## MODIFIED Requirements

### Requirement: Dual formationsRole registration is rejected across all auth flows
The system SHALL reject any attempt to register or log in with a formationsRole that conflicts with the user's existing formationsRole. This applies to credentials registration, OAuth registration, AND OAuth login.

#### Scenario: OAuth user tries to switch from apprenant to instructeur
- **WHEN** a user with `formationsRole=apprenant` initiates OAuth login with `pendingFormationsRole=instructeur`
- **THEN** the signIn callback SHALL reject the login
- **AND** the user SHALL be redirected to the formations login page with an error message explaining the conflict

#### Scenario: Credentials registration with conflicting role
- **WHEN** a user with `formationsRole=instructeur` tries to register via `/api/auth/register` with `formationsRole=apprenant`
- **THEN** the API SHALL return HTTP 409 with a clear error message

#### Scenario: OAuth user with no existing formationsRole
- **WHEN** a user with no `formationsRole` initiates OAuth login with `pendingFormationsRole=apprenant`
- **THEN** the signIn callback SHALL set `formationsRole=apprenant` and allow login

#### Scenario: OAuth user with same formationsRole
- **WHEN** a user with `formationsRole=apprenant` initiates OAuth login with `pendingFormationsRole=apprenant`
- **THEN** the signIn callback SHALL allow login without changes
