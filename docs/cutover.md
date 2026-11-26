# Cutover: moving app.pathwaysusa.org from Base44 to Supabase + Cloudflare Pages

A step-by-step guide for the owner. Run the commands on your own computer,
one block at a time, from the project folder. **Never paste a secret key into
a chat, a pull request, or any file in this repo.** The only values that may
go in Cloudflare's settings are the two *public* Supabase values (the
Project URL and the anon / publishable key).

Background details live in [`supabase/README.md`](../supabase/README.md);
this guide puts them in order for cutover day.

## Where things stand (checked Nov 26, 2026)

- The live app at `https://app.pathwaysusa.org` is Base44's build of `main`,
  served through Cloudflare. Its JavaScript has the provider fixed to
  `"base44"` and an empty Supabase URL and key, so the switch is **off**.
- The newest work (Supabase data, Amio v2) is on `standalone` only.
- The Supabase project `myrkrrvigxzgfiznizvj` answered normally (it asked
  for a key rather than saying "paused"), and all five Edge Function names
  exist there. They may be older versions; this guide deploys them again.
- `next.pathwaysusa.org` sits behind a Cloudflare Access login.
- A test build of `standalone` with the switch on works without any Base44
  settings: about 1,900 files, none near Cloudflare's 25 MB limit.

## What changes on cutover day

| Before | After |
|---|---|
| app.pathwaysusa.org shows Base44's build of `main` | app.pathwaysusa.org shows Cloudflare Pages' build of `standalone` |
| Learners sign in with Base44 | Learners sign in with a 6-digit code from Supabase |
| Learner data is in Base44 | New learner data goes to Supabase. **Old Base44 data is not copied** (see Step 12) |
| Merging into `main` updates the live app | Merging into **`standalone`** updates the live app. `main` no longer changes app.pathwaysusa.org |

---

## Step 1. Make sure the Supabase project is running

1. Open the Supabase dashboard and pick the Pathways project.
2. If you see **"Project is paused"**, press **Restore project** and wait
   until the status says it's healthy (a few minutes). Paused projects keep
   their data.
3. If a project has been paused for a long time, the dashboard may only
   offer a backup download. Tell me if you see that and we'll stop here.
4. **Billing**: free projects pause themselves after about a week with no
   use. A live app shouldn't pause, so put this project on a paid plan
   (Organization → Billing) before cutover, and check there's no unpaid
   invoice.

Check from the terminal too. First, the CLI version (it should be 3 or
later):

```bash
supabase --version
```

```bash
supabase login
```

```bash
supabase projects list
```

The Pathways project (ref `myrkrrvigxzgfiznizvj`) should be in the list.
If the command errors or the list is empty, check you're logged in to the
right Supabase account.

## Step 2. Get the latest `standalone`

```bash
cd ~/pathways-usa-app-data
```

```bash
git checkout standalone
```

```bash
git pull
```

```bash
npm ci
```

```bash
npm test
```

All tests should pass. If any fail, stop and send me the last lines.

## Step 3. Link the folder and update the database

```bash
supabase link --project-ref myrkrrvigxzgfiznizvj
```

If it asks for the database password, type it there (reset it in Project
Settings → Database if you don't have it).

```bash
supabase db push --remote
```

It lists the migrations it hasn't applied yet and asks you to confirm.
"Remote database is up to date" is also fine. It never loads `seed.sql`
(the fake accounts).

**Check**: dashboard → SQL editor, run:

```sql
select version from supabase_migrations.schema_migrations order by version;
```

The last row should be `20261118000001` (or newer if newer migrations exist
in `supabase/migrations/`).

## Step 4. Sign-in settings in the dashboard

These are described in `supabase/README.md` → "Sign-in". Check each one:

| Where | Should be |
|---|---|
| Authentication → Sign In / Providers → Email | On; Email OTP Length **6**; Email OTP Expiration **600** |
| Authentication → Rate Limits | Emails **30** per hour |
| Authentication → Emails → SMTP Settings | Resend, `Pathways <hello@pathwaysusa.org>`, minimum interval **60** seconds |
| Authentication → Emails → Templates → Magic Link **and** Confirm signup | Subject `Your Pathways code: {{ .Token }}`, body = all of `supabase/templates/sign-in-code.html` |
| Authentication → URL Configuration → Site URL | `https://app.pathwaysusa.org` |
| Authentication → URL Configuration → Redirect URLs | add `https://app.pathwaysusa.org` (keep `https://next.pathwaysusa.org` and `http://localhost:5173`) |

Sign-in uses a code, not a link, so the URLs matter little, but they should
name the real address.

## Step 5. Function secrets

Get each key from its own site (see the table in `supabase/README.md`).
Paste the real key straight after the `=`, with no spaces or quotes. Type
them in your terminal only.

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-whole-key
```

```bash
supabase secrets set GEOCODIO_API_KEY=your-whole-key
```

```bash
supabase secrets set RESEND_API_KEY=re_your-whole-key
```

**Check** (shows names and fingerprints, never the keys):

```bash
supabase secrets list
```

You should see the three names (plus Supabase's own `SUPABASE_…` ones).

## Step 6. Deploy the five functions

One command each. If one says Docker isn't running, run it again with
`--use-api` added at the end.

```bash
supabase functions deploy ai
```

```bash
supabase functions deploy district-lookup
```

```bash
supabase functions deploy pilot-report
```

```bash
supabase functions deploy support-message
```

```bash
supabase functions deploy pilot-reminders
```

**Check**:

```bash
supabase functions list
```

All five should be listed as `ACTIVE`, each with today's date.

## Step 7. The Cloudflare Pages project

If a Pages project already serves `next.pathwaysusa.org`, use that one and
check its settings against this table. Otherwise: Cloudflare dashboard →
Workers & Pages → Create → Pages → **Connect to Git** → pick
`scoakley23/pathways-usa-app-data`.

| Setting | Value |
|---|---|
| Production branch | `standalone` |
| Framework preset | None (or Vite) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | (empty) |

**Environment variables** (Settings → Variables and Secrets), for
**Production**. Both Supabase values are in the Supabase dashboard → Project
Settings → API. They are public by design; the **service-role key never
goes here**.

| Name | Value |
|---|---|
| `VITE_AUTH_PROVIDER` | `supabase` |
| `VITE_SUPABASE_URL` | `https://myrkrrvigxzgfiznizvj.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | the anon / publishable key (starts with `sb_publishable_` or `eyJ`) |
| `NODE_VERSION` | `22` |

Don't add the Base44 variables: the Supabase build doesn't need them.

**Preview builds** (Settings → Builds → Branch control): set preview
branches to **None** for now. Otherwise every branch pushed to GitHub gets a
public test address.

Variables only reach a build made *after* they were saved. If the first
build ran before you added them, go to Deployments → the latest one →
**Retry deployment**.

Page addresses such as `/course` or `/study?tab=practice` work without extra
files: Pages sends unknown paths to `index.html` because the app has no
`404.html`.

**Check**: open the project's `….pages.dev` address. You should see the
Welcome screen with Amio. Then open `…pages.dev/course` directly: it should
load the app, not a 404. Tell me the `.pages.dev` address and I'll check that
its JavaScript has the switch on.

## Step 8. Sign in once and make yourself admin

1. On the `.pages.dev` address, tap Start and sign in with **your own email**
   (the 6-digit code).
2. Supabase dashboard → SQL editor, with your email between the quotes:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
where email = 'you@example.org';
```

3. Check it (one row with `"role":"admin"` means it worked):

```sql
select email, raw_app_meta_data
from auth.users
where email = 'you@example.org';
```

4. Sign out of the app and sign in again. Me → Settings should now show an
   Admin link.

## Step 9. Try each area with a fake account

Do this on the `.pages.dev` address (the real build). Use your own email for
the admin steps and a **second, fake email you control** for everything a
learner does (for example a `+test` address). Type only made-up information:
no real names, addresses or case details. Watch the results in Supabase →
Table Editor.

- [ ] **Sign-in**: sign in with the fake email → a row in `profiles`.
- [ ] **Content**: Practice (civics, reading, writing), Course, one lesson, the Resource Hub map → questions, sentences, lessons and places show.
- [ ] **Profile**: change the name in Settings; "Who Represents Me?" with a ZIP → `profiles.display_name`, `representative_state` / `_district`.
- [ ] **Activity**: open the app → today's row in `activity_days`.
- [ ] **Practice**: one civics round → rows in `user_progress`; Me and Progress count them.
- [ ] **Lessons**: finish a course lesson → `lesson_progress`; write a note in a Study lesson → `lesson_notes`.
- [ ] **Interview**: finish a practice interview → `interview_sessions` (scores only); "I read this section" in the N-400 guide → `n400_section_progress`.
- [ ] **Ask Amio**: ask a question that isn't a suggestion; open Study history → `ai_study_logs`; an `ask` count in `ai_usage`.
- [ ] **AI checks**: say a civics answer in your own words → a feedback line; `civics` and `interview` counts in `ai_usage` (no text).
- [ ] **Saved places**: save a place → `saved_places`.
- [ ] **Partner programs**: as admin, Admin → Partners → a fake program with your email as staff; with the fake account, join it in Me → Settings → My tutor; as admin, confirm it on `/Partner` → `partners`, `program_memberships`.
- [ ] **Pilot**: answer "Help us improve Amio" with the fake account; open `/admin/pilot` as admin → `outcome_checkins`; the dashboard lists the fake learner.
- [ ] **Talk to a person**: send a fake message → it arrives in the team inbox with the fake email as Reply-To; a fourth one that day says to write again tomorrow.
- [ ] **Reminder emails**: as admin, Admin → Pilot → "Pretend I signed up 3 months ago", reminders on, "Send due reminders" → one email; pressing again sends nothing; a row in `check_in_reminders`.
- [ ] **Delete my data**: with the **fake** account, Settings → Delete all my data → the fake login is gone from Authentication → Users and its rows from every table.

If anything fails, stop and tell me which line. Nothing has changed for
learners yet: the live address still shows Base44.

## Step 10. Point app.pathwaysusa.org at Pages

**First, write down today's record** so you can undo this. Cloudflare
dashboard → the `pathwaysusa.org` zone → DNS → Records → the `app` row.
Copy its **Type**, **Target / Content** and **Proxy status** into a note on
your computer (not this repo). This is your rollback.

Then:

1. Workers & Pages → the Pages project → **Custom domains** → **Set up a
   custom domain** → `app.pathwaysusa.org`.
2. If Cloudflare says a record already exists, go back to DNS, delete the
   old `app` record (you wrote it down), and try again.
3. Wait until the domain says **Active** (usually a few minutes).
4. If Cloudflare Access protects `next.pathwaysusa.org`, make sure no Access
   application covers `app.pathwaysusa.org` (Zero Trust → Access →
   Applications). Learners must reach it without a login wall.

**Check**: open `https://app.pathwaysusa.org` in a private window. You should
see Welcome with Amio and the 6-digit code sign-in. Tell me and I'll check
the live JavaScript again: it should now contain
`myrkrrvigxzgfiznizvj.supabase.co` and the provider `"supabase"`.

## Step 11. How to roll back

**If the whole thing must go back to Base44** (fast, a few minutes):

1. Pages project → Custom domains → `app.pathwaysusa.org` → **Remove**.
2. DNS → add the `app` record exactly as you wrote it down in Step 10
   (same type, target and proxy status).
3. Open the address in a private window and check that the Base44 sign-in
   is back.

Anything learners did on Supabase in the meantime stays in Supabase; Base44
doesn't see it. Their Base44 data was never touched, so it's still there.

**If only the latest change broke something** (the cutover itself is fine):
Pages project → Deployments → pick the last good one → **Rollback to this
deployment**. Then fix the code on a branch and merge it into `standalone`
as usual.

**To switch off the new backend but stay on Pages**, which you shouldn't
need: removing `VITE_AUTH_PROVIDER` would make a Base44 build, but that
needs the Base44 variables, and Pages builds `standalone`, not `main`. Use
the DNS rollback above instead.

## Step 12. What happens to the learners' Base44 data

**Nothing is copied automatically.** The Supabase database has the content
(questions, sentences, lessons, places) but **no learner data from Base44**.
After cutover, a learner who used the Base44 app signs in with the same email
and gets a **new, empty account**: no practice progress, lesson progress,
notes, interview scores, N-400 sections read, Ask Amio history, saved places,
partner program, pilot answers or quick-check levels. Their device-only
settings (language, interview month, field office) stay on their phone.

The Base44 data itself stays where it is until you delete it. "Delete all my
data" in the new app deletes Supabase data only; it can't reach Base44.

The pilot is affected the most: a learner's 3-, 6- and 12-month check-ins
count from when their account was made, and their `pilot_id` (the key in the
pilot export) is new, so before and after can't be joined.

Options, from simplest:

1. **Fresh start.** Tell learners and partner programs before cutover that
   accounts start over and why. Keep the Base44 app at its own Base44 address
   for a set time (say 30 days) so learners can look at their old progress,
   then delete the Base44 learner data and say so. No code needed.
2. **Move only what keeps things working for people**: partner program
   memberships (so staff don't have to confirm everyone again), quick-check
   levels, and the pilot fields and check-ins (so the pilot keeps its
   learners and dates). This needs a one-time import script (a new pull
   request I can write), run once on your computer with the service-role key
   from a file outside the repo. It matches people by email and creates their
   Supabase login in advance, so their first code sign-in lands in the
   imported account.
3. **Move everything** the learner tables hold (the same script, more
   tables). More work and more to check, because some Base44 fields were
   renamed or dropped (see "Names that changed" in `supabase/README.md`).
   Ask Amio history and lesson notes are personal free text; consider leaving
   them out even here.

For options 2 and 3, tell learners first and update `docs/AI-Policy-updated.md`
and `docs/privacy-audit.md` to say the data moved. Afterwards, delete the
Base44 copy so the data isn't kept in two places.

## After cutover

- Every merge into `standalone` now goes live within minutes (Pages builds
  it). Review pull requests with that in mind.
- `main` and Base44 no longer change app.pathwaysusa.org.
- Once a week, press "Send due reminders" in Admin → Pilot, as before.
- After each monthly officeholder update: `npm run ai:server`, then
  `supabase functions deploy ai`.
- After rebuilding the translation pack: `npm run email:texts`, then
  `supabase functions deploy pilot-reminders`.
- After new migrations arrive: `git pull`, then `supabase db push --remote`.
