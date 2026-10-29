# civics-learning Specification

## Purpose

Teaches new civics questions and brings learned ones back on a spaced-review schedule, using reviewed explanations, official answers, and the right current names for questions whose answers change or vary.

## Requirements

### Requirement: Learn teaches new 2025 questions
The learn page SHALL require sign-in and SHALL teach 2025 civics questions the learner has not started yet, ordered by category then question, two at a time by default (one to five when requested). Each question SHALL be taught as: explanation, then the official question and accepted answers, then a spoken or typed practice.

#### Scenario: Learner opens learn
- **WHEN** a signed-in learner opens the learn page
- **THEN** they are taught the next two unstarted 2025 questions

#### Scenario: Everything started
- **WHEN** the learner has started every 2025 question
- **THEN** the page says so and links to review

### Requirement: Finishing learn schedules a review
Finishing a learn session SHALL save each taught question as "practicing" with a first review in 3 days. Leaving before the end SHALL save nothing.

#### Scenario: Learner finishes learn
- **WHEN** a learner finishes a learn session
- **THEN** the done screen says the quick check is in 3 days and each question is saved as practicing

### Requirement: Review uses spaced repetition
The review page SHALL show up to 5 due questions, most overdue first, as checks without teaching. A correct answer SHALL lengthen the gap (1 day after a first correct answer, 6 days after a second, then growing by the ease factor; a correct Learn practice counts as the first); a wrong answer SHALL make the question due again right away. A question SHALL be mastered after 3 correct in a row.

#### Scenario: Nothing due
- **WHEN** no questions are due
- **THEN** the review page shows the date of the next review

#### Scenario: Review results
- **WHEN** a learner finishes a review
- **THEN** each question shows correct or "Practice again", what they said, the accepted official answers, and when it comes back

### Requirement: Explanations are chosen by language
The system SHALL show the learner's own-language explanation when it is reviewed, otherwise the reviewed English explanation with "Translation coming soon.", otherwise "Explanation coming soon." A translated explanation SHALL also show the English text. Explanation links SHALL go only to official sites (https `.gov`, `.mil`, or `.si.edu`).

#### Scenario: Spanish learner with a reviewed translation
- **WHEN** a Spanish-language learner opens a question with a reviewed Spanish explanation
- **THEN** they see the Spanish explanation with the English text alongside

### Requirement: Questions whose answers change show confirmed names
For "Answers change" questions, the system SHALL show the admin-confirmed current official with the date it was checked. When no confirmed name and date exist, it SHALL tell the learner to check uscis.gov.

#### Scenario: Confirmed president
- **WHEN** a learner sees "Who is the President now?" and a confirmed name and check date exist
- **THEN** the name is shown with "checked on" and the date

#### Scenario: Not yet confirmed
- **WHEN** no confirmed name exists for that office
- **THEN** the learner is told to check uscis.gov

### Requirement: Questions whose answers vary use the learner's own lookup
For "Answers vary" questions about the learner's own state or district, the system SHALL show the result of the learner's Find My Representative lookup, or a prompt to run it when there is none.

#### Scenario: No lookup yet
- **WHEN** a learner sees "Name your U.S. Representative" and has never looked one up
- **THEN** a prompt links to Find My Representative on the learn page

### Requirement: Find My Representative sends the minimum
The representative lookup SHALL send only the ZIP code to the AI, and a street address only when the ZIP spans several districts. It SHALL save only the state (name, abbreviation, capital) and the officials' names, parties, districts, and photos, never the address or ZIP.

#### Scenario: ZIP spans several districts
- **WHEN** the lookup reports that the ZIP covers more than one district
- **THEN** the learner is asked for a street address, which is cleared after the lookup

#### Scenario: Results saved
- **WHEN** a lookup succeeds
- **THEN** the learner's public profile stores the state, governor, senators, and representative, with no address or ZIP

#### Scenario: Officials changed since last lookup
- **WHEN** a new ZIP lookup returns different officials than the ones shown before it
- **THEN** the learner gets an email and an in-app notification about the change
