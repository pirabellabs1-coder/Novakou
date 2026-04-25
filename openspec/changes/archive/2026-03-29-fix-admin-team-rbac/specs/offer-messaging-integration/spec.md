## ADDED Requirements

### Requirement: Offer form uses messaging contacts dropdown instead of manual text input
The freelance offer creation form (`/dashboard/offres`) SHALL replace the manual "Nom du client" text input and "Email du client" input with a dropdown that lists clients from the freelance's messaging conversations.

#### Scenario: Freelance creates an offer for a messaging contact
- **WHEN** a freelance opens the offer creation form
- **THEN** the "Client" field SHALL be a dropdown listing all unique clients from their messaging conversations (filtered by `participant.role === "client"`)
- **THEN** each option SHALL show the client's name and avatar
- **THEN** there SHALL be NO email field

#### Scenario: Freelance has no messaging contacts
- **WHEN** a freelance has no conversations with any client
- **THEN** the dropdown SHALL show "Aucun contact — démarrez une conversation d'abord"
- **THEN** the form submit button SHALL be disabled

#### Scenario: Offer is sent to conversation
- **WHEN** a freelance submits an offer for a selected client
- **THEN** the offer SHALL be sent to the existing conversation with that client via the messaging system

### Requirement: No email field in offer forms
The offer creation form SHALL NOT include a client email field. All communications MUST remain on the platform.

#### Scenario: Email field removed
- **WHEN** a freelance or agency opens the offer form
- **THEN** there SHALL be NO "Email du client" input field
- **THEN** the API request SHALL NOT include `clientEmail`

### Requirement: Agency offer form connected to API
The agency offer form (`/agence/offres`) SHALL make real API calls to `POST /api/offres` instead of only showing a toast message.

#### Scenario: Agency submits an offer
- **WHEN** an agency fills the offer form and clicks submit
- **THEN** the system SHALL call `POST /api/offres` with the offer data
- **THEN** on success, the offer SHALL appear in the offers list

### Requirement: Client billing shows real financial data
The client billing page (`/client/factures`) SHALL display accurate financial data from the store including total spent, pending amounts, and credits balance.

#### Scenario: Client sees updated financial summary
- **WHEN** a client navigates to `/client/factures` and has completed orders
- **THEN** "Total dépensé" SHALL show the sum of completed order amounts
- **THEN** "En attente" SHALL show the sum of pending order amounts
- **THEN** "Crédits" SHALL reactively update from the store (not via getState())

#### Scenario: Dev mode financial summary
- **WHEN** the app is in dev mode (IS_DEV) and the client has orders
- **THEN** the `/api/finances/summary` endpoint SHALL calculate totalSpent and pending from dev store orders instead of returning zeros
