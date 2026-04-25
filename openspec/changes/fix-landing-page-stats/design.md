## Context

La StatsBar de la landing affiche 4 cartes : Freelances actifs, Satisfaction, Projets livrés, Pays couverts. Les données viennent de `GET /api/public/stats` qui en dev mode lit les stores JSON.

Problème : `formatStatNumber(n)` retourne `null` si `n < 10`, et le composant affiche alors "Rejoignez-nous!" (placeholder). Avec seulement 4 commandes terminées dans les seed data, "Projets livrés" est toujours un placeholder.

## Goals / Non-Goals

**Goals:**
- Toutes les 4 stats affichent des nombres réalistes et non des placeholders
- Les seed data sont suffisamment riches pour une démo convaincante (10+ projets, 15+ avis)
- Le badge "+X ce mois" s'affiche avec des données récentes

**Non-Goals:**
- Pas de gonflement artificiel des chiffres (rester honnête)
- Pas de changement de la logique production Prisma
- Pas de refactoring du composant StatsBar

## Decisions

### D1 : Afficher les nombres dès 1 dans StatsBar (vs garder seuil 10)

**Choix :** Modifier `formatStatNumber` pour retourner le nombre exact dès 1 au lieu de `null`.
**Rationale :** En MVP, "6 projets livrés" est bien mieux que "Rejoignez-nous!". Le seuil de 10 avait du sens pour une plateforme en production, pas pour une démo.

### D2 : Enrichir les seed data (vs fake data gonflés)

**Choix :** Ajouter 8+ commandes `termine` réalistes et 10+ reviews dans `getDefaultOrders()` et `getDefaultReviews()`.
**Rationale :** Des données seed riches montrent la plateforme en action. Chaque commande et review doit être réaliste (vrais noms, montants cohérents, dates chronologiques).

### D3 : Mettre quelques users en mars 2026 (vs ignorer le badge croissance)

**Choix :** Modifier 3-5 `createdAt` dans `users.json` pour mars 2026.
**Rationale :** Le badge "+X ce mois" ajoute du dynamisme à la landing. Coût minimal.

## Risks / Trade-offs

- **Seed data plus volumineuses** → Fichier `data-store.ts` grossit mais reste gérable
- **Seuil 1 pour formatStatNumber** → Les petits nombres ne sont plus cachés. Acceptable en MVP. En production, le seuil peut être remonté.
