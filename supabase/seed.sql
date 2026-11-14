-- FAKE test data for the LOCAL Supabase stack only (`supabase db reset`).
-- `supabase db push` never sends this file to the real project.
-- Every email is @example.test (a domain that can't receive mail).
--
--   admin@example.test   admin (app_metadata.role = admin)
--   staff@example.test   staff of the fake program TEST-CLASS
--   ana@example.test     learner, confirmed in TEST-CLASS, shares progress
--   ben@example.test     learner, waiting (pending) in TEST-CLASS
--   cam@example.test     learner, no program

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated', 'admin@example.test', '{"provider":"email","role":"admin"}', '{}', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-00000000005f', 'authenticated', 'authenticated', 'staff@example.test', '{"provider":"email"}', '{}', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'ana@example.test', '{"provider":"email"}', '{}', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'ben@example.test', '{"provider":"email"}', '{}', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'cam@example.test', '{"provider":"email"}', '{}', now(), now(), now());

-- Profiles are made by the on_auth_user_created trigger; fill in a few fields.
update public.profiles set display_name = 'Ana Test', skill_levels = '{"civics":"getting_there","reading":"strong","writing":"getting_there","speaking":"start_here"}'
  where user_id = '00000000-0000-4000-8000-000000000001';
update public.profiles set display_name = 'Ben Test' where user_id = '00000000-0000-4000-8000-000000000002';
update public.profiles set display_name = 'Cam Test' where user_id = '00000000-0000-4000-8000-000000000003';

insert into public.partners (name, code, staff_emails, share_learners, active)
values ('Test Class (fake)', 'TEST-CLASS', array['staff@example.test'], true, true);

insert into public.program_memberships (user_id, partner_code, status, display_name, share_progress) values
  ('00000000-0000-4000-8000-000000000001', 'TEST-CLASS', 'confirmed', 'Ana', true),
  ('00000000-0000-4000-8000-000000000002', 'TEST-CLASS', 'pending', null, false);

insert into public.lesson_progress (user_id, lesson_id, topic, completed, best_score, steps_done, stars, completed_at) values
  ('00000000-0000-4000-8000-000000000001', 'fake-lesson-1', 'System of Government', true, 90, 5, 3, now()),
  ('00000000-0000-4000-8000-000000000001', 'fake-lesson-2', 'System of Government', false, null, 2, 0, null);
insert into public.checkpoint_results (user_id, section_id, correct, total, passed_at) values
  ('00000000-0000-4000-8000-000000000001', 'u2-s2', 6, 7, now());
insert into public.review_items (user_id, question_id, box, next_due) values
  ('00000000-0000-4000-8000-000000000001', 'fake-question-1', 1, current_date);
insert into public.n400_section_progress (user_id, section_id, completed, completed_date) values
  ('00000000-0000-4000-8000-000000000001', 'basics', true, current_date);
insert into public.activity_days (user_id, date) values
  ('00000000-0000-4000-8000-000000000001', current_date),
  ('00000000-0000-4000-8000-000000000002', current_date - 10);
insert into public.lesson_notes (user_id, lesson_id, content) values
  ('00000000-0000-4000-8000-000000000001', 'fake-lesson-1', 'Fake note: 100 senators.');
