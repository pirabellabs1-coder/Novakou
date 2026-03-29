## Context

The `StatsBar` component in `apps/web/components/landing/StatsBar.tsx` displays platform statistics below the hero section. It fetches from `/api/public/stats` and renders stat cards.

Current issues:
- 4 cards rendered (Freelances, Satisfaction, Projets, **Pays**) — should be 3
- Grid is `lg:grid-cols-4` — should be `lg:grid-cols-3`
- `formatStatNumber()` returns `null` for values < 10, causing fallback to "Rejoignez-nous !"
- For an early-stage platform, showing "3 freelances" is better than "Rejoignez-nous !"

### Key files
- `apps/web/components/landing/StatsBar.tsx`

## Goals / Non-Goals

**Goals:**
- Remove the "Pays couverts" (4th) card entirely
- Show actual numbers even when < 10 (e.g., "3", "7") instead of "Rejoignez-nous !"
- Fix grid to 3 columns on desktop
- Keep the card order: Freelances actifs → Satisfaction client → Projets livrés

**Non-Goals:**
- Changing the API response
- Adding animations or new visual elements
- Modifying the HeroSection component

## Decisions

### 1. Remove countries card
**Decision**: Delete the 4th card JSX block and remove `countriesCount` from the component.
**Rationale**: User explicitly requested removal. Only 3 stats needed for hero.

### 2. Show real numbers for low counts
**Decision**: Replace `formatStatNumber(n) ?? t("join_first")` with direct number display. For counts 0, show "0". For any positive count, show the actual number (or formatted if > 100).
**Rationale**: "Rejoignez-nous !" is confusing in a stats card. Even "3" is honest and builds trust.

### 3. Grid layout fix
**Decision**: Change `lg:grid-cols-4` to `lg:grid-cols-3`.
**Rationale**: 3 cards, 3 columns. Simple.

## Risks / Trade-offs

- Showing "3 freelances" may look small for a new platform, but it's more honest than "Rejoignez-nous !"
