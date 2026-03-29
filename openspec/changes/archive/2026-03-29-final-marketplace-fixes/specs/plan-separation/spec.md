## ADDED Requirements

### Requirement: Freelances see only freelance plans
The freelance subscription page SHALL display only 3 plans: Découverte (0€), Ascension (15€), Sommet (29.99€). The Empire plan and any agency-specific plans SHALL NOT be visible to freelances.

#### Scenario: Freelance visits subscription page
- **WHEN** a user with role `freelance` navigates to `/dashboard/abonnement`
- **THEN** the page SHALL display exactly 3 plan cards: Découverte, Ascension, Sommet
- **AND** the Empire plan SHALL NOT appear anywhere on the page

#### Scenario: Freelance on public pricing page
- **WHEN** a non-authenticated user visits `/tarifs`
- **THEN** the page SHALL show all plans grouped by role: "Pour les Freelances" (3 plans) and "Pour les Agences" (2 plans)

### Requirement: Agencies see only agency plans
The agency subscription page SHALL display only 2 plans: Agence Starter (20€) and Empire (65€). Freelance-specific plans (Découverte, Ascension, Sommet) SHALL NOT be visible to agencies.

#### Scenario: Agency visits subscription page
- **WHEN** a user with role `agence` navigates to `/agence/abonnement`
- **THEN** the page SHALL display exactly 2 plan cards: Agence Starter (20€/mois) and Empire (65€/mois)
- **AND** no freelance plans SHALL be shown

#### Scenario: Agency on Agence Starter plan
- **WHEN** an agency is on the Agence Starter plan
- **THEN** the subscription banner SHALL show "Plan Agence Starter · 20€/mois" with the correct commission rate (5%)

### Requirement: New "Agence Starter" plan exists in PLAN_RULES
A new plan called "AGENCE_STARTER" SHALL be added to `lib/plans.ts` with the following characteristics:
- Price: 20€/mois (180€/an with 25% discount)
- Commission: 5% (percentage type)
- Services: Illimité
- Candidatures: Illimité
- Boosts: 5/mois
- Team members: 5 max
- CRM access: Oui
- Cloud storage: 10 GB
- API access: Non
- Support: Prioritaire

#### Scenario: Agency selects Agence Starter plan
- **WHEN** an agency selects the Agence Starter plan
- **THEN** the system SHALL apply 5% commission on all orders for that agency's services
- **AND** the agency SHALL be limited to 5 team members and 5 boosts per month

#### Scenario: Plan normalization handles AGENCE_STARTER
- **WHEN** a user's plan field contains "AGENCE_STARTER" or "agence_starter"
- **THEN** `normalizePlanName()` SHALL return `"AGENCE_STARTER"`

### Requirement: Plan visibility mapping
The system SHALL maintain a `PLAN_VISIBILITY` constant that maps roles to their visible plans:
- `freelance` → `["DECOUVERTE", "ASCENSION", "SOMMET"]`
- `agence` → `["AGENCE_STARTER", "EMPIRE"]`

#### Scenario: Role-based plan filtering
- **WHEN** the subscription page loads for a user with a specific role
- **THEN** only plans in `PLAN_VISIBILITY[role]` SHALL be displayed

### Requirement: Plan restrictions enforce correctly per plan
All plan limits SHALL be enforced at the API level based on the seller's current plan (freelance or agency).

#### Scenario: Commission matches plan
- **WHEN** an order is created for a service owned by a user on the Ascension plan
- **THEN** the commission SHALL be 5% of the order amount

#### Scenario: Commission matches agency plan
- **WHEN** an order is created for a service owned by an agency on the Agence Starter plan
- **THEN** the commission SHALL be 5% of the order amount

#### Scenario: Candidature limit enforced
- **WHEN** a freelance on the Découverte plan has already submitted 10 candidatures this month
- **THEN** the system SHALL reject the 11th candidature with error "Limite de candidatures atteinte pour votre plan"
