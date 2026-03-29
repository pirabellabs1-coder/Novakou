## ADDED Requirements

### Requirement: Budget-based boost model
The boost system SHALL use a budget-based model where freelances and agencies enter their desired budget (minimum 5€). The system calculates duration based on a fixed daily rate.

#### Scenario: Freelance enters boost budget
- **WHEN** a freelance enters a budget of 15€ for a boost
- **THEN** the system SHALL calculate the duration as `budget / costPerDay` days (e.g., 15€ / 1€/day = 15 days)
- **AND** the boost SHALL be created with `totalCost: 15`, `durationDays: 15`

#### Scenario: Budget below minimum
- **WHEN** a user enters a budget below 5€
- **THEN** the system SHALL show a validation error "Le budget minimum est de 5€"

#### Scenario: Boost limit enforced per plan
- **WHEN** a user on the Ascension plan (3 boosts/mois) already has 3 active boosts this month
- **THEN** the system SHALL reject the new boost with "Limite de boosts atteinte pour votre plan (3/mois). Passez au plan supérieur."

### Requirement: Agency boost access
Agencies SHALL have access to boost their services from the agency services page, with the same budget-based model as freelances.

#### Scenario: Agency boosts a service
- **WHEN** an agency member with admin or manager role clicks "Booster" on a service
- **THEN** the system SHALL show the budget input form
- **AND** on submission, create the boost linked to the agency's service

#### Scenario: Agency boost limit per plan
- **WHEN** an agency on Agence Starter plan (5 boosts/mois) boosts services
- **THEN** the monthly boost count SHALL be shared across all agency members
