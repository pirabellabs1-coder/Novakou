## 1. Middleware — Formations Space Isolation

- [x] 1.1 Refactor `middleware.ts` to use a catch-all guard for `/` protected routes instead of explicit prefix list. Define `FORMATIONS_PUBLIC_PATTERNS` (catalog, detail pages, checkout success) and `FORMATIONS_AUTH_ROUTES` (connexion, inscription). Any `/*` route not matching public or auth patterns SHALL require authentication.
- [x] 1.2 Ensure `/instructeur/*` still requires `formationsRole=instructeur` or `role=admin`
- [x] 1.3 Ensure `/admin/*` still requires `role=admin`
- [x] 1.4 Verify that the main app role-based routing (lines 258-276) is never reached by `/*` routes

## 2. Data Persistence — Fix ensureUserInDb

- [x] 2.1 Rewrite `ensureUserInDb` in `lib/formations/ensure-user.ts`: when email matches but ID differs, update the existing DB user's ID to match the dev-store ID using `prisma.$executeRawUnsafe` (since Prisma doesn't allow PK updates via normal API). Remove the email-renaming logic entirely.
- [x] 2.2 Wrap the ID update in a transaction to handle FK cascading properly
- [x] 2.3 Test the full cycle: seed DB → login with dev user → verify enrollments visible → logout → re-login → verify enrollments still visible

## 3. Auth — Dual Registration Enforcement

- [x] 3.1 In `lib/auth/config.ts` OAuth `signIn` callback (DEV_MODE branch): before updating `formationsRole`, check if existing user has a different `formationsRole`. If conflict, return `false` to reject login.
- [x] 3.2 In `lib/auth/config.ts` OAuth `signIn` callback (production branch): same check — if `existing.formationsRole` exists and differs from `pendingFormationsRole`, reject with `false` and store error in a redirect URL param.
- [x] 3.3 Update formations login page (`formations/connexion/page.tsx`) to display role conflict error from URL params (e.g., `?error=role_conflict`)
- [x] 3.4 Update formations inscription page (`formations/inscription/page.tsx`) to display the 409 error message clearly when dual registration is attempted

## 4. Certificate — Brand Alignment

- [x] 4.1 Update `lib/formations/certificate-generator.ts` color palette: replace ivory/gold/navy with indigo (`#6366f1`), violet (`#8b5cf6`), gold accent (`#d4a843`), near-white bg (`#fafafa`), deep indigo text (`#1e1b4b`). Add "FreelanceHigh" brand name in header.
- [x] 4.2 Update certificate detail page (`formations/(apprenant)/certificats/[id]/page.tsx`) to use the same brand color palette — indigo/violet borders, gold seal accent, clean white background
- [x] 4.3 Update certificate list page (`formations/(apprenant)/certificats/page.tsx`) to align card styling with brand colors
- [x] 4.4 Verify PDF download works after color changes (test `/api/formations/[id]/certificate`)

## 5. Verification & Cleanup

- [x] 5.1 Run TypeScript compilation (`pnpm --filter=@freelancehigh/web exec tsc --noEmit`) — fix any errors
- [x] 5.2 Test full flow: register as apprenant → buy formation → complete quiz → get certificate → logout → re-login → verify data persists
- [x] 5.3 Test space isolation: login as client role → navigate to formations → verify no redirect to /client
