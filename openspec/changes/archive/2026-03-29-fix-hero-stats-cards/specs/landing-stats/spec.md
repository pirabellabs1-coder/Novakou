## landing-stats

### Description
The StatsBar component shows 3 platform statistics below the hero: Freelances actifs, Satisfaction client, Projets livrés.

### Behavior
- Fetches stats from `/api/public/stats`
- Renders exactly 3 cards in a responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
- Shows actual numbers for all counts, even if < 10
- Shows "—" only while loading (before API responds)
- Shows "0" if the stat value is 0 after API responds
- No "Pays couverts" card
