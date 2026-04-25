## 1. Fix StatsBar component

- [x] 1.1 In `components/landing/StatsBar.tsx`: remove the `countriesCount` variable and the entire 4th card block ("Pays couverts")
- [x] 1.2 Change grid class from `lg:grid-cols-4` to `lg:grid-cols-3`
- [x] 1.3 Fix freelances display: replace `formatStatNumber(freelanceCount) ?? t("join_first")` with direct number display — show `String(freelanceCount)` when > 0, "0" when 0
- [x] 1.4 Fix orders display: same pattern — show `String(completedOrders)` when > 0, "0" when 0
- [x] 1.5 Remove unused `countriesCount` from PlatformStats interface and destructuring
- [x] 1.6 Verify card order is: Freelances actifs → Satisfaction client → Projets livrés

## 2. Fix dispute verdict financial logic (dev mode)

- [x] 2.1 In Prisma path: update `freelancerPayout` on order when verdict="client" (set to 0) and verdict="partiel" (set to partial amount) so wallet fallback aggregation shows correct amounts
- [x] 2.2 Dev mode transactions already correct: client refund, partial split, full payout per verdict
- [x] 2.3 Verified dev mode `orderStore.update` sets correct `status` (client→annule, freelance→termine, partiel→termine)

## 3. Verify

- [x] 3.1 Run TypeScript check — no errors
- [x] 3.2 Visual check: 3 cards centered, real numbers showing, no "Rejoignez-nous !"
