# skill-practice Specification

## Purpose

Lets learners drill the four interview skills (reading, writing by dictation, civics, and the spoken interview) with fair scoring, official-answer feedback, and spaced repetition of what they practice.

## Requirements

### Requirement: Practice modes open directly
The Practice page SHALL offer interview, reading, dictation (writing), and civics modes and SHALL open a mode directly when one is named in the link (reading, dictation, and civics once the signed-in learner has loaded; interview for anyone).

#### Scenario: Link from Today
- **WHEN** a learner opens Practice with the civics mode in the link
- **THEN** civics practice starts without choosing a mode first

### Requirement: Civics test version is the learner's choice
Civics practice SHALL use the version chosen on the device, defaulting to 2025, and SHALL describe each: 2025 is "up to 20 of 128, pass with 12"; 2008 is "up to 10 of 100, pass with 6", labeled for learners who applied before Oct 20, 2025.

#### Scenario: No version chosen
- **WHEN** a learner has never chosen a version
- **THEN** civics practice uses the 2025 questions

### Requirement: Sessions favor what needs practice
A practice session SHALL load 10 items. For signed-in learners, items that are due, overdue, or in a weak category SHALL be favored and mastered items with long intervals that are not due SHALL be held back; for signed-out visitors, and for civics at a chosen difficulty, items SHALL be shuffled. Reading SHALL pick 10 random sentences.

#### Scenario: Weak category
- **WHEN** more than 40% of a learner's items in a civics category are wrong or still practicing
- **THEN** that category is favored and the learner sees a note that practice is focusing on it

### Requirement: Civics answers are checked on the device first
A civics answer SHALL first be matched on the device against the official accepted answers (correct when every key word of any accepted answer appears; parenthesized words optional). Only when that is not enough SHALL the AI check it, with emails and phone numbers removed first. If the AI fails, the learner SHALL self-check against the revealed answer.

#### Scenario: Typed answer matches
- **WHEN** a learner types an answer containing every key word of an accepted answer
- **THEN** it is marked correct without calling the AI

#### Scenario: AI check unavailable
- **WHEN** the AI check fails
- **THEN** the official answer is revealed with "Hard / Missed" and "Easy / Got it" buttons

### Requirement: Civics feedback shows the right answer source
When a civics answer is wrong, the feedback SHALL show the official accepted answers, or for changing answers the confirmed current official (or "check uscis.gov"), or for varying answers the learner's own lookup result (or a prompt to use Find My Representative).

#### Scenario: Wrong answer on a changing question
- **WHEN** a learner misses "Who is the Speaker of the House now?" and a confirmed name exists
- **THEN** the feedback shows the confirmed name and the date it was checked

### Requirement: Speech recognition and fallbacks
Spoken answers SHALL use the device's U.S. English speech recognition. No audio SHALL be recorded or uploaded. Without speech recognition, the civics card SHALL offer typing, reading SHALL say the browser is not supported and offer Skip, and the interview SHALL say speech is not supported.

#### Scenario: Browser without speech recognition
- **WHEN** the browser has no speech recognition and the learner opens a civics card
- **THEN** the card offers a text box instead of the microphone

### Requirement: Dictation is checked exactly
A dictation answer SHALL be correct when it matches the sentence exactly after ignoring case and most punctuation (periods, commas, and similar marks; question marks, apostrophes, and quotes still count). A learner who reveals the answer SHALL report whether theirs matched.

#### Scenario: Different capitalization
- **WHEN** a learner types the sentence with different capitalization and no final period
- **THEN** it is marked correct

### Requirement: Reading is scored by word matching
A reading attempt SHALL be scored by the share of the sentence's words heard in order and SHALL pass at 70 or more. No speech, or almost none, SHALL score 0. Any AI tip SHALL NOT change the score.

#### Scenario: Learner reads most words
- **WHEN** the device hears 8 of 10 words in order
- **THEN** the score is 80 and the attempt passes

### Requirement: Mock interview saves scores only
The mock interview SHALL ask 12 questions (2 small talk, 3 personal information, 4 moral character, 3 oath) and SHALL pass when at least 70% of answers are acceptable. Personal-information and moral-character questions SHALL be answered as a practice person. Only per-question scores SHALL be saved; transcripts SHALL stay in memory for the end-of-interview report.

#### Scenario: Interview ends
- **WHEN** a learner finishes a mock interview
- **THEN** the session's scores are saved and the report is shown, and no transcript is saved

### Requirement: Practice results update spaced review and points
For signed-in learners each practiced item SHALL update its spaced-review schedule, and each correct item SHALL add 10 points. Signed-out visitors SHALL have nothing saved. Skipping a civics item SHALL save nothing; a skipped interview question SHALL count as a score of 0.

#### Scenario: Correct civics answer
- **WHEN** a signed-in learner answers a civics question correctly
- **THEN** its next review moves further out and they gain 10 points

### Requirement: Assigned practice reports back to the tutor
When a learner completes an item their human tutor assigned, the assignment SHALL be marked completed and the tutor SHALL be notified.

#### Scenario: Assigned item completed
- **WHEN** a student completes an assigned sentence
- **THEN** the assignment shows as completed and the tutor gets a notification
