## ADDED Requirements

### Requirement: User model tracks registration source
The User model SHALL have a `registrationSource` field that records whether the user registered through the marketplace or the formations platform.

#### Scenario: User registers via formations inscription
- **WHEN** a user registers through `/inscription`
- **THEN** the User record SHALL have `registrationSource = "formations"` and `role = CLIENT`
- **AND** no `FreelancerProfile` SHALL be created

#### Scenario: User registers via marketplace inscription
- **WHEN** a user registers through `/inscription`
- **THEN** the User record SHALL have `registrationSource = "marketplace"`
- **AND** the appropriate role profile (FreelancerProfile/ClientProfile/AgencyProfile) SHALL be created

#### Scenario: Existing users without registrationSource
- **WHEN** a user was created before this change and has `registrationSource = null`
- **THEN** the system SHALL treat them as marketplace users by default

### Requirement: Marketplace admin excludes formation-only users
The main admin user list (`/admin/utilisateurs`) SHALL only show users who registered through the marketplace or have no `registrationSource` set.

#### Scenario: Admin views marketplace user list
- **WHEN** an admin navigates to `/admin/utilisateurs`
- **THEN** users with `registrationSource = "formations"` SHALL NOT appear in the list
- **AND** users with `registrationSource = null` or `registrationSource = "marketplace"` SHALL appear

#### Scenario: Admin user count in dashboard
- **WHEN** the admin dashboard displays user statistics
- **THEN** the freelance/client/agence counts SHALL exclude formation-only users

### Requirement: Formations admin shows formation users
The formations admin panel SHALL have visibility of users who registered through formations.

#### Scenario: Formations admin views learners
- **WHEN** an admin navigates to `/admin/apprenants`
- **THEN** the page SHALL show users with `formationsRole` set, regardless of marketplace role
- **AND** it SHALL show enrollment counts, certificate counts, and formation progress

### Requirement: Formation registration does not create marketplace profiles
When a user registers through the formations platform, the system SHALL NOT create FreelancerProfile, ClientProfile, or AgencyProfile records.

#### Scenario: Formation user has no marketplace profile
- **WHEN** a user registers via `/inscription` with `role: "client"`
- **THEN** no `FreelancerProfile` record SHALL be created
- **AND** no `ClientProfile` record SHALL be created
