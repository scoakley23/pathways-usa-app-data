# Spec Delta

## Purpose

Protects learners, many of whom are in a sensitive immigration process, by limiting what the app stores, who can see it, what is sent to AI, and keeping personal planning data on their own device.

## ADDED Requirements

### Requirement: Sensitive case data is never stored
The system SHALL NOT store a learner's immigration status, A-number, case details, filing date, field office, home address, or N-400 answers, in their account or on the device.

#### Scenario: Learner completes N-400 practice
- **WHEN** a learner finishes N-400 practice
- **THEN** only section completion and its date are stored

### Requirement: Personal planning stays on the device
The target date, plan, daily checkmarks, Getting started answers, own tutor photo, text size, read-aloud setting, language, and location SHALL stay only in the device's browser storage (location only in memory). Every read and write of device storage SHALL tolerate storage being unavailable.

#### Scenario: Private browsing blocks storage
- **WHEN** browser storage throws an error
- **THEN** the app keeps working as if nothing was stored

### Requirement: No audio or transcripts are stored
The system SHALL NOT record or upload audio and SHALL NOT store speech transcripts; only scores SHALL be saved.

#### Scenario: Reading practice
- **WHEN** a learner reads a sentence aloud
- **THEN** only the score is saved

### Requirement: Learner text goes to AI only in listed features
Learner-written or spoken text SHALL be sent to the AI only for Ask Vía, civics answer grading, interview and lesson answer scoring, and the representative lookup. Before sending, emails and phone numbers SHALL be removed wherever learners type freely, and the learner's name and email SHALL NOT be included. Text SHALL be checked on the device first when that is enough.

#### Scenario: Lesson answer with an email
- **WHEN** a learner's answer in any graded feature contains an email address
- **THEN** the AI receives it with the email removed

### Requirement: Learner records are owner-only
Learner records (practice progress, lesson progress and notes, N-400 progress, interview sessions, study history, public profile) SHALL be readable and changeable only by the signed-in owner, matched by lowercase email. Admins SHALL get no extra access to learner data. Content (questions, sentences, lessons, vocabulary, places) SHALL be public to read and changeable only by admins.

#### Scenario: Another learner's progress
- **WHEN** a signed-in learner requests another learner's practice records
- **THEN** none are returned

#### Scenario: Non-admin edits a place
- **WHEN** a non-admin tries to create or change a Resource Hub place
- **THEN** the write is refused

### Requirement: Privacy promises are shown where data is collected
Screens that collect answers, voice, or chat SHALL state what is and is not saved (for example, the quick check, Ask Vía, Interview Day, and the Resource Hub).

#### Scenario: Ask Vía opened
- **WHEN** a learner opens Ask Vía
- **THEN** a note says chats are private, their tutor cannot see them, and not to share status, A-number, case, or address
