## Why

The platform has critical stability issues causing a broken user experience: (1) space conflicts where navigating in the formations/apprenant area unexpectedly redirects to the client dashboard, (2) purchased formations disappear completely after logout/re-login because `ensureUserInDb` migrates seeded user emails causing orphaned enrollments, and (3) the certificate design doesn't match the FreelanceHigh branding. These bugs make the platform feel unreliable and must be fixed before any further feature work. Target: MVP.

## What Changes

### Session & Routing Stability
- Fix middleware to properly isolate the formations space from main app role-based routing — apprenant routes must never trigger client/freelance redirects
- Add all formations protected routes to middleware checks (currently only explicit prefixes are checked; any new page falls through to role-based routing)
- Ensure `formationsRole` is preserved in JWT token across sessions and on OAuth re-login

### Data Persistence on Re-login
- Fix `ensureUserInDb()` which renames existing user emails to `@migrated.dev`, orphaning all their enrollments, certificates, and progress
- Instead of migrating emails, reuse the existing DB user when email matches (update the ID reference or keep existing)
- Ensure seeded demo data remains accessible after logout/re-login cycle
- Add defensive checks in enrollment API to handle user ID inconsistencies gracefully

### Dual Registration Enforcement
- Block same-email registration as both instructeur AND apprenant (already partially implemented in register API)
- **BREAKING**: Add the same check to the OAuth flow (signIn callback) which currently allows formationsRole changes without validation
- Show clear error messages on formations login/register pages when role conflict occurs

### Certificate Branding Alignment
- Redesign certificate (PDF generator + detail page) to use FreelanceHigh brand colors (primary indigo/violet, accent gold) instead of current "Sovereign Gilt" ivory/gold palette
- Keep premium elements (guilloche borders, seal, QR code, 5-year validity) but align with site identity
- Remove score display, keep start date, completion date, and validity period

## Capabilities

### New Capabilities
- `session-stability`: Middleware routing isolation between formations space and main app spaces, JWT token consistency across login cycles
- `data-persistence-fix`: Fix `ensureUserInDb` email migration bug and ensure enrollments/certificates survive logout/re-login
- `certificate-branding`: Certificate PDF and detail page redesigned with FreelanceHigh brand identity

### Modified Capabilities
- `enrollment-lifecycle`: Enrollment data must persist across logout/re-login cycles — user ID mapping fix
- `role-normalization`: Dual registration (instructeur + apprenant) enforcement across all auth flows (credentials + OAuth)

## Impact

- **Middleware** (`apps/web/middleware.ts`): Refactor formations route matching to use a single prefix check instead of individual route lists
- **Auth config** (`apps/web/lib/auth/config.ts`): Fix OAuth signIn callback to reject dual formationsRole, preserve token consistency
- **ensureUserInDb** (`apps/web/lib/formations/ensure-user.ts`): Complete rewrite — stop email migration, reuse existing users by email match
- **Certificate generator** (`apps/web/lib/formations/certificate-generator.ts`): Brand color palette update
- **Certificate detail page** (`apps/web/app/formations/(apprenant)/certificats/[id]/page.tsx`): Brand color update
- **Certificate list page** (`apps/web/app/formations/(apprenant)/certificats/page.tsx`): Brand alignment
- **No Prisma schema changes** — all fixes are in application logic
- **No new BullMQ jobs or Socket.io handlers needed**
- **Impact on all roles**: Freelance/Client/Agence users who also use formations will benefit from stable routing; Admin impersonation unaffected
