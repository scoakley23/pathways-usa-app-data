# Spec Delta

## Purpose

Connects learners with human tutors (teachers, volunteers) so tutors can invite students, assign practice, message them, and see linked students' progress, with every link change controlled on the server.

## ADDED Requirements

### Requirement: Classroom page by role
The classroom page SHALL ask signed-out visitors to sign in, show tutors their students, and show students their tutor.

#### Scenario: Student opens My Classroom
- **WHEN** a signed-in student opens My Classroom
- **THEN** they see their tutor links and ways to join a class

### Requirement: Link changes happen only on the server
Learners and tutors SHALL NOT create or change tutor links directly; every link change (invite, request, join, accept, decline) SHALL go through the server. Either side SHALL be able to read or remove a link they are part of.

#### Scenario: Direct write attempt
- **WHEN** a client tries to create a tutor link record directly
- **THEN** the write is refused

### Requirement: Join by class code
A student SHALL be able to join a tutor's class with the tutor's invite code, ignoring spaces and case and treating letter O and zero as the same. Joining SHALL make the link active immediately. A student SHALL NOT join their own class.

#### Scenario: Already in the class
- **WHEN** a student enters the code of a class they are already in
- **THEN** they see "You are already in this class."

#### Scenario: Unknown code
- **WHEN** a student enters a code that matches no tutor
- **THEN** no link is made

### Requirement: Invites and requests need the other person's answer
A tutor invite or a student request SHALL create a pending link. Only the person who did not send it SHALL accept (making it active) or decline it. A second invite or request for an existing link SHALL be refused. A student's request SHALL notify the tutor, a tutor's invite SHALL be emailed, and a tutor's answer SHALL notify the student.

#### Scenario: Student accepts an invite
- **WHEN** a student accepts a tutor's invite
- **THEN** the link becomes active

#### Scenario: Sender tries to accept
- **WHEN** the tutor who sent an invite tries to accept it
- **THEN** the server refuses

### Requirement: Invite by email link
A tutor SHALL be able to email an invite containing a link and their code. Opening the link SHALL ask "Join this tutor's class?" and closing the prompt SHALL forget the invite.

#### Scenario: Student opens the invite link
- **WHEN** a signed-in student opens a tutor invite link
- **THEN** they are asked whether to join that tutor's class

### Requirement: Assignments only to active students
A tutor SHALL be able to assign 1 to 200 content items to a student with an active link, sent through the server, which sets them pending. Clients SHALL NOT create assignments directly.

#### Scenario: Assigning to a pending student
- **WHEN** a tutor assigns work to a student whose link is still pending
- **THEN** the server refuses

### Requirement: Tutors see only active students' progress
A tutor SHALL see practice, lesson, and N-400 section progress only for students with an active link. Ask Vía chats SHALL NOT be visible to tutors.

#### Scenario: Link removed
- **WHEN** a student removes the link to a tutor
- **THEN** that tutor can no longer load the student's progress

### Requirement: Messages between linked people
The app SHALL offer chat between a student and a tutor with an active link. Only the sender SHALL create a message; sender and receiver SHALL read it.

#### Scenario: Student messages tutor
- **WHEN** a student sends a message to their active tutor
- **THEN** the tutor sees it in their chat

### Requirement: Notifications go to their recipient
Notifications (link responses, assignment completions, daily reminders) SHALL be readable and removable only by their recipient, and SHALL be created only for a recipient who has a reason to receive them.

#### Scenario: Tutor accepts a request
- **WHEN** a tutor accepts a student's request
- **THEN** the student receives a notification
