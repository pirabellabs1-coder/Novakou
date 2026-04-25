## ADDED Requirements

### Requirement: ensureUserInDb preserves existing user data
In DEV_MODE, when a dev-store user logs in and their email already exists in the Prisma database (from seeding), the system SHALL reuse the existing DB record instead of creating a new one and orphaning the old data.

#### Scenario: Dev user login with email matching seeded user
- **WHEN** a dev-store user with id `dev-admin-1` and email `admin@freelancehigh.com` logs in
- **AND** a Prisma user with id `cuid-xxx` and email `admin@freelancehigh.com` already exists (from seed)
- **THEN** the system SHALL update the existing Prisma user's id to `dev-admin-1` (or alias the lookup)
- **AND** all enrollments, certificates, and lesson progress linked to the original user SHALL remain accessible

#### Scenario: Dev user login with no matching DB user
- **WHEN** a dev-store user logs in and no Prisma user exists with their id OR email
- **THEN** the system SHALL create a new Prisma user record

#### Scenario: Dev user login with matching ID
- **WHEN** a dev-store user logs in and a Prisma user with the same id already exists
- **THEN** the system SHALL return immediately without any changes

### Requirement: ensureUserInDb never renames emails
The `ensureUserInDb` function SHALL NOT modify the `email` field of any existing user record. The pattern of appending `@migrated.dev` to existing user emails is forbidden.

#### Scenario: Email collision handling
- **WHEN** a dev-store user's email matches an existing Prisma user with a different id
- **THEN** the system SHALL NOT rename the existing user's email
- **AND** the system SHALL update the existing user's id to match the dev-store id

### Requirement: Enrollment data survives logout/re-login cycle
All enrollment, certificate, and lesson progress data SHALL be retrievable after a user logs out and logs back in.

#### Scenario: User checks enrollments after re-login
- **WHEN** a user who purchased formations logs out and logs back in
- **THEN** calling `GET /api/apprenant/enrollments` SHALL return all previously purchased formations with their progress intact
