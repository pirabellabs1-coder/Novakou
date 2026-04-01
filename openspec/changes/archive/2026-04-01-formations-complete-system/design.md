## Context

The formations module has a comprehensive database schema (23 Prisma models), 55+ API routes, and 70+ frontend pages. However, the system operates in a dual-mode architecture where `IS_DEV` toggles between dev stores (mock data) and Prisma. Many routes were built with dev stores first and need to be migrated to real Prisma queries. The cart-to-enrollment pipeline has all the pieces but they aren't wired end-to-end. Stats on instructor/admin dashboards show hardcoded values instead of computed aggregations.

**Current state:**
- Models exist: Formation, Section, Lesson, Enrollment, CartItem, PromoCode, FormationFavorite, Certificate, FormationReview, LessonProgress
- Cart uses a simple `CartItem` model (userId + formationId, no Cart parent table with totals) — totals are computed on-the-fly
- Checkout creates a Stripe session but enrollment creation on webhook/verification may have gaps
- Formation stats (studentsCount, rating) are fields on the Formation model but may not be updated on enrollment/review creation
- Certificate generation exists (`certificate-generator.ts`) but auto-issuance on 100% completion may not be wired

## Goals / Non-Goals

**Goals:**
- All API routes use Prisma queries (no dev store fallback in production)
- Cart operations (add, remove, list, apply promo) work end-to-end with Prisma
- Checkout creates Stripe session → webhook/verify creates Enrollment → Formation stats update
- Lesson progress tracking updates enrollment progress % → 100% triggers certificate issuance
- Favorites toggle works with Prisma (add/remove/list)
- Instructor dashboard computes real stats from Prisma aggregations
- Admin dashboard shows real platform-wide stats
- TanStack Query cache invalidation ensures UI updates after mutations

**Non-Goals:**
- CinetPay Mobile Money integration for formations (Stripe only for MVP)
- Real-time WebSocket notifications for enrollment events (use polling/refetch)
- Email templates for purchase confirmation (can be added later)
- Advanced analytics (cohort analysis, churn prediction) — V3
- Video DRM or content protection — V2+
- Multi-currency pricing for formations — V1

## Decisions

### 1. Cart totals computed on-the-fly (no Cart parent table)

**Decision**: Keep the existing `CartItem` model (userId + formationId) without a parent Cart table. Compute subtotal, discount, and total in the API response.

**Rationale**: The schema uses `CartItem` with a unique constraint on `[userId, formationId]`. Adding a Cart parent table would require a migration and refactoring all existing cart routes. Computing totals on-the-fly is simpler and avoids data staleness (if a formation price changes, the cart total auto-updates).

**Alternative rejected**: Adding a Cart model with stored totals — adds complexity, requires keeping totals in sync.

### 2. Stats updated via Prisma middleware or inline in mutation handlers

**Decision**: Update Formation stats (studentsCount, totalRevenue) inline in the enrollment creation handler and review creation handler, using Prisma `update` with `increment`.

**Rationale**: Prisma middleware would fire on every Enrollment/Review create, including seed and admin operations. Inline updates give explicit control. The stats fields already exist on the Formation model.

**Alternative rejected**: Prisma middleware — too broad, fires on operations we don't want to count. Computed views — more complex, Prisma doesn't natively support computed columns.

### 3. Certificate auto-issuance in progress tracking endpoint

**Decision**: When the progress API marks the last lesson as complete (enrollment progress reaches 100%), check if `formation.hasCertificate` is true, and if so, create a Certificate record with a unique code. PDF generation happens lazily on first download.

**Rationale**: Generating PDFs on completion would slow the API response. Lazy PDF generation means the certificate record is created immediately (fast), and the PDF is generated only when the user requests download.

**Alternative rejected**: BullMQ async PDF generation — adds infrastructure dependency for MVP. Can upgrade to this in V2 if needed.

### 4. Promo code validation as a reusable service function

**Decision**: Create a `validatePromoCode(code, formationIds)` helper in `lib/formations/promo.ts` that validates all conditions (active, date range, usage limits, applicable formations) and returns the discount calculation. Used by both the promo validation endpoint and the checkout endpoint.

**Rationale**: DRY — promo validation logic is needed in multiple places (apply to cart, validate at checkout). A shared function ensures consistent validation.

### 5. TanStack Query invalidation strategy

**Decision**: After mutations (add to cart, purchase, mark lesson complete, add review), invalidate specific query keys rather than broad invalidation. Use `queryClient.invalidateQueries({ queryKey: ['cart'] })` etc.

**Rationale**: Targeted invalidation avoids unnecessary refetches. The existing hooks in `lib/formations/hooks.ts` already define query keys.

## Risks / Trade-offs

- **Race condition on stats increment**: Two concurrent enrollments could both read the same studentsCount and increment → one is lost. **Mitigation**: Use Prisma's atomic `increment` operator which translates to SQL `SET count = count + 1`.

- **Promo code usage count race**: Two users applying the same promo code simultaneously could exceed maxUsage. **Mitigation**: Use Prisma's atomic increment and check `usageCount < maxUsage` in a transaction.

- **Cart item price drift**: If a formation price changes between add-to-cart and checkout, the user pays the new price (since we compute on-the-fly). **Mitigation**: Show current price in cart with a note if it changed. For MVP, this is acceptable behavior.

- **Certificate PDF generation failure**: Lazy PDF generation could fail on download. **Mitigation**: Try-catch with retry, show error to user. The certificate record still exists even if PDF fails.

## Open Questions

- Should we store the price-at-time-of-purchase on CartItem (adding a `priceAtTime` field) to lock in the price when added to cart? For MVP, computing on-the-fly from Formation.price is simpler.
- Should the instructor receive an email notification when a new enrollment is created? Deferred to a follow-up change.
