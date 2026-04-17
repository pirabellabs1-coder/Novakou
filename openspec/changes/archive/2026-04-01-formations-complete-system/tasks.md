## 1. Promo Code Validation Helper

- [x] 1.1 Create `lib/formations/promo.ts` with `validatePromoCode(code, formationIds)` function: check isActive, date range (expiresAt), usageCount < maxUsage, applicable formations (formationIds array or empty = all). Return `{ valid, discountPct, discountAmount, error }`.
- [x] 1.2 Add `computeCartTotals(items, promoCode?)` helper that calculates subtotal from formation prices, applies promo discount (PERCENTAGE or FIXED), returns `{ subtotal, discountAmount, total }`.

## 2. Cart API Routes (Prisma)

- [x] 2.1 Rewrite GET `/api/formations/cart` to use Prisma: fetch CartItems where userId = authenticated user, include Formation (title, slug, thumbnail, price, discount, level, duration, category), compute totals on-the-fly using `computeCartTotals`, return items + totals + itemCount.
- [x] 2.2 Rewrite POST `/api/formations/cart` to use Prisma: validate formationId exists and is ACTIF, check no duplicate CartItem (unique constraint), check no existing active Enrollment, create CartItem, return updated cart.
- [x] 2.3 Rewrite DELETE `/api/formations/cart` to use Prisma: delete CartItem by userId + formationId, return updated cart totals.
- [x] 2.4 Rewrite POST `/api/formations/cart/promo` to use Prisma + `validatePromoCode()`: validate code, store applied promo code ID in session/cookie or return it for client to persist, return updated cart with discount applied.
- [x] 2.5 Add DELETE `/api/formations/cart/promo` route to remove applied promo code.

## 3. Checkout & Payment Verification

- [x] 3.1 Rewrite POST `/api/formations/checkout` to use Prisma: fetch cart items, build Stripe Checkout Session with line items (formation title, price after discount), success_url with session_id param, cancel_url, return `{ sessionId, url }`.
- [x] 3.2 Rewrite POST `/api/formations/checkout/verify` to use Prisma: retrieve Stripe session, verify payment_status = 'paid', check for duplicate enrollments (idempotency by stripeSessionId), create Enrollment per cart item with paidAmount, increment Formation.studentsCount (atomic), increment PromoCode.usageCount if applicable, delete all CartItems for user.
- [x] 3.3 Add Stripe webhook handler (if not exists) for `checkout.session.completed` as backup enrollment creation path in case verify endpoint is not called.

## 4. Favorites API Routes (Prisma)

- [x] 4.1 Rewrite POST `/api/formations/favorites` as toggle: check if FormationFavorite exists for userId + formationId — if yes, delete it (return `isFavorite: false`), if no, create it (return `isFavorite: true`).
- [x] 4.2 Rewrite GET `/api/formations/favorites` to use Prisma: fetch all FormationFavorite where userId, include Formation details (title, slug, thumbnail, price, rating, studentsCount, category).
- [x] 4.3 Add `isFavorite` field to formation detail API response: check if authenticated user has a FormationFavorite for this formation.

## 5. Enrollment & Progress Tracking (Prisma)

- [x] 5.1 Rewrite GET enrolled formations endpoint to use Prisma: fetch Enrollments where userId, include Formation (title, thumbnail, category, sections with lessons count), include LessonProgress (completed count), include Certificate if exists. Compute progress percentage. Group by status (en cours / terminees).
- [x] 5.2 Rewrite POST `/api/formations/[id]/progress` to use Prisma: upsert LessonProgress (create or update completed/watchedPct), recalculate enrollment progress % = (completed lessons / total lessons) * 100, update Enrollment.progress field.
- [x] 5.3 Add auto-certificate logic to progress endpoint: after updating progress, if progress = 100 AND formation.hasCertificate = true AND no Certificate exists for this enrollment, create Certificate with unique code (CERT-YYYY-XXXXX format), update Enrollment.completedAt = now().

## 6. Stats Synchronization

- [x] 6.1 In checkout verify handler (task 3.2), after creating each Enrollment: atomically increment `Formation.studentsCount` by 1 using `prisma.formation.update({ where: { id }, data: { studentsCount: { increment: 1 } } })`.
- [x] 6.2 In reviews POST handler: after creating FormationReview, recalculate Formation.rating as AVG of all reviews and update Formation model. Use `prisma.formationReview.aggregate({ where: { formationId }, _avg: { rating: true }, _count: true })`.
- [x] 6.3 Rewrite instructor dashboard API to compute stats from Prisma: totalStudents = SUM(studentsCount) across instructor formations, totalRevenue = SUM(enrollment.paidAmount), averageRating = weighted AVG, recentEnrollments = latest 10.
- [x] 6.4 Rewrite instructor formation stats API: enrollment count, revenue SUM, review AVG, completionRate = COUNT(progress=100)/COUNT(*), enrollments grouped by month.
- [x] 6.5 Rewrite admin formations dashboard API: platform-wide stats (total formations, total students, total revenue, avg rating, top 5 formations, recent enrollments).

## 7. Formation Detail API (Prisma)

- [x] 7.1 Rewrite GET `/api/formations/[id]` to use Prisma: include sections with lessons (ordered), include instructor profile, include reviews (latest 10), compute totalDuration, totalLessons. Add `isEnrolled` + `enrollment` data if user is authenticated. Add `isFavorite` if user is authenticated.
- [x] 7.2 Ensure formation list/marketplace API uses Prisma: paginated query with filters (category, level, price range, rating, language, duration), include category, compute stats from Formation model fields (studentsCount, rating already pre-computed).

## 8. Certificate Generation

- [x] 8.1 Verify certificate generation in `lib/formations/certificate-generator.ts` works with real Prisma data: reads Certificate record, generates PDF with student name, formation title, completion date, certificate number, verification code.
- [x] 8.2 Rewrite GET `/api/formations/[id]/certificate` to use Prisma: find Certificate by enrollmentId, if pdfUrl exists return it, otherwise generate PDF and save pdfUrl.
- [x] 8.3 Verify GET `/api/formations/certificats/verify/[code]` uses Prisma: find Certificate by code, return details or 404.

## 9. Frontend Wiring & Cache Invalidation

- [x] 9.1 Update cart page (`/(apprenant)/panier`) to use TanStack Query hooks that call real Prisma-backed cart API. Ensure add/remove/promo apply mutations invalidate `['cart']` query key.
- [x] 9.2 Update formation detail page to show real `isEnrolled` and `isFavorite` state from API. Wire "Ajouter au panier" button to cart mutation. Wire "Ajouter aux favoris" button to favorites toggle mutation.
- [x] 9.3 Update enrolled formations page (`/(apprenant)/mes-formations`) to fetch from real Prisma-backed API. Show progress bars, certificate download links, "Continuer" buttons.
- [x] 9.4 Update instructor dashboard to fetch real stats from Prisma-backed API. Replace any hardcoded values with API data.
- [x] 9.5 Update admin formations dashboard to fetch real stats from Prisma-backed API.
- [x] 9.6 Ensure checkout success page (`/(paiement)/succes`) calls verify endpoint, shows purchased formations, provides "Commencer" links.

## 10. Seed Data & Testing

- [x] 10.1 Update seed.ts to create CartItems, PromoCode entries (active + expired), FormationFavorites for test users, ensuring end-to-end test data exists.
- [ ] 10.2 Manual end-to-end test: browse formations (real data) → add to cart → apply promo code → checkout (Stripe test mode) → verify enrollment created → view in "Mes formations" → mark lessons complete → certificate issued → verify certificate code.
- [ ] 10.3 Verify responsive layout on mobile (375px) and desktop (1024px+) for: cart page, formation detail, enrolled formations, instructor dashboard.
