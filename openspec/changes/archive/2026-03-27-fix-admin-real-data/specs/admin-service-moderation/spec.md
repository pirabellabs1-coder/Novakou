## ADDED Requirements

### Requirement: Admin service moderation actions persist to database
The `/api/admin/services/[id]` PATCH endpoint SHALL perform service moderation actions via Prisma when `USE_PRISMA_FOR_DATA` is true.

#### Scenario: Admin approves a service
- **WHEN** an admin calls `PATCH /api/admin/services/[id]` with `{ action: "approve" }`
- **THEN** the system SHALL update `service.status` to `ACTIF` via Prisma and create a notification for the service owner

#### Scenario: Admin refuses a service
- **WHEN** an admin calls `PATCH /api/admin/services/[id]` with `{ action: "refuse", reason: "Contenu inapproprie" }`
- **THEN** the system SHALL update `service.status` to `REFUSE` and set `refuseReason` via Prisma, and create a notification for the service owner

#### Scenario: Admin features a service
- **WHEN** an admin calls `PATCH /api/admin/services/[id]` with `{ action: "feature" }`
- **THEN** the system SHALL update `service.isBoosted` to `true` via Prisma

#### Scenario: Admin unfeatures a service
- **WHEN** an admin calls `PATCH /api/admin/services/[id]` with `{ action: "unfeature" }`
- **THEN** the system SHALL update `service.isBoosted` to `false` via Prisma
