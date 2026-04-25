## ADDED Requirements

### Requirement: Wallet balance SHALL be displayed on payment pages
All payment pages (abonnement, boost, commande) SHALL display the user's current wallet balance fetched from the real WalletFreelance/WalletAgency table.

#### Scenario: Freelance sees wallet balance on subscription payment page
- **WHEN** freelance navigates to `/dashboard/abonnement/paiement`
- **THEN** the page SHALL display their current `WalletFreelance.balance` value
- **THEN** the balance SHALL be formatted in EUR with 2 decimal places

#### Scenario: Agency sees wallet balance on payment page
- **WHEN** agency navigates to a payment page
- **THEN** the page SHALL display their `WalletAgency.balance` value

#### Scenario: User with no wallet record
- **WHEN** a user has no WalletFreelance/WalletAgency record
- **THEN** the system SHALL display 0,00 EUR as balance

### Requirement: Wallet balance API endpoint SHALL exist
A lightweight `/api/wallet/balance` endpoint SHALL return the current user's wallet balance without loading full transaction history.

#### Scenario: Authenticated user fetches balance
- **WHEN** an authenticated user calls GET `/api/wallet/balance`
- **THEN** the response SHALL contain `{ balance, pending, currency }` from their wallet

#### Scenario: Unauthenticated request
- **WHEN** an unauthenticated request is made to `/api/wallet/balance`
- **THEN** the system SHALL return 401

### Requirement: Payment methods SHALL return real data
The `/api/payment-methods` endpoint SHALL return available payment methods instead of an empty array in production.

#### Scenario: Payment methods list in production
- **WHEN** user calls GET `/api/payment-methods`
- **THEN** the response SHALL include at minimum: carte bancaire (Stripe) and wallet balance
- **THEN** methods not yet integrated (Mobile Money, PayPal, virement) SHALL be marked as `available: false`

#### Scenario: Wallet method shows balance
- **WHEN** payment methods are listed
- **THEN** the wallet method SHALL include the user's current balance
- **THEN** it SHALL be `available: true` only if balance > 0
