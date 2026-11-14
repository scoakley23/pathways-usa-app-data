-- Pathways USA on Supabase: tables and data rules (Standalone Step 1).
-- Recreates the Base44 entities (STANDALONE_AUDIT.md, section b) plus the
-- course tables from Redesign Prompt 4. Every learner table is keyed by the
-- login (auth.users.id) and deleted with it, so deleting the login removes
-- everything ("Delete all my data", delete_my_account()).
--
-- Who can do what:
--   learner        their own rows only
--   partner staff  only through the functions in ..._partner_functions.sql
--                  (names or emails + status of members, and counts)
--   admin          content and partners; check_in_reminders; never learner rows
--   anon           read public content only

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Admin = app_metadata.role 'admin' on the login. Only the server (service
-- role) can set app_metadata, never the learner.
create function public.is_admin() returns boolean
language sql stable set search_path = '' as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

create function public.my_email() returns text
language sql stable set search_path = '' as $$
  select lower(trim(coalesce(auth.jwt() ->> 'email', '')))
$$;

-- updated_at on change.
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Content: anyone can read, only admins change. Ids keep the Base44 ids
-- (text), so links like lesson_id and saved places keep working.
-- ---------------------------------------------------------------------------

create table public.civics_questions (
  id text primary key default gen_random_uuid()::text,
  version text not null check (version in ('2008', '2025')),
  question text not null,
  answer text not null,
  category text,
  difficulty text
);

create table public.interview_questions (
  id text primary key default gen_random_uuid()::text,
  section text,
  question text not null,
  expected_response text,
  response_type text,
  sort_order integer, -- Base44 "order"
  tips text
);

create table public.reading_sentences (
  id text primary key default gen_random_uuid()::text,
  text text not null,
  difficulty text
);

create table public.writing_sentences ( -- Base44 "Sentence"
  id text primary key default gen_random_uuid()::text,
  text text not null,
  category text,
  difficulty text
);

create table public.vocabulary_words (
  id text primary key default gen_random_uuid()::text,
  word text not null,
  category text,
  definition text
);

create table public.lessons (
  id text primary key default gen_random_uuid()::text,
  topic text,
  title text not null,
  description text,
  video_url text,
  content text,
  key_points jsonb not null default '[]'::jsonb,
  sort_order integer -- Base44 "order"
);

create table public.lesson_flashcards (
  id text primary key default gen_random_uuid()::text,
  lesson_id text not null references public.lessons (id) on delete cascade,
  term text not null,
  definition text,
  example text
);
create index on public.lesson_flashcards (lesson_id);

create table public.community_resources (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  category text,
  services text[],
  address text,
  city text,
  state text,
  zip text,
  latitude double precision,
  longitude double precision,
  location_precision text,
  phone text,
  website text,
  logo_url text,
  hours text,
  languages text[] not null default '{}',
  cost text,
  description text,
  source text,
  source_url text,
  last_verified text,
  external_id text unique,
  relevance_note text,
  is_active boolean not null default true
);

do $$
declare t text;
begin
  foreach t in array array['civics_questions', 'interview_questions', 'reading_sentences', 'writing_sentences',
                           'vocabulary_words', 'lessons', 'lesson_flashcards', 'community_resources'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "admins change content" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    if t = 'community_resources' then
      -- Hidden places (is_active = false) are visible to admins only.
      execute format('create policy "anyone reads active places" on public.%I for select to anon, authenticated using (is_active or public.is_admin())', t);
    else
      execute format('create policy "anyone reads content" on public.%I for select to anon, authenticated using (true)', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- The learner's profile (Base44 User extra fields + PublicProfile).
-- Made automatically when the login is created.
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  points integer not null default 0,
  badges jsonb not null default '[]'::jsonb,
  tutor_profile jsonb, -- tone and English mix (the tutor's name is always Amio)
  skill_levels jsonb, -- quick check: four levels + checked_at only
  state text, -- pilot: two-letter state or "prefer not"
  checkin_email_reminders boolean not null default false,
  reminder_language text, -- kept only while reminders are on
  checkins_stopped boolean not null default false,
  app_language text,
  pilot_id text not null unique default replace(gen_random_uuid()::text, '-', ''),
  pilot_intro_seen boolean not null default false,
  pilot_test_months_ago integer, -- admins' testing only
  representative_state text, -- "Who Represents Me?": state and district only
  representative_district text,
  lessons_per_day integer check (lessons_per_day between 1 and 3), -- Prompt 4
  write_level integer not null default 1 check (write_level in (1, 2)), -- Prompt 4
  write_level1_passes integer not null default 0 check (write_level1_passes >= 0), -- Prompt 4
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A learner can't change their pilot_id; only admins can set the testing field.
create function public.profiles_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    new.pilot_id := old.pilot_id;
    new.user_id := old.user_id;
    new.created_at := old.created_at;
    if not public.is_admin() then new.pilot_test_months_ago := old.pilot_test_months_ago; end if;
  elsif not public.is_admin() then
    new.pilot_test_months_ago := null;
  end if;
  return new;
end $$;
create trigger profiles_guard before insert or update on public.profiles
  for each row execute function public.profiles_guard();
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

create function public.create_profile_for_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

-- ---------------------------------------------------------------------------
-- Learner tables: owner only.
-- ---------------------------------------------------------------------------

create table public.user_progress ( -- per sentence, word or civics question
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  content_id text not null,
  content_type text not null,
  status text,
  last_practiced timestamptz,
  ease_factor numeric, -- spaced-review fields: removed in Prompt 4 (review_items)
  "interval" integer,
  consecutive_correct integer,
  last_result text,
  best_score numeric,
  last_score numeric,
  total_attempts integer not null default 0,
  unique (user_id, content_type, content_id)
);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lesson_id text not null, -- a lessons row today; a course lesson id (content/course) from Prompt 4
  topic text,
  completed boolean not null default false,
  quiz_attempts integer not null default 0,
  best_score numeric,
  last_score numeric,
  total_questions integer,
  last_attempt_date timestamptz,
  needs_review boolean not null default false,
  steps_done integer not null default 0 check (steps_done between 0 and 5), -- Prompt 4
  stars integer not null default 0 check (stars between 0 and 3), -- Prompt 4
  completed_at timestamptz, -- Prompt 4
  unique (user_id, lesson_id)
);

create table public.checkpoint_results ( -- Speak it! checkpoints (Prompt 4)
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  section_id text not null,
  correct integer not null check (correct >= 0),
  total integer not null check (total > 0 and correct <= total),
  passed_at timestamptz, -- null when not passed
  created_at timestamptz not null default now()
);

create table public.review_items ( -- the one review schedule (Prompt 4): boxes 1-5 = 1, 3, 7, 14, 30 days
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question_id text not null,
  box integer not null default 1 check (box between 1 and 5),
  next_due date not null default current_date,
  primary key (user_id, question_id)
);

create table public.lesson_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lesson_id text not null,
  lesson_title text,
  lesson_topic text,
  content text not null default '',
  updated_at timestamptz not null default now()
);
create trigger lesson_notes_touch before update on public.lesson_notes
  for each row execute function public.touch_updated_at();

create table public.n400_section_progress ( -- section id only: no section names, no answers
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  section_id text not null,
  completed boolean not null default false,
  completed_date date,
  primary key (user_id, section_id)
);

create table public.interview_sessions ( -- scores only, never what was said
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  overall_score numeric,
  passed boolean,
  question_count integer,
  passed_count integer,
  results jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.ai_study_logs ( -- Ask the tutor history, shown only to the learner
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question text not null,
  answer text not null,
  language text,
  created_at timestamptz not null default now()
);

create table public.notifications ( -- in-app only
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text,
  title text,
  message text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.activity_days ( -- the date the learner opened the app
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  primary key (user_id, date)
);

create table public.outcome_checkins ( -- pilot: fixed choices only; never partner staff
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null,
  confidence text,
  stage text,
  filed text,
  interviewed text,
  passed_tests text,
  oath text,
  registered_to_vote text,
  would_have_without_pathways text,
  created_at timestamptz not null default now()
);

create table public.saved_places ( -- place id only, no location
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  resource_id text not null references public.community_resources (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

do $$
declare t text;
begin
  foreach t in array array['user_progress', 'lesson_progress', 'checkpoint_results', 'review_items', 'lesson_notes',
                           'n400_section_progress', 'interview_sessions', 'ai_study_logs', 'notifications',
                           'activity_days', 'outcome_checkins', 'saved_places'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
create policy "own profile: read" on public.profiles for select to authenticated using (user_id = auth.uid());
create policy "own profile: change" on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- No insert or delete: the profile is made with the login and deleted with it.

-- ---------------------------------------------------------------------------
-- Pilot reminder emails sent (Base44 CheckInReminder): written by the server
-- only; admins may read. Deleted with the login.
-- ---------------------------------------------------------------------------

create table public.check_in_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  sent_date date not null default current_date
);
alter table public.check_in_reminders enable row level security;
revoke all on public.check_in_reminders from anon;
create policy "admins read reminders" on public.check_in_reminders for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Partner programs. Staff and learners reach them only through functions.
-- ---------------------------------------------------------------------------

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique check (code = upper(code) and code <> ''),
  staff_emails text[] not null default '{}', -- stored lowercase
  share_learners boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create function public.partners_lowercase_emails() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.staff_emails := array(select distinct lower(trim(e)) from unnest(new.staff_emails) e where trim(e) <> '');
  return new;
end $$;
create trigger partners_lowercase_emails before insert or update on public.partners
  for each row execute function public.partners_lowercase_emails();
alter table public.partners enable row level security;
revoke all on public.partners from anon;
create policy "admins manage partners" on public.partners for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table public.program_memberships ( -- one program per learner
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  partner_code text not null references public.partners (code) on update cascade on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'removed')),
  display_name text,
  share_progress boolean not null default false,
  status_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.program_memberships enable row level security;
revoke all on public.program_memberships from anon;
create policy "own membership: read" on public.program_memberships for select to authenticated using (user_id = auth.uid());
create policy "own membership: leave" on public.program_memberships for delete to authenticated using (user_id = auth.uid());
-- No insert or update policy: joining and confirming go through functions.
