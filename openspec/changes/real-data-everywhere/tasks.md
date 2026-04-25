## Tasks

### Group A: Critical Payment Routes (Priority: CRITICAL)
- [ ] A1: Add Prisma path to `/api/payments/cinetpay/route.ts`
- [ ] A2: Add Prisma path to `/api/webhooks/cinetpay/route.ts`

### Group B: Auth Routes (Priority: HIGH)
- [ ] B1: Add Prisma guard to `/api/auth/setup-2fa/route.ts`
- [ ] B2: Add Prisma guard to `/api/auth/verify-2fa/route.ts`
- [ ] B3: Add Prisma guard to `/api/auth/update-formations-role/route.ts`

### Group C: Search & Discovery (Priority: HIGH)
- [ ] C1: Add Prisma path to `/api/search/route.ts`
- [ ] C2: Add Prisma path to `/api/admin/users/search/route.ts`

### Group D: Finance Routes (Priority: HIGH)
- [ ] D1: Add Prisma path to `/api/invoices/route.ts`
- [ ] D2: Add Prisma path to `/api/invoices/[id]/pdf/route.ts`
- [ ] D3: Add Prisma path to `/api/downloads/route.ts`

### Group E: Admin Routes (Priority: HIGH)
- [ ] E1: Add Prisma path to `/api/admin/boosts/route.ts`
- [ ] E2: Add Prisma path to `/api/admin/badges/route.ts`

### Group F: Service & Misc Routes (Priority: MEDIUM)
- [ ] F1: Add Prisma path to `/api/services/[id]/toggle/route.ts`
- [ ] F2: Add Prisma path to `/api/rank/route.ts`
- [ ] F3: Add Prisma path to `/api/cron/deadline-reminder/route.ts`
- [ ] F4: Add Prisma path to `/api/contact/route.ts`

### Group G: Frontend Cleanup (Priority: HIGH)
- [ ] G1: Remove hardcoded `DEMO_NOTIFICATION_SETTINGS` and `DEMO_AVAILABILITY` from `store/dashboard.ts`
- [ ] G2: Replace `INVOICES` import in `dashboard/abonnement/page.tsx` with API fetch
- [ ] G3: Update CategoryBar to fetch from API with static fallback
- [ ] G4: Clean up unused exports in `lib/demo-data.ts`

### Group H: Error Fixes from Previous Audit (Priority: MEDIUM)
- [ ] H1: Fix remaining MEDIUM bugs from platform audit (client store guards, agency fixes, etc.)
