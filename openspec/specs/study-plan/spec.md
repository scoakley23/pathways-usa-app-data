# study-plan Specification

## Purpose

Turns a learner's levels and optional target month into a short daily list of study tasks on Home (Today), with gentle check-ins, while keeping the target date and progress marks only on the device.

## Requirements

### Requirement: Plan setup offers three choices
Plan setup SHALL let a learner pick a target month (from the current month up to 18 months ahead, defaulting to two months ahead), say "I don't know", or choose "Just study". It SHALL NOT ask about the learner's case, filing date, or field office.

#### Scenario: Learner picks a month
- **WHEN** a learner picks a month
- **THEN** the target date is set to the 15th of that month

#### Scenario: Learner does not know
- **WHEN** a learner chooses "I don't know"
- **THEN** the target date is set to 12 weeks from today

#### Scenario: Learner just wants to study
- **WHEN** a learner chooses "Just study"
- **THEN** no target date is kept and the plan has no end date

### Requirement: Plan lives only on the device
The target date, plan mode, plan start, daily checkmarks, last visit, and dismissed check-ins SHALL be stored only in the device's browser storage, never in the learner's account. Storage errors SHALL be treated as "no plan" rather than breaking the page.

#### Scenario: Learner opens the app on a new device
- **WHEN** a learner with quick-check levels signs in on a device with no stored plan
- **THEN** Today shows plan setup ("This phone doesn't have your date yet") above the tasks; no plan is restored from the account

### Requirement: Today shows the right state
The Today card SHALL show nothing to signed-out visitors, the tutor introduction to learners with no levels and no plan, plan setup above the tasks to learners with levels but no plan, and the day's tasks otherwise.

#### Scenario: Levels but no plan
- **WHEN** a learner has quick-check levels but no plan on this device
- **THEN** plan setup appears above the day's tasks

### Requirement: Daily task count adapts
Today SHALL list 3 tasks when the learner missed days since their last visit, 5 when 4 or fewer weeks remain before the target, and 4 otherwise.

#### Scenario: Learner returns after missed days
- **WHEN** a learner opens Today after missing one or more days
- **THEN** Today lists 3 tasks and no penalty is shown

#### Scenario: Target is close
- **WHEN** 4 or fewer weeks remain before the target date
- **THEN** Today lists 5 tasks

### Requirement: Tasks follow the learner's levels
Each day SHALL include a civics task (learn or review). Other tasks SHALL favor weaker skills: "start here" most, then "getting there" and unchecked; "strong" skills SHALL be picked by weight only every third day and otherwise SHALL be used only to fill remaining slots. Each task SHALL show an estimated time and link to its page.

#### Scenario: Strong civics
- **WHEN** a learner's civics level is strong
- **THEN** civics is "learn" every third day and "review" on the other days

#### Scenario: Task links
- **WHEN** a learner taps a task
- **THEN** it opens the matching page: learn, review, reading practice, dictation, interview practice, or an N-400 coach section

### Requirement: N-400 sections are scheduled
On two days of each week, Today SHALL include one not-yet-completed N-400 section, moving forward through the remaining sections in form order at a pace set by the weeks left before the target.

#### Scenario: N-400 day
- **WHEN** it is an N-400 day in the plan and sections remain
- **THEN** Today includes this week's uncompleted N-400 section

### Requirement: Checkmarks and keep going
A learner SHALL be able to check off tasks for the day. After all tasks are checked, Today SHALL offer "Keep going", which adds two more tasks.

#### Scenario: All tasks done
- **WHEN** a learner checks off every task for the day
- **THEN** a "Keep going" option adds a civics review and a reading or writing task

### Requirement: One check-in at a time
Today SHALL show at most one check-in, in priority order: welcome back after missed days; a low-skill nudge; a re-check of the weakest skill once levels are 14 or more days old; an offer of more English. "Not now" SHALL hide it for the rest of the day.

#### Scenario: Levels are old
- **WHEN** the quick-check date is 14 or more days ago and no higher-priority check-in applies
- **THEN** Today offers to re-check the weakest checked skill

#### Scenario: More English offer accepted
- **WHEN** a non-English learner who is doing well accepts more English
- **THEN** the tutor's English mix in their account moves up one level

### Requirement: No punishing streaks
Today SHALL show practice days for the current week (Monday to Sunday) and how many 2025 civics questions are mastered, and SHALL NOT show leaderboards, lives, or streak penalties.

#### Scenario: Learner views the footer
- **WHEN** a learner views Today
- **THEN** they see practice days this week and civics questions ready, with no streak counter that resets

### Requirement: Home roadmap shows where the learner is
Home SHALL show a five-stop path with the tutor at the first stop not yet done, labeled "You're here". Stops SHALL complete on: 20 mastered sentences; half of lessons completed with a best quiz score of 70 or more; one passed mock interview. The layout SHALL mirror for right-to-left languages.

#### Scenario: Signed-out visitor
- **WHEN** a signed-out visitor sees the roadmap
- **THEN** the first stop is current and none are done
