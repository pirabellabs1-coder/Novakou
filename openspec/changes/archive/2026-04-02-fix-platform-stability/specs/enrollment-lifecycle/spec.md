## MODIFIED Requirements

### Requirement: Enrollment data persists across user sessions
Enrollments SHALL be stored in the Prisma database with the correct user ID. In DEV_MODE, the `ensureUserInDb` helper SHALL align the dev-store user ID with the database user ID so that enrollment queries (`WHERE userId = session.user.id`) always return the correct data.

#### Scenario: Enrollment query after dev-mode re-login
- **WHEN** a dev-store user creates an enrollment (userId = "dev-admin-1")
- **AND** the user logs out and logs back in
- **THEN** `prisma.enrollment.findMany({ where: { userId: "dev-admin-1" } })` SHALL return the enrollment

#### Scenario: Seeded enrollment visible after first dev login
- **WHEN** the database is seeded with enrollments for user email `admin@freelancehigh.com` (with seeded cuid)
- **AND** a dev-store user logs in with that same email (with id `dev-admin-1`)
- **THEN** the seeded enrollments SHALL be visible to the dev-store user after `ensureUserInDb` aligns the IDs
