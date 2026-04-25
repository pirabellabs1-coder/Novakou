## 1. Corrections critiques (crashes et endpoints manquants)

- [x] 1.1 Fix crash bouton "Reessayer" dans `marketing/page.tsx` : remplacer `setLoading`/`setError` inexistants par `refetch()` de React Query
- [x] 1.2 Fix crash bouton "Reessayer" dans `marketing/analytics/page.tsx` : meme correction
- [x] 1.3 Supprimer `Math.random()` dans `dashboard/page.tsx` : remplacer le fallback enrollmentsByMonth par un tableau vide + EmptyState
- [x] 1.4 Remplacer `MOCK_FORMATIONS`/`MOCK_PRODUCTS` dans `marketing/flash/page.tsx` par de vrais appels API vers `/api/instructeur/formations` et `/api/instructeur/produits`
- [x] 1.5 Creer la route `POST /api/instructeur/produits` dans `app/api/instructeur/produits/route.ts` (validation, association instructeur, retour 201)
- [x] 1.6 Ajouter `PUT` et `DELETE` dans `app/api/instructeur/produits/route.ts` (modification et archivage)
- [x] 1.7 Corriger l'endpoint POST dans `produits/creer/page.tsx` : `/api/produits` → `/api/instructeur/produits`
- [x] 1.8 Corriger l'endpoint DELETE dans `produits/page.tsx` : `/api/produits/${id}` → `/api/instructeur/produits?id=${id}`

## 2. Gestion d'erreur et etats

- [x] 2.1 Ajouter gestion d'erreur (try/catch + message + retry) dans `apprenants/page.tsx`
- [x] 2.2 Ajouter gestion d'erreur dans `avis/page.tsx` (actuellement erreur silencieuse)
- [x] 2.3 Ajouter try/catch + finally dans `fetchCohorts` de `[id]/cohorts/page.tsx` (loading infini en cas d'erreur)
- [x] 2.4 Afficher message "Cohorte introuvable" + lien retour dans `[id]/cohorts/[cohortId]/page.tsx` au lieu de `return null`
- [x] 2.5 Corriger gestion d'erreur sauvegarde dans `parametres/page.tsx` (catch vide → message d'erreur)
- [x] 2.6 Corriger gestion d'erreur retrait dans `marketing/affilies/tableau-de-bord/page.tsx`
- [x] 2.7 Ajouter le vrai appel API DELETE dans `handleDelete` de `funnels/page.tsx` (actuellement suppression uniquement locale)
- [x] 2.8 Corriger `campagnes/page.tsx` : annuler la suppression locale si l'API echoue
- [x] 2.9 Deplacer `router.replace()` dans un `useEffect` dans `produits/dashboard/page.tsx`

## 3. Migration React Query (14 pages)

- [x] 3.1 Creer hooks manquants dans `hooks.ts` : `useInstructorPromotions()`, `useInstructorPixels()`, `useInstructorCohorts(formationId)`
- [x] 3.2 Migrer `dashboard/page.tsx` vers `useInstructorDashboard(period)`
- [x] 3.3 Migrer `mes-formations/page.tsx` vers `useInstructorFormations()`
- [x] 3.4 Migrer `[id]/statistiques/page.tsx` vers `useInstructorFormationStats(id, period)`
- [x] 3.5 Migrer `apprenants/page.tsx` vers `useInstructorStudents()`
- [x] 3.6 Migrer `revenus/page.tsx` vers `useInstructorRevenue()`
- [x] 3.7 Migrer `avis/page.tsx` vers `useInstructorReviews()`
- [x] 3.8 Migrer `statistiques/page.tsx` vers `useInstructorStats(period)`
- [x] 3.9 Migrer `promotions/page.tsx` vers `useInstructorPromotions()`
- [x] 3.10 Migrer `marketing/pixels/page.tsx` vers `useInstructorPixels()`
- [x] 3.11 Ajouter `queryClient.invalidateQueries()` apres chaque mutation reussie dans les pages deja migrees qui utilisent encore des reloads manuels

## 4. Suppression double navigation et donnees fictives

- [x] 4.1 Supprimer le composant `INSTRUCTOR_NAV` inline dans `mes-formations/page.tsx`
- [x] 4.2 Supprimer le composant `INSTRUCTOR_NAV` inline dans `apprenants/page.tsx`
- [x] 4.3 Supprimer le composant `INSTRUCTOR_NAV` inline dans `avis/page.tsx`
- [x] 4.4 Corriger `const fr = true` → `const fr = locale === "fr"` dans `avis/page.tsx`
- [x] 4.5 Supprimer le calcul fictif `productPending = revenue * 0.5` dans `revenus/page.tsx` — utiliser une vraie donnee API ou afficher 0
- [x] 4.6 Supprimer le lien "Export PDF" vers route inexistante dans `[id]/statistiques/page.tsx`

## 5. Page modifier enrichie

- [x] 5.1 Ajouter l'editeur de sections/lecons dans `[id]/modifier/page.tsx` (reutiliser les composants du wizard creer)
- [x] 5.2 Remplacer l'input texte URL thumbnail par le composant `ImageUpload` dans `[id]/modifier/page.tsx`
- [x] 5.3 Ajouter le champ categorie dans le formulaire modifier

## 6. Harmonisation visuelle et composants partages

- [x] 6.1 Remplacer les `StatCard`/`MiniStatCard` locaux par le composant partage dans `funnels/page.tsx`
- [x] 6.2 Remplacer les `StatCard` locaux dans `campagnes/page.tsx`
- [x] 6.3 Remplacer les `EmptyState` locaux dans `funnels/page.tsx` et `funnels/creer/page.tsx`
- [x] 6.4 Corriger `EUR` → `€` dans `reductions/page.tsx`, `flash/page.tsx`, `funnels/page.tsx`
- [x] 6.5 Corriger les emojis Unicode dans `marketing/pixels/page.tsx` → icones Lucide
- [x] 6.6 Fix StatCard SVG IDs uniques (utiliser `useId()` ou `Math.random()` au montage)

## 7. i18n sidebar et breadcrumb

- [x] 7.1 Ajouter les traductions des subItems du sidebar dans les fichiers `messages/fr.json` et `messages/en.json`
- [x] 7.2 Modifier le layout.tsx pour utiliser `t()` au lieu de labels hardcodes dans les subItems
- [x] 7.3 Ameliorer le breadcrumb pour afficher le titre de la formation au lieu de l'UUID quand le segment est un ID dynamique

## 8. Implementations manquantes

- [x] 8.1 Implementer le handler CSV dans `revenus/page.tsx` (bouton "Telecharger CSV" sans action)
- [x] 8.2 Implementer la gestion d'erreur dans `updateStatus` de `[id]/cohorts/[cohortId]/page.tsx`
- [x] 8.3 Corriger `mes-formations/page.tsx` : ajouter try/catch dans `duplicateFormation` et `archiveFormation`
