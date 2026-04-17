## Why

The formations module and the main marketplace are leaking into each other. Users who register through `/inscription` get `role: "freelance"` hardcoded, making them appear as freelancers in the marketplace admin panel — polluting user statistics and confusing the admin. Conversely, the main admin has no way to distinguish a real marketplace freelancer from a formation-only learner. Additionally, the formations homepage and card designs need a professional polish to match the quality expected of a premium learning platform. Target: MVP.

## What Changes

### User Separation — Formations vs Marketplace
- **BREAKING**: Formation-only registrations (`/inscription`) SHALL no longer set `role: "freelance"`. Instead, they'll set a new `role: "APPRENANT"` or use a `registrationSource` field to distinguish them
- The main admin user list (`/admin/utilisateurs`) SHALL exclude formation-only users (users with `formationsRole` set but no real marketplace activity)
- The formations admin (`/admin/apprenants`) already shows enrollments — add a proper "Users" tab showing all formations users
- Admin dashboard stats SHALL count marketplace users and formations users separately
- Registration from formations SHALL NOT create `FreelancerProfile`/`ClientProfile` records

### Admin Data Isolation
- Main admin API (`/api/admin/users`) SHALL filter out users whose ONLY purpose is formations (have `formationsRole` but never created a service, order, or project)
- Formations admin SHALL have its own user management showing `formationsRole`, enrollments count, certificates count
- Admin dashboard sidebar SHALL clearly separate "Marketplace" and "Formations" sections

### Design Polish — Formations Homepage & Cards
- Redesign the FormationCard component for a more premium, modern look (inspired by Udemy/Coursera level but unique to FreelanceHigh)
- Polish the formations homepage hero, category grid, and section layouts for a more professional feel
- Improve visual hierarchy, spacing, shadows, and micro-interactions on cards
- Ensure the overall aesthetic matches the FreelanceHigh brand (indigo/violet/gold palette)

## Capabilities

### New Capabilities
- `user-separation`: Clean separation between marketplace users and formation-only users in registration, admin views, and API queries
- `formations-design-polish`: Premium redesign of formations homepage, cards, and key UI components

### Modified Capabilities
- `seed-data`: Seed must create formation-only users separately from marketplace users
- `role-normalization`: Registration source tracking to distinguish marketplace vs formations users

## Impact

- **Prisma schema** (`packages/db/prisma/schema.prisma`): Add `registrationSource` field to User model (or a new `UserRole` enum value)
- **Register API** (`apps/web/app/api/auth/register/route.ts`): Track registration source, stop hardcoding `role: "freelance"` for formations users
- **Admin users API** (`apps/web/app/api/admin/users/route.ts`): Filter out formation-only users from marketplace admin
- **Admin utilisateurs page** (`apps/web/app/admin/utilisateurs/page.tsx`): Only show marketplace users
- **Formations admin** (`apps/web/app/formations/(admin)/admin/`): Add user management view
- **FormationCard** (`apps/web/components/formations/FormationCard.tsx`): Visual redesign
- **Formations homepage** (`apps/web/app/formations/page.tsx`): Design polish
- **Formations inscription** (`apps/web/app/formations/inscription/page.tsx`): Fix hardcoded `role: "freelance"`
- **Seed data** (`packages/db/prisma/seed.ts`): Separate formation-only users from marketplace users
- Requires Prisma migration for the new field
- No new BullMQ jobs, Socket.io handlers, or email templates needed
- Impacts Admin role (sees cleaner data), all formations roles (better UX), and marketplace roles (no pollution)
