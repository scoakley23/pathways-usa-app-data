# Spec Delta

## Purpose

Helps learners understand the N-400 form's wording and practice answering officer questions as a fictional practice person, without ever advising them on their own answers or saving anything but section completion.

## ADDED Requirements

### Requirement: N-400 guide shows approved question cards by section
The N-400 guide SHALL list form sections, each collapsible, showing only approved question cards to learners. Admins SHALL also see drafts marked "Draft". A section with no visible cards SHALL say it is still being prepared.

#### Scenario: Section not ready
- **WHEN** a section has no approved cards
- **THEN** it shows "Coming soon — this section is still being prepared."

### Requirement: Every N-400 surface states it is not legal advice
The guide SHALL say it does not tell learners how to answer any question and saves nothing as an answer. Each question card SHALL say it is not legal advice and link to the lawyer-first section.

#### Scenario: Learner reads a question card
- **WHEN** a learner opens any N-400 question card
- **THEN** it carries a "not legal advice… talk to a lawyer before you file" note linked to `/lawyer-first`

### Requirement: Example applicants and practice form
The guide SHALL offer an "Example applicants" view with six fictional practice people and a practice copy of the form filled with one fictional applicant, labeled "Practice copy — not real".

#### Scenario: Learner opens example applicants
- **WHEN** a learner switches to example applicants
- **THEN** they see six practice people, each labeled as not real

### Requirement: Coach teaches one section per lesson
The N-400 coach SHALL require sign-in. It SHALL open the requested section, or else the first live section (approved, with at least one approved question) not yet completed, in form order. A lesson SHALL run: intro, one card per approved question, practice as a practice person (up to 3 officer questions, only when approved questions have officer phrasings), then a talk-to-a-lawyer step.

#### Scenario: Signed out
- **WHEN** a signed-out visitor opens the coach
- **THEN** they see "Please sign in to use the N-400 coach."

#### Scenario: Last step of a lesson
- **WHEN** a learner reaches the end of a section lesson
- **THEN** they see "If you're not sure your answer is "no"… talk to a lawyer before you file" with a "Talk to a lawyer first" link

### Requirement: Practice answers are about a fictional person
N-400 interview practice SHALL ask the learner to answer as a named practice person shown with their facts and the tag "Practice person. Not real." The AI scorer SHALL be instructed that "No" is the expected answer to yes/no questions the card does not cover, and that any simple invented answer is acceptable for other uncovered questions.

#### Scenario: Question not on the card
- **WHEN** an officer asks a yes/no question the practice person's facts do not cover and the learner answers "No"
- **THEN** the scorer is instructed to treat "No" as the expected answer

### Requirement: Only section completion is saved
Completing an N-400 section (by finishing a coach lesson or marking it complete in the guide) SHALL save only the section, a completed flag, and the date. The learner's answers SHALL NOT be saved.

#### Scenario: Coach save fails
- **WHEN** saving a finished coach section fails
- **THEN** the learner sees "Couldn't save that this section is done. Please try again."

#### Scenario: More sections remain
- **WHEN** a learner finishes a section and others remain
- **THEN** they are offered "Back to Today" and "Next section: {title}"

### Requirement: Lesson text in English and Spanish
Coach lesson lines SHALL be available in English and Spanish; other languages SHALL see English.

#### Scenario: Vietnamese learner
- **WHEN** a Vietnamese-language learner opens the coach
- **THEN** lesson lines are shown in English
