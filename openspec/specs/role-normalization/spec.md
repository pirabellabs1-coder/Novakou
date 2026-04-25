# Spec: Admin Role Normalization

The session role must be normalized to lowercase so all admin route checks work consistently.

## Root cause
- Prisma stores role as UPPERCASE enum: "ADMIN", "FREELANCE", "CLIENT", "AGENCE"
- JWT callback sets `token.role = user.role` without lowercasing
- Admin routes check `session.user.role !== "admin"` (lowercase)
- Result: all admin routes return 403

## Fix
- In `lib/auth/config.ts` JWT callback: lowercase the role
- Additionally fix all admin route role checks to be case-insensitive as safety net
## MODIFIED Requirements

### Requirement: JWT plan claim normalization
The JWT callback in `lib/auth/config.ts` SHALL normalize the `plan` claim to the new elevation plan names.

The mapping SHALL be:
- DB value `GRATUIT` or legacy JWT `gratuit` → JWT claim `decouverte`
- DB value `PRO` or legacy JWT `pro` → JWT claim `ascension`
- DB value `BUSINESS` or legacy JWT `business` → JWT claim `sommet`
- DB value `AGENCE` or legacy JWT `agence` → JWT claim `empire`
- New values (`decouverte`, `ascension`, `sommet`, `empire`) → pass through unchanged

#### Scenario: New user gets new plan name in JWT
- **WHEN** a user with `plan: "GRATUIT"` in DB signs in
- **THEN** their JWT SHALL contain `plan: "decouverte"`

#### Scenario: Existing token with old plan name
- **WHEN** a JWT contains `plan: "pro"` from a previous session
- **THEN** `normalizePlanName("pro")` SHALL return `"ascension"` for all downstream checks
