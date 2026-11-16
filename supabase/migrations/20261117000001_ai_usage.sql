-- Step 4: daily limits for the `ai` Edge Function (supabase/functions/ai).
--
-- ai_usage holds counts only: how many AI requests a learner made today, by
-- group. Never a question, an answer or what the learner said. Learners can
-- read their own rows; only take_ai_request() adds to them, and it keeps
-- today's row only. Deleted with the login (Delete all my data).
--
-- The limits (per learner per UTC day) match AI_LIMITS in
-- src/lib/aiRequests.js; src/lib/supabaseRules.test.js checks they agree.

create table public.ai_usage (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  kind text not null check (kind in ('ask', 'civics', 'interview', 'other')),
  count integer not null default 0 check (count >= 0),
  primary key (user_id, day, kind)
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon;
revoke insert, update, delete on public.ai_usage from authenticated;
create policy "own usage: read" on public.ai_usage for select to authenticated using (user_id = auth.uid());

create function public.ai_daily_limit(p_kind text) returns integer
language sql immutable set search_path = '' as $$
  select case p_kind
    when 'ask' then 30
    when 'civics' then 200
    when 'interview' then 100
    when 'other' then 50
    else 0
  end
$$;

-- Counts one request for the signed-in learner. Returns false (and counts
-- nothing) once today's limit for that group is reached.
create function public.take_ai_request(p_kind text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  lim integer := public.ai_daily_limit(p_kind);
  today date := (now() at time zone 'utc')::date;
  n integer;
begin
  if me is null then raise exception 'sign in first' using errcode = '42501'; end if;
  if lim = 0 then raise exception 'unknown kind' using errcode = '22023'; end if;
  delete from public.ai_usage where user_id = me and day < today;
  insert into public.ai_usage (user_id, day, kind, count) values (me, today, p_kind, 1)
  on conflict (user_id, day, kind) do update set count = public.ai_usage.count + 1
    where public.ai_usage.count < lim
  returning count into n;
  return n is not null;
end $$;

revoke execute on function public.take_ai_request(text) from public, anon;
grant execute on function public.take_ai_request(text) to authenticated, service_role;
revoke execute on function public.ai_daily_limit(text) from public, anon;
grant execute on function public.ai_daily_limit(text) to authenticated, service_role;
