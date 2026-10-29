# interview-day Specification

## Purpose

Prepares learners for the naturalization interview with a "what to expect" guide and a full timed-feel rehearsal under real test rules, saving nothing.

## Requirements

### Requirement: Interview Day page offers a guide and a rehearsal
The Interview Day page SHALL show a "What to expect" guide (with a "Talk to a lawyer first" link) and a full rehearsal. Signed-out visitors SHALL be asked to sign in before rehearsing.

#### Scenario: Signed-out visitor
- **WHEN** a signed-out visitor opens Interview Day
- **THEN** they can read the guide and see a "Sign in" button for the rehearsal

### Requirement: Rehearsal start screen
The start screen SHALL say "This is practice. Pathways is not part of USCIS. Your answers are not saved.", let the learner pick a practice person and the 2025 or 2008 civics test (defaulting to the version chosen on the device, else 2025), and say it takes about 30 minutes and can be stopped any time.

#### Scenario: Learner chose 2008 during setup
- **WHEN** the device has the 2008 civics version saved
- **THEN** the rehearsal defaults to the 2008 civics test

### Requirement: Rehearsal runs the parts in order
The rehearsal SHALL run Oath, Small talk and N-400 review, Reading, Writing, Civics, then Results, with "Part X of 6" progress and a Stop button on every part except Results.

#### Scenario: Learner stops midway
- **WHEN** a learner taps Stop during any part
- **THEN** the learner returns to the Interview Day page with their practice person and civics version kept, and nothing is saved

### Requirement: Oath step
The officer's oath line SHALL be spoken aloud. The learner SHALL advance by tapping "I do" or by saying "I do" or "yes". The oath SHALL NOT be scored.

#### Scenario: Learner says something else
- **WHEN** the device hears a phrase other than "I do" or "yes"
- **THEN** it shows what it heard and asks the learner to try again or tap "I do"

### Requirement: Rehearsal uses real pass rules
Speaking SHALL pass with acceptable answers to at least 70% of questions. Reading and writing SHALL each give up to 3 sentences and pass on the first correct one. Civics SHALL follow the chosen test: 2025 asks up to 20 and passes at 12 right or fails at 9 wrong; 2008 asks up to 10 and passes at 6 right or fails at 5 wrong.

#### Scenario: 2025 civics pass
- **WHEN** a learner on the 2025 test reaches 12 correct answers
- **THEN** the civics part ends as passed

#### Scenario: Moving on without answering
- **WHEN** a learner moves past an item without a recorded result
- **THEN** that item counts as wrong

#### Scenario: Part has no content
- **WHEN** no items can be loaded for reading, writing, or civics
- **THEN** it says "This part isn't available right now." and counts as not passed

### Requirement: Test mode gives one try
In the rehearsal, reading, writing, and civics items SHALL allow one try with no reveal and no translation, and civics SHALL offer "I don't know", which counts as wrong.

#### Scenario: Learner does not know a civics answer
- **WHEN** a learner taps "I don't know"
- **THEN** the question counts as wrong and the next one appears

### Requirement: Results and saving nothing
Results SHALL show each skill as "Passed" or with a "Practice more" link to the matching practice, and say the results are not saved and do not predict the real interview. The rehearsal SHALL make no account writes and no browser-storage writes.

#### Scenario: Learner refreshes the page
- **WHEN** a learner refreshes during or after a rehearsal
- **THEN** the rehearsal state is gone and nothing about it was stored
