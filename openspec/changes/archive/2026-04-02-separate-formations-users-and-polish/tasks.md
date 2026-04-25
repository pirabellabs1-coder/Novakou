## 1. Schema & Migration — registrationSource field

- [x] 1.1 Add `registrationSource String?` field to User model in `packages/db/prisma/schema.prisma`
- [x] 1.2 Run `pnpm --filter=@freelancehigh/db migrate:dev --name add-registration-source` to create the migration
- [x] 1.3 Write a data migration (in seed or separate script): update existing users with `formationsRole IS NOT NULL` AND `role = FREELANCE` AND no services → set `registrationSource = 'formations'` and `role = 'CLIENT'`

## 2. Registration — Fix formations inscription

- [x] 2.1 Update `formations/inscription/page.tsx`: change `role: "freelance"` to `role: "client"` in the register API call body
- [x] 2.2 Update `api/auth/register/route.ts`: when `formationsRole` is provided, set `registrationSource = "formations"` on the User record, and skip creation of FreelancerProfile/ClientProfile/AgencyProfile
- [x] 2.3 Update OAuth signIn callback in `lib/auth/config.ts`: when `pendingFormationsRole` is set for a NEW user, set `registrationSource = "formations"` and use `role = "client"` instead of the cookie-provided role. Skip profile creation.

## 3. Admin — Filter marketplace users from formation users

- [x] 3.1 Update `api/admin/users/route.ts`: add filter `registrationSource != 'formations'` (or IS NULL) to the Prisma query, so formation-only users don't appear in the marketplace admin
- [x] 3.2 Update `admin/utilisateurs/page.tsx`: ensure the role filter dropdown doesn't show formation-only roles. Add a subtle info badge showing "Marketplace users only"
- [x] 3.3 Update admin dashboard stats API (if it counts users by role) to exclude `registrationSource = 'formations'` users from freelance/client/agence counts

## 4. Formations Admin — User management

- [x] 4.1 Update `api/admin/formations/apprenants/route.ts`: include `registrationSource` in returned user data, and also count total formations users (not just enrollments)
- [x] 4.2 Update `formations/(admin)/admin/apprenants/page.tsx`: show a summary header with total formations users count, total enrollments, active learners, and instructors

## 5. Seed Data — Proper separation

- [x] 5.1 Update `packages/db/prisma/seed.ts`: formation-only demo users get `role: CLIENT`, `registrationSource: "formations"`, and `formationsRole: "apprenant"`. No FreelancerProfile for these users.
- [x] 5.2 Ensure marketplace demo users get `registrationSource: "marketplace"` (or leave null for backward compat)

## 6. Design Polish — FormationCard

- [x] 6.1 Refine FormationCard (`components/formations/FormationCard.tsx`): add a thin indigo/violet left accent border, improve shadow depth (default `shadow-sm`, hover `shadow-xl`), refine typography sizes and weights for better hierarchy
- [x] 6.2 Improve thumbnail section: add subtle gradient overlay at bottom for text contrast, refine badge positioning (category, bestseller, new, discount)
- [x] 6.3 Refine price display: make price more prominent with brand colors, improve the original price strikethrough styling
- [x] 6.4 Polish instructor section: better avatar circle styling, cleaner name display, consistent icon sizing

## 7. Design Polish — Formations Homepage

- [x] 7.1 Refine hero section in `formations/page.tsx`: update gradient to use brand colors (indigo-900 → violet-900 → indigo-950), improve search bar styling, refine CTA button gradients
- [x] 7.2 Polish stats block: use glassmorphism with brand tint, improve counter animations, add subtle border/glow effect
- [x] 7.3 Refine section headings: consistent styling across Featured, New, Top Rated sections — use brand underline accent, improve spacing between sections
- [x] 7.4 Polish category cards: brand-aligned left border colors, improve hover states, cleaner icon styling

## 8. Verification

- [x] 8.1 Run TypeScript compilation — fix any errors
- [x] 8.2 Run Prisma validate and generate
- [x] 8.3 Verify: register as formation apprenant → check NOT visible in /admin/utilisateurs → check visible in /formations/admin/apprenants
- [x] 8.4 Visual review: formations homepage and cards look polished and brand-consistent
