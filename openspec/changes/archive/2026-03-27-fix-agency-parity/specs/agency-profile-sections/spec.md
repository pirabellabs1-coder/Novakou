## MODIFIED Requirements

### Requirement: Orders API filters correctly for agencies
The `/api/orders` GET endpoint SHALL filter orders by `agencyId` when the caller is an agency owner (role AGENCE), excluding personal freelance orders from the agency view.

#### Scenario: Agency fetches orders without side filter
- **WHEN** an agency owner (role=AGENCE) calls `GET /api/orders` without `?side` parameter
- **THEN** the API SHALL return orders where `agencyId = agencyProfileId` OR `clientId = userId`, NOT including orders where only `freelanceId = userId`

#### Scenario: Agency fetches seller orders
- **WHEN** an agency owner calls `GET /api/orders?side=seller`
- **THEN** the API SHALL return orders where `agencyId = agencyProfileId`, NOT including personal freelance orders

### Requirement: Agency commission rate is 8%
The agency finances page SHALL use the correct 8% commission rate for the Agence plan, not a hardcoded 10%.

#### Scenario: Agency views commission on finances page
- **WHEN** an agency admin views `/agence/finances`
- **THEN** the commission rate displayed and used for calculations SHALL be 8% (0.08), matching the Agence plan in the centralized plan rules

#### Scenario: Agency views commission in CSV export
- **WHEN** an agency admin exports their finances as CSV
- **THEN** the commission amounts SHALL be calculated at 8%
