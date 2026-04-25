## ADDED Requirements

### Requirement: Client has a credits balance visible in payments page
The system SHALL display the client's credits balance (in EUR) in the payments/billing page (`/client/factures`), alongside total spent and pending amounts.

#### Scenario: Client sees credits balance
- **WHEN** a client navigates to `/client/factures`
- **THEN** the page SHALL display a "Crédits" card showing the current balance (default 0€ for new clients)

### Requirement: Recharge button shows coming soon message
The system SHALL display a "Recharger" button next to the credits balance. Since Stripe integration for deposits is not yet implemented, clicking it SHALL show a toast message "Fonctionnalité bientôt disponible".

#### Scenario: Client clicks recharge
- **WHEN** a client clicks the "Recharger" button
- **THEN** the system SHALL display an info toast "Rechargement de crédits bientôt disponible"

### Requirement: Credits field exists in client store
The client store SHALL include a `credits` field (number, default 0) that is synced from the API when the finance summary is loaded.

#### Scenario: Credits loaded from API
- **WHEN** the client store syncs finance data
- **THEN** the `credits` field SHALL be populated from the API response (or default to 0 if not present)
