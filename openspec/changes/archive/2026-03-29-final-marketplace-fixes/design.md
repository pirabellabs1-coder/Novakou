## Context

The FreelanceHigh marketplace is deployed to production (Vercel) but has critical bugs and missing features across 7 areas:

1. **Admin Boosts page crash**: Missing stats fields → `.toLocaleString()` on undefined
2. **Dispute management broken**: UPPERCASE vs lowercase status + `partialPercent` not forwarded
3. **Wallet balance always 0**: Normal order completion never credits wallet
4. **Boost/SEO select dropdowns unreadable**: White background on dark theme = invisible text
5. **Plan separation missing**: Freelances see Empire (agency-only), agencies see freelance plans
6. **Plan restrictions not enforced**: Boost limit, candidature limit not checked
7. **Admin KYC broken**: Field mismatches between dev/Prisma paths

All fixes apply equally to freelances and agencies (both are "vendeurs" / sellers).

### Key files
- `apps/web/app/admin/boosts/page.tsx` + `app/api/admin/boosts/route.ts`
- `apps/web/app/admin/litiges/page.tsx` + `app/api/admin/disputes/route.ts`
- `apps/web/store/admin.ts`
- `apps/web/app/api/orders/[id]/route.ts`
- `apps/web/app/api/wallet/route.ts` + `app/api/finances/summary/route.ts`
- `apps/web/app/dashboard/boost/page.tsx` + `app/dashboard/services/seo/page.tsx`
- `apps/web/lib/plans.ts`
- `apps/web/app/dashboard/abonnement/page.tsx` + `app/agence/abonnement/page.tsx`
- `apps/web/app/admin/kyc/page.tsx` + `app/api/admin/kyc/route.ts`

## Goals / Non-Goals

**Goals:**
- Fix all 7 critical bugs above
- Separate plans by role: freelance sees Découverte/Ascension/Sommet, agency sees Agence Starter (20€)/Empire (65€)
- Add "Agence Starter" plan at 20€/mois
- Enforce plan limits (boost, candidature, commission) at API level
- Convert boost to budget-based model (min 5€) for both freelances and agencies
- Add boost capability to agency space
- Fix admin KYC data display

**Non-Goals:**
- Redesigning the boost tracking analytics system
- Adding new payment providers
- Implementing Stripe webhook integration for wallet credits
- Changing the dispute resolution financial logic
- Redesigning the subscription/billing flow with Stripe Billing

## Decisions

### 1. Status normalization: lowercase in API response
**Decision**: Normalize status to lowercase in API response mapping.
**Rationale**: API is the data boundary. All consumers get consistent data.

### 2. Wallet credit on order completion: inline in PATCH /api/orders/[id]
**Decision**: Add wallet credit in a Prisma transaction when status → TERMINE.
**Rationale**: Atomic, fast (<50ms), no need for BullMQ job.

### 3. Plan separation: filter plans by role in frontend
**Decision**: Add `PLAN_VISIBILITY` constant mapping roles → visible plan keys. Freelance page filters out EMPIRE/AGENCE_STARTER. Agency page filters out DECOUVERTE/ASCENSION/SOMMET.
**Rationale**: Plan definitions stay centralized in `lib/plans.ts`. Frontend simply filters. No API change needed since plan selection routes already validate against PLAN_RULES.

### 4. New "AGENCE_STARTER" plan
**Decision**: Add to `PLAN_RULES` in `lib/plans.ts`:
```
AGENCE_STARTER: {
  name: "Agence Starter",
  priceMonthly: 20,
  priceAnnual: 180,
  commissionType: "percentage",
  commissionValue: 5,
  serviceLimit: Infinity,
  applicationLimit: Infinity,
  boostLimit: 5,
  teamLimit: 5,
  crmAccess: true,
  cloudStorageGB: 10,
  apiAccess: false,
  supportLevel: "prioritaire",
}
```
**Rationale**: Agencies need a lower entry point than Empire (65€). 20€/mois with 5 members, 5% commission, basic CRM.

### 5. Boost budget model: replace tiers with budget input
**Decision**: Replace the 3-tier boost system (Starter/Premium/Ultime) with a single budget input field. Minimum 5€, no maximum. Duration calculated as `budget / costPerDay`. Frontend shows a simple input + duration estimate.
**Rationale**: More flexible, agencies and freelances decide their own investment. Simpler UI.
**Alternative rejected**: Keep tiers — too rigid, doesn't allow custom budgets.

### 6. Boost limit enforcement: API-level check
**Decision**: Before creating a boost, query count of active boosts this month for the user. Compare against `PLAN_RULES[plan].boostLimit`. Return 403 if exceeded.
**Rationale**: Frontend validation is insufficient (can be bypassed). API must be authoritative.

### 7. Select dropdown fix: dark background + explicit text color
**Decision**: Change `bg-primary/10` to `bg-neutral-dark` + add `text-white` on all `<select>` elements and their `<option>` children.
**Rationale**: Browser `<select>` options inherit OS/browser theme, not Tailwind. Must explicitly set `bg-neutral-dark text-white` on `<option>` elements.

### 8. KYC data normalization
**Decision**: Normalize KYC API response to always include consistent fields (`userId`, `name`, `email`, `role`, `requestedLevel`, `currentLevel`, `documentType`, `submittedAt`) regardless of dev/Prisma path.
**Rationale**: Frontend uses a fixed interface. API must conform.

## Risks / Trade-offs

- **Wallet credit without Stripe confirmation** → For DB-managed escrow, this is correct. When real Stripe payments are active, wallet should be triggered by webhook.
- **Plan enforcement at API only** → Frontend still needs to show limits for good UX, but API is the gate.
- **Boost budget model changes existing data** → Existing boosts with tier data will still work. New boosts use budget field.
- **New AGENCE_STARTER plan needs legacy mapping** → Add to `LEGACY_TO_NEW` map and `normalizePlanName` function.
