## Why

La page d'accueil (`/`) affiche des statistiques incohérentes dans la section StatsBar :

- **"Projets livrés"** affiche "Rejoignez-nous!" au lieu d'un nombre, car `formatStatNumber()` retourne `null` pour les valeurs < 10 et il n'y a que 4 commandes terminées dans les seed data
- **"Freelances actifs"** affiche 20 (correct mais faible pour une démo convaincante)
- **"Satisfaction"** affiche 4.7/5 avec "8 avis" (correct mais trop peu pour la crédibilité)
- **"+X ce mois"** ne s'affiche jamais car aucun user seed n'a de `createdAt` en mars 2026

Ces chiffres donnent une impression de plateforme vide/cassée au lieu d'une marketplace active.

**Version cible :** MVP — la landing page est la première impression de la plateforme.

## What Changes

- **Enrichir les seed data** : ajouter des commandes `termine` pour atteindre 10+ projets livrés, ajouter des reviews pour atteindre 15+ avis, mettre quelques users avec `createdAt` en mars 2026
- **Baisser le seuil de `formatStatNumber`** : afficher les nombres dès 1 (pas 10) pour la section stats landing — en MVP, même un petit nombre est mieux qu'un placeholder
- **Afficher le nombre exact** dans StatsBar au lieu du placeholder "Rejoignez-nous!" quand le nombre est > 0

## Capabilities

### New Capabilities
_(aucune)_

### Modified Capabilities
- `seed-data`: Enrichir les données de démonstration avec plus de commandes terminées, plus de reviews et des users récents
- `dashboard-sync`: Pas de modification directe mais impact via les nouvelles seed data

## Impact

**Fichiers impactés :**
- `apps/web/lib/dev/data-store.ts` — ajouter des commandes `termine` et des reviews
- `apps/web/lib/dev/users.json` — mettre quelques `createdAt` en mars 2026
- `apps/web/lib/ranking.ts` — baisser le seuil de `formatStatNumber`
- `apps/web/components/landing/StatsBar.tsx` — afficher le nombre exact si > 0 au lieu du placeholder

**Pas d'impact Prisma, pas de job BullMQ, pas de template email**
