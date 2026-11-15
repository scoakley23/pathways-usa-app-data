# Supabase (Standalone Step 1)

The database for Pathways after it leaves Base44. **The app doesn't use its
data yet**: screens still talk to Base44 until Standalone Step 3. Sign-in
(Step 2) is ready behind a switch; see "Sign-in" below.

| File | What it is |
|---|---|
| `migrations/20261114000001_schema.sql` | Every table and its data rules (row-level security) |
| `migrations/20261114000002_functions.sql` | Partner program actions and "Delete all my data" |
| `migrations/20261114000003_content.sql` | The real content (questions, sentences, words, lessons, flashcards, 5,588 places), **generated** from `content/base44-export/` by `scripts/supabase/build-content-migration.mjs` |
| `migrations/20261115000001_course_data.sql` | Prompt 4: two passes at Write it level 1 move the learner to level 2 (`write_level1_passes` 0-2, a trigger sets `write_level`), and the old spaced-review fields (`ease_factor`, `interval`) leave `user_progress`: `review_items` is the one review schedule |
| `seed.sql` | **Fake** accounts and progress for a local Supabase only (`@example.test`); never pushed |
| `tests/` | The stand-in for Supabase's auth used by `src/lib/supabaseRules.test.js` (PGlite, runs in `npm test`) |
| `config.toml` | Supabase CLI settings, including sign-in for the local stack |
| `templates/sign-in-code.html` | The sign-in email (the 6-digit code) |

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
signed in to the app once with your email, with the sign-in switch on):

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
where email = 'you@example.org';
```

Then sign out and sign in again: the admin role reaches the app with the
next login.

## Sign-in (Standalone Step 2)

Learners sign in with a **6-digit code sent by email** (no password, no
link). The app code is in `src/api/` (`auth.js` is the switch); the email is
`templates/sign-in-code.html`. Until Step 3 moves the data, the app keeps
Base44's sign-in unless `VITE_AUTH_PROVIDER=supabase` is set.

### 1. Settings in the Supabase dashboard (you do this once)

| Where | Setting |
|---|---|
| Authentication → Sign In / Providers → Email | Email provider **on**. "Email OTP Length" **6** (new projects start at **8**, which the app won't accept: change it). "Email OTP Expiration" **600** seconds (10 minutes) |
| Authentication → Rate Limits | "Rate limit for sending emails" **30** per hour. Leave "sign-ups and sign-ins" and "token verifications" at their defaults (30 per 5 minutes per IP address) |
| Authentication → Emails → SMTP Settings | Already Resend (`Pathways <hello@pathwaysusa.org>`). The "minimum interval per user" is **60** seconds |
| Authentication → URL Configuration | Already set: `https://next.pathwaysusa.org` and `http://localhost:5173` |

### 2. The email text (paste it twice)

Supabase sends returning learners the **Magic Link** email and new ones the
**Confirm signup** email, so both get the same text. In Authentication →
Emails → Templates, open **Magic Link**, then **Confirm signup**, and in each:

- **Subject**: `Your Pathways code: {{ .Token }}`
- **Body**: the whole of `supabase/templates/sign-in-code.html` (switch the
  editor to its source/HTML view and replace everything).

The body shows only the code (`{{ .Token }}`), never a link, and never
mentions citizenship, immigration or USCIS (inboxes can be shared);
`src/api/auth.test.js` checks that. Then **Save** each one.

### 3. The app's settings (never paste these in a chat)

| Where | What |
|---|---|
| Your computer: the `.env` file in the project folder (see `.env.example`) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_AUTH_PROVIDER=supabase` to try the new sign-in |
| Cloudflare Pages → your project → Settings → Variables and Secrets (Production and Preview) | The same three, **after Step 3** (before that, sign-in would work but the screens' data wouldn't) |

Both values are in Supabase dashboard → Project Settings → API: the Project
URL and the **anon (publishable)** key. They are public by design (they end
up in the browser); row-level security protects the data. The
**service-role (secret)** key never goes in the app or a `VITE_` variable.

### What learners see

| What happens | Message |
|---|---|
| Wrong code | "That code didn't work. Check the 6 numbers and try again." |
| Code older than 10 minutes | "That code has expired. Tap "Send a new code"." (Supabase gives one error for both; the app tells them apart by the time since the code was sent) |
| Too many codes or tries | "Too many tries. Wait a minute, then try again." "Send a new code" counts down 60 seconds |
| No internet | "We couldn't reach Pathways. Check your internet and try again." |
| The login ends by itself (renewal failed, signed out elsewhere) | The page keeps working signed out, with a small "You were signed out. Sign in again" notice |

Supabase can't limit codes per address per hour; the closest is one code per
address per 60 seconds plus the project-wide 30 per hour. If abuse shows up,
add a CAPTCHA (Cloudflare Turnstile, Authentication → Attack Protection).

## Edge Functions (server code, from Step 3)

| Function | What it does |
|---|---|
| `functions/district-lookup/` | "Who Represents Me?" for a ZIP that spans districts: signed-in learners only; sends the street address and ZIP to Geocodio once and returns only `{ state, district }` (logic in `functions/_shared/districtLookup.js`, tested in `src/api/districts.test.js`). Never logs or saves the address. Needs the secret `GEOCODIO_API_KEY` |
| `functions/pilot-report/` | The admin pilot dashboard (`/admin/pilot`): admins only (anyone else gets 404); reads the pilot learners' rows with the service role and returns one summary per learner keyed by `pilot_id`, never an email, name or login id. The math is `functions/_shared/pilotReport.js`, an exact copy of `base44/shared/pilotReport.js` (a test checks they match; change both together) |

Deploy (on your computer, after `supabase link`; again whenever a function's folder changes):

```bash
supabase functions deploy pilot-report
supabase secrets set GEOCODIO_API_KEY=...   # your key from geocod.io; type it in your terminal, never in a chat
supabase functions deploy district-lookup
```

Supabase gives every Edge Function its URL, anon key and service-role key
itself; nothing to paste. The service-role key stays on Supabase's servers.

## Turning the switch on (after Step 3)

Step 3 moved every screen's data into `src/api/`, behind the same switch as
sign-in (`VITE_AUTH_PROVIDER=supabase`). `src/api/movedData.test.js` checks
that no screen reads or writes data any other way.

### 1. Before you try it

- [ ] Every Step 3 pull request is merged into `standalone`.
- [ ] `supabase db push` has applied every migration (run it again after new ones).
- [ ] The pilot dashboard's server function is deployed: `supabase functions deploy pilot-report`.
- [ ] The split-ZIP lookup is deployed with its key: `supabase secrets set GEOCODIO_API_KEY=...`, then `supabase functions deploy district-lookup`.
- [ ] You are an admin (SQL above), signed out and in again.
- [ ] Your computer's `.env` has `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_AUTH_PROVIDER=supabase`.

### 2. Try each area on your computer (`npm run dev`)

Use your own email, and a second **fake** email you control for the delete test.

| Area | Do this | See this (Supabase → Table Editor) |
|---|---|---|
| Sign-in | Sign in with the 6-digit code | a row in `profiles` |
| Content | Practice (civics, reading, writing), Course, a lesson, the Resource Hub map | questions, sentences, lessons and places show |
| Profile | Change your name in Settings; "Who Represents Me?" | `profiles.display_name`, `representative_state` / `_district` |
| Activity | Open the app | today's row in `activity_days` |
| Practice | One civics round | rows in `user_progress`; Me and Progress count them |
| Lessons | Finish a lesson's "Go over them"; write a note | `lesson_progress`, `lesson_notes` |
| Interview | Finish a practice interview; "I read this section" in the N-400 guide | `interview_sessions` (scores only), `n400_section_progress` (id + date) |
| Ask Amio | Ask a question; open Study history | `ai_study_logs` |
| Saved places | Save a place | `saved_places` |
| Partner programs | Admin → Partners: a fake program with your email as staff; pick it in Me with the fake account; confirm it on `/Partner` | `partners`, `program_memberships` |
| Pilot | Answer "Help us improve"; open `/admin/pilot` as admin | `outcome_checkins`; the dashboard lists the fake learner |
| Delete my data | With the **fake** account: Settings → Delete all my data | the fake login is gone from Authentication → Users, and its rows from every table |

### 3. Still on Base44 after Step 3

These keep working only while the switch is **off**, until their step moves them:

- **AI** (Ask Amio's answers, grading, scoring, translations, "Who Represents Me?" lookup): Step 4. Base44 may refuse AI calls without a Base44 login, so test these with the switch on before relying on them.
- **Emails** (Talk to a person, pilot reminder emails in Admin → Pilot): Step 5.
- **The review schedule**: the screens still use the old one on `user_progress`; `review_items` (Prompt 4) replaces it in its own PR.

So turn the switch on in Cloudflare Pages only after Steps 4 and 5.

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
