# Supabase (Standalone Steps 1–5)

The database and server code for Pathways after it leaves Base44. The app
uses it when the switch is on (`VITE_AUTH_PROVIDER=supabase`, see "Turning
the switch on" below); with the switch off it still uses Base44.

| File | What it is |
|---|---|
| `migrations/20261114000001_schema.sql` | Every table and its data rules (row-level security) |
| `migrations/20261114000002_functions.sql` | Partner program actions and "Delete all my data" |
| `migrations/20261114000003_content.sql` | The real content (questions, sentences, words, lessons, flashcards, 5,588 places), **generated** from `content/base44-export/` by `scripts/supabase/build-content-migration.mjs` |
| `migrations/20261115000001_course_data.sql` | Prompt 4: two passes at Write it level 1 move the learner to level 2 (`write_level1_passes` 0-2, a trigger sets `write_level`), and the old spaced-review fields (`ease_factor`, `interval`) leave `user_progress`: `review_items` is the one review schedule |
| `migrations/20261116000001_partner_counts.sql` | Prompt 11: `program_summary()` also counts stars and checkpoints passed |
| `migrations/20261117000001_ai_usage.sql` | Step 4: `ai_usage` and `take_ai_request()`, the daily AI limits (counts only, today only) |
| `migrations/20261118000001_support_limit.sql` | Step 5: the "Talk to a person" limit (3 a day) in `take_ai_request('support')` |
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

On your computer, with the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) installed (version 3 or later).
Run every command from inside the project folder; a new Terminal window
starts in your home folder, so go there first:

```bash
cd ~/pathways-usa-app-data
```

```bash
supabase login
```

Link this folder to the project. Our project ref is `myrkrrvigxzgfiznizvj`
(20 lowercase letters, also in the dashboard address
`supabase.com/dashboard/project/…`). It is **not** the `sb_publishable_…` key.
Type it as is, with no `< >` around it (in zsh, `<` and `>` cause
`parse error near '\n'`):

```bash
supabase link --project-ref myrkrrvigxzgfiznizvj
```

Apply the migrations to the real project. `--remote` matters: without it,
CLI version 3 aims at a local test database that needs Docker
(`ECONNREFUSED 127.0.0.1:54322`):

```bash
supabase db push --remote
```

It lists the migrations it hasn't applied yet and asks you to confirm. If it
asks for the database password, type it there, never in a chat (reset it in
Project Settings → Database). It applies every migration, including the
content. It does **not** load `seed.sql`. Run it again after new migrations
arrive (`git pull` first).

If a `supabase secrets` or `supabase functions` command ever says it's aiming
at the "local stack", add `--project-ref myrkrrvigxzgfiznizvj` to it.

**Make yourself an admin** (Supabase dashboard → SQL editor, after you've
signed in to the app once with your email, with the sign-in switch on).
Replace `you@example.org` with your email, keeping the single quotes:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
where email = 'you@example.org';
```

"Success. No rows returned" appears even when the email matched nobody (a
typo, or that email hasn't signed in yet), so check it:

```sql
select email, raw_app_meta_data
from auth.users
where email = 'you@example.org';
```

One row with `"role":"admin"` means it worked. Then sign out and sign in
again: the admin role reaches the app with the next login, and Me shows an
Admin link.

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
| `functions/ai/` | Every live AI request when the switch is on (Step 4): Ask Amio, checking a spoken civics answer, interview scoring, the "understood the question" check, "Explain it simply". Signed-in learners only. The phone sends `{ kind, input }` (data, never instructions); `functions/_shared/aiServer.generated.js` (bundled from `src/lib/aiServer.js` by `npm run ai:server`) confirms the question against `civics_questions` / `interview_questions` / the N-400 guide and writes the instructions; `take_ai_request()` counts the daily limit (`ai_usage`, counts only); then Claude (`AI_MODEL`, default `claude-sonnet-5-5`, with the server-side refusal fallback on Sonnet/Opus). Never logs or saves the text. Needs the secret `ANTHROPIC_API_KEY` |
| `functions/district-lookup/` | "Who Represents Me?" for a ZIP that spans districts: signed-in learners only; sends the street address and ZIP to Geocodio once and returns only `{ state, district }` (logic in `functions/_shared/districtLookup.js`, tested in `src/api/districts.test.js`). Never logs or saves the address. Needs the secret `GEOCODIO_API_KEY` |
| `functions/support-message/` | "Talk to a person" (Step 5): signed-in learners only; takes only the message, removes identifiers (`_shared/redact.js`, an exact copy of `src/lib/redact.js`), counts the daily limit (`take_ai_request('support')`, 3 a day), and emails the team inbox through Resend with the learner's login email as Reply-To (`_shared/supportMessage.js`, `_shared/email.js`). Saves nothing. Needs the secret `RESEND_API_KEY` |
| `functions/pilot-reminders/` | Pilot check-in reminder emails (Step 5): admins only (anyone else gets 404); the "Send due reminders" button in Admin → Pilot. Uses the shared rules (`reminderPlan()` in `_shared/pilotCheckIns.js`) through `_shared/reminderJob.js`, the email text from the translation pack (`_shared/reminderTexts.generated.js`, `npm run email:texts`; English otherwise), sends through Resend, records each in `check_in_reminders`, returns counts only. Needs `RESEND_API_KEY` |
| `functions/pilot-report/` | The admin pilot dashboard (`/admin/pilot`): admins only (anyone else gets 404); reads the pilot learners' rows with the service role and returns one summary per learner keyed by `pilot_id`, never an email, name or login id. The math is `functions/_shared/pilotReport.js`, an exact copy of `base44/shared/pilotReport.js` (a test checks they match; change both together) |

Deploy (on your computer, in the project folder, after `supabase link`;
again whenever a function's folder changes).

**Secrets first.** Put the real key straight after the `=`: no spaces, no
quotes, no brackets. A placeholder left in by mistake is saved as the secret
(the function is then refused); running the command again with the real key
replaces it. Type keys in your terminal only, never in a chat.

| Secret | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys (starts with `sk-ant-`) |
| `GEOCODIO_API_KEY` | geocod.io → API Keys (the free tier is enough) |
| `RESEND_API_KEY` | resend.com → API Keys (starts with `re_`); the `pathwaysusa.org` domain must show as verified under Domains |

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-whole-key
```

```bash
supabase secrets set GEOCODIO_API_KEY=your-whole-key
```

```bash
supabase secrets set RESEND_API_KEY=re_your-whole-key
```

Optional: the model the civics eval picks (the default is `claude-sonnet-5-5`):

```bash
supabase secrets set AI_MODEL=claude-sonnet-5-5
```

Check: this lists each name with a fingerprint, never the key itself:

```bash
supabase secrets list
```

**Then the five functions**, one command each. If one says Docker isn't
running, add `--use-api` to the end:

```bash
supabase functions deploy ai
```

```bash
supabase functions deploy district-lookup
```

```bash
supabase functions deploy support-message
```

```bash
supabase functions deploy pilot-reminders
```

```bash
supabase functions deploy pilot-report
```

Dashboard → Edge Functions then lists all five.

`pilot-reminders` sends the reminder email in each learner's language from the
translation pack. After rebuilding the pack, refresh its copy and redeploy
(`npm test` fails until you do):

```bash
npm run email:texts
supabase functions deploy pilot-reminders
```

The `ai` function's shared code is a generated bundle. Rebuild it and deploy
again whenever the prompts, the official civics list, the N-400 guide or the
monthly officeholder list change (`npm test` fails until you do):

```bash
npm run ai:server
supabase functions deploy ai
```

Supabase gives every Edge Function its URL, anon key and service-role key
itself; nothing to paste. The service-role key stays on Supabase's servers.

## Turning the switch on (after Step 3)

Step 3 moved every screen's data into `src/api/`, behind the same switch as
sign-in (`VITE_AUTH_PROVIDER=supabase`). `src/api/movedData.test.js` checks
that no screen reads or writes data any other way.

### 1. Before you try it

- [ ] Every Step 3 pull request is merged into `standalone`.
- [ ] `supabase db push --remote` has applied every migration (run it again after new ones).
- [ ] The pilot dashboard's server function is deployed: `supabase functions deploy pilot-report`.
- [ ] The split-ZIP lookup is deployed with its key: `supabase secrets set GEOCODIO_API_KEY=...`, then `supabase functions deploy district-lookup`.
- [ ] The AI function is deployed with its key: `supabase secrets set ANTHROPIC_API_KEY=...`, then `supabase functions deploy ai`.
- [ ] The email functions are deployed with their key: `supabase secrets set RESEND_API_KEY=...`, then `supabase functions deploy support-message` and `supabase functions deploy pilot-reminders`.
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
| Ask Amio | Ask a question (not a suggested one); open Study history | `ai_study_logs`; today's `ask` count in `ai_usage` |
| AI checks | Say a civics answer the app can't match; finish a practice interview | a feedback line; `civics` and `interview` counts in `ai_usage` (no text) |
| Saved places | Save a place | `saved_places` |
| Partner programs | Admin → Partners: a fake program with your email as staff; pick it in Me with the fake account; confirm it on `/Partner` | `partners`, `program_memberships` |
| Pilot | Answer "Help us improve"; open `/admin/pilot` as admin | `outcome_checkins`; the dashboard lists the fake learner |
| Talk to a person | Ask Amio → Talk to a person: send a fake message | it arrives in the team inbox with your email as Reply-To; a fourth message that day says "write again tomorrow"; `support` count in `ai_usage` |
| Reminder emails | Admin → Pilot: "Pretend I signed up 3 months ago", turn reminders on, then "Send due reminders" | the email arrives once; a second press sends nothing; a row in `check_in_reminders` |
| Delete my data | With the **fake** account: Settings → Delete all my data | the fake login is gone from Authentication → Users, and its rows from every table |

### 3. Still on Base44 after Step 3

These keep working only while the switch is **off**, until their step moves them:

- ~~**AI**~~: moved in Step 4. With the switch on, AI goes through the `ai` function (above) and the split-ZIP lookup through `district-lookup`; app text comes from the translation pack only.
- ~~**Emails**~~: moved in Step 5. With the switch on, "Talk to a person" goes through `support-message` and the pilot reminders through `pilot-reminders` (above).
- **The review schedule**: the screens still use the old one on `user_progress`; `review_items` (Prompt 4) replaces it in its own PR.

With Steps 4 and 5 done, the switch can go on in Cloudflare Pages once the checklist above is complete.

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
