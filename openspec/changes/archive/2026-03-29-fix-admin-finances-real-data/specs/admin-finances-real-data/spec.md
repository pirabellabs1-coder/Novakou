## ADDED Requirements

### Requirement: Platform revenue SHALL reflect real AdminWallet data
The `/api/admin/finances` endpoint SHALL calculate `platformRevenue` from `AdminWallet.totalFeesReleased` instead of aggregating `Payment` records with `type=commission`.

#### Scenario: Admin views finances with real commission data
- **WHEN** admin loads `/admin/finances`
- **THEN** the "Revenus plateforme" card SHALL display `AdminWallet.totalFeesReleased` value
- **THEN** the value SHALL match the "Commissions liberees" card in the Admin Wallet section

#### Scenario: AdminWallet does not exist yet
- **WHEN** admin loads `/admin/finances` and no `AdminWallet` record exists
- **THEN** the system SHALL create one with `totalFeesHeld=0` and `totalFeesReleased=0`
- **THEN** all revenue KPIs SHALL display 0€

### Requirement: Escrow funds SHALL use the Escrow table
The `/api/admin/finances` endpoint SHALL calculate `escrowFunds` from `Escrow` records with `status=HELD` instead of summing `Order.amount` for active orders.

#### Scenario: Escrow funds reflect held escrows
- **WHEN** admin views the finances page
- **THEN** "Fonds en escrow" SHALL equal the sum of `Escrow.amount` where `status=HELD`
- **THEN** this SHALL NOT include orders without an Escrow record

#### Scenario: Fallback for orders without Escrow records
- **WHEN** some active orders have no associated Escrow row
- **THEN** the system SHALL add `Order.platformFee` for those orders to the escrow total as a fallback

### Requirement: Total payments SHALL reflect real order volume
The `totalPayments` KPI SHALL be calculated from `Order` records (excluding CANCELLED/REFUNDED) to show the real transaction volume on the platform.

#### Scenario: Total payments shows actual sales volume
- **WHEN** admin views the finances page extra metrics
- **THEN** "Total paiements" SHALL equal sum of `Order.amount` where status is not CANCELLED or REFUNDED

### Requirement: Comptabilite endpoint SHALL work without error
The `/api/admin/comptabilite` endpoint SHALL return valid data with real Prisma queries, including human-readable payer names.

#### Scenario: Comptabilite loads successfully
- **WHEN** admin navigates to `/admin/comptabilite`
- **THEN** the page SHALL load without showing "Erreur lors du chargement de la comptabilite"
- **THEN** KPIs (Recettes services, Commissions percues, etc.) SHALL display real amounts

#### Scenario: Operations table shows real payer names
- **WHEN** admin views the operations table in comptabilite
- **THEN** the "Payeur" column SHALL display the user's name (not their CUID ID)
- **THEN** for orders, it SHALL show the client's name
- **THEN** for boosts, it SHALL show the freelance's name

#### Scenario: Period filtering works correctly
- **WHEN** admin selects a period (1m, 3m, 6m, 1y, 5y)
- **THEN** only operations within that date range SHALL appear
- **THEN** KPIs SHALL be recalculated for the selected period

### Requirement: Transaction count SHALL reflect Prisma data
The "Total transactions" and "Bloquées" counts on the finances page SHALL come from real `Payment` records count, not from dev store length.

#### Scenario: Transaction counts are accurate
- **WHEN** admin views finances extra metrics
- **THEN** "Total transactions" SHALL equal `Payment.count()` from Prisma
- **THEN** "Bloquées" SHALL equal count of transactions with status blocked/BLOQUE

### Requirement: Subscription revenue SHALL aggregate from real data
The "Abonnements" KPI SHALL aggregate subscription payments from `Payment` records where `type=abonnement` and `status=COMPLETE`.

#### Scenario: Subscription revenue displayed
- **WHEN** admin views the finances page
- **THEN** "Abonnements" SHALL show the sum of `Payment.amount` where `type=abonnement` and `status=COMPLETE`
- **THEN** if no subscription payments exist, it SHALL display 0€
