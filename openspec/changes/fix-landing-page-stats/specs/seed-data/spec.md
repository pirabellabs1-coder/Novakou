## MODIFIED Requirements

### Requirement: Landing page stats display real numbers

The landing page StatsBar SHALL display actual numbers for all 4 stats cards instead of placeholder text when the value is greater than 0.

The `formatStatNumber()` function SHALL return the exact number as a string for values from 1 to 9 (currently returns `null` for values < 10).

#### Scenario: Projets livrés with small count
- **WHEN** there are 6 completed orders in the platform
- **THEN** the "Projets livrés" card displays "6" (not "Rejoignez-nous!")

#### Scenario: Freelances actifs with small count
- **WHEN** there are 5 active freelancers
- **THEN** the "Freelances actifs" card displays "5" (not a placeholder)

### Requirement: Seed data produces convincing landing stats

The default seed data SHALL include enough entries to produce meaningful landing page statistics:
- At least 10 completed orders (`status: "termine"`) with realistic data
- At least 15 reviews with varied ratings (4.0–5.0 range)
- At least 3 users with `createdAt` dates in the current month (March 2026) to trigger the "+X ce mois" growth badge

#### Scenario: Fresh dev startup shows rich stats
- **WHEN** the dev server starts with no existing `orders.json` (fresh seed data)
- **THEN** the landing page displays: 20+ freelances actifs, 10+ projets livrés, 4.5+ satisfaction rating, 15+ avis, 10 pays couverts, and "+3 ce mois" growth badge

#### Scenario: Stats are based on real seed data
- **WHEN** the API `/api/public/stats` is called in dev mode
- **THEN** all returned values match the actual counts from the dev stores (no hardcoded overrides)

### Requirement: StatsBar shows number when greater than zero

The StatsBar component SHALL display the actual number for freelances and projets livrés when the count is > 0, falling back to placeholder text only when the count is exactly 0.

#### Scenario: Zero completed orders
- **WHEN** `completedOrders` is 0
- **THEN** the projets livrés card shows "—" (dash)

#### Scenario: Non-zero completed orders
- **WHEN** `completedOrders` is 4
- **THEN** the projets livrés card shows "4"
