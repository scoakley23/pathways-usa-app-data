# Spec Delta

## Purpose

Lets learners use the app in their own language while studying English: a chosen language on the device, on-demand translation of interface text, and right-to-left layout where needed.

## ADDED Requirements

### Requirement: Language choice on the device
Learners SHALL choose from the app's list of languages (default English) from a menu at the top of Home or in Getting started. The choice SHALL be stored only on the device.

#### Scenario: Learner picks Spanish
- **WHEN** a learner picks Spanish
- **THEN** the app's interface switches to Spanish and the choice is remembered on that device

### Requirement: On-demand translation with caching
Interface text SHALL be written in English and translated by AI when a learner picks another language, cached per language on the device. English SHALL never trigger a translation. Hand-written translations SHALL take priority over machine translation. If translation fails, English SHALL be shown with a notice.

#### Scenario: Translation fails
- **WHEN** translating the Home text fails
- **THEN** Home shows English and a notice

#### Scenario: Second visit
- **WHEN** a learner returns in the same language
- **THEN** cached translations are used without calling the AI again

### Requirement: Machine translation is labeled
Machine-translated legal or form content (the lawyer checklist, N-400 cards) SHALL be labeled as machine translation and suggest checking with a trusted person or lawyer. Official civics questions and answers SHALL always also appear in English.

#### Scenario: Checklist in Arabic
- **WHEN** a learner reads the lawyer checklist in Arabic
- **THEN** a note says it is a machine translation

### Requirement: Right-to-left layout
Arabic, Persian, Urdu, Hebrew, Dari, and Pashto SHALL be laid out right to left where tutor messages, the roadmap, Ask Vía, Talk to a person, lessons, and the Resource Hub are shown.

#### Scenario: Persian learner
- **WHEN** a learner chooses Persian
- **THEN** tutor messages and the Home roadmap run right to left
