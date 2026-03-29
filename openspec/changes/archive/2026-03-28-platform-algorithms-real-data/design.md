## Architecture

Ce change modifie exclusivement la couche API (routes Next.js) et les composants landing page. Aucune migration DB. Aucun nouveau modele.

### Composants touches

```
apps/web/
├── components/landing/
│   ├── StatsBar.tsx                  ← Formatage adaptatif
│   ├── PopularServicesSection.tsx    ← Badge "Trending"
│   └── TopFreelancesSection.tsx      ← Badge "Rising Talent"
├── app/api/public/
│   ├── stats/route.ts               ← Stats reelles
│   ├── top-services/route.ts        ← Algo mix + rotation
│   ├── top-freelances/route.ts      ← Algo pool + diversite
│   └── services/route.ts            ← Sponsored rotation
└── lib/
    └── ranking.ts                    ← (NEW) Fonctions de scoring partagees
```

## Design Decisions

### D1: Formatage Adaptatif des Stats

**Approche retenue** : Seuils progressifs honnetes

```
0-99       → affiche le nombre exact : "12"
100-999    → arrondi bas : "100+" / "500+"
1000-9999  → "1K+" / "5K+"
10000+     → "10K+" / "25K+"
```

Quand `freelances < 10`, afficher "Rejoignez nos premiers membres" au lieu d'un nombre embarrassant.

**Rejet** : Afficher toujours le nombre brut (ex: "3 freelances actifs" serait demotivant pour un visiteur).

### D2: Rotation Equitable des Boosts (Marketplace)

**Approche retenue** : Weighted Random Shuffle avec seed temporel

```typescript
// Pseudo-code
function rankServices(services, seed) {
  const boosted = services.filter(s => s.isBoosted);
  const regular = services.filter(s => !s.isBoosted);

  // Score chaque service booste par sa performance
  const scoredBoosted = boosted.map(s => ({
    ...s,
    boostScore:
      (s.boostBudget / maxBudget) * 0.3 +           // 30% budget
      (s.boostCTR ?? 0.01) * 0.3 +                   // 30% CTR
      (s.boostConversion ?? 0) * 0.2 +               // 20% conversion
      timeDecayFactor(s.boostedSince) * 0.2           // 20% recency
  }));

  // Weighted random: position proportionnelle au score
  const shuffledBoosted = weightedShuffle(scoredBoosted, seed);

  // Intercaler: max 1 boosted par tranche de 4
  return interleave(shuffledBoosted, regular, ratio=1/4);
}
```

**Seed** : `hash(heure_arrondie_5min + page_number)` — meme visiteur voit meme ordre pendant 5 min, mais ca tourne.

**Rejet** : Randomisation pure (les gros budgets n'auraient pas plus de visibilite que les petits).

### D3: Algorithme Landing Page Services

**Approche retenue** : Mix categorise avec rotation horaire

```
6 slots = 2 "Top Performers" + 2 "Trending" + 2 "Sponsored"

Top Performers (slots 1, 4):
  score = rating * 0.4 + orders * 0.35 + reviews * 0.25
  Filtre: rating >= 3.5, orders >= 1

Trending (slots 2, 5):
  score = views_7j * 0.3 + orders_7j * 0.4 + rating * 0.3
  Filtre: cree il y a > 7j, au moins 1 vue cette semaine

Sponsored (slots 3, 6):
  score = boost_budget * 0.4 + CTR * 0.3 + rating * 0.3
  Filtre: isBoosted = true

Diversite: max 2 services de la meme categorie
Rotation: seed = hash(heure_courante) → change toutes les heures
```

**Rejet** : Afficher uniquement par score global (pas de diversite, les memes categories dominent toujours).

### D4: Pool Tournant Top Freelances

**Approche retenue** : Pool de 20, selection ponderee de 3 avec diversite

```
Pool = top 20 freelances par score
Selection = weighted random pick de 3 parmi le pool
  - Poids = score * (1 + rising_bonus)
  - rising_bonus = 0.3 si < 3 mois et rating >= 4.0

Contraintes:
  - 3 categories differentes obligatoires
  - Au moins 1 freelance avec badge (TOP RATED ou ELITE)
  - Rotation: seed = hash(heure_courante) → change toutes les heures
```

### D5: Nouveau Badge "Rising Talent"

**Criteres** :
- Compte cree il y a < 90 jours
- Au moins 1 commande terminee
- Rating moyen >= 4.0
- Au moins 1 avis

Affiche un badge vert "Rising Talent" sur le profil et les cartes landing page.

## Fichier Partage: lib/ranking.ts

Centralise les fonctions de scoring pour eviter la duplication entre les routes API :

```typescript
export function serviceScore(s: ServiceData): number
export function freelanceScore(f: FreelanceData): number
export function boostScore(b: BoostData): number
export function timeDecay(createdAt: Date, halfLifeDays: number): number
export function hourlyHash(salt?: string): number  // Seed deterministe par heure
export function weightedRandomPick<T>(items: T[], weights: number[], count: number, seed: number): T[]
export function enforceCategoryDiversity<T extends { category: string }>(items: T[], maxPerCategory: number): T[]
```

## Edge Cases

1. **Aucun service booste** : Les slots "Sponsored" sur la landing sont remplaces par des "Top Performers" supplementaires
2. **Moins de 6 services actifs** : Afficher ce qui existe, pas de padding avec du vide
3. **Aucun freelance** : Section masquee (deja le cas — `freelances.length === 0`)
4. **Nouveau boost sans historique** : CTR default = 0.01 (1%), conversion default = 0 — le budget et la recence dominent
5. **Meme freelance multiple categories** : Prendre sa categorie principale (premier service actif)
