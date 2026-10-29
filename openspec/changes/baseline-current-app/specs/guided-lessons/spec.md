# Spec Delta

## Purpose

Delivers step-by-step lessons led by the AI tutor (used by the quick check, learn, review, and N-400 coach) and the topic lesson library with quizzes.

## ADDED Requirements

### Requirement: Tutor lessons move one step at a time
A tutor lesson SHALL show "Step i of n" and one step at a time. Continue SHALL stay locked on practice and check-understanding steps until the learner answers or taps "Show me".

#### Scenario: Practice step not answered
- **WHEN** a learner is on a practice step and has not answered
- **THEN** Continue is disabled

### Requirement: Skippable parts
A lesson with skippable parts SHALL open each part with "Start" and "Skip this part".

#### Scenario: Learner skips a part
- **WHEN** a learner taps "Skip this part"
- **THEN** the lesson jumps to the start of the next part

### Requirement: Check mode records without teaching
A step in check mode SHALL record the learner's answer without showing teaching feedback.

#### Scenario: Review step
- **WHEN** a learner answers a check-mode step
- **THEN** the lesson moves on without explaining the answer

### Requirement: Typed answers are checked on the device
In tutor lessons, typed civics answers SHALL be checked on the device only. Spoken answers SHALL be checked on the device first and by the AI only when needed, with emails and phone numbers removed, falling back to the on-device check if the AI fails. Feedback SHALL always show the official accepted answers.

#### Scenario: Typed answer
- **WHEN** a learner types a civics answer in a lesson
- **THEN** it is checked without sending the text to the AI

### Requirement: Lesson library grouped by topic
The Lessons page SHALL group lessons under five topics. Each lesson card SHALL show "Completed" (finished with at least one quiz), "In Progress" (opened), or "Start", and a review marker when the last quiz score was under 60 (with "Review Recommended" text when the best score is above 0).

#### Scenario: Low quiz score
- **WHEN** a learner scores under 60 on a lesson quiz
- **THEN** the lesson card shows "Review Recommended"

### Requirement: Lesson quizzes use official answers
A lesson quiz SHALL use the 2025 civics questions in the lesson's category, or the 2008 ones when the category has no 2025 questions. Grading SHALL check the answer on the device first, SHALL remove emails and phone numbers before any AI call, and SHALL show the official accepted answers rather than AI-written answers. Finishing SHALL save completed, attempts, best and last score.

#### Scenario: Learner finishes a quiz
- **WHEN** a learner finishes a lesson quiz
- **THEN** the lesson is saved as completed with the attempt count and best and last scores

### Requirement: Lesson progress requires sign-in
Opening a lesson SHALL create its progress record for a signed-in learner. "Mark complete" on the quiz results screen SHALL save completion; signed-out visitors SHALL be asked to sign in.

#### Scenario: Signed-out mark complete
- **WHEN** a signed-out visitor taps "Mark complete"
- **THEN** they are asked to sign in and nothing is saved
