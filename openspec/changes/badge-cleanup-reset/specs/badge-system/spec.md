# Badge System — Spec

## Overview
Système unifié d'attribution et d'affichage des badges pour les freelances et agences sur FreelanceHigh.

## Requirements

### R1: Fonction centralisée `computeBadges()`
- DOIT exister dans `apps/web/lib/badges.ts`
- DOIT accepter `{ role, plan, kyc, avgRating, completedOrders, createdAt }`
- DOIT retourner `string[]` en Title Case sans accents
- DOIT être la SEULE source de calcul de badges dans le codebase

### R2: Critères d'attribution
| Badge | Critères |
|-------|----------|
| Rising Talent | `createdAt` < 90 jours ET `completedOrders` ≥ 1 ET `avgRating` ≥ 4.0 |
| Top Rated | `avgRating` ≥ 4.0 ET `completedOrders` ≥ 3 |
| Elite | `avgRating` ≥ 4.5 ET `completedOrders` ≥ 10 |
| Verifie | `kyc` ≥ 3 |
| Pro | `plan` = "PRO" |
| Business | `plan` = "BUSINESS" |
| Agence | `role` = "agence" OU `plan` = "AGENCE" |

- Rising Talent est EXCLUSIF avec Top Rated et Elite (on prend le plus élevé sauf Rising Talent qui s'ajoute si le compte est récent)
- Un utilisateur PEUT avoir plusieurs badges (ex: "Elite" + "Verifie" + "Pro")

### R3: Format standardisé
- Format unique : Title Case sans accents
- Valeurs autorisées : `"Rising Talent"`, `"Top Rated"`, `"Elite"`, `"Verifie"`, `"Pro"`, `"Business"`, `"Agence"`, `"High Seller"`, `"Instructeur Certifie"`, `"Agence Verifiee"`
- Supprimer TOUTES les variantes UPPERCASE (`"ELITE"`, `"TOP RATED"`, `"RISING TALENT"`)
- Supprimer TOUTES les variantes accentuées (`"Vérifié"`, `"Agence Vérifiée"`)

### R4: BadgeDisplay unique
- Le composant `BadgeDisplay.tsx` DOIT être le seul composant d'affichage de badges
- Supprimer les doublons dans `BADGE_CONFIG` (garder seulement le format Title Case)
- Le profil public freelance DOIT utiliser `BadgeDisplay` au lieu de son propre `BADGE_CONFIG` local

### R5: APIs uniformisées
- `top-freelances/route.ts` DOIT utiliser `computeBadges()`
- `top-services/route.ts` DOIT utiliser `computeBadges()`
- `public/services/route.ts` DOIT utiliser `computeBadges()`
- `public/freelances/[username]/route.ts` DOIT utiliser `computeBadges()`
- Supprimer toutes les fonctions locales `buildBadgesList`, `buildBadgesListPrisma`, `buildBadges`, `pickTopBadge`

### R6: Profil public — supprimer duplication
- Supprimer le bloc "Commandes complétées" du sidebar (icône `work_history`)
- Garder uniquement dans la section stats circulaires (plus visible, plus riche)

### R7: Card landing — badge cohérent
- La card `TopFreelancesSection.tsx` DOIT afficher le badge via `BadgeDisplay` avec `maxDisplay={1}`
- Le badge sur la card DOIT être identique visuellement à celui du profil public
