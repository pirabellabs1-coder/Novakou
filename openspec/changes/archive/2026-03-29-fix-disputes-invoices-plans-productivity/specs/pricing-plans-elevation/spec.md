## MODIFIED Requirements

### Requirement: Admin plans page uses elevation plan keys

The admin plans page (`/admin/plans`) SHALL read and write plan data using the elevation plan keys defined in `lib/plans.ts`: `decouverte`, `ascension`, `sommet`, `agence_starter`, `empire`.

The page SHALL display for each plan:
- Name (from PLAN_RULES)
- Monthly price and annual price (with 25% discount)
- Commission type and value
- Service limits, candidature limits
- Team member limits and storage (for agency plans)

The admin SHALL be able to edit commission values, prices, and limits, and changes SHALL persist via the config-service.

#### Scenario: Admin opens plans page
- **WHEN** admin navigates to `/admin/plans`
- **THEN** all 5 plans are displayed with correct names, prices, and commissions from `lib/plans.ts` (Découverte 0€/12%, Ascension 15€/5%, Sommet 29.99€/1€ fixe, Agence Starter 20€/5%, Empire 65€/0%)

#### Scenario: Admin edits a plan commission
- **WHEN** admin changes Ascension commission from 5% to 8% and saves
- **THEN** the config-service persists the change under key `ascension` and subsequent page loads show 8%

#### Scenario: Plans page loads without config override
- **WHEN** no admin overrides exist in config-service
- **THEN** the page falls back to defaults from `lib/plans.ts` PLAN_RULES

### Requirement: Config-service uses elevation plan keys

The `config-service.ts` SHALL store plan configuration under elevation keys (`decouverte`, `ascension`, `sommet`, `agence_starter`, `empire`) instead of legacy keys (`gratuit`, `pro`, `business`, `agence`).

The default plan values in `getDefaultConfig()` SHALL match `lib/plans.ts` PLAN_RULES exactly:
- `decouverte`: price 0, commission 12%, maxServices 5, maxCandidatures 10
- `ascension`: price 15, commission 5%, maxServices 15, maxCandidatures 30
- `sommet`: price 29.99, commission 1€ fixed, maxServices -1, maxCandidatures -1
- `agence_starter`: price 20, commission 5%, maxServices -1, maxCandidatures -1, maxMembers 10, storageGB 25
- `empire`: price 65, commission 0%, maxServices -1, maxCandidatures -1, maxMembers 25, storageGB 100

#### Scenario: Config-service returns aligned defaults
- **WHEN** `getConfig()` is called with no overrides
- **THEN** `config.plans.decouverte.price` returns 0 and `config.plans.ascension.commissionValue` returns 5

#### Scenario: Legacy keys no longer used
- **WHEN** config-service is queried for `config.plans.gratuit`
- **THEN** it returns undefined (legacy keys are removed)
