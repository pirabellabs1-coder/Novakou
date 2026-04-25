## MODIFIED Requirements

### Requirement: Admin boosts API SHALL return consistent field names
The `/api/admin/boosts` endpoint SHALL normalize field names between dev mode and Prisma mode so the frontend receives the same structure regardless of data source.

#### Scenario: Boost stats display correctly
- **WHEN** admin views `/admin/boosts`
- **THEN** each boost SHALL display: serviceTitle, userName, impressions, clicks, orders, totalCost
- **THEN** these fields SHALL come from Prisma relations (`service.title`, `user.name`) and actual stats (`actualImpressions`, `actualClicks`, `actualOrders`)

#### Scenario: Boost data updates in real-time
- **WHEN** admin refreshes the boosts page
- **THEN** the stats SHALL reflect current Prisma data (not cached dev store values)

### Requirement: Comptabilite KPIs SHALL include all revenue sources
The `/api/admin/comptabilite` endpoint SHALL calculate KPIs from ALL revenue sources: order commissions, boost revenue, and subscription payments.

#### Scenario: Commissions perçues shows real order fees
- **WHEN** admin views comptabilite
- **THEN** "Commissions perçues" SHALL equal the sum of `Order.platformFee` for orders with status `TERMINE` or `LIVRE` in the selected period

#### Scenario: Revenus boosts shows real boost revenue
- **WHEN** admin views comptabilite
- **THEN** "Revenus boosts" SHALL equal the sum of `Boost.totalCost` for boosts with `paidAt` not null in the selected period

#### Scenario: Abonnements revenue tracked
- **WHEN** admin views comptabilite
- **THEN** "Abonnements" SHALL equal the sum of `Payment.amount` where `type=abonnement` and `status=COMPLETE` in the selected period
- **THEN** this value SHALL NOT be hardcoded to 0

#### Scenario: Résultat net includes all sources
- **WHEN** admin views comptabilite
- **THEN** "Résultat net" SHALL equal commissions + boosts + abonnements - remboursements
