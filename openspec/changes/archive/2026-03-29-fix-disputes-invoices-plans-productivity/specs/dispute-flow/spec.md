## MODIFIED Requirements

### Requirement: Admin dispute actions work in dev mode

The admin dispute API route (`POST /api/admin/disputes`) SHALL support both "examine" and "resolve" actions in dev mode without authentication errors or type errors.

The `StoredOrder` interface in `data-store.ts` SHALL include optional dispute fields:
- `disputeStatus?: string` (ouvert | en_examen | resolu)
- `disputeReason?: string`
- `disputeVerdict?: string | null` (freelance | client | partiel)
- `disputeVerdictNote?: string | null`
- `disputePartialPercent?: number | null`
- `disputeResolvedAt?: string | null`

The API route SHALL NOT use `as Partial<typeof order>` casts — TypeScript MUST validate the update payload naturally.

The API route SHALL include a dev mode auth bypass (consistent with other admin routes) when `IS_DEV` is true, falling back to a mock admin session.

#### Scenario: Admin examines a dispute in dev mode
- **WHEN** admin clicks "Examiner" on a dispute with status "ouvert"
- **THEN** the API updates the order's `disputeStatus` to "en_examen", adds a timeline event, creates notifications for both parties, and returns `{ success: true }`

#### Scenario: Admin resolves a dispute in favor of freelance
- **WHEN** admin selects verdict "freelance" with a note and clicks "Appliquer le verdict"
- **THEN** the API sets `disputeStatus: "resolu"`, `disputeVerdict: "freelance"`, `disputeVerdictNote` with the note, creates a payout transaction for the freelance, and the dispute appears in the "Résolus" tab

#### Scenario: Admin resolves with partial refund
- **WHEN** admin selects verdict "partiel" with 60% and a note
- **THEN** the API creates two transactions (60% refund to client, remaining minus commission to freelance), sets `disputePartialPercent: 60`, and the dispute is marked resolved

#### Scenario: Admin resolves in favor of client
- **WHEN** admin selects verdict "client" with a note
- **THEN** the API creates a full refund transaction for the client, sets order status to "annule", and the dispute is marked resolved

#### Scenario: Notifications created on dispute resolution
- **WHEN** any verdict is applied
- **THEN** both client and freelance receive a notification with the verdict result and relevant links

## ADDED Requirements

### Requirement: Dev auth bypass for disputes API

The disputes API route SHALL check `IS_DEV` before checking session auth. When `IS_DEV` is true and `getServerSession()` returns null, the route SHALL use a mock admin session (`{ user: { id: "dev-admin", role: "admin", name: "Admin Dev" } }`) to proceed with the action.

#### Scenario: Dev mode without NextAuth configured
- **WHEN** `IS_DEV` is true and `getServerSession()` returns null
- **THEN** the API uses a mock admin session and processes the request normally (no 403 error)

#### Scenario: Production mode auth unchanged
- **WHEN** `IS_DEV` is false
- **THEN** the API requires a valid admin session and returns 403 if missing
