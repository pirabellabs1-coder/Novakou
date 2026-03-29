## ADDED Requirements

### Requirement: User can cancel their own dispute
The system SHALL allow the user who opened a dispute to cancel it, returning the dispute to a closed state and releasing funds to the freelance.

#### Scenario: Client cancels open dispute
- **WHEN** the client who opened the dispute sends a cancel request while dispute status is `ouvert`
- **THEN** the dispute status SHALL change to `annule`, the order status SHALL revert to `en_cours`, escrow funds SHALL be released to the freelance wallet, and both parties SHALL receive a notification

#### Scenario: Cannot cancel dispute in examination
- **WHEN** a user attempts to cancel a dispute that has status `en_examen`
- **THEN** the system SHALL reject the request with an error message "Le litige est en cours d'examen et ne peut plus être annulé"

#### Scenario: Non-opener cannot cancel
- **WHEN** a user who did NOT open the dispute attempts to cancel it
- **THEN** the system SHALL return a 403 error

### Requirement: User can propose 50/50 partial settlement
The system SHALL allow the dispute opener to propose a 50/50 partial payment split instead of full resolution.

#### Scenario: Client proposes 50/50 split
- **WHEN** the client who opened the dispute sends a propose-settlement request while dispute status is `ouvert`
- **THEN** the dispute status SHALL change to `resolu` with verdict `PARTIEL`, partialPercent SHALL be set to 50, the order amount SHALL be split 50% refund to client and 50% (minus commission) to freelance wallet, and both parties SHALL receive a notification

#### Scenario: Propose settlement on non-open dispute
- **WHEN** a user attempts to propose settlement on a dispute that is not `ouvert`
- **THEN** the system SHALL reject the request with an appropriate error message

### Requirement: Dispute cancellation UI in client order detail
The client order detail page SHALL display a "Annuler le litige" button and a "Proposer un accord 50/50" button when the order has an active dispute opened by the current user.

#### Scenario: Buttons visible on disputed order
- **WHEN** the client views an order with status `litige` that they opened
- **THEN** the page SHALL show "Annuler le litige" and "Proposer un accord 50/50" buttons

#### Scenario: Buttons hidden after dispute resolved
- **WHEN** the dispute has been resolved or cancelled
- **THEN** the cancellation and settlement buttons SHALL NOT be visible
