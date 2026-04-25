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
