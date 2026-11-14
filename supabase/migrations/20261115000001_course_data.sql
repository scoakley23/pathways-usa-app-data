-- Redesign Prompt 4: the course model's saved data.
-- The tables themselves (lesson_progress steps and stars, checkpoint_results,
-- review_items, the profile's lessons_per_day / write_level /
-- write_level1_passes) came with Step 1. This adds the two rules Prompt 4
-- sets and removes the old spaced-review fields.

-- 1. Write it levels: two passes at level 1 (tap words from a word bank)
--    move the learner to level 2 (type it). The count stays 0-2, and the
--    level follows the count whatever screen saves it.
alter table public.profiles drop constraint if exists profiles_write_level1_passes_check;
alter table public.profiles add constraint profiles_write_level1_passes_check
  check (write_level1_passes between 0 and 2);

create function public.profiles_write_level() returns trigger
language plpgsql as $$
begin
  if new.write_level1_passes >= 2 then
    new.write_level := 2;
  end if;
  return new;
end;
$$;

create trigger profiles_write_level before insert or update of write_level1_passes, write_level on public.profiles
  for each row execute function public.profiles_write_level();

-- 2. One review schedule: review_items (boxes 1-5 = 1, 3, 7, 14, 30 days)
--    replaces the old spaced-review fields on user_progress. user_progress
--    keeps status, results and scores.
alter table public.user_progress drop column if exists ease_factor;
alter table public.user_progress drop column if exists "interval";
