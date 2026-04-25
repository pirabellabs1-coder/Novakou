## ADDED Requirements

### Requirement: Plan definitions with elevation theme
The system SHALL define exactly 4 subscription plans with the following properties:

| Plan | ID | Price/mo | Annual/mo | Commission | Services | Candidatures | Boosts | Certif IA | Scénarios | Productivité | Équipe | CRM | Cloud | API | Support |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Découverte | decouverte | 0€ | 0€ | 12% | 5 | 10/mo | 0 | 0 | 0 | Non | — | — | — | Non | Email |
| Ascension | ascension | 15€ | 11,25€ | 5% | 15 | 30/mo | 3/mo | 1/mo | 3 | Non | — | — | — | Non | Prioritaire |
| Sommet | sommet | 29,99€ | 22,49€ | 1€ fixe/vente | ∞ | ∞ | 10/mo | ∞ | 10 | Oui | — | — | Oui | Dédié |
| Empire | empire | 65€ | 48,75€ | 0% | ∞ | ∞ | 20/mo | ∞ | ∞ | Oui | 25 max | Oui | 100GB | Oui | VIP dédié |

#### Scenario: Plan rules source of truth
- **WHEN** any part of the application needs plan limits or commission rates
- **THEN** it SHALL import from `lib/plans.ts` PLAN_RULES — no local plan constants

#### Scenario: Commission calculation for Découverte
- **WHEN** a freelance on plan Découverte sells a service for 100€
- **THEN** the platform commission SHALL be 12€ (12% of 100€)

#### Scenario: Commission calculation for Ascension
- **WHEN** a freelance on plan Ascension sells a service for 100€
- **THEN** the platform commission SHALL be 5€ (5% of 100€)

#### Scenario: Commission calculation for Sommet
- **WHEN** a freelance on plan Sommet sells a service for any amount
- **THEN** the platform commission SHALL be exactly 1€ (fixed, regardless of amount)

#### Scenario: Commission calculation for Empire
- **WHEN** a freelance or agency on plan Empire sells a service for any amount
- **THEN** the platform commission SHALL be 0€ (zero commission)

### Requirement: Plan name mapping from database
The system SHALL map Prisma enum values to new plan identifiers bidirectionally:
- GRATUIT ↔ decouverte
- PRO ↔ ascension
- BUSINESS ↔ sommet
- AGENCE ↔ empire

#### Scenario: Normalize legacy plan name from DB
- **WHEN** a user has `plan: "GRATUIT"` in the database
- **THEN** `normalizePlanName("GRATUIT")` SHALL return `"decouverte"`

#### Scenario: Normalize legacy plan name from JWT
- **WHEN** a JWT contains `plan: "pro"` (from an old session)
- **THEN** `normalizePlanName("pro")` SHALL return `"ascension"`

#### Scenario: Normalize new plan name
- **WHEN** `normalizePlanName("sommet")` is called
- **THEN** it SHALL return `"sommet"` unchanged

### Requirement: Annual billing with 25% discount
The system SHALL offer annual billing with a 25% discount on monthly price.

#### Scenario: Annual price calculation
- **WHEN** a user selects annual billing for Ascension (15€/mo)
- **THEN** the annual price SHALL be 135€/year (11,25€/mo displayed)

#### Scenario: Annual toggle on pricing page
- **WHEN** user toggles between monthly and annual on `/tarifs`
- **THEN** all plan prices SHALL update instantly with the 25% discount applied

### Requirement: Public pricing page with elevation theme
The `/tarifs` page SHALL display all 4 plans in a responsive grid with clear visual progression showing each tier's advantages over the previous one.

#### Scenario: Plan card display
- **WHEN** a visitor loads `/tarifs`
- **THEN** they SHALL see 4 plan cards (Découverte, Ascension, Sommet, Empire) with price, commission rate, feature list, and CTA button

#### Scenario: Popular plan highlight
- **WHEN** the pricing page renders
- **THEN** the Sommet plan SHALL be highlighted as "Populaire" with a distinct visual treatment

#### Scenario: Feature comparison table
- **WHEN** a visitor scrolls down on `/tarifs`
- **THEN** they SHALL see a comparison table showing all features across all 4 plans with checkmarks/values

#### Scenario: FAQ section
- **WHEN** a visitor views the pricing FAQ
- **THEN** they SHALL see at least 5 questions covering: plan changes, engagement, commission explanation, agency features, payment methods

### Requirement: Dashboard subscription page updated
The `/dashboard/abonnement` page SHALL show the new plan names, prices, and commission rates.

#### Scenario: Current plan display
- **WHEN** a freelance on Ascension views their subscription page
- **THEN** they SHALL see "Plan Ascension — 15€/mois — Commission 5%" with their current usage stats

#### Scenario: Upgrade flow
- **WHEN** a freelance on Découverte clicks "Choisir" on the Sommet plan
- **THEN** they SHALL be redirected to the payment page with Sommet details pre-filled

### Requirement: Agency subscription unified under Empire
The `/agence/abonnement` page SHALL show Empire as the agency plan with team management features highlighted.

#### Scenario: Agency plan display
- **WHEN** an agency views their subscription page
- **THEN** they SHALL see Empire (65€/mo) with agency-specific features: 25 members, CRM, 100GB cloud, VIP support

#### Scenario: Non-Empire agency features
- **WHEN** an agency is on Découverte or Ascension plan
- **THEN** team management, CRM, and cloud features SHALL be locked with "Passer à Empire" CTA

### Requirement: Subscription API with new plan IDs
The `/api/subscription` POST endpoint SHALL accept "ascension", "sommet", "empire" as valid plan IDs.

#### Scenario: Subscribe to Ascension
- **WHEN** POST `/api/subscription` with `{ planId: "ascension", billing: "monthly" }`
- **THEN** the system SHALL create a Stripe Checkout session with `STRIPE_PRICE_ASCENSION` price ID

#### Scenario: Invalid plan ID
- **WHEN** POST `/api/subscription` with `{ planId: "pro" }` (old name)
- **THEN** the system SHALL normalize to "ascension" and proceed normally

### Requirement: Stripe Connect dynamic commission
The Stripe Connect `createPaymentIntent` function SHALL use `calculateCommissionEur()` to compute the application fee based on the vendor's current plan.

#### Scenario: Empire vendor payment
- **WHEN** a client pays 200€ for a service from an Empire vendor
- **THEN** `application_fee_amount` SHALL be 0 (zero commission)

#### Scenario: Découverte vendor payment
- **WHEN** a client pays 200€ for a service from a Découverte vendor
- **THEN** `application_fee_amount` SHALL be 2400 cents (12% of 200€ = 24€)

#### Scenario: Sommet vendor payment
- **WHEN** a client pays 200€ for a service from a Sommet vendor
- **THEN** `application_fee_amount` SHALL be 100 cents (1€ fixed)

### Requirement: Commission label display
The system SHALL display commission in a user-friendly format per plan.

#### Scenario: Percentage commission label
- **WHEN** displaying commission for Découverte (12%) or Ascension (5%)
- **THEN** the label SHALL be "12%" or "5%" respectively

#### Scenario: Fixed commission label
- **WHEN** displaying commission for Sommet
- **THEN** the label SHALL be "1€/vente"

#### Scenario: Zero commission label
- **WHEN** displaying commission for Empire
- **THEN** the label SHALL be "0%" or "Gratuit"

### Requirement: Demo data updated
The `DEMO_PLANS` array in `lib/demo-data.ts` SHALL reflect the new plan names, prices, and features.

#### Scenario: Demo plans match PLAN_RULES
- **WHEN** the application loads demo data
- **THEN** each demo plan SHALL match the corresponding PLAN_RULES entry (name, price, commission, limits)

### Requirement: i18n translations updated
The `fr.json` and `en.json` message files SHALL contain translations for all new plan names and descriptions.

#### Scenario: French plan names
- **WHEN** the app renders in French
- **THEN** plan names SHALL display as "Découverte", "Ascension", "Sommet", "Empire"

#### Scenario: English plan names
- **WHEN** the app renders in English
- **THEN** plan names SHALL display as "Discovery", "Ascension", "Summit", "Empire"
