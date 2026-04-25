## Why

L'espace instructeur du module formations contient **6 bugs critiques** (crashes, données fictives en production, endpoints manquants), **12 bugs fonctionnels graves** (fetch manuels sans gestion d'erreur, locale hardcodée, suppression non persistée), et **30+ problèmes de qualité** identifiés par un audit exhaustif. En l'état, un instructeur ne peut pas créer de produit numérique (endpoint POST manquant), voit des données aléatoires dans son dashboard (`Math.random()`), et rencontre des crashes sur les pages marketing. Ce change corrige **tous** les problèmes pour amener l'espace à 100% de fonctionnalité, fiabilité et cohérence visuelle. Version cible : **MVP**.

## What Changes

### Corrections critiques (6)
- Supprimer les appels à `setLoading`/`setError` inexistants dans `marketing/page.tsx` et `marketing/analytics/page.tsx` (crash au clic "Réessayer")
- Remplacer `Math.random()` par des données réelles ou un tableau vide dans `dashboard/page.tsx`
- Remplacer les `MOCK_FORMATIONS`/`MOCK_PRODUCTS` par de vrais appels API dans `marketing/flash/page.tsx`
- Créer la route `POST /api/instructeur/produits` et corriger l'endpoint dans `produits/creer/page.tsx`
- Corriger l'endpoint DELETE dans `produits/page.tsx` vers `/api/instructeur/produits`

### Corrections fonctionnelles (12)
- Migrer **14 pages** restantes de `fetch()` manuel vers les hooks React Query existants
- Corriger `const fr = true` → `const fr = locale === "fr"` dans `avis/page.tsx`
- Ajouter gestion d'erreur dans `apprenants/page.tsx`, `avis/page.tsx`, `cohorts/page.tsx`, `parametres/page.tsx`
- Ajouter le vrai appel API DELETE dans `handleDelete` de `funnels/page.tsx`
- Déplacer `router.replace()` dans un `useEffect` dans `produits/dashboard/page.tsx`
- Corriger `revenus/page.tsx` : remplacer le calcul fictif `productPending = revenue * 0.5`
- Supprimer la double navigation `INSTRUCTOR_NAV` inline dans `mes-formations/page.tsx`, `apprenants/page.tsx`, `avis/page.tsx`
- Ajouter un état d'erreur/retour quand une cohorte est introuvable dans `cohorts/[cohortId]/page.tsx`

### Améliorations qualité (16)
- Traduire les libellés hardcodés FR dans le sidebar layout (`subItems.label`)
- Ajouter l'éditeur de modules/leçons dans `[id]/modifier/page.tsx` (parité avec `creer/page.tsx`)
- Remplacer l'input texte URL par `ImageUpload` dans `[id]/modifier/page.tsx`
- Standardiser l'affichage des devises (`€` au lieu de `EUR`)
- Corriger les erreurs silencieuses dans les mutations marketing
- Utiliser le composant partagé `StatCard` au lieu des duplications locales
- Supprimer le lien "Export PDF" vers une route inexistante dans `[id]/statistiques/page.tsx`
- Implémenter le handler CSV dans `revenus/page.tsx`

### Harmonisation visuelle
- Corriger les emojis Unicode dans `marketing/pixels/page.tsx` → icônes Lucide
- Standardiser les hauteurs de fallback des éditeurs Markdown/Rich
- Assurer la cohérence des StatCard avec des IDs SVG uniques

## Capabilities

### New Capabilities
- `instructeur-api-products`: Route API POST/PUT/DELETE pour la gestion des produits numériques par l'instructeur
- `instructeur-error-handling`: Gestion cohérente des erreurs, états vides et retry sur toutes les pages instructeur
- `instructeur-react-query-migration`: Migration complète des 14 pages restantes vers React Query avec invalidation automatique

### Modified Capabilities
_(aucune spec existante dans openspec/specs/ à modifier)_

## Impact

- **API** : Nouvelle route `POST/PUT/DELETE /api/instructeur/produits` + corrections d'endpoints dans 3 pages
- **Schéma Prisma** : Aucun changement — les modèles `DigitalProduct` et marketing existent déjà
- **Pages modifiées** : ~25 fichiers dans `app/formations/(instructeur)/`
- **Composants modifiés** : `StatCard.tsx` (fix IDs SVG), layout.tsx (i18n sidebar)
- **Hooks** : `lib/formations/hooks.ts` — ajout de hooks manquants pour pixels, promotions, cohorts
- **Templates email / BullMQ / Socket.io** : Aucun impact
- **Impact sur les autres rôles** : Aucun — changements limités à l'espace instructeur formations
