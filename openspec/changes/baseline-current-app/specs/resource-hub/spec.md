# Spec Delta

## Purpose

Helps learners find trusted, human-checked help near them (legal help, English and citizenship classes, USCIS offices, libraries) and explains why to talk to a lawyer first, without saving or sending their location.

## ADDED Requirements

### Requirement: Resource Hub layout
The Resource Hub SHALL be reachable at `/resources` and `/lawyer-first` (which scrolls to the lawyer section) and SHALL show, in order: Find help near you, Talk to a lawyer first, a read-only checklist, legal-help links, "Who can legally help you", and a note that nothing is saved.

#### Scenario: Lawyer-first link
- **WHEN** a learner follows a "Talk to a lawyer first" link
- **THEN** the Resource Hub opens scrolled to the lawyer section

### Requirement: Location stays on the device
A learner's location (from the browser or a typed ZIP) SHALL be used only on the device to sort places by distance. It SHALL NOT be saved, put in a URL, or sent to the AI or Base44. Directions links SHALL use only the place's address. (Map tiles for the area shown are fetched from the map provider.)

#### Scenario: Learner uses their location
- **WHEN** a learner taps "Use my location" and allows it
- **THEN** places are sorted by distance and no request to Base44 or the AI carries their location

#### Scenario: Location denied
- **WHEN** location is unavailable or denied
- **THEN** the learner is asked to type a ZIP code instead

### Requirement: ZIP search
A typed ZIP SHALL have at least 5 digits. An unknown ZIP SHALL fall back to the nearest known ZIP with the same first three digits; if none exists the learner SHALL be told the ZIP is not known.

#### Scenario: Short ZIP
- **WHEN** a learner types fewer than 5 digits
- **THEN** they see "Please type a 5-digit ZIP code."

### Requirement: Places are filtered and sorted by distance
The finder SHALL show active places within the chosen radius (10, 25, 50, or 100 miles; default 25) whose main category or services match any selected category (legal, English classes, citizenship classes, USCIS, library, other; all selected by default), nearest first.

#### Scenario: Learner narrows to legal help
- **WHEN** a learner selects only the legal category
- **THEN** places whose main category or services include legal help are listed, nearest first

#### Scenario: Nothing nearby
- **WHEN** no places match
- **THEN** the finder says "No places found here yet."

### Requirement: List and map
The list SHALL show 30 places at a time with "Show more". The map SHALL show every place in range (up to 2,000) with pins colored by category and grouped when close, a full-screen mode, and "Search this area" after the learner moves the map.

#### Scenario: Learner moves the map
- **WHEN** a learner drags the map and taps "Search this area"
- **THEN** places are re-sorted from the map's center

### Requirement: Place details
Each place SHALL show its tags, distance, address, description, hours, cost, languages, and when it was last checked. Phone, website, and directions links SHALL appear only when valid (no directions for P.O. boxes; websites must be http or https).

#### Scenario: Place located only by ZIP
- **WHEN** a place's pin is placed at its ZIP code area
- **THEN** the card says the pin shows the ZIP code area

### Requirement: Places are human-checked listings
Places SHALL come only from human-checked listings managed by admins, never found by AI. A place that is not relevant SHALL be hidden with a reason, not deleted, and hidden places SHALL NOT be shown to learners.

#### Scenario: Hidden place
- **WHEN** an admin hides a place as not relevant
- **THEN** learners no longer see it and it remains in the admin list with its reason

### Requirement: Not an endorsement
The finder SHALL say places are not endorsed and learners should call before they go, and SHALL link to national directories.

#### Scenario: Learner views results
- **WHEN** the finder shows places
- **THEN** a "not endorsed / call before you go" note is visible
