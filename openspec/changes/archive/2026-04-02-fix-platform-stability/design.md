## Context

FreelanceHigh has a dual-session architecture: the main app (roles: freelance/client/agence/admin) and the formations subsystem (roles: apprenant/instructeur). Both share the same NextAuth JWT session with different claims (`role` for main, `formationsRole` for formations). The middleware at `apps/web/middleware.ts` handles route protection for both systems.

**Current problems:**

1. **Middleware routing gap**: The formations route protection on line 197 explicitly lists individual route prefixes (`/mes-formations`, `/certificats`, etc.). Any new formations page NOT in this list falls through to the generic route check which enforces the main app `role` — causing a client-role user browsing formations to be redirected to `/client`.

2. **`ensureUserInDb` destroys data**: In DEV_MODE, auth uses a dev-store with IDs like `dev-admin-1`. When `ensureUserInDb()` finds an existing DB user by email (from seed), it renames their email to `{id}@migrated.dev` and creates a NEW user with the dev-store ID. This orphans all enrollments, certificates, and progress linked to the original seeded user.

3. **OAuth allows silent role override**: The OAuth `signIn` callback in auth config updates `formationsRole` without checking for conflicts, bypassing the dual-registration protection in the register API.

4. **Certificate uses non-brand colors**: Current "Sovereign Gilt" palette (ivory/gold/navy) doesn't match FreelanceHigh's brand identity (indigo/violet primary with warm accents).

## Goals / Non-Goals

**Goals:**
- Formations space routes are completely isolated from main app role-based routing
- User data (enrollments, certificates, progress) persists across logout/re-login in DEV_MODE
- Same email cannot hold both instructeur AND apprenant formationsRole
- Certificate design matches FreelanceHigh visual identity
- Zero Prisma schema changes — all fixes in application logic

**Non-Goals:**
- Fixing production auth (Supabase Auth) — only DEV_MODE affected by ensureUserInDb
- Redesigning the main app middleware for non-formation spaces
- Adding new features to the certificate (blockchain verification, etc.)
- Fixing unrelated formations bugs (quiz 404, etc.)

## Decisions

### Decision 1: Single prefix guard for all formations protected routes

**Choice**: Replace the explicit list of formation prefixes in middleware with a single `/` prefix check that classifies routes as public, apprenant-protected, instructeur-protected, or admin-protected.

**Approach**: Define a constant `FORMATIONS_PROTECTED_PREFIXES` that includes all apprenant-scoped route prefixes. Use a catch-all: any `/*` route not in the public/auth/instructeur/admin lists defaults to requiring authentication (apprenant-level). This prevents future routes from accidentally falling through.

**Alternative rejected**: Adding each new route manually to the middleware list — fragile, already caused the current bug.

### Decision 2: Rewrite ensureUserInDb to MERGE instead of MIGRATE

**Choice**: When a dev-store user ID doesn't match a DB user but the email matches, UPDATE the existing DB user's ID to match the dev-store ID instead of creating a new user and orphaning the old one.

**Approach**:
```
1. Check if user exists by dev-store ID → return if found
2. Check if user exists by email → if found, UPDATE their id to match dev-store ID
3. Only create new user if neither ID nor email match
```

This preserves all FK relationships (enrollments, certificates, progress) because Prisma IDs are referenced everywhere.

**Alternative rejected**: Creating a mapping table between dev IDs and DB IDs — too complex for DEV_MODE, and the real fix is just aligning the IDs.

### Decision 3: Enforce formationsRole exclusivity in OAuth signIn callback

**Choice**: Apply the same dual-registration check from the register API to the OAuth flow. If user already has formationsRole X and tries to register as Y, reject with error.

**Approach**: In the `signIn` callback, before updating formationsRole, check if the existing role conflicts. If so, return `false` (login rejected) or redirect with an error parameter.

### Decision 4: Certificate brand palette

**Choice**: Replace "Sovereign Gilt" palette with FreelanceHigh brand colors:
- Primary: `#6366f1` (indigo-500) — headers, seal
- Accent: `#8b5cf6` (violet-500) — borders, decorative elements
- Gold: `#d4a843` — retained for prestige elements (seal ring, certificate border)
- Background: `#fafafa` (near-white) — clean modern look
- Text: `#1e1b4b` (indigo-950) — deep indigo for readability

Keep premium elements (guilloche borders, seal, QR code, 5-year validity, start/completion dates). Add FreelanceHigh logo in header.

## Risks / Trade-offs

**Risk**: Updating user ID in ensureUserInDb may cause Prisma FK constraint violations if referenced tables use ON DELETE RESTRICT.
→ **Mitigation**: Prisma `User.id` is the parent — updating it requires raw SQL `UPDATE "User" SET id = $1 WHERE id = $2` since Prisma won't allow PK updates. We'll use `prisma.$executeRawUnsafe` with a transaction that also updates all FK references, OR we'll use Prisma's `@relation(onUpdate: Cascade)` which is already configured.

**Risk**: Catch-all formations route guard may block legitimate public formation pages (e.g., `/[slug]`).
→ **Mitigation**: Explicitly list public formation route patterns (the catalog, detail pages, checkout success) and ensure they're checked BEFORE the catch-all guard.

**Risk**: OAuth rejection for role conflicts may confuse users who just want to log in.
→ **Mitigation**: Store error code in URL params and display a clear message on the formations login page explaining the conflict.
