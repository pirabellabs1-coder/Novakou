## 1. Fix Admin Boosts Page Crash

- [x] 1.1 In `/api/admin/boosts/route.ts` Prisma path: add `totalClicks` and `totalOrders` fields computed from `BoostDailyStat` aggregates (or 0 if table empty). Ensure stats object includes all 6 fields.
- [x] 1.2 In `admin/boosts/page.tsx`: add safe fallback `(safeStats.totalViews ?? 0).toLocaleString()` for all stat values. Fix field name mismatch — API returns `serviceName` but interface expects `serviceTitle`.
- [x] 1.3 Align `AdminBoost` interface with actual Prisma API response fields.

## 2. Fix Dispute Status Case Mismatch + PartialPercent

- [x] 2.1 In `/api/admin/disputes/route.ts` GET: lowercase `status` and `verdict` in response mapping: `status: d.status.toLowerCase()`, `verdict: d.verdict?.toLowerCase()`.
- [x] 2.2 In `store/admin.ts` `resolveDispute`: add `partialPercent` parameter and forward it in the API body.
- [x] 2.3 In `admin/litiges/page.tsx` `handleResolve`: pass `partialPercent` directly to `resolveDispute()` instead of embedding in resolution text.
- [x] 2.4 Verify tabs, stats, filters, examine, and verdict all work with lowercase values.

## 3. Add Dispute User Cancellation + 50/50 Settlement

- [x] 3.1 Create `/api/disputes/[id]/cancel/route.ts`: POST handler — check `session.user.id === dispute.clientId`, status is OUVERT, update to ANNULE, release escrow to freelance wallet, notify both parties.
- [x] 3.2 Create `/api/disputes/[id]/settle/route.ts`: POST handler for 50/50 — same auth check, update dispute to RESOLU with PARTIEL verdict + partialPercent 50, split funds.
- [x] 3.3 In `client/commandes/[id]/page.tsx`: add "Annuler le litige" and "Proposer un accord 50/50" buttons for dispute opener.

## 4. Fix Wallet Balance (Credit on Order Completion)

- [x] 4.1 In `/api/orders/[id]/route.ts` PATCH: when status → TERMINE, add Prisma transaction: upsert WalletFreelance (or WalletAgency if agencyId), create WalletTransaction ORDER_PAYOUT, update Escrow to RELEASED, confirm AdminTransaction. Include idempotency check.
- [x] 4.2 Handle agency orders: if `order.agencyId`, credit WalletAgency instead.
- [x] 4.3 Simplify `/api/wallet/route.ts` fallback: keep Order aggregate only as safety net for pre-fix orders.

## 5. Fix Select Dropdown Styling (Boost + SEO)

- [x] 5.1 In `dashboard/boost/page.tsx`: change `<select>` to `bg-neutral-dark text-white border border-border-dark`. Add `<option className="bg-neutral-dark text-white">` to all options.
- [x] 5.2 In `dashboard/services/seo/page.tsx`: same fix for the service selector.
- [x] 5.3 Verify both dropdowns are readable on dark theme.

## 6. Plan Separation (Freelance vs Agency)

- [x] 6.1 In `lib/plans.ts`: add `AGENCE_STARTER` plan to `PLAN_RULES` (20€/mois, 5% commission, 5 members, 5 boosts, 10GB, CRM access). Add to `PLAN_ORDER`, `PLAN_DISPLAY_NAMES`, `PLAN_FEATURES`, `LEGACY_TO_NEW`, `NEW_TO_DB`.
- [x] 6.2 In `lib/plans.ts`: add `PLAN_VISIBILITY` constant: `{ freelance: ["DECOUVERTE", "ASCENSION", "SOMMET"], agence: ["AGENCE_STARTER", "EMPIRE"] }`.
- [x] 6.3 In `dashboard/abonnement/page.tsx`: filter plans to only show `PLAN_VISIBILITY.freelance`. Remove Empire plan card.
- [x] 6.4 In `agence/abonnement/page.tsx`: filter plans to only show `PLAN_VISIBILITY.agence`. Show Agence Starter and Empire only.
- [x] 6.5 In `(public)/tarifs/page.tsx`: split plans into "Pour les Freelances" and "Pour les Agences" sections.

## 7. Plan Restriction Enforcement

- [x] 7.1 In boost creation API: check `canBoost(plan, monthlyBoostCount)` before creating. Return 403 with plan limit message if exceeded.
- [x] 7.2 In candidature/application API: check `canApply(plan, monthlyAppCount)` before allowing submission. Return 403 if exceeded.
- [x] 7.3 Verify commission calculation in `/api/orders/route.ts` correctly uses seller's plan (freelance OR agency owner's plan).

## 8. Boost Budget Model (Replace Tiers)

- [x] 8.1 In `dashboard/boost/page.tsx`: replace 3-tier selection with budget input field (min 5€). Show live preview of duration and estimated metrics.
- [x] 8.2 Update boost creation API call to send `budget` and `costPerDay` instead of `tier`.
- [x] 8.3 Add boost functionality to agency space: add "Booster" button on `agence/services/page.tsx` that opens a modal/page with the budget-based boost form.

## 9. Fix Admin KYC Data Display

- [x] 9.1 In `/api/admin/kyc/route.ts`: normalize response fields to consistent names (userId, name, email, role, currentLevel, requestedLevel, documentType, submittedAt) for both dev and Prisma paths.
- [x] 9.2 In `admin/kyc/page.tsx`: ensure field access matches normalized API response. Fix any undefined field displays.
- [x] 9.3 Verify KYC approve/reject works for both freelance and agency submissions.

## 10. Admin Plans Page

- [x] 10.1 Verify `/api/admin/config` returns plan data matching the updated PLAN_RULES (including AGENCE_STARTER).
- [x] 10.2 In `admin/plans/page.tsx`: display all 5 plans with correct editing capability.

## 11. Deploy & Verify

- [x] 11.1 Run `pnpm typecheck` to ensure no TypeScript errors.
- [x] 11.2 Test admin boosts page loads without crash.
- [x] 11.3 Test admin litiges: stats, filters, examine, resolve, verdict all work.
- [x] 11.4 Test wallet balance updates after order completion.
- [x] 11.5 Test plan pages: freelance sees 3 plans, agency sees 2 plans.
- [x] 11.6 Test boost creation respects plan limits.
- [ ] 11.7 Deploy to Vercel production.
