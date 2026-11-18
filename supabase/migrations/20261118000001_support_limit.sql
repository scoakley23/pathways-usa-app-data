-- Step 5: a daily limit for "Talk to a person" (the `support-message` Edge
-- Function): 3 messages per learner per UTC day. Counted in ai_usage like the
-- AI requests (counts only, today only, deleted with the login), under the
-- new kind 'support'. The limit matches SUPPORT_DAILY_LIMIT in
-- src/config/support.js (src/lib/supabaseRules.test.js checks it).

alter table public.ai_usage drop constraint ai_usage_kind_check;
alter table public.ai_usage add constraint ai_usage_kind_check
  check (kind in ('ask', 'civics', 'interview', 'other', 'support'));

create or replace function public.ai_daily_limit(p_kind text) returns integer
language sql immutable set search_path = '' as $$
  select case p_kind
    when 'ask' then 30
    when 'civics' then 200
    when 'interview' then 100
    when 'other' then 50
    when 'support' then 3
    else 0
  end
$$;
