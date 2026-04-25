## ADDED Requirements

### Requirement: Dashboard syncs user plan from session

The dashboard layout (`/dashboard/layout.tsx`) SHALL read `session.user.plan` from NextAuth's `useSession()` hook and update the Zustand store's `currentPlan` field on mount.

The plan value SHALL be normalized using `normalizePlanName()` from `lib/plans.ts` to handle both legacy names (gratuit, pro, business, agence) and elevation names (decouverte, ascension, sommet, empire).

#### Scenario: Pro user loads dashboard
- **WHEN** a user with `session.user.plan = "ascension"` loads any `/dashboard/*` page
- **THEN** the store's `currentPlan` is set to `"ascension"` before any child component renders

#### Scenario: Legacy plan name in session
- **WHEN** a user has `session.user.plan = "pro"` (legacy name)
- **THEN** `normalizePlanName("pro")` returns `"ascension"` and the store is updated accordingly

#### Scenario: No session plan defaults to decouverte
- **WHEN** `session.user.plan` is undefined or null
- **THEN** the store's `currentPlan` remains `"decouverte"` (free tier default)

### Requirement: Productivity page respects synced plan

The productivity page (`/dashboard/productivite`) SHALL use the store's `currentPlan` (synced from session) to determine feature access. It SHALL NOT show the upgrade gate when the user has a qualifying plan.

#### Scenario: Pro user sees productivity features
- **WHEN** a user with plan "ascension" (Pro) visits `/dashboard/productivite`
- **THEN** the page displays the Pomodoro timer, activity journal, and work proof features (no upgrade gate)

#### Scenario: Free user sees upgrade gate
- **WHEN** a user with plan "decouverte" visits `/dashboard/productivite`
- **THEN** the page displays the upgrade CTA with Pro/Business plan options

### Requirement: Agency space also syncs plan

The agency layout (`/agence/layout.tsx`) SHALL apply the same plan sync pattern, reading `session.user.plan` and updating the agency store if applicable.

#### Scenario: Agency with starter plan
- **WHEN** an agency user with `session.user.plan = "agence_starter"` loads `/agence/*`
- **THEN** the store's plan is set to `"agence_starter"` and agency features are accessible
