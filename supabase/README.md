# Supabase (Standalone Step 1)

The database for Pathways after it leaves Base44. **The app doesn't use its
data yet**: screens still talk to Base44 until Standalone Step 3. Sign-in
(Step 2) is ready behind a switch; see "Sign-in" below.

| File | What it is |
|---|---|
| `migrations/20261114000001_schema.sql` | Every table and its data rules (row-level security) |
| `migrations/20261114000002_functions.sql` | Partner program actions and "Delete all my data" |
| `migrations/20261114000003_content.sql` | The real content (questions, sentences, words, lessons, flashcards, 5,588 places), **generated** from `content/base44-export/` by `scripts/supabase/build-content-migration.mjs` |
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
| Authentication → Sign In / Providers → Email | Email provider **on**. "Email OTP Length" **6**. "Email OTP Expiration" **600** seconds (10 minutes) |
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
