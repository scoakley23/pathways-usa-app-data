-- Redesign Prompt 11: the partner dashboard's course counts match what
-- learners see. program_summary() is the same as in 20261114000002_functions
-- except:
--   - stars = lesson stars + 10 per passed Speak it! (as src/lib/checkpoints.js
--     checkpointStars() and src/lib/journey.js totalStars());
--   - checkpoints passed counts each checkpoint once (a Speak it! section or a
--     Read and write stop), not every passing try.
-- Still counts only: never answers, notes, chats, pilot answers or section names.

create or replace function public.program_summary(p_code text, p_today date default current_date)
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
  -- Each checkpoint counts once, however many times it was passed. Speak it!
  -- results use the section id; Read and write stops use their stop id,
  -- which always contains "-rw" (checked by src/lib/checkpoints.test.js).
  checkpoints as (
    select cr.user_id,
           count(distinct cr.section_id) as passed,
           count(distinct cr.section_id) filter (where cr.section_id not like '%-rw%') as speak
    from public.checkpoint_results cr
    where cr.passed_at is not null and cr.user_id in (select user_id from members) group by cr.user_id
  ),
  -- Stars as the learner sees them: lesson stars plus 10 per passed Speak it!.
  stars as (
    select mb.user_id,
           coalesce((select l.stars from lessons l where l.user_id = mb.user_id), 0)
           + 10 * coalesce((select c.speak from checkpoints c where c.user_id = mb.user_id), 0) as total
    from members mb
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
    'stars', (select coalesce(sum(total), 0) from stars),
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
          'stars', coalesce((select total from stars where user_id = mb.user_id), 0),
          'checkpointsPassed', coalesce((select passed from checkpoints where user_id = mb.user_id), 0),
          'n400SectionsRead', coalesce((select done from sections where user_id = mb.user_id), 0)
        ) as row_data
        from members mb where mb.share_progress
      ) x
    ) else '[]'::jsonb end
  ) into result;

  return result;
end $$;
