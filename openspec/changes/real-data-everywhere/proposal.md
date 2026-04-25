## Why

18+ API routes use dev-stores unconditionally (no `IS_DEV && !USE_PRISMA_FOR_DATA` gate), meaning they return empty/ephemeral data in production on Vercel. Critical routes like CinetPay payments, search, invoices, rank/badges, and service toggle are broken in prod. Additionally, hardcoded demo data (categories, notification settings, availability) is never loaded from the database.

**Version cible : MVP**

## What Changes

- Add `IS_DEV && !USE_PRISMA_FOR_DATA` dual-mode gate to all 18 fake-only API routes, with Prisma fallback
- Replace hardcoded `CATEGORIES` in CategoryBar with API-fetched categories (fallback to hardcoded list)
- Remove `DEMO_NOTIFICATION_SETTINGS` and `DEMO_AVAILABILITY` from dashboard store initial state; load from API
- Add Prisma path for `/api/invoices`, `/api/search`, `/api/rank`, `/api/admin/boosts`, `/api/admin/badges`, `/api/admin/users/search`
- Add Prisma path for `/api/payments/cinetpay`, `/api/webhooks/cinetpay`, `/api/services/[id]/toggle`
- Add Prisma path for `/api/cron/deadline-reminder`, `/api/contact`, `/api/downloads`
- Fix auth routes (`register`, `verify-email`, `setup-2fa`, `verify-2fa`) to use Prisma in production
- Remove unused empty arrays from `lib/demo-data.ts` (INVOICES, MONTHLY_REVENUE, etc.)

**Impact sur les autres roles :** Tous les espaces sont affectes (Public, Auth, Freelance, Client, Agence, Admin).

**Impact Prisma :** Aucune nouvelle table ou colonne requise — les tables existent deja. On ajoute seulement les queries Prisma manquantes.

## Capabilities

### New Capabilities
- `prisma-data-migration`: Adding Prisma fallback paths to all 18+ fake-only API routes and removing hardcoded demo data from stores/components

### Modified Capabilities
- None (no spec-level behavior changes — routes already exist, we're adding the production data path)

## Impact

- **API routes:** 18+ routes modified to add Prisma dual-mode gate
- **Stores:** `store/dashboard.ts` — remove hardcoded initial values for availability and notification settings
- **Components:** `CategoryBar.tsx` — fetch categories from API or use static fallback
- **Pages:** `dashboard/abonnement/page.tsx` — replace empty INVOICES import with API call
- **lib/demo-data.ts:** Clean up unused exports
- **Dependencies:** None new — Prisma already available in all routes
