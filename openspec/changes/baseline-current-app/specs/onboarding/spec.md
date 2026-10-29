# Spec Delta

## Purpose

Gets a new visitor from the landing page to their first quick check: signing in, choosing a role, and a short device-only setup (language, tutor, stage, sound and text size).

## ADDED Requirements

### Requirement: Home hero depends on who is visiting
The Home page SHALL show a "Start here" card to signed-out visitors, the Today card to signed-in students, and a roadmap hero to tutors. The roadmap path SHALL be shown to everyone.

#### Scenario: Signed-out visitor
- **WHEN** a signed-out visitor opens Home
- **THEN** they see the "Start here" card with the default tutor, and tapping "Start here" sends them to sign in and then to the quick check

#### Scenario: Signed-in student
- **WHEN** a signed-in student opens Home
- **THEN** they see the Today card

#### Scenario: Tutor
- **WHEN** a signed-in user whose role is tutor opens Home
- **THEN** they see the roadmap hero instead of the Today card

### Requirement: Role is chosen once per account
After sign-in, the system SHALL ask a user with no saved role to choose student or tutor, save that role to their public profile, and remember it on the device so the question is not repeated.

#### Scenario: First sign-in
- **WHEN** a signed-in user has no role saved in their public profile or on this device
- **THEN** the role dialog opens

#### Scenario: Role already known
- **WHEN** the role is saved in the public profile or cached on this device
- **THEN** the role dialog does not open

#### Scenario: New student
- **WHEN** a user picks the student role
- **THEN** they are taken to the quick check

### Requirement: Invite links pre-fill the role dialog
The role dialog SHALL pre-select the student role when the visitor arrived through a class invite code or a tutor invite link. When a student enters a class code, the system SHALL validate it and join that class.

#### Scenario: Class code link
- **WHEN** a visitor opens the app with a class invite code in the link
- **THEN** the dialog pre-selects student and fills in the code

#### Scenario: Invalid class code
- **WHEN** a student submits a class code that does not match a tutor
- **THEN** no class is joined, the learner sees "Invalid invite code. Please check and try again.", and the dialog stays open

### Requirement: Tutors get a class invite code
The system SHALL give each new tutor an invite code made of the first three characters of their email in uppercase (non-letters become X) followed by four random digits.

#### Scenario: Tutor signs up
- **WHEN** a user chooses the tutor role
- **THEN** their public profile receives an invite code such as `ABC1234` (an email starting `j.d` gives `JXD` plus four digits)

### Requirement: Getting started runs once per device before the first quick check
The first time a learner reaches the quick check on a device, the system SHALL show Getting started first, in this order: Start, language, tutor picture, tutor name, stage in the process, which civics test (only if applied or interview scheduled), interview month (only if interview scheduled), then sound and text size.

#### Scenario: Learner who is still preparing
- **WHEN** a learner picks "preparing" or "learning" as their stage
- **THEN** the civics-test and interview-month steps are skipped

#### Scenario: Learner with an interview scheduled
- **WHEN** a learner picks "interview" as their stage
- **THEN** both the civics-test step and the interview-month step are shown

#### Scenario: Already set up on this device
- **WHEN** Getting started was finished or skipped on this device before
- **THEN** the quick check opens directly

### Requirement: Getting started can be skipped at any step
Every Getting started step SHALL offer Skip, which ends setup and marks it as done on the device. A progress label SHALL show "step X of N", not counting the Start screen.

#### Scenario: Skip on the Start screen
- **WHEN** a learner taps "Skip setup" on the Start screen
- **THEN** setup ends and the quick check intro opens

### Requirement: Getting started answers stay on the device
The stage, the civics test version, the interview month, sound and text size SHALL be saved only on the device. Only the tutor picture and tutor name SHALL be saved to the learner's account. The setup SHALL NOT ask for a filing date, field office, or case details.

#### Scenario: Learner picks a civics test
- **WHEN** a learner answers whether they filed before or after the 2025 test change (or is unsure)
- **THEN** the device stores the 2008 version for "before" and the 2025 version for "after" or "unsure", and no date is stored

#### Scenario: Learner picks a tutor picture
- **WHEN** a learner picks a tutor picture
- **THEN** the choice is saved to their account right away

#### Scenario: Learner uses their own photo
- **WHEN** a learner picks their own photo as the tutor picture
- **THEN** the photo is kept only on the device

### Requirement: Start tap unlocks speech
The Start screen SHALL require a tap before the tutor speaks, so the browser allows audio. Choosing a language SHALL speak the language name when the device has a voice for it; when the device has no voice for the current language, the step SHALL show a written note that the tutor will speak English.

#### Scenario: No voice for the chosen language
- **WHEN** a learner picks a language the device cannot speak
- **THEN** a note says the tutor will speak English

### Requirement: New learners meet their tutor
A signed-in learner with no quick-check levels and no study plan SHALL see the tutor introduction on Home, whose single "Your first step" action opens the quick check.

#### Scenario: Brand-new learner opens Home
- **WHEN** a signed-in learner has never taken the quick check and has no plan on this device
- **THEN** Home shows the tutor introduction with one action leading to the quick check
