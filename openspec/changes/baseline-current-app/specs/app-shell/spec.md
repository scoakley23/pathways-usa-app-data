# Spec Delta

## Purpose

Provides the frame every page sits in: navigation for phones and desktops, distraction-free lesson screens, the brand and disclaimer, a daily practice reminder, and accessibility minimums.

## ADDED Requirements

### Requirement: Phone tab bar
On phones, students and signed-out visitors SHALL see a bottom tab bar with Today, Learn, the tutor (middle, with portrait), Practice, and N-400. The current tab SHALL be marked. Tutors SHALL NOT see the tab bar.

#### Scenario: Learner on Practice
- **WHEN** a learner is on the Practice page on a phone
- **THEN** the Practice tab is marked as current

### Requirement: Menu and desktop navigation
The menu (phones) and top navigation (desktop) SHALL list Today; Learn, Practice, Interview Day, N-400, and Progress for non-tutors, plus My Classroom when signed in or Tutors when signed out; Tutor Portal for tutors; Resources and Profile for everyone; Admin for admins; and Sign In or Sign Out.

#### Scenario: Admin signs in
- **WHEN** an admin is signed in
- **THEN** the navigation includes Admin

#### Scenario: Signed-out visitor
- **WHEN** a signed-out visitor opens the menu
- **THEN** it shows Tutors instead of My Classroom, and Sign In

### Requirement: Lesson screens hide distractions
Lesson screens (quick check, learn, review, N-400 coach, tutor demo) SHALL hide the tab bar, the chat button, and invite prompts.

#### Scenario: Learner starts learn
- **WHEN** a learner opens the learn page
- **THEN** no tab bar or chat button is shown

### Requirement: Disclaimer on public pages
Where the brand meets the public, the app SHALL show "Free practice · Not affiliated with USCIS", and every page footer SHALL say Pathways is not affiliated with USCIS or any government agency and is not legal advice.

#### Scenario: Any page footer
- **WHEN** a visitor scrolls to the bottom of any page
- **THEN** the footer says it is not affiliated with USCIS and not legal advice

### Requirement: Text size
Learners SHALL be able to choose normal, large, or extra-large text (16, 18, or 20px) for tutor messages and lessons, saved on the device; changes SHALL apply immediately.

#### Scenario: Learner picks large text
- **WHEN** a learner picks large text
- **THEN** tutor messages and lessons switch to 18px right away

### Requirement: Daily practice reminder
Once a day, a student who has not practiced yet that day SHALL get one in-app notification "Your practice for today" linking to Today. The reminder SHALL NOT run on Interview Day.

#### Scenario: Learner already practiced
- **WHEN** a student has practiced today
- **THEN** no reminder is created

### Requirement: Accessibility minimums
All text SHALL have at least 4.5:1 contrast, body text SHALL be at least 16px, buttons SHALL be at least 44px tall, and layouts SHALL work at 360px wide.

#### Scenario: Phone at 360px
- **WHEN** any page is viewed 360px wide
- **THEN** it fits without horizontal scrolling and its buttons are at least 44px tall
