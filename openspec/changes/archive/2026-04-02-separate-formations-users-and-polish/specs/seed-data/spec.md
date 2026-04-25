## MODIFIED Requirements

### Requirement: Seed creates formation-only users separately
The seed script SHALL create formation-only users with `registrationSource = "formations"` and `role = CLIENT`, distinct from marketplace users.

#### Scenario: Seed creates demo formation learners
- **WHEN** the seed script runs
- **THEN** formation-only users SHALL have `registrationSource = "formations"`, `role = CLIENT`, and `formationsRole = "apprenant"`
- **AND** they SHALL NOT have FreelancerProfile records

#### Scenario: Seed creates marketplace users
- **WHEN** the seed script creates freelancers, clients, or agencies
- **THEN** they SHALL have `registrationSource = "marketplace"` (or null for backward compatibility)
- **AND** they SHALL have their respective profile records
