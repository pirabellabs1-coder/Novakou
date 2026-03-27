## ADDED Requirements

### Requirement: Propositions list with statuses in freelancer dashboard
The freelancer candidatures page (`/dashboard/candidatures`) SHALL display all propositions sent by the freelancer with their current status, linked to the project or client.

#### Scenario: Freelancer views their propositions
- **WHEN** a freelancer navigates to `/dashboard/candidatures`
- **THEN** the system SHALL display a list of all their propositions with: project/client name, amount proposed, delivery days, status (PENDING, SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED, WITHDRAWN), and date sent

#### Scenario: Proposition status is VIEWED
- **WHEN** a client opens/views a proposition
- **THEN** the proposition status SHALL update to `VIEWED` and the freelancer SHALL see the updated status in their list

#### Scenario: Filter propositions by status
- **WHEN** the freelancer clicks on a status filter (e.g., "En attente", "Acceptée", "Rejetée")
- **THEN** the list SHALL show only propositions matching that status

### Requirement: Client can accept or reject propositions
The client SHALL be able to accept or reject propositions received on their projects, with appropriate side effects.

#### Scenario: Client accepts a proposition
- **WHEN** a client clicks "Accepter" on a proposition
- **THEN** the system SHALL:
  1. Call `PATCH /api/propositions/[id]` with `action: "accept"`
  2. Update proposition status to `ACCEPTED`
  3. Auto-create an order (using order-creation-flow) with the proposition's amount and delivery days
  4. Create a notification for the freelancer
  5. Redirect the client to the new order page

#### Scenario: Client rejects a proposition
- **WHEN** a client clicks "Rejeter" on a proposition
- **THEN** the system SHALL:
  1. Call `PATCH /api/propositions/[id]` with `action: "reject"`
  2. Update proposition status to `REJECTED` with `rejectedAt` timestamp
  3. Create a notification for the freelancer

### Requirement: Proposition accept/reject API endpoint
The API SHALL provide a `PATCH /api/propositions/[id]` endpoint that handles accept and reject actions.

#### Scenario: Accept action creates order
- **WHEN** `PATCH /api/propositions/[id]` is called with `{ action: "accept" }`
- **THEN** the API SHALL validate the caller is the client, update status to `ACCEPTED`, set `acceptedAt`, and create an order with `escrowStatus: HELD`

#### Scenario: Reject action
- **WHEN** `PATCH /api/propositions/[id]` is called with `{ action: "reject" }`
- **THEN** the API SHALL validate the caller is the client, update status to `REJECTED`, and set `rejectedAt`

#### Scenario: Invalid state transition
- **WHEN** a PATCH is called on a proposition already `ACCEPTED` or `REJECTED`
- **THEN** the API SHALL return 400 with "Cette proposition a déjà été traitée"

### Requirement: Propositions visible in client project detail
The client project detail page SHALL display all propositions received for that project with freelancer profiles and actions.

#### Scenario: Client views propositions on their project
- **WHEN** a client navigates to their project detail page
- **THEN** the system SHALL display all propositions for that project with: freelancer name, avatar, rating, proposed amount, proposed delivery days, cover letter excerpt, and Accept/Reject buttons

### Requirement: Proposition notifications
The system SHALL create in-app notifications when proposition statuses change.

#### Scenario: Freelancer notified of acceptance
- **WHEN** a client accepts a proposition
- **THEN** the freelancer SHALL receive a notification "Votre proposition pour [projet] a été acceptée"

#### Scenario: Freelancer notified of rejection
- **WHEN** a client rejects a proposition
- **THEN** the freelancer SHALL receive a notification "Votre proposition pour [projet] a été refusée"
