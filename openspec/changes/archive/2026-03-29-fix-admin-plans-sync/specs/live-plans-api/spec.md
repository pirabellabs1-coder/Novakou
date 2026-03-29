## ADDED Requirements

### Requirement: Public API endpoint returns live plan configuration
The system SHALL expose a public `GET /api/plans/live` endpoint that returns the current plan configuration for all 5 plans (DECOUVERTE, ASCENSION, SOMMET, AGENCE_STARTER, EMPIRE), merging admin overrides from the platform config with hardcoded defaults from `PLAN_RULES`.

#### Scenario: Successful fetch with no admin overrides
- **WHEN** a client fetches `GET /api/plans/live` and no admin has ever modified the plans config
- **THEN** the response SHALL return all 5 plans with values identical to `PLAN_RULES` defaults, status 200, and `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`

#### Scenario: Successful fetch with admin overrides
- **WHEN** a client fetches `GET /api/plans/live` and the admin has modified the ASCENSION plan price to 19
- **THEN** the response SHALL return ASCENSION with `priceMonthly: 19` and all other ASCENSION fields from defaults, and all other plans unchanged

#### Scenario: Response shape
- **WHEN** the endpoint returns successfully
- **THEN** the response body SHALL have shape `{ plans: Record<PlanName, LivePlanConfig>, updatedAt: string }` where `LivePlanConfig` includes all fields: `name`, `priceMonthly`, `priceAnnual`, `commissionType`, `commissionValue`, `serviceLimit`, `applicationLimit`, `boostLimit`, `scenarioLimit`, `certificationLimit`, `productiviteAccess`, `teamLimit`, `crmAccess`, `cloudStorageGB`, `apiAccess`, `supportLevel`, `features`

### Requirement: React hook provides live plan data with fallback
The system SHALL provide a `useLivePlans()` React hook that fetches from `/api/plans/live` and returns the live plan configuration. If the fetch fails, it SHALL fallback to the hardcoded `PLAN_RULES` and `PLAN_FEATURES`.

#### Scenario: Successful hook usage
- **WHEN** a component calls `useLivePlans()`
- **THEN** it SHALL return `{ plans, features, isLoading, error }` where `plans` is a `Record<PlanName, LivePlanConfig>` and `features` is a `Record<PlanName, string[]>`

#### Scenario: API unavailable fallback
- **WHEN** a component calls `useLivePlans()` and the API returns an error
- **THEN** the hook SHALL return the hardcoded `PLAN_RULES` values as `plans` and `PLAN_FEATURES` as `features`, with `error` set and `isLoading: false`

### Requirement: Admin can edit all plan parameters
The admin `/admin/plans` page SHALL display an editable form for each plan with ALL configurable fields:
- Prix mensuel (EUR)
- Prix annuel (EUR)
- Type de commission (pourcentage / fixe)
- Valeur de commission
- Limite services (-1 = illimité)
- Limite candidatures/mois (-1 = illimité)
- Boosts/mois
- Scénarios automatisés (-1 = illimité)
- Certifications IA/mois (-1 = illimité)
- Accès outils productivité (oui/non)
- Membres équipe max (0 = non applicable)
- Accès CRM (oui/non)
- Stockage cloud (GB, 0 = non applicable)
- Accès API (oui/non)
- Niveau support (email / prioritaire / dédié / VIP)
- Liste de features (texte libre, une par ligne)

#### Scenario: Admin opens plan editor
- **WHEN** the admin clicks "Modifier" on a plan card
- **THEN** the system SHALL display an expanded form with all fields pre-filled with current values from the platform config (merged with defaults)

#### Scenario: Admin saves plan changes
- **WHEN** the admin modifies fields and clicks "Enregistrer"
- **THEN** the system SHALL call `PATCH /api/admin/config` with the updated plan data and show a success toast
- **THEN** the plan card SHALL immediately reflect the new values

#### Scenario: Admin edits features list
- **WHEN** the admin modifies the features list for a plan (adding/removing/reordering bullet points)
- **THEN** the saved config SHALL store the features array, and the `/api/plans/live` endpoint SHALL return these features instead of the hardcoded `PLAN_FEATURES`

### Requirement: Public tarifs page uses live plan data
The `/tarifs` page SHALL fetch plan data from `useLivePlans()` instead of reading directly from hardcoded `PLAN_RULES` and `PLAN_FEATURES` constants.

#### Scenario: Admin changes plan price
- **WHEN** the admin changes the ASCENSION monthly price from 15 to 19 in `/admin/plans`
- **THEN** within 60 seconds, the `/tarifs` page SHALL display 19€/mois for the Ascension plan

#### Scenario: Admin changes features list
- **WHEN** the admin adds "Badge prioritaire" to the ASCENSION features list
- **THEN** within 60 seconds, the `/tarifs` page SHALL display "Badge prioritaire" in the Ascension plan card

### Requirement: Freelance subscription page uses live plan data
The `/dashboard/abonnement` page SHALL fetch plan data from `useLivePlans()` instead of hardcoded constants.

#### Scenario: Plan prices reflect admin changes
- **WHEN** the admin modifies the SOMMET monthly price
- **THEN** the freelance subscription page SHALL display the updated price within 60 seconds

### Requirement: Agency subscription page uses live plan data
The `/agence/abonnement` page SHALL fetch plan data from `useLivePlans()` instead of hardcoded constants.

#### Scenario: Agency plan limits reflect admin changes
- **WHEN** the admin modifies the EMPIRE teamLimit from 25 to 30
- **THEN** the agency subscription page SHALL display "Jusqu'à 30 membres" within 60 seconds
