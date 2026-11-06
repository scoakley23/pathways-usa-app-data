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

### Requirement: Current officeholders come only from the officeholders table
For the questions about current officeholders and capitals (President, Vice President, Speaker, Chief Justice, the learner's U.S. senators, U.S. representative, governor and state capital: 2008 #20, 23, 28, 29, 40, 43, 44, 47; 2025 #23, 29, 30, 38, 39, 57, 61, 62, matched by their official wording), the system SHALL show and grade answers only from `src/data/officeholders.json`, with "Checked on official government websites on <date>", and "This may change soon. At your interview, name the person serving that day." when the table marks the office. These answers SHALL never be sent to the AI or checked on the web. An answer that can't be graded SHALL count as neither right nor wrong.

#### Scenario: President
- **WHEN** a learner sees "What is the name of the President of the United States now?"
- **THEN** the name from the table is shown with the date it was checked

#### Scenario: No saved place
- **WHEN** a learner answers "Name your U.S. representative." without a saved "Who Represents Me?" result
- **THEN** the answer isn't counted, and a link opens "Who Represents Me?" on the learn page

### Requirement: Who Represents Me? sends and saves the minimum
The lookup SHALL send only the ZIP code to the AI, and a street address only when the ZIP spans several districts, and the AI SHALL return only the state and congressional district, never names. The result SHALL be checked with `validateLocation()`; if it fails, the learner sees "We couldn't confirm your district. Please try again." and nothing is saved. Only the state and district SHALL be saved on the learner's public profile; names are shown from the officeholders table.

#### Scenario: ZIP spans several districts
- **WHEN** the lookup reports that the ZIP covers more than one district
- **THEN** the learner is asked for a street address, which is cleared after the lookup

#### Scenario: Results saved
- **WHEN** a lookup succeeds
- **THEN** the learner's public profile stores only the state and district, with no names, address or ZIP

#### Scenario: Old saved names
- **WHEN** a profile still holds officials' names from an earlier lookup
- **THEN** the names are cleared, and the state and district are kept only if they are in the table
