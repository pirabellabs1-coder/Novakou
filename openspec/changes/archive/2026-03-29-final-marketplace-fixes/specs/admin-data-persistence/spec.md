## MODIFIED Requirements

### Requirement: Admin boosts API returns complete stats object
The `/api/admin/boosts` GET endpoint SHALL return a stats object with all 6 fields: `totalBoosts`, `activeBoosts`, `totalRevenue`, `totalViews`, `totalClicks`, `totalOrders`.

#### Scenario: Prisma path returns computed stats
- **WHEN** the admin fetches the boosts page in production (Prisma path)
- **THEN** the stats object SHALL include `totalViews`, `totalClicks`, and `totalOrders` computed from `BoostDailyStat` aggregates (not hardcoded to 0)

#### Scenario: No boost stats exist yet
- **WHEN** no `BoostDailyStat` records exist in the database
- **THEN** the API SHALL return `totalViews: 0`, `totalClicks: 0`, `totalOrders: 0` (numeric zero, not undefined)

#### Scenario: Frontend handles missing stats gracefully
- **WHEN** the admin boosts page receives a stats object with any missing field
- **THEN** the page SHALL use `(value ?? 0).toLocaleString()` to prevent crashes

### Requirement: Admin boosts page maps API fields correctly
The frontend boosts page SHALL map API response fields to the `AdminBoost` interface using correct field names.

#### Scenario: Boost table displays all columns
- **WHEN** the admin views the boosts table
- **THEN** each row SHALL display: service title, freelance name, tier, cost, start date, end date, views, clicks, orders, status — with no undefined values

#### Scenario: Boost card maps service title
- **WHEN** the API returns `serviceName` (from Prisma include)
- **THEN** the frontend SHALL map it to `serviceTitle` for display

### Requirement: Admin plans page reflects current configuration
The admin plans page SHALL load plan data from the `/api/admin/config` endpoint and display current commission rates, limits, and pricing.

#### Scenario: Plans display current values
- **WHEN** the admin navigates to /admin/plans
- **THEN** the page SHALL show the 4 plans (Decouverte, Ascension, Sommet, Empire) with their current prices, commission rates, service limits, candidature limits, and boost limits

#### Scenario: Plan edit saves to config
- **WHEN** the admin edits a plan's commission rate and saves
- **THEN** the config SHALL be updated via POST /api/admin/config and the page SHALL refresh to show the new value
