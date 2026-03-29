## Why

The marketplace has critical bugs and missing features preventing admin operations, freelancer/agency payments, plan enforcement, and boost UX from working correctly in production. These are the last blockers before the marketplace can be considered production-ready. All changes apply equally to freelances and agencies (both are "vendeurs").

## What Changes

### Bug Fixes
- **Fix admin boosts page crash**: API route returns stats object missing `totalClicks` and `totalOrders` fields; frontend calls `.toLocaleString()` on undefined values. Add missing fields + compute from BoostDailyStat aggregates in Prisma path.
- **Fix dispute status case mismatch**: API returns UPPERCASE Prisma enums (`OUVERT`, `EN_EXAMEN`, `RESOLU`) but frontend filters/stats compare lowercase (`ouvert`, `en_examen`, `resolu`). Normalize to lowercase in API response mapping.
- **Fix dispute `partialPercent` not forwarded**: The `resolveDispute` store function doesn't send `partialPercent` to the API. Admin slider adjustments are lost (always defaults to 50%).
- **Fix wallet balance always 0**: Normal order completion (`TERMINE` status) never credits `WalletFreelance` or `WalletAgency` table. Only dispute resolution writes to wallet. Add wallet credit on order completion.
- **Fix boost/SEO select dropdown white background**: `<select>` elements on boost and SEO pages use `bg-primary/10` without explicit text color, making options unreadable (white text on light background). Fix with dark background + white text.
- **Fix admin KYC page**: KYC details not loading correctly for freelance and agency submissions — field name mismatches between dev and Prisma paths, missing `/api/admin/kyc/details` endpoint.

### Plan Separation (Freelance vs Agency)
- **Freelances see only 3 plans**: Découverte, Ascension, Sommet. The "Empire" plan is hidden from freelances.
- **Agencies see only 2 plans**: A lower agency plan at 20€/mois + the Empire plan at 65€/mois. Agency plans include team management, CRM, and cloud storage features.
- **Add agency starter plan**: New "Agence Starter" plan at 20€/mois with reduced limits (5 members, 5 boosts/mois, 10GB storage, 5% commission).
- **Plan detection**: Ensure the platform correctly detects the user's role + plan from session/JWT and shows the right subscription page.

### Plan Restriction Enforcement
- **Boost limit enforcement**: Validate against plan's `boostLimit` before allowing boost creation. Currently not enforced.
- **Commission enforcement verification**: Ensure commission is correctly calculated based on the seller's (freelance OR agency) current plan at order creation time.
- **Candidature/application limit**: Enforce `applicationLimit` from plan rules when freelances submit candidatures.

### Boost Self-Service (Freelance + Agency)
- **Boost budget model**: Freelances and agencies choose their own budget starting from 5€ minimum. Remove tier-based pricing in favor of budget-based model.
- **Agency boost page**: Agencies currently have no boost functionality. Add boost access to the agency services page.

### Dispute User Actions
- **Dispute cancellation**: Allow the user who opened the dispute to cancel it.
- **50/50 settlement proposal**: Allow dispute opener to propose a 50/50 partial payment split.

## Capabilities

### New Capabilities
- `dispute-user-actions`: User who opened a dispute can cancel it or propose 50/50 partial payment
- `plan-separation`: Role-based plan visibility (freelance sees 3 plans, agency sees 2 plans) + new agency starter plan
- `boost-self-service`: Budget-based boost model (min 5€) for both freelances and agencies

### Modified Capabilities
- `dispute-flow`: Fix status case mismatch + partialPercent forwarding in existing dispute resolution
- `admin-data-persistence`: Fix boosts stats computation + plans config sync + KYC data flow
- `wallet-order-credit`: Credit freelance/agency wallet on normal order completion (not just dispute resolution)
- `service-boost-ui`: Fix select dropdown styling + add agency boost page + enforce boost limits

## Impact

- **API Routes affected**: `/api/admin/boosts` (stats computation), `/api/admin/disputes` (status lowercase + cancellation), `/api/orders/[id]` (wallet credit on completion), `/api/admin/config` (plans data), `/api/wallet` (wallet creation), `/api/admin/kyc` (field mapping), `/api/services` (boost limit check), `/api/subscription` (plan separation)
- **Frontend affected**: `admin/boosts/page.tsx` (safe fallback), `admin/litiges/page.tsx` (cancellation UI), `store/admin.ts` (partialPercent), `dashboard/boost/page.tsx` (select styling + budget model), `dashboard/services/seo/page.tsx` (select styling), `dashboard/abonnement/page.tsx` (hide Empire), `agence/abonnement/page.tsx` (show only agency plans), `agence/services/page.tsx` (add boost), `admin/kyc/page.tsx` (fix data display)
- **Schema changes**: Add new "AGENCE_STARTER" plan to `lib/plans.ts` PLAN_RULES. Possibly add `Dispute.cancelledByUserId` field.
- **Impact on all roles**: Admin (boosts, disputes, plans, KYC), Freelance (wallet, boost, plans, commissions), Agency (wallet, boost, plans, commissions), Client (dispute cancellation)
- **No BullMQ jobs or Socket.io handlers needed**
- **No new email templates needed** (notifications already exist in dispute flow)
