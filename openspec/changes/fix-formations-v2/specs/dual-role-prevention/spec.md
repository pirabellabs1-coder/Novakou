## ADDED Requirements

### Requirement: Same email cannot register as both instructeur and apprenant
The registration endpoint must reject attempts to register with an email that already has a different formations role.

#### Scenario: Email already registered as apprenant, tries to register as instructeur
- **WHEN** A user with email X is already registered with `formationsRole=apprenant` and attempts to register again with `formationsRole=instructeur`
- **THEN** The API returns HTTP 409 with error message "Ce compte est deja enregistre en tant qu'apprenant. Vous ne pouvez pas etre instructeur et apprenant avec le meme email."

#### Scenario: Email already registered as instructeur, tries to register as apprenant
- **WHEN** A user with email X is already registered with `formationsRole=instructeur` and attempts to register again with `formationsRole=apprenant`
- **THEN** The API returns HTTP 409 with error message "Ce compte est deja enregistre en tant qu'instructeur. Vous ne pouvez pas etre instructeur et apprenant avec le meme email."

#### Scenario: Email not registered yet
- **WHEN** A new email registers with any formationsRole
- **THEN** The registration succeeds normally

#### Scenario: Same email, same role
- **WHEN** A user re-submits registration with the same email AND same formationsRole
- **THEN** The API returns the existing user (current behavior preserved)
