## ADDED Requirements

### Requirement: Boost selection page
The freelancer/agency SHALL be able to access a boost page (`/dashboard/services/boost` or `/agence/services/boost`) where they select a service to boost, choose a tier, and see the automatic cost calculation.

#### Scenario: Freelancer selects a service and tier
- **WHEN** a freelancer navigates to the boost page and selects a service and the "Standard" tier (7 days)
- **THEN** the system SHALL display: duration (7 days), cost per day, total cost, estimated daily impressions, and total estimated impressions

#### Scenario: Boost tiers with different durations
- **WHEN** the boost page loads
- **THEN** the system SHALL display 3 tiers:
  - Standard: 7 jours, ~500 impressions/jour
  - Premium: 14 jours, ~1000 impressions/jour
  - Ultime: 30 jours, ~2000 impressions/jour

#### Scenario: Plan limits enforcement
- **WHEN** a freelancer on the Free plan (0 boosts/month) tries to boost
- **THEN** the system SHALL display a message "Passez au plan Pro pour booster vos services" and block the action

#### Scenario: Monthly boost limit reached
- **WHEN** a Pro freelancer (1 boost/month) has already used their monthly boost
- **THEN** the system SHALL display "Limite de boost atteinte ce mois-ci" and block the action

### Requirement: Boost activation
The system SHALL activate a boost when the freelancer confirms, creating the Boost record, Escrow, AdminTransaction, and BoostDailyStat entries.

#### Scenario: Successful boost activation
- **WHEN** a freelancer confirms boost activation for a service
- **THEN** the system SHALL:
  1. Call `POST /api/services/[id]/boost` with the selected tier
  2. Create a `Boost` record with status `ACTIVE`
  3. Update the service `isBoosted: true` and `boostedUntil` to the end date
  4. Create `BoostDailyStat` entries for each day of the boost
  5. Create an `AdminTransaction` of type `BOOST_FEE`
  6. Display a success confirmation with redirect to the boost stats page

#### Scenario: Service already has an active boost
- **WHEN** a freelancer tries to boost a service that already has an active boost
- **THEN** the system SHALL display "Ce service est déjà en boost actif jusqu'au [date]"

### Requirement: Boost statistics page
A dedicated page (`/dashboard/services/boost/[boostId]`) SHALL display real-time statistics of an active or completed boost.

#### Scenario: Active boost with daily stats
- **WHEN** a freelancer navigates to the boost stats page
- **THEN** the system SHALL display:
  - Total impressions vs estimated impressions (progress bar)
  - Total clicks
  - Total contacts initiated via the boosted service
  - Total orders from the boosted service during the boost period
  - Conversion rate (clicks/impressions)
  - Daily breakdown chart (impressions, clicks, contacts, orders per day)
  - Remaining days and end date

#### Scenario: Completed boost summary
- **WHEN** a boost has ended (status: COMPLETED)
- **THEN** the page SHALL display final stats with a "Boost terminé" badge and a "Renouveler le boost" button

### Requirement: Boost impression tracking
The system SHALL track real impressions when a boosted service card is displayed on the explorer or landing page.

#### Scenario: Boosted service card viewed on explorer
- **WHEN** a boosted service card is rendered on the `/explorer` page
- **THEN** the system SHALL call `POST /api/services/[id]/track-view` which increments the `BoostDailyStat.impressions` for today if a boost is active

#### Scenario: Boosted service card clicked
- **WHEN** a user clicks on a boosted service card
- **THEN** the system SHALL call `POST /api/services/[id]/track-click` which increments the `BoostDailyStat.clicks` for today if a boost is active

### Requirement: Agency boost functionality
The agency space (`/agence/services/boost`) SHALL provide the same boost selection, activation, and statistics pages as the freelancer dashboard.

#### Scenario: Agency boosts a service
- **WHEN** an agency admin boosts an agency service
- **THEN** the boost SHALL be created with the `agencyId` field set, and the stats page SHALL be accessible from `/agence/services/boost/[boostId]`
