## Why

La plateforme FreelanceHigh affiche actuellement des statistiques gonflees et utilise des algorithmes deterministes pour les services et profils. Trois problemes critiques de credibilite et d'equite :

1. **Stats hero gonflees** : Le compteur "freelances actifs" affiche des milliers (ex: "25K+") car le dev-store accumule les utilisateurs de test. En production, le nombre serait realiste, mais le formatage `25K+` sur 5 vrais users serait trompeur. Il faut un affichage honnete et adaptatif.

2. **Algorithme de services deterministe** : Les services sponsorises/boostes apparaissent TOUJOURS en premier dans le marketplace (tri `isBoosted: desc, rating: desc`). Pas de rotation, pas d'equite de visibilite, pas de ponderation par performance reelle (CTR, conversions). Pareil pour la landing page : toujours les memes 6 services.

3. **Profils landing page statiques** : Les 3 memes freelances sont toujours affiches. Pas de rotation, pas de diversite de categories, pas de mise en avant des talents emergents.

## What Changes

### 1. Stats Hero — Donnees Reelles Uniquement

- Remplacer le formatage `25K+` par un affichage honnete : si 12 freelances, afficher "12" pas "0K+"
- Ajouter un seuil minimum : afficher le compteur brut si < 100, puis "100+" si >= 100, etc.
- En mode dev, s'assurer que les seed users sont realistes (pas d'inflation artificielle)
- Ajouter "pays couverts" calcule depuis les pays reels des users

### 2. Algorithme Sponsored Services (Marketplace Explorer)

- **Rotation equitable** : Les services boostes sont melanges aleatoirement dans les premiers resultats, pas toujours en position 1
- **Ponderation par performance** : CTR (clics/impressions), taux de conversion (commandes/clics), budget restant
- **Time decay** : Boost recent obtient un bonus de visibilite initial qui diminue progressivement
- **Seed aleatoire par session** : Chaque visiteur voit un ordre legerement different (cache 5min par IP/session)
- **Fair exposure** : Un boost ne peut pas monopoliser la position #1 — distribution proportionnelle au budget

### 3. Algorithme Landing Page — Services Populaires

- **Mix de 3 categories** : 2 services "top performers" (rating + orders), 2 services "trending" (recemment populaires), 2 services "sponsorises" (boostes actifs)
- **Rotation toutes les heures** : Seed temporel qui change pour varier les services affiches
- **Diversite de categories** : Maximum 2 services de la meme categorie dans le top 6
- **Filtre qualite** : Minimum 3 etoiles et 1 commande pour apparaitre

### 4. Algorithme Landing Page — Top Freelances

- **Rotation intelligente** : Pool des 20 meilleurs freelances, afficher 3 aleatoirement (weighted random)
- **Diversite de categories** : Pas 2 freelances de la meme specialite dans le meme affichage
- **Mix : Top Performers + Rising Talent** : 2 freelances confirmes + 1 "nouveau talent" (< 3 mois, bonnes premiers avis)
- **Badge "Rising Talent"** : Nouveau badge pour les freelances recents avec de bonnes evaluations

### 5. Verification Complete (30 points)

Audit complet de toutes les pages pour s'assurer qu'aucune donnee hardcodee ne pollue l'affichage. Verification de coherence entre dev mode et production mode.

## Capabilities

### New Capabilities
- `smart-ranking-algorithm`: Algorithme de classement intelligent avec rotation, performance, et equite
- `rising-talent-badge`: Badge "Rising Talent" pour les nouveaux freelances performants
- `fair-boost-rotation`: Distribution equitable des positions sponsorisees
- `hourly-seed-rotation`: Rotation horaire du contenu landing page

### Modified Capabilities
- `public-stats`: Stats hero basees sur donnees reelles avec formatage adaptatif
- `top-services-display`: Algorithme de selection avec mix performance/trending/sponsored
- `top-freelances-display`: Pool tournant avec diversite de categories
- `marketplace-search`: Integration de la rotation equitable des boosts dans les resultats

## Impact

- **API Routes affectees** : `/api/public/stats` (formatage), `/api/public/top-services` (algorithme), `/api/public/top-freelances` (algorithme), `/api/public/services` (sponsored rotation)
- **Frontend affecte** : `StatsBar.tsx` (formatage nombre), `PopularServicesSection.tsx` (mix categories), `TopFreelancesSection.tsx` (badges + rotation)
- **Schema changes** : Aucune migration Prisma necessaire — les champs existent deja (views, clicks, orderCount, rating, isBoosted, boostedUntil)
- **Performance** : Les algorithmes de scoring sont calcules cote serveur, pas de surcharge client. Le seed temporel utilise une hash rapide (pas de crypto).
- **Pas de breaking changes** : Les interfaces API restent identiques, seul l'ordre des resultats change
