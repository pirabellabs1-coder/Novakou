## 1. Create Shared Ranking Library (lib/ranking.ts)

- [x] 1.1 Create `lib/ranking.ts` with: `serviceScoreTopPerformers()`, `serviceScoreTrending()`, `boostScore()`, `freelanceScore()`, `isRisingTalent()`, `timeDecay()`.
- [x] 1.2 Add `hourlyHash(salt)` — DJB2 hash of `floor(Date.now()/3600000):salt`. Returns unsigned 32-bit int.
- [x] 1.3 Add `seededRandom(seed)` — simple LCG PRNG returning 0-1 floats. Deterministic per seed.
- [x] 1.4 Add `weightedRandomPick(items, weights, count, seed)` — select `count` items with probability proportional to weights.
- [x] 1.5 Add `enforceCategoryDiversity(items, maxPerCategory)` — reorder to cap category repeats.
- [x] 1.6 Add `interleave(boosted, regular, ratio)` — merge boosted services every Nth position.

## 2. Fix Stats Hero — Real Numbers Only

- [x] 2.1 In `StatsBar.tsx`: replace `formatNumber()` with new `formatStatNumber()`: < 10 shows motivational CTA ("Rejoignez les premiers !"), 10-99 exact, 100+ progressive rounding.
- [x] 2.2 In `StatsBar.tsx`: add 4th stat card "Pays couverts" fetched from API (count distinct countries from active users).
- [x] 2.3 In `/api/public/stats/route.ts`: add `countriesCount` field — DEV: count distinct `country` from active users, Prisma: `SELECT COUNT(DISTINCT country)`.
- [x] 2.4 Verify StatsBar shows "—" gracefully while loading, not "0" or "0K+".

## 3. Landing Page Top Services — Mix Algorithm

- [x] 3.1 In `/api/public/top-services/route.ts`: split scoring into 3 pools: "topPerformers" (2), "trending" (2), "sponsored" (2).
- [x] 3.2 TopPerformers pool: use `serviceScoreTopPerformers()`, filter `rating >= 3.5 AND orderCount >= 1`, take top 2.
- [x] 3.3 Trending pool: score by `views_7days * 0.3 + orders_7days * 0.4 + rating * 0.3`. For DEV: use total views/orders as proxy. For Prisma: count ServiceView/Order where createdAt >= now - 7 days.
- [x] 3.4 Sponsored pool: filter `isBoosted = true`, score with `boostScore()`, take top 2. If fewer than 2 boosts, fill with TopPerformers.
- [x] 3.5 Apply `enforceCategoryDiversity(merged, 2)` — max 2 services per category.
- [x] 3.6 Apply `hourlyHash("services")` as seed for weighted random within each pool — rotation horaire.
- [x] 3.7 Add optional `?pool=trending|top|sponsored` query param for debugging/admin.

## 4. Landing Page Top Freelances — Pool + Diversity

- [x] 4.1 In `/api/public/top-freelances/route.ts`: build pool of top 20 freelances by `freelanceScore()`.
- [x] 4.2 Apply Rising Talent bonus: `isRisingTalent()` adds 30% weight bonus.
- [x] 4.3 Use `weightedRandomPick(pool, scores, 3, hourlyHash("freelances"))` to select 3.
- [x] 4.4 Enforce category diversity: 3 selections must have 3 different primary categories (fallback: relax if not enough diversity in pool).
- [x] 4.5 Ensure at least 1 badged freelance (TOP RATED or ELITE) in the selection, if any exist in pool.
- [x] 4.6 Add "RISING TALENT" badge assignment in response: `badge: isRisingTalent ? "RISING TALENT" : ...`

## 5. TopFreelancesSection — Rising Talent Badge UI

- [x] 5.1 In `BadgeDisplay.tsx`: add RISING TALENT badge (green, sparkle icon), ELITE (gold), TOP RATED (amber), with uppercase variants for API compatibility.
- [x] 5.2 Add `badges` array support (a freelance can have multiple: ["RISING TALENT", "Verifie"]).

## 6. Marketplace Sponsored Rotation

- [x] 6.1 In `/api/public/services/route.ts`: when `sort === "pertinence"` (default), split services into boosted and non-boosted.
- [x] 6.2 Score boosted services with `boostScore()`. Apply `weightedShuffle` with `hourlyHash("explorer:" + page)` as seed.
- [x] 6.3 Interleave: insert 1 boosted service in position 2, then every 4 positions. Max 1-2 in first view, rest spread naturally.
- [x] 6.4 Non-boosted services sorted by: `(rating/5) * 0.4 + min(orderCount/100,1) * 0.35 + min(views/500,1) * 0.25`.
- [x] 6.5 Add `isSponsored: true` flag on interleaved boosted services for frontend badge display.
- [x] 6.6 Keep existing sort options (prix_asc, prix_desc, note, nouveau, populaire) unchanged — rotation only applies to "pertinence".

## 7. Boost Order/Contact Tracking (Gap Fix)

- [x] 7.1 In `/api/orders/route.ts` POST: when creating an order for a boosted service, increment `BoostDailyStat.orders` and `Boost.actualOrders` for today's active boost.
- [x] 7.2 In `/api/propositions/route.ts`: when a proposition is sent to a boosted service, increment `BoostDailyStat.contacts` and `Boost.actualContacts`.

## 8. Verification Complete (30 Points)

- [x] 8.1 `pnpm typecheck` passe sans erreur.
- [x] 8.2 Landing page loads: StatsBar shows real freelance count (not inflated).
- [x] 8.3 Landing page: Top Services section shows mix of categories (not all same category).
- [x] 8.4 Landing page: Top Freelances shows diverse profiles.
- [x] 8.5 Landing page: Refresh after 1 hour shows different selection (rotation).
- [x] 8.6 Explorer page: default sort mixes sponsored services at positions 2, 6, 10.
- [x] 8.7 Explorer page: sort by prix/note/nouveau still works deterministically.
- [x] 8.8 Explorer page: "Sponsorise" badge shown on boosted services.
- [x] 8.9 Dashboard boost page: activating a boost works (unchanged).
- [x] 8.10 Admin boosts page: loads without crash, shows correct stats (from final-marketplace-fixes).
- [x] 8.11 Admin litiges page: status filters work lowercase (from final-marketplace-fixes).
- [x] 8.12 Admin KYC page: data loads correctly (from final-marketplace-fixes).
- [x] 8.13 Admin plans page: shows all 5 plans (from final-marketplace-fixes).
- [x] 8.14 Dashboard abonnement: shows only freelance plans 3 (from final-marketplace-fixes).
- [x] 8.15 Agence abonnement: shows only agency plans 2 (from final-marketplace-fixes).
- [x] 8.16 Tarifs page: split freelance/agence sections (from final-marketplace-fixes).
- [x] 8.17 Client commandes detail: dispute cancel/settle buttons (from final-marketplace-fixes).
- [x] 8.18 Wallet: balance updates after order completion (from final-marketplace-fixes).
- [x] 8.19 Boost/SEO dropdowns: readable on dark theme (from final-marketplace-fixes).
- [x] 8.20 Agence services: boost button present (from final-marketplace-fixes).
- [x] 8.21 Candidature submission: respects plan application limit (from final-marketplace-fixes).
- [x] 8.22 Boost activation: respects plan boost limit (from final-marketplace-fixes).
- [x] 8.23 Order commission: calculated from seller's plan (from final-marketplace-fixes).
- [x] 8.24 No hardcoded "25000" or inflated stats anywhere — formatStatNumber() handles honestly.
- [x] 8.25 Rising Talent badge renders correctly via BadgeDisplay.
- [x] 8.26 Category diversity enforced on landing page services (enforceCategoryDiversity).
- [x] 8.27 API `/api/public/stats` returns `countriesCount` field.
- [x] 8.28 Mobile responsive: StatsBar grid is 2-col sm, 4-col lg.
- [x] 8.29 Dark mode: all new elements use dark theme classes.
- [x] 8.30 No TypeScript `any` types introduced (only kept existing eslint-disable in services route).
