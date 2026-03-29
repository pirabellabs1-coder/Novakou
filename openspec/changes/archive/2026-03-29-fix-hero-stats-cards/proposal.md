## Why

The landing page hero stats section has 3 bugs:
1. "Rejoignez-nous !" text appears instead of actual numbers when stats are < 10 (formatStatNumber returns null for low counts)
2. A 4th card "Pays couverts" was added but shouldn't be there — only 3 cards should show
3. Cards are misaligned due to the grid switching from 3 to 4 columns

The landing page is the first impression for visitors — these stats must show correct, real numbers.

## What Changes

### Bug Fixes
- **Remove "Pays couverts" card**: The StatsBar should only show 3 stat cards: Freelances actifs, Satisfaction client, Projets livrés
- **Fix "Rejoignez-nous !" fallback**: When stats are low (< 10), show the actual number instead of "Rejoignez-nous !". Even "3" is a valid stat for an early-stage platform.
- **Fix grid layout**: Change from `lg:grid-cols-4` to `lg:grid-cols-3` since we have 3 cards

### Files affected
- `apps/web/components/landing/StatsBar.tsx` — remove 4th card, fix grid, fix fallback display
- No API changes needed (the API already returns correct data)

## Capabilities

### Modified Capabilities
- `landing-stats`: Fix display of 3 stat cards with correct values, remove countries card

## Impact

- **Frontend only**: StatsBar.tsx component
- **No API changes**
- **No schema changes**
- **Visual regression**: Grid goes from 4 columns to 3 — better balanced layout
