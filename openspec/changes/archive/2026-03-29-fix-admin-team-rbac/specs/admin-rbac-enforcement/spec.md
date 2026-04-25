## ADDED Requirements

### Requirement: JWT and session include adminRole
The NextAuth JWT callback SHALL extract `adminRole` from the database for users with `role === "admin"` and include it in the JWT token. The session callback SHALL propagate `adminRole` to `session.user.adminRole`.

#### Scenario: Admin logs in with moderateur role
- **WHEN** a user with `role: "admin"` and `adminRole: "moderateur"` logs in
- **THEN** the JWT SHALL contain `adminRole: "moderateur"` and `session.user.adminRole` SHALL equal `"moderateur"`

#### Scenario: Admin without adminRole field
- **WHEN** an admin user has no `adminRole` set in the database
- **THEN** the system SHALL default to `adminRole: "super_admin"` (backward compatibility for the platform founder)

### Requirement: Admin sidebar filters navigation by real role
The AdminSidebar component SHALL read `adminRole` from `useSession()` instead of the hard-coded `"super_admin"`. Navigation items SHALL only be visible if `hasPermission(adminRole, requiredPermission)` returns true.

#### Scenario: Moderateur sees limited navigation
- **WHEN** a moderateur views the admin sidebar
- **THEN** they SHALL only see: Dashboard, Services, Blog, Catégories, Audit Log
- **THEN** they SHALL NOT see: Utilisateurs, KYC, Litiges, Finances, Plans, Notifications, Configuration, Équipe

#### Scenario: Super admin sees all navigation
- **WHEN** a super_admin views the admin sidebar
- **THEN** they SHALL see all navigation items

### Requirement: API routes enforce RBAC with hasPermission
All admin API routes SHALL check the user's `adminRole` against the required permission using `hasPermission()`. If the user lacks the required permission, the API SHALL return 403 with message "Vous n'êtes pas autorisé à effectuer cette action. Rôle requis : [permission]".

#### Scenario: Moderateur tries to invite team member
- **WHEN** a moderateur calls `POST /api/admin/team` to invite a new member
- **THEN** the API SHALL return 403 because moderateur does not have `team.manage` permission

#### Scenario: Super admin invites team member
- **WHEN** a super_admin calls `POST /api/admin/team` to invite a new member
- **THEN** the API SHALL process the invitation normally

#### Scenario: Support tries to access finances
- **WHEN** a support admin calls `GET /api/admin/finances`
- **THEN** the API SHALL return 403 because support does not have `finances.view` permission

### Requirement: Team page actions restricted by permission
The admin team page (`/admin/equipe`) SHALL check the current user's `adminRole` and:
- If user has `team.manage`: show all action buttons (invite, edit role, remove)
- If user has `team.view` only: show the member list in read-only mode with a banner "Lecture seule"
- If user has neither: show "Accès non autorisé" warning page

#### Scenario: Moderateur views team page
- **WHEN** a moderateur navigates to `/admin/equipe`
- **THEN** they SHALL see the team list (has `team.view`)
- **THEN** they SHALL NOT see invite, edit, or remove buttons
- **THEN** a banner SHALL display "Lecture seule — votre rôle ne permet pas de gérer l'équipe"

#### Scenario: User without team.view
- **WHEN** a validateur_kyc navigates to `/admin/equipe`
- **THEN** the system SHALL display "Accès non autorisé — votre rôle [Validateur KYC] ne permet pas d'accéder à cette page"

### Requirement: Role selector excludes super_admin for non-super_admins
When editing a team member's role, the role dropdown SHALL NOT include `super_admin` unless the current user is themselves a `super_admin`.

#### Scenario: Super admin edits member role
- **WHEN** a super_admin opens the role editor for a team member
- **THEN** all roles SHALL be available including super_admin

#### Scenario: Non-super_admin edits member role (if they have team.manage)
- **WHEN** a non-super_admin with team.manage permission opens the role editor
- **THEN** super_admin SHALL NOT be in the dropdown

### Requirement: Unauthorized action shows warning
When an admin attempts an action they are not authorized for (via direct URL or API manipulation), the system SHALL display a clear warning message indicating their role and the required permission.

#### Scenario: Direct URL access to restricted page
- **WHEN** a support admin navigates directly to `/admin/finances`
- **THEN** the page SHALL display: "Accès non autorisé. Votre rôle Support ne permet pas d'accéder aux finances. Contactez un super administrateur si vous pensez que c'est une erreur."
