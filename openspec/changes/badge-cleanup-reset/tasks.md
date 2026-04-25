# Tasks — badge-cleanup-reset

## Task 1: Créer la fonction centralisée `computeBadges()`
- [x] Consolider `apps/web/lib/badges.ts` avec une seule fonction exportée `computeBadges(params): string[]`
- [x] Paramètres : `{ role, plan, kyc, avgRating, completedOrders, createdAt }`
- [x] Implémenter les critères : Rising Talent, Top Rated, Elite, Verifie, Pro, Business, Agence
- [x] Retourner uniquement du Title Case sans accents
- [x] Exporter aussi un helper `computeTopBadge(params): string` qui retourne le badge le plus important (pour les cards avec `maxDisplay=1`)

## Task 2: Nettoyer `BadgeDisplay.tsx`
- [x] Supprimer les entrées dupliquées UPPERCASE dans `BADGE_CONFIG` (`"RISING TALENT"`, `"TOP RATED"`, `"ELITE"`)
- [x] Supprimer les entrées accentuées (`"Vérifié"`, `"Agence Vérifiée"`)
- [x] Garder uniquement les entrées Title Case sans accents
- [x] Vérifier que les icônes et couleurs sont correctes pour chaque badge

## Task 3: Migrer les APIs vers `computeBadges()`
- [x] `top-freelances/route.ts` : remplacer `pickTopBadge()` et logique locale par `computeBadges()`
- [x] `top-services/route.ts` : remplacer `buildBadges()` locale par `computeBadges()`
- [x] `public/services/route.ts` : remplacer `buildBadges()` locale par `computeBadges()`
- [x] `public/freelances/[username]/route.ts` : remplacer la logique badge locale par `computeBadges()`
- [x] Supprimer toutes les fonctions locales de calcul de badges (`buildBadgesList`, `buildBadgesListPrisma`, `buildBadges`, `pickTopBadge`)

## Task 4: Unifier les badges sur le profil public freelance
- [x] Dans `freelances/[username]/page.tsx` : supprimer le `BADGE_CONFIG` local
- [x] Utiliser le composant `BadgeDisplay` importé de `@/components/ui/BadgeDisplay`
- [x] S'assurer que les badges dans le header profil utilisent `BadgeDisplay`

## Task 5: Supprimer "Commandes complétées" du sidebar profil
- [x] Dans `freelances/[username]/page.tsx` : supprimer le bloc `work_history` / "Commandes complétées" du sidebar
- [x] Garder uniquement : location + membre depuis
- [x] Vérifier que "Commandes complétées" reste dans les stats circulaires

## Task 6: Card landing — utiliser BadgeDisplay standard
- [x] Dans `TopFreelancesSection.tsx` : remplacer le badge custom par `<BadgeDisplay>` avec wrapper blanc
- [x] S'assurer du contraste sur le fond gradient (wrapper blanc ajouté)

## Task 7: Reset complet des données dev
- [x] Supprimer tous les fichiers `*.json` dans `apps/web/lib/dev/`
- [x] `getDefaultUsers()` retourne seulement l'admin (déjà le cas)
- [x] Modifier `getDefaultServices()` pour retourner une liste vide
- [x] Modifier `getDefaultOrders()` pour retourner une liste vide
- [x] Modifier `getDefaultReviews()` pour retourner une liste vide
- [x] Cache vidé via suppression des JSON

## Task 8: Route admin reset Prisma
- [x] Créer `POST /api/admin/reset-data`
- [x] Supprimer dans l'ordre FK : reviews → escrows → adminTx → adminPayouts → walletTx → orders → boosts → serviceViews → serviceClicks → propositions → services → profiles → users (sauf admin)
- [x] Remettre à zéro AdminWallet
- [x] Retourner un résumé du nombre d'éléments supprimés

## Task 9: Vérification finale
- [x] Build + deploy Vercel
