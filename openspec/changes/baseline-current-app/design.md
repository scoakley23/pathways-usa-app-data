# Design

## Context

See proposal.md for why. The specs were drafted from a read-only pass over `src/`, `base44/entities/`, `base44/functions/`, `content/`, `CLAUDE.md`, and `docs/`. The project rules in `CLAUDE.md` are binding (legal, privacy, brand, tutor tone). In a few places the code does not yet meet those rules; those gaps are listed below.

## Goals / Non-Goals

**Goals:**
- One spec per durable capability, written as observable behavior: what learners, tutors, and admins see, and what is stored or sent.
- Specs that future changes can extend with small MODIFIED/ADDED deltas.

**Non-Goals:**
- Fixing any gap found. Each fix is its own later change.
- Specifying visual design detail (colors, fonts, components). `docs/redesign/brand-spec.md` remains the binding design spec; only contrast, size, and disclaimer rules are in `app-shell`.
- Specifying exact UI copy everywhere. Quoted strings are used only where the wording carries a promise (privacy, legal, pass rules).

## Decisions

- **Spec the rule where code falls short.** Where code conflicts with a `CLAUDE.md` rule, the requirement states the rule, and the gap is listed below for a follow-up change. The alternative, specifying today's behavior exactly, would make the specs approve privacy and legal gaps. (Decided by the project owner.)
- **Cross-cutting rules get their own capabilities** (`content-integrity`, `learner-privacy`, `language-support`, `app-shell`), and feature specs reference them through scenarios instead of repeating them. Rejected alternative: a single catch-all "rules" spec, which would grow without bounds.
- **Flat capability layout** (`specs/<name>/spec.md`), matching OpenSpec's default; there are no existing specs to follow.
- **Numbers that matter are in the specs** (pass cutoffs, level cutoffs, task counts, review intervals, page sizes), because changing them changes what learners experience.

## Risks / Trade-offs

- [Specs drafted from reading code, not running it] → tasks.md includes a walk-through on a branch with a fake test account to check each capability's scenarios.
- [Specs state rules the code does not yet meet] → each gap below becomes a tracked follow-up; until fixed, those scenarios are expected to fail.
- [Large baseline is hard to review at once] → each capability is self-contained and can be reviewed separately.

## Known gaps (code vs. spec)

| Capability | Spec says | Code today |
| --- | --- | --- |
| `guided-lessons`, `learner-privacy` | Lesson quiz answers are checked on the device first and have emails/phones removed before AI | `LessonDetail.jsx` `checkAnswer` sends the typed (or spoken) answer straight to AI, unredacted, with no on-device check. (The AI "why" on wrong answers explains the official answer, which is allowed.) |
| `learner-privacy` | Interview answers are redacted before AI | Mock interview and lesson interview steps accept typed answers; neither `evaluateInterviewAnswer.js` nor its callers (`InterviewPractice.jsx`, `lessonSteps.jsx`) strip emails or phone numbers |
| `app-shell`, `content-integrity` | "Free practice · Not affiliated with USCIS" where the brand meets the public | That line is not in `src/`; only the footer disclaimer exists |
| `classroom` | Notifications are created only for a recipient with a reason | `Notification` create rule checks only `created_by`, so any user can notify any email |
| `learner-privacy` | Places are admin-only to change | `CommunityResource` rls is `create/update/delete: created_by_id = user.id`, so any signed-in user can create a place and edit their own (confirmed in the entity file) |
| `learner-progress` | Points and badges are shown | Badges, "Correct Answers", and max streak are displayed but never awarded (only points are) |
| `app-shell` | Daily reminder is once per learner's day | Uses the UTC date, so the "day" may differ from the learner's local day |
| `language-support` | RTL for six languages | Resolved in this change: `CLAUDE.md` now lists all six (ar, fa, ur, he, prs, ps), matching the code |
| `learner-progress` | Delete my data resets account fields | `full_name` (written by Profile) and `total_correct` are not reset |
| `learner-privacy` | Every browser-storage read and write tolerates storage being unavailable | Two writes have no try/catch: the role cache in `Layout.jsx` (dialog completion) and `pending_tutor_invite` in `RoleSelectionDialog.jsx` |
| `skill-check` | Re-checking one skill keeps the other saved levels | If loading the account fails, `QuickCheck.jsx` saves the other levels as empty, wiping them |
| `interview-day` | The Interview Day page writes nothing to browser storage | The app shell still writes there on `/interview-day`: the role cache (`Layout.jsx`) and cached AI translations for Ask Vía / Talk to a person in languages other than English and Spanish |
| `ai-tutor` | Feature pages show a tutor guide line | The Lesson Progress page (`Dashboard.jsx`) has none |
| `ai-tutor` | Microphones stop read-aloud before listening | The N-400 card's "Say it back" mic (used inside the coach, a read-aloud screen) does not call `stopReading()` |
| `resource-hub`, `admin-tools` | Places that aren't relevant are hidden with a reason, not deleted | The admin Hide button sets hidden without asking for a reason (an old note like "Checked: shown" can remain), and the admin list has a Delete action |
| `resource-hub`, `learner-privacy` | Hidden places are not shown to learners | Hidden places (with admin notes) are downloaded to every learner's browser and filtered there; `CommunityResource` read is open |
| `learner-progress`, `learner-privacy` | Delete my data removes the learner's records | Notifications in other people's inboxes that contain the learner's email ("… wants to join your class", "New message from …") remain |
| `classroom` | Link requests go to tutors | The server `request` action does not check that the target email is a tutor, so a pending link, email, and notification can go to any address |
| `guided-lessons`, `learner-privacy` | Spoken lesson answers are checked on the device first | `lessonSteps.jsx` sends spoken civics answers straight to the AI |
| `guided-lessons`, `content-integrity` | Changing/varying answers use confirmed names and the learner's lookup | Lesson steps don't pass the confirmed name or lookup: typed answers to these questions can never be marked right, and spoken "Answers vary" answers accept any valid official |
| `content-integrity` | Official answers come from the question bank | On "Answers change" questions, practice never matches against the confirmed name; the AI decides the current official from a web search |
| `learner-privacy` | Every browser-storage access tolerates storage being unavailable | `civicsVersion` read/write in `Practice.jsx` has no try/catch |
| `learner-privacy` | Stored emails are lowercase (so access rules match) | `LessonProgress` (`LessonDetail.jsx`), Learn/Review `UserProgress`, and the representative-change notification store the email as given |
| `skill-practice` | Each correct item adds 10 points | Points use a stale total, so several correct items in one session add only 10 |

### Follow-up changes

One proposed OpenSpec change per open gap (names are suggestions for `/opsx:propose`):

1. `redact-lesson-quiz-answers` (`guided-lessons`, `learner-privacy`): check lesson quiz answers on the device first and strip emails/phones before any AI call.
2. `redact-interview-answers` (`learner-privacy`, `skill-practice`): strip emails/phones from typed interview answers before AI scoring.
3. `show-free-practice-disclaimer` (`app-shell`, `content-integrity`): add "Free practice · Not affiliated with USCIS" where the brand meets the public.
4. `restrict-notification-create` (`classroom`): let only the server or a linked user create a notification for someone else.
5. `admin-only-places` (`learner-privacy`, `resource-hub`): limit place create/update/delete to admins.
6. `decide-badges` (`learner-progress`): award badges and correct-answer counts with defined criteria, or remove them from Profile (see Open Questions).
7. `local-day-reminder` (`app-shell`): use the learner's local date for the daily reminder.
8. `complete-delete-my-data` (`learner-progress`): also reset `full_name` and `total_correct`.
9. `guard-storage-writes` (`learner-privacy`): wrap the role cache and pending-invite writes in try/catch.
10. `keep-levels-on-recheck` (`skill-check`): don't save a one-skill re-check when the earlier levels failed to load.
11. `interview-day-no-storage` (`interview-day`): skip shell storage writes on `/interview-day`.
12. `dashboard-guide-line` (`ai-tutor`): add a tutor guide line to Lesson Progress.
13. `say-it-back-stops-reading` (`ai-tutor`): stop read-aloud when the "Say it back" mic starts.
14. `hide-places-with-reason` (`admin-tools`): require a reason when hiding a place, and remove or restrict Delete.
15. `hidden-places-server-side` (`resource-hub`): don't send hidden places or admin notes to learners.
16. `scrub-email-from-notifications` (`learner-progress`): avoid emails in notification text, or remove them on Delete my data.
17. `request-only-tutors` (`classroom`): check that a link request targets a tutor.
18. `lesson-answers-device-first` (`guided-lessons`): match spoken lesson answers on the device first, and pass confirmed names / lookup results to lesson checks.
19. `match-confirmed-officials` (`skill-practice`, `content-integrity`): match "Answers change" answers against the confirmed names before any AI check.
20. `lowercase-stored-emails` (`learner-privacy`): lowercase emails on every learner-record write, and wrap the `civicsVersion` storage access.
21. `fix-points-total` (`skill-practice`): add points from the current total.

(The RTL row needs no follow-up; it was resolved here.)

Other observations, not spec conflicts (left for the owner to judge):
- Lesson notes: `LessonNotes` exists (owner-only) and `LessonNotesTab.jsx` exists, but no screen uses it, so notes are not in the specs. CLAUDE.md's data table still lists `LessonNotes`.
- Find My Representative shows "Representatives saved" even when nothing was saved (no public profile yet), and the street-address follow-up never triggers the officials-changed email.
- The practice-test "difficulty" filter turns off spaced review for civics.
- No screen lets a tutor or student remove a link (the access rule allows it); only Delete my data removes links. After removal the tutor can still read old assignments for that student.
- Accepting or declining a tutor's invite, or joining by code, does not notify the tutor. All classroom notifications are created in the browser, not the server.
- The `Message` access rule doesn't require a tutor link (any user can message any email), and the receiver can edit or delete a message's content.
- N-400 coach: if saving a finished section fails, the done screen still appears and offers "Next section" with the same section. The guide's "Mark complete" shows no message at all on failure.
- N-400 guide filters cards by status but not sections; a draft section with approved cards would show to learners (none today).
- Interview Day: if the speaking part has no questions it shows "No interview questions found." with Reload, which discards the rehearsal.
- The Ask Vía privacy note always says "Vía", even if the learner renamed the tutor.
- Home briefly shows the roadmap hero to signed-in users until their role loads, and signed-in users with no role yet see the Today card. A new tutor who signs in through "Start here" lands on the quick check and Getting started.
- In the sign-up path of the role dialog, an account is created before a class code is validated, so a bad code leaves an account with no role (rarely reached).
- CLAUDE.md lists `/Practice?mode=civics` among Today task links, but no Today task uses it (civics tasks go to `/learn` or `/review`).
- Today always shows the "This phone doesn't have your date yet" plan-setup wording, even the first time a learner has no plan.
- Reading practice sends the speech transcript (not audio) to AI for an optional tip. `docs/AI-Policy-updated.md` covers this, but the CLAUDE.md list of AI features does not name reading; one of the two should be updated.
- Other AI calls send only content or fixed UI text (translations of lessons, N-400 cards, Home strings, tutor lines, the lawyer checklist, civics and dictation cards) or are admin-only (explanation drafts, current officials).
- `RepresentativeFinder` emails the learner when their officials change (spec'd as current behavior in `civics-learning`).
- `src/pages/Messages.jsx` is an empty file; chat lives in the classroom components.
- Talk to a person emails the learner's text to support without stripping emails or phone numbers (not an AI call, so not covered by the AI rule).
- `content/resources/README.md` says re-imports "skip" matching rows in one place; the code updates changed fields.
- The reading "Yes, I got it" self-report in Practice may not advance to the next sentence.

## Open Questions

- Should badges be awarded (with defined criteria) or removed from Profile? The answer only affects a future change to `learner-progress`.
