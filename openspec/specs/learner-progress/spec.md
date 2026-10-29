# learner-progress Specification

## Purpose

Shows learners what they have practiced and mastered, their points and badges, their Ask Vía history, and their profile settings, in a respectful way with no competition or punishing streaks.

## Requirements

### Requirement: Progress page
The Progress page SHALL show total items practiced (linking to study history), items mastered (linking to lesson progress), test preparedness as mastered items out of a goal of 100, the quick-check card, a practice calendar, a progress chart, achievements, and recent activity.

#### Scenario: Learner with 40 mastered items
- **WHEN** a learner has mastered 40 items
- **THEN** test preparedness shows 40%

### Requirement: Lesson progress page
The lesson progress page SHALL count lessons as Completed (finished with at least one quiz), In Progress (opened), or Not Started, grouped under the five lesson topics.

#### Scenario: Lesson opened but not finished
- **WHEN** a learner opened a lesson but did not finish it
- **THEN** it counts as In Progress

### Requirement: Points and badges, no competition
Learners SHALL earn 10 points per correct practice item and SHALL see their points and badge collection on Profile. The app SHALL NOT show leaderboards, hearts or lives, or streak counters that reset.

#### Scenario: Learner views Profile
- **WHEN** a learner opens Profile
- **THEN** they see their points and badges and no ranking against other learners

### Requirement: Study history
Study history SHALL list the learner's saved Ask Vía questions and answers, newest first, with date, language, and a Listen button, and link to Practice when empty.

#### Scenario: No history yet
- **WHEN** a learner has never asked Vía a question
- **THEN** study history links to Practice

### Requirement: Profile settings
Profile SHALL let learners change their display name, tutor settings, read aloud, text size, and voice settings. Tutors SHALL see classroom progress instead of learner stats.

#### Scenario: Learner renames themself
- **WHEN** a learner saves a new display name
- **THEN** their public profile and account show the new name

### Requirement: Delete my data
Profile SHALL let a learner, after confirming, delete their learning records (progress, lesson progress and notes, N-400 progress, interview sessions, study history, messages, assignments, tutor links, notifications, public profile), reset account fields (name shown, points, badges, tutor profile, levels), clear the app's data from the device, and sign out.

#### Scenario: Learner deletes their data
- **WHEN** a learner confirms Delete my data
- **THEN** their records are removed, their device data is cleared, and they are signed out

#### Scenario: Deletion fails partway
- **WHEN** a deletion step fails
- **THEN** the learner sees an error and the remaining steps do not run
