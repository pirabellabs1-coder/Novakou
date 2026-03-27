## ADDED Requirements

### Requirement: Agency propositions page lists sent proposals with statuses
The agency space SHALL have a propositions page (`/agence/propositions`) that displays all propositions sent by the agency with their current status.

#### Scenario: Agency views sent propositions
- **WHEN** an agency admin navigates to `/agence/propositions`
- **THEN** the system SHALL display all propositions linked to the agency with: title, client name, amount, delivery days, status (SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED), date sent, and link to order if accepted

#### Scenario: Agency filters propositions by status
- **WHEN** the agency admin selects a status filter
- **THEN** the list SHALL show only propositions matching that status

### Requirement: Propositions API returns agency propositions
The `/api/propositions` GET endpoint SHALL include propositions linked to the agency (via `agencyId`) when the caller is an agency owner.

#### Scenario: Agency fetches propositions
- **WHEN** an agency owner calls `GET /api/propositions?role=freelance`
- **THEN** the API SHALL return propositions where `freelanceId = userId` OR `agencyId = agencyProfileId`
