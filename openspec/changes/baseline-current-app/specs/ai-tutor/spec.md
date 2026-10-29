# Spec Delta

## Purpose

Puts a personal AI tutor (default "Vía") front and center as the learner's teacher: a chosen name and portrait, short guidance on every page, read-aloud on lesson screens, Ask Vía for questions, and a path to a real person.

## ADDED Requirements

### Requirement: Tutor profile
Each learner SHALL have a tutor profile with a name (up to 20 characters), a portrait, a tone (one of four), and an English mix (one of three). New learners SHALL get name "Vía", the first portrait, a warm tone, and mostly their own language. Invalid values SHALL fall back to these defaults.

#### Scenario: Name too long
- **WHEN** a learner enters a tutor name longer than 20 characters
- **THEN** only the first 20 characters are kept

### Requirement: Tutor portraits and expressions
The tutor SHALL be shown as one of six illustrated portraits with four expressions: greeting for hellos, listening while waiting or thinking, proud for a correct answer or finished day, and default otherwise. A learner's own photo SHALL stay on the device only; elsewhere, or without it, Vía SHALL be shown.

#### Scenario: Correct answer
- **WHEN** a learner answers correctly in a teaching step of a lesson
- **THEN** the tutor shows the proud expression (check-mode steps such as the quick check and review show no feedback face)

#### Scenario: Own photo on another device
- **WHEN** a learner who chose their own photo signs in on a different device
- **THEN** Vía's portrait is shown

### Requirement: Tutor guides every page
Feature pages SHALL show a one-line tutor message saying what the page is for, next to the tutor's portrait and name.

#### Scenario: Learner opens Resources
- **WHEN** a learner opens the Resource Hub
- **THEN** the tutor line explains what the page is for

### Requirement: Read aloud on lesson screens
On lesson screens (quick check, learn, review, N-400 coach, tutor demo), each new tutor message SHALL read itself aloud, in the learner's language then English, skipping a language the device cannot speak, after the learner's first tap. A Stop button SHALL show while reading and Listen SHALL replay. Learners SHALL be able to turn this off on the device.

#### Scenario: Read aloud turned off
- **WHEN** a learner turns read aloud off
- **THEN** tutor messages no longer speak on their own, and Listen still works

#### Scenario: Microphone starts
- **WHEN** a learner starts the microphone while a message is being read
- **THEN** reading stops before listening begins

### Requirement: Tutor rules for the AI
Every AI tutor reply SHALL use simple English (A2–B1) or the learner's language mix, stay under 120 words, never change official answers, never ask about the learner's case, status, A-number, address, or eligibility, and point legal questions to "Talk to a lawyer first".

#### Scenario: Tutor explains a question
- **WHEN** the tutor answers a learner's question
- **THEN** the reply is short and plain and does not ask for personal case details

### Requirement: Ask Vía opens from anywhere
Signed-in learners SHALL be able to open Ask Vía (titled "Ask {tutor name}") from the phone tab bar's middle button or the desktop button. It SHALL be hidden on lesson screens; for signed-out visitors the chat is hidden and the tutor tab sends them to sign in. It SHALL say chats are private and not to share status, A-number, case, or address.

#### Scenario: Signed-out visitor taps the tutor tab
- **WHEN** a signed-out visitor taps the tutor button
- **THEN** they are sent to sign in

### Requirement: Ask Vía declines personal legal questions
Ask Vía SHALL decline questions about the learner's own case or eligibility (detected on the device first, or flagged by the AI), show a fixed reply with a "Talk to a lawyer first" button, and SHALL NOT send detected questions to the AI or save declined questions.

#### Scenario: Learner asks "Am I eligible?"
- **WHEN** a learner asks "Am I eligible to apply?"
- **THEN** the tutor declines without calling the AI, offers the lawyer-first link, and nothing is saved

### Requirement: Ask Vía protects identifiers
Questions SHALL be limited to 500 characters. Emails and phone numbers SHALL be replaced with "[removed]" before the AI sees them, and the learner's name and email SHALL NOT be sent. Answered questions SHALL be saved (redacted) to the learner's study history.

#### Scenario: Question includes a phone number
- **WHEN** a learner's question contains a 10-digit phone number
- **THEN** the AI receives "[removed]" in its place and the saved history shows the redacted text

#### Scenario: AI error
- **WHEN** the AI fails to answer
- **THEN** the learner sees "Sorry, I couldn't answer that right now." and nothing is saved

### Requirement: Talk to a person
Ask Vía SHALL offer "Talk to a person". Learners with an active human tutor SHALL be offered a message to that tutor; others SHALL get a support email form (up to 1000 characters) that is disabled with "Contact form coming soon." until a support address and reply time are configured. The form SHALL say it cannot give legal advice and link to the lawyer section. The support form SHALL store nothing in the app; messages to a human tutor are saved as classroom messages.

#### Scenario: Message sent
- **WHEN** a learner sends a support message
- **THEN** they see "Thank you. Your message was sent." and the reply time
