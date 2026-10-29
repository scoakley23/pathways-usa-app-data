# admin-tools Specification

## Purpose

Gives app admins the tools to keep content accurate (sentences, civics questions, vocabulary, Resource Hub places, explanations, current officials) without any access to learner data.

## Requirements

### Requirement: Admin page is admin-only
The Admin page SHALL show "Access Denied" to anyone who is not a signed-in admin. Admins SHALL see tabs for sentences, civics questions, vocabulary, and places, plus explanation and current-officials tools and a link to the tutor demo.

#### Scenario: Learner opens Admin
- **WHEN** a non-admin opens the Admin page
- **THEN** they see "Access Denied"

### Requirement: Manage places
Admins SHALL be able to search places (by name, city, state, ZIP, category), filter by shown, waiting for a check, or hidden, and add, edit, show, or hide each place with a reason. Showing a place waiting for a check SHALL record it as checked.

#### Scenario: Admin keeps a place hidden
- **WHEN** an admin taps "Keep hidden (checked)"
- **THEN** the place stays hidden with the reason "Checked: not relevant"

### Requirement: Import places from a file
Admins SHALL import places from CSV or JSON. Before anything is written, the admin SHALL see a summary (new, updated, hidden, up to date, duplicates, problems) and confirm. Rows SHALL match existing places by external ID or by name, address, and ZIP; matched places SHALL get only changed fields; a human-checked place SHALL keep its shown/hidden status and reason. Rows missing a name or valid category SHALL be reported as problems.

#### Scenario: Re-importing the same file
- **WHEN** an admin imports a file whose rows all match unchanged places
- **THEN** the summary shows them as up to date and nothing is written

#### Scenario: Row without coordinates
- **WHEN** a row has a ZIP but no coordinates
- **THEN** the place is placed at the ZIP's center and marked as ZIP-precision

### Requirement: Draft explanations for human review
Admins SHALL export the 2025 questions and have AI draft explanations in English or Spanish. The question and official answers in each draft SHALL come from the question bank, not the AI. Drafts SHALL stay on the admin's device until downloaded for human review and commit.

#### Scenario: AI drafts an explanation
- **WHEN** an admin drafts an explanation
- **THEN** the draft's answers are copied from the official record and marked draft

### Requirement: Confirm current officials
Admins SHALL be able to have AI read the USCIS page for the current President, Vice President, Speaker, and Chief Justice, edit the names, and download a dated file to commit. Download SHALL be blocked while the file has problems. Nothing SHALL be saved to the backend.

#### Scenario: Missing name
- **WHEN** one official's name is empty
- **THEN** the download button is disabled

### Requirement: Tutor lesson demo
Admins SHALL be able to run a demo tutor lesson built from 2025 civics questions that saves no progress. Non-admins SHALL see "This demo is for admins only."

#### Scenario: Admin finishes the demo
- **WHEN** an admin completes the demo lesson
- **THEN** no progress is saved and they can start again
