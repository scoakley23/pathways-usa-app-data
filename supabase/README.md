# Supabase (Standalone Step 1)

The database for Pathways after it leaves Base44. **The app doesn't use it
yet**: screens still talk to Base44 until Standalone Step 3.

| File | What it is |
|---|---|
| `migrations/20261114000001_schema.sql` | Every table and its data rules (row-level security) |
| `migrations/20261114000002_functions.sql` | Partner program actions and "Delete all my data" |
| `migrations/20261114000003_content.sql` | The real content (questions, sentences, words, lessons, flashcards, 5,588 places), **generated** from `content/base44-export/` by `scripts/supabase/build-content-migration.mjs` |
| `seed.sql` | **Fake** accounts and progress for a local Supabase only (`@example.test`); never pushed |
| `tests/` | The stand-in for Supabase's auth used by `src/lib/supabaseRules.test.js` (PGlite, runs in `npm test`) |
| `config.toml` | Supabase CLI settings |

## Who can do what

| Who | Can |
|---|---|
| Anyone, signed out | Read content (hidden places excluded) |
| Learner | Read and change **their own** rows only; join or leave a partner program through `join_program()`; delete their whole account with `delete_my_account()` |
| Partner staff (email on a program's staff list) | Through functions only: their members' name (or email) and status (`program_members`), confirm or "not ours" (`set_member_status`), exact totals over confirmed learners and the progress of learners who chose to share (`program_summary`). Never answers, notes, Ask-the-tutor chats, pilot answers or N-400 section names |
| Admin (`app_metadata.role = 'admin'`) | Change content and partner programs; read pilot reminder records. **No** access to learners' rows |
| The server (service role) | Everything (Edge Functions in Steps 4–5) |

Every learner table is deleted together with the login, so
`delete_my_account()` removes everything. The test checks every table with a
`user_id`, including any added later.

## Apply it to your Supabase project (you run this)

On your computer, with the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) installed:

```bash
supabase login
```

```bash
supabase link --project-ref <your project ref>
```

```bash
supabase db push
```

The project ref is in your Supabase dashboard URL. `db push` asks for the
database password; type it there, never in a chat. It applies the three
migrations, including the content. It does **not** load `seed.sql`.

**Make yourself an admin** (Supabase dashboard → SQL editor, after you've
signed in to the app once with your email in Step 2):

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
where email = 'you@example.org';
```

## Names that changed from Base44 (for Step 3)

| Base44 | Supabase |
|---|---|
| `User` extra fields + `PublicProfile` | `profiles` (`max_streak`, `badges_count` and the old `representative_data` aren't kept) |
| `Sentence` | `writing_sentences` |
| `order` (lessons, interview questions) | `sort_order` |
| `user_email` on every learner table | `user_id` (the login id) |
| `CheckInReminder` | `check_in_reminders` |
| `LessonQuiz` | not ported (unused; kept as JSON in `content/base44-export/`) |
| other entities | the same name in snake_case plural |
