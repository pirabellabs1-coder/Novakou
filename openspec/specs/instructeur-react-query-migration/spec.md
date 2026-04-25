## ADDED Requirements

### Requirement: Toutes les pages instructeur DOIVENT utiliser React Query pour le chargement de donnees
Les 14 pages qui utilisent encore `fetch()` manuel + `useState`/`useEffect` pour le chargement initial SHALL etre migrees vers les hooks React Query de `lib/formations/hooks.ts`. Les hooks manquants DOIVENT etre crees.

#### Scenario: Dashboard utilise useInstructorDashboard
- **WHEN** la page dashboard charge les donnees
- **THEN** elle utilise le hook `useInstructorDashboard(period)` au lieu d'un `useEffect` + `fetch()`

#### Scenario: Page mes-formations utilise useInstructorFormations
- **WHEN** la page mes-formations charge la liste des formations
- **THEN** elle utilise le hook `useInstructorFormations()` avec cache automatique et deduplication

#### Scenario: Page statistiques utilise useInstructorStats
- **WHEN** la page statistiques charge les stats
- **THEN** elle utilise le hook `useInstructorStats(period)` avec refetch automatique toutes les 60s

### Requirement: Les mutations DOIVENT invalider le cache React Query
Apres chaque mutation reussie (POST, PUT, DELETE), le frontend SHALL appeler `queryClient.invalidateQueries()` avec la cle appropriee pour rafraichir automatiquement les donnees affichees.

#### Scenario: Apres creation d'une formation
- **WHEN** l'instructeur cree une formation avec succes
- **THEN** le cache `instructorKeys.formations()` est invalide et la liste se met a jour automatiquement

#### Scenario: Apres toggle d'un popup
- **WHEN** l'instructeur active/desactive un popup
- **THEN** le cache `instructorKeys.popups()` est invalide et la liste reflète le nouvel etat

### Requirement: Les hooks manquants DOIVENT etre crees dans hooks.ts
Le fichier `lib/formations/hooks.ts` SHALL contenir des hooks pour tous les endpoints utilises par l'espace instructeur. Les hooks manquants identifes : `useInstructorPromotions`, `useInstructorPixels`, `useInstructorCohorts(formationId)`.

#### Scenario: Hook promotions disponible
- **WHEN** la page promotions a besoin de charger les promotions de l'instructeur
- **THEN** elle peut utiliser `useInstructorPromotions()` au lieu d'un fetch manuel

### Requirement: La double navigation inline DOIT etre supprimee
Les pages `mes-formations`, `apprenants` et `avis` qui definissent un composant `INSTRUCTOR_NAV` inline SHALL le supprimer car le layout fournit deja la navigation complete via la sidebar.

#### Scenario: Page mes-formations sans double navigation
- **WHEN** l'instructeur visite la page mes-formations
- **THEN** seule la sidebar du layout est visible (pas de barre de navigation horizontale en double)

### Requirement: La page modifier DOIT permettre l'edition du contenu
La page `[id]/modifier/page.tsx` SHALL permettre d'ajouter, modifier, supprimer et reordonner les sections et lecons d'une formation (parite avec le wizard de creation). Le champ thumbnail SHALL utiliser le composant `ImageUpload` au lieu d'un input texte.

#### Scenario: Ajout d'une lecon dans une section existante
- **WHEN** l'instructeur clique "Ajouter une lecon" sur la page modifier
- **THEN** un formulaire de lecon (video, texte ou quiz) s'ajoute dans la section concernee

#### Scenario: Upload de thumbnail
- **WHEN** l'instructeur modifie la miniature de sa formation
- **THEN** un composant d'upload avec preview s'affiche (pas un simple champ URL texte)

### Requirement: Les composants partages DOIVENT remplacer les duplications locales
Les pages `funnels/page.tsx`, `campagnes/page.tsx` et autres qui definissent des composants `StatCard` ou `EmptyState` locaux SHALL utiliser les composants partages `@/components/formations/StatCard` et `@/components/formations/EmptyState`.

#### Scenario: StatCard partage dans funnels
- **WHEN** la page funnels affiche des statistiques
- **THEN** elle utilise le composant `StatCard` importe de `@/components/formations/StatCard`

### Requirement: L'affichage des devises DOIT etre coherent
Toutes les pages SHALL afficher le symbole `€` au lieu de `EUR` pour les montants en euros. Le format DOIT etre `1 234€` (sans espace avant le symbole).

#### Scenario: Affichage du revenu total
- **WHEN** une page affiche un montant de 1500 euros
- **THEN** le format est `1 500€` (pas `1500EUR`)
