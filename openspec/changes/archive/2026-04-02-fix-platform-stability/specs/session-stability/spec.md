## ADDED Requirements

### Requirement: Formations routes are isolated from main app role routing
The middleware SHALL treat all routes under `/` as a separate routing domain. A user with main app role `client` navigating formations apprenant pages SHALL NOT be redirected to `/client`. The formations space SHALL only enforce `formationsRole` checks, never `role` checks (except for `/admin` which requires `role=admin`).

#### Scenario: Client-role user browsing formations as apprenant
- **WHEN** a user with `role=client` and valid session navigates to `/mes-formations`
- **THEN** the middleware SHALL allow access without redirect (only authentication is required)

#### Scenario: Authenticated user on any formations protected route
- **WHEN** a user with valid session navigates to any route starting with `/` that is not public, auth, or instructeur-scoped
- **THEN** the middleware SHALL require authentication but NOT check main app `role`

#### Scenario: New formations page added without middleware update
- **WHEN** a developer adds a new page `/remboursement` or `/historique`
- **THEN** the middleware SHALL still protect it (require auth) because the catch-all guard covers all `/` non-public routes

### Requirement: Formations public routes remain accessible
The middleware SHALL allow unauthenticated access to formation catalog and detail pages.

#### Scenario: Unauthenticated user browsing formation catalog
- **WHEN** an unauthenticated user navigates to `/` or `/[slug]`
- **THEN** the middleware SHALL allow access without redirect

#### Scenario: Unauthenticated user accessing protected formation route
- **WHEN** an unauthenticated user navigates to `/mes-formations`
- **THEN** the middleware SHALL redirect to `/connexion`

### Requirement: JWT formationsRole persists across sessions
The `formationsRole` claim in the JWT token SHALL be loaded from the database on every login. It SHALL NOT be lost or reset to undefined when the user logs out and back in.

#### Scenario: User logs out and logs back in
- **WHEN** a user with `formationsRole=apprenant` logs out and logs back in with the same credentials
- **THEN** the JWT SHALL contain `formationsRole=apprenant`
