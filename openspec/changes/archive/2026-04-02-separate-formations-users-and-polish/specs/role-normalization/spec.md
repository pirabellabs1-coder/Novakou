## MODIFIED Requirements

### Requirement: Formation inscription sends correct role
The formations inscription page SHALL send `role: "client"` instead of `role: "freelance"` when registering a new user. This prevents formation-only users from appearing as freelancers in the marketplace.

#### Scenario: New apprenant registration
- **WHEN** a user registers as apprenant via `/inscription`
- **THEN** the register API call SHALL include `role: "client"` and `formationsRole: "apprenant"`
- **AND** the User record SHALL have `role = CLIENT` and `registrationSource = "formations"`

#### Scenario: New instructeur registration
- **WHEN** a user registers as instructeur via `/inscription`
- **THEN** the register API call SHALL include `role: "client"` and `formationsRole: "instructeur"`
- **AND** the User record SHALL have `role = CLIENT` and `registrationSource = "formations"`

### Requirement: Existing formation users are migrated
A data migration SHALL update existing users who registered through formations (have `formationsRole` set, `role = FREELANCE`, and no real marketplace activity) to `role = CLIENT` and `registrationSource = "formations"`.

#### Scenario: Migration of existing formation-only freelancers
- **WHEN** the migration runs
- **THEN** users with `formationsRole IS NOT NULL` AND `role = FREELANCE` AND no services/orders SHALL be updated to `role = CLIENT` and `registrationSource = "formations"`
- **AND** users who DO have marketplace activity (services, orders) SHALL NOT be changed
