# Spec Delta

## Purpose

The quick check (pretest) gives each learner a starting level in civics, reading, writing, and speaking so the study plan can focus on what they need, while saving only the four levels.

## ADDED Requirements

### Requirement: Quick check covers four skills
The quick check SHALL ask 10 civics questions, 3 reading sentences, 3 writing sentences, and 2 speaking (small-talk) questions, chosen at random. Civics SHALL use 2025 questions only, excluding questions whose answers change or vary, with no duplicates.

#### Scenario: Learner starts a full quick check
- **WHEN** a learner starts the quick check with no part chosen
- **THEN** they get up to 10 civics, 3 reading, 3 writing, and 2 speaking items in random order within each part

#### Scenario: Content not available
- **WHEN** no items can be loaded for any part
- **THEN** the page says "The quick check isn't ready yet"

#### Scenario: One part has no items
- **WHEN** one skill has no items available
- **THEN** that part is left out and the others run

### Requirement: Parts can be skipped
Each part of the quick check SHALL be skippable. A skipped part SHALL get no level ("Not checked yet").

#### Scenario: Learner skips speaking
- **WHEN** a learner skips the speaking part
- **THEN** speaking has no level and the other parts are scored normally

### Requirement: Levels use fixed cutoffs
Each skill SHALL be scored as strong, getting there, or start here. Unanswered items in a started part SHALL count as wrong.

#### Scenario: Civics level
- **WHEN** a learner gets at least 8 right or at least 80% of civics items right
- **THEN** civics is "strong"; at least 50% is "getting there"; less is "start here"

#### Scenario: Reading or writing level
- **WHEN** a learner gets every reading (or writing) item right
- **THEN** that skill is "strong"; at least 60% is "getting there"; less is "start here"

#### Scenario: Speaking level
- **WHEN** a learner's average speaking score is at least 80
- **THEN** speaking is "strong"; at least 60 is "getting there"; less is "start here"

### Requirement: Only levels are saved
The system SHALL save only the four levels and the date checked to the learner's account. Answers, transcripts, and audio SHALL NOT be saved. The intro screen SHALL tell the learner this.

#### Scenario: Learner finishes the quick check
- **WHEN** a learner finishes the quick check
- **THEN** their account stores only the four levels and the date

#### Scenario: Intro explains what is saved
- **WHEN** a learner opens the quick check intro
- **THEN** it says "We save only your four levels. Your answers and your voice are not saved."

#### Scenario: Save fails
- **WHEN** saving the levels fails
- **THEN** the learner sees "Couldn't save your results. Please check your connection."

### Requirement: Re-check one skill
Opening the quick check for one named skill SHALL check only that skill, skip Getting started, and keep the saved levels of the other skills. An unknown skill name SHALL run the full check.

#### Scenario: Re-check reading
- **WHEN** a learner opens the quick check for reading only and finishes it
- **THEN** only the reading level and the check date change

### Requirement: Results lead to a plan
The results screen SHALL name the skills at "start here" (or say it is a good start when there are none) and offer "Make my plan" when the device has no study plan, otherwise "Done". It SHALL offer "Take it again".

#### Scenario: No plan on this device
- **WHEN** a learner sees results and this device has no study plan
- **THEN** "Make my plan" opens the plan setup
