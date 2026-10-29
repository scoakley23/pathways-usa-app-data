# content-integrity Specification

## Purpose

Keeps Pathways USA trustworthy as a free education app: official civics answers come only from the USCIS question lists, and the app never acts as a legal service for a learner's own case.

## Requirements

### Requirement: Official civics answers come only from the question bank
The system SHALL show as official accepted answers only those stored in the app's USCIS civics question lists (versions 2008 and 2025). AI-generated text SHALL NOT be presented as an official answer.

#### Scenario: Feedback after a civics answer
- **WHEN** a learner answers a civics question in any practice, lesson, review, or rehearsal
- **THEN** the feedback lists the accepted answers from the question bank, not answers written by AI

#### Scenario: AI explains a question
- **WHEN** the AI tutor explains a civics question
- **THEN** the explanation does not add, remove, or reword the official accepted answers

### Requirement: Explanations must match official answers
The build's test suite SHALL fail when a civics explanation lists answers that differ from the official 2025 question list.

#### Scenario: Explanation drifts from the question list
- **WHEN** an explanation's answers differ from the official answers for the same question
- **THEN** `npm test` fails

#### Scenario: Explanation for an unknown question
- **WHEN** an explanation is keyed to a question that is not in the official 2025 list
- **THEN** `npm test` fails rather than skipping the entry

### Requirement: Only human-reviewed explanations are shown
The system SHALL show learners only explanations marked as reviewed; drafts SHALL NOT be shown.

#### Scenario: Draft explanation exists
- **WHEN** an explanation for a question is not marked reviewed
- **THEN** learners do not see it, in any language, and see "Explanation coming soon." instead

#### Scenario: Translation is still a draft
- **WHEN** the reviewed English explanation exists but the learner's language version is a draft or missing
- **THEN** the English explanation is shown with "Translation coming soon."

### Requirement: No legal advice about a learner's own case
The system SHALL NOT tell a learner how they should answer an N-400 question about their own history or whether they are eligible. It SHALL point such questions to the "Talk to a lawyer first" section of the Resource Hub.

#### Scenario: Learner asks about their own eligibility
- **WHEN** a learner asks the tutor whether they qualify or how to answer a question about their own past
- **THEN** the tutor declines to advise and points them to the lawyer-first section at `/lawyer-first`

#### Scenario: N-400 practice
- **WHEN** a learner practices N-400 questions
- **THEN** the questions are answered about a fictional practice person, not about the learner

### Requirement: Not affiliated with USCIS
The system SHALL present itself as Pathways, a free practice app, and SHALL NOT claim to be official or use USCIS branding, seals, or national symbols. Public-facing surfaces SHALL show "Free practice · Not affiliated with USCIS".

#### Scenario: Signed-out visitor sees the app
- **WHEN** a signed-out visitor opens the app
- **THEN** the page shows "Free practice · Not affiliated with USCIS" and no official seals or USCIS logos
