-- Functions for the actions that can't be plain table rules (Standalone
-- Step 1): partner programs (Base44's `partner` function: list, join, staff,
-- members, setStatus, summary) and deleting the account. Same behavior as
-- base44/shared/partners.js. All run with the owner's rights, so each one
-- checks who is asking before it reads anything.

-- Active programs a learner can pick: name and code, never the staff list.
create function public.active_programs()
returns table (code text, name text, share_learners boolean)
language sql stable security definer set search_path = '' as $$
  select p.code, p.name, p.share_learners
  from public.partners p
  where p.active and p.name <> ''
  order by p.name
$$;

-- The optional name a learner gives a program: a name only (no "@", no run
-- of 3+ digits that could be a case or phone number), at most 60 characters.
create function public.clean_member_name(raw text) returns text
language sql immutable set search_path = '' as $$
  select case
    when s = '' or position('@' in s) > 0 or s ~ '[0-9]{3,}' then null
    else s
  end
  from (select left(regexp_replace(trim(coalesce(raw, '')), '\s+', ' ', 'g'), 60) as s) x
$$;

-- A learner picks (or re-picks) a program. Same program: keep its status,
-- unless it said "not ours" (then pending again). Another program: pending.
-- Sharing progress only where the program allows it.
create function public.join_program(p_code text, p_name text default null, p_share boolean default false)
returns public.program_memberships
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  prog public.partners;
  old public.program_memberships;
  result public.program_memberships;
  next_status text;
begin
  if me is null then raise exception 'sign in first' using errcode = '42501'; end if;
  select * into prog from public.partners
    where code = upper(regexp_replace(trim(coalesce(p_code, '')), '\s+', '-', 'g')) and active;
  if not found then raise exception 'no such program' using errcode = 'P0002'; end if;
  select * into old from public.program_memberships where user_id = me;
  next_status := case when found and old.partner_code = prog.code and old.status <> 'removed' then old.status else 'pending' end;
  insert into public.program_memberships as m (user_id, partner_code, status, display_name, share_progress, status_changed_at)
  values (me, prog.code, next_status, public.clean_member_name(p_name), prog.share_learners and coalesce(p_share, false), now())
  on conflict (user_id) do update set
    partner_code = excluded.partner_code,
    status = excluded.status,
    display_name = excluded.display_name,
    share_progress = excluded.share_progress,
    status_changed_at = case when m.partner_code = excluded.partner_code and m.status = excluded.status
                             then m.status_changed_at else now() end
  returning * into result;
  return result;
end $$;

-- True when the signed-in person is on this program's staff list.
create function public.is_staff_of(p_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.partners p
    where p.code = upper(p_code) and p.active and public.my_email() <> '' and public.my_email() = any (p.staff_emails)
  )
$$;

-- The programs the signed-in person works for.
create function public.my_staff_programs()
returns table (code text, name text, share_learners boolean)
language sql stable security definer set search_path = '' as $$
  select p.code, p.name, p.share_learners from public.partners p
  where p.active and public.my_email() <> '' and public.my_email() = any (p.staff_emails)
  order by p.name
$$;

-- Staff: the learners who picked this program. The name they gave (or their
-- email) and the status. Nothing else.
create function public.program_members(p_code text)
returns table (user_id uuid, name text, status text, since timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_staff_of(p_code) then raise exception 'not staff of this program' using errcode = '42501'; end if;
  return query
    select m.user_id, coalesce(m.display_name, lower(u.email)), m.status, m.created_at
    from public.program_memberships m join auth.users u on u.id = m.user_id
    where m.partner_code = upper(p_code)
    order by m.created_at;
end $$;

-- Staff: confirm a learner, mark them "not ours", or set them back to pending.
create function public.set_member_status(p_code text, p_user_id uuid, p_status text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_staff_of(p_code) then raise exception 'not staff of this program' using errcode = '42501'; end if;
  if p_status not in ('pending', 'confirmed', 'removed') then raise exception 'bad status'; end if;
  update public.program_memberships set status = p_status, status_changed_at = now()
    where user_id = p_user_id and partner_code = upper(p_code) and status <> p_status;
end $$;

-- Staff: totals over CONFIRMED learners, exact numbers (as programSummary()
-- in base44/shared/partners.js), plus the course counts from Prompt 4
-- (lessons completed, stars, checkpoints passed). Per-learner rows only for
-- learners who chose to share, in programs that allow it, and only levels
-- and counts. Never answers, notes, chats, pilot answers or section names.
create function public.program_summary(p_code text, p_today date default current_date)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  prog public.partners;
  result jsonb;
begin
  if not public.is_staff_of(p_code) then raise exception 'not staff of this program' using errcode = '42501'; end if;
  select * into prog from public.partners where code = upper(p_code);

  with members as (
    select m.user_id, m.display_name, m.share_progress, lower(u.email) as email
    from public.program_memberships m join auth.users u on u.id = m.user_id
    where m.partner_code = prog.code and m.status = 'confirmed'
  ),
  levels as (
    select mb.user_id, s.skill, pr.skill_levels ->> s.skill as level
    from members mb join public.profiles pr on pr.user_id = mb.user_id
    cross join (values ('civics'), ('reading'), ('writing'), ('speaking')) as s(skill)
    where pr.skill_levels ->> s.skill in ('start_here', 'getting_there', 'strong')
  ),
  lessons as (
    select lp.user_id, count(*) filter (where lp.completed) as done, coalesce(sum(lp.stars), 0) as stars
    from public.lesson_progress lp where lp.user_id in (select user_id from members) group by lp.user_id
  ),
  sections as (
    select sp.user_id, count(*) as done from public.n400_section_progress sp
    where sp.completed and sp.user_id in (select user_id from members) group by sp.user_id
  ),
  checkpoints as (
    select cr.user_id, count(*) as passed from public.checkpoint_results cr
    where cr.passed_at is not null and cr.user_id in (select user_id from members) group by cr.user_id
  )
  select jsonb_build_object(
    'totals',
    jsonb_build_object(
    'learners', (select count(*) from members),
    'activeWeek', (select count(distinct a.user_id) from public.activity_days a
                   where a.user_id in (select user_id from members) and a.date >= p_today - 6),
    'activeMonth', (select count(distinct a.user_id) from public.activity_days a
                    where a.user_id in (select user_id from members) and a.date >= p_today - 29),
    'quickCheckDone', (select count(distinct user_id) from levels),
    'levels', (select jsonb_object_agg(sk.skill, (
                 select jsonb_object_agg(lv.level, (select count(*) from levels l where l.skill = sk.skill and l.level = lv.level))
                 from (values ('start_here'), ('getting_there'), ('strong')) as lv(level)))
               from (values ('civics'), ('reading'), ('writing'), ('speaking')) as sk(skill)),
    'lessonsCompleted', (select coalesce(sum(done), 0) from lessons),
    'learnersWithLesson', (select count(*) from lessons where done > 0),
    'stars', (select coalesce(sum(stars), 0) from lessons),
    'checkpointsPassed', (select coalesce(sum(passed), 0) from checkpoints),
    'n400SectionsRead', (select coalesce(sum(done), 0) from sections),
    'learnersWithN400', (select count(*) from sections)
  ),
    'learners',
    case when prog.share_learners then (
      select coalesce(jsonb_agg(row_data order by row_data ->> 'name'), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'id', mb.user_id,
          'name', coalesce(mb.display_name, mb.email),
          'levels', (select jsonb_object_agg(sk.skill, (select l.level from levels l where l.user_id = mb.user_id and l.skill = sk.skill))
                     from (values ('civics'), ('reading'), ('writing'), ('speaking')) as sk(skill)),
          'lessonsCompleted', coalesce((select done from lessons where user_id = mb.user_id), 0),
          'stars', coalesce((select stars from lessons where user_id = mb.user_id), 0),
          'checkpointsPassed', coalesce((select passed from checkpoints where user_id = mb.user_id), 0),
          'n400SectionsRead', coalesce((select done from sections where user_id = mb.user_id), 0)
        ) as row_data
        from members mb where mb.share_progress
      ) x
    ) else '[]'::jsonb end
  ) into result;

  return result;
end $$;

-- "Delete all my data": removes the login, and with it every row tied to the
-- learner (every learner table cascades from auth.users).
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'sign in first' using errcode = '42501'; end if;
  delete from auth.users where id = me;
end $$;

-- Who may call what. Postgres lets everyone (PUBLIC) run a new function, so
-- take that away and give each one back to signed-in users only. The
-- profile trigger is never called directly.
do $$
declare f text;
begin
  foreach f in array array[
    'public.active_programs()', 'public.join_program(text, text, boolean)', 'public.is_staff_of(text)',
    'public.my_staff_programs()', 'public.program_members(text)', 'public.set_member_status(text, uuid, text)',
    'public.program_summary(text, date)', 'public.delete_my_account()'] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;
revoke execute on function public.create_profile_for_new_user() from public, anon, authenticated;
