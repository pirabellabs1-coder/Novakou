## ADDED Requirements

### Requirement: Refund routes must handle DEV_MODE users
All refund API routes must call `ensureUserInDb` after authentication.

#### Scenario: Dev user requests refund
- **WHEN** A DEV_MODE user sends POST to `/api/apprenant/refunds` with a valid enrollment
- **THEN** The user record is auto-created in DB if missing, and the refund request is created successfully

#### Scenario: Dev user views refund history
- **WHEN** A DEV_MODE user sends GET to `/api/apprenant/refunds`
- **THEN** The user record exists and refund history is returned (empty array if no refunds)
