## ADDED Requirements

### Requirement: L'instructeur SHALL pouvoir voir les analytiques step-by-step d'un funnel
Un panel d'analytiques SHALL s'ouvrir quand l'instructeur clique sur un funnel dans la liste. Ce panel SHALL afficher les données provenant de `GET /api/marketing/funnels/[id]/events` : nombre de vues, clics, achats, skips, taux de conversion et taux de drop-off par étape.

#### Scenario: Ouverture du panel analytiques
- **WHEN** l'instructeur clique sur l'icône analytiques d'un funnel avec du trafic
- **THEN** un panel latéral s'ouvre avec un graphique en barres montrant vues/clics/achats par étape, le taux de drop-off entre chaque étape, et le revenu total

#### Scenario: Funnel sans trafic
- **WHEN** l'instructeur ouvre les analytiques d'un funnel nouvellement créé sans aucun événement
- **THEN** le panel affiche un empty state avec le message "Aucune donnée encore. Partagez le lien de votre funnel pour commencer à collecter des statistiques."

#### Scenario: Données chargées en lazy
- **WHEN** l'instructeur clique sur les analytiques
- **THEN** le système affiche un skeleton loading pendant le fetch, puis les données réelles une fois chargées

### Requirement: Le panel analytiques SHALL afficher un graphique de conversion funnel
Le panel SHALL contenir un graphique en entonnoir (funnel chart) montrant la progression des visiteurs à travers chaque étape avec le pourcentage de drop-off.

#### Scenario: Affichage du funnel chart
- **WHEN** les données sont chargées pour un funnel avec 5 étapes
- **THEN** le graphique affiche une barre par étape, de largeur décroissante proportionnelle au nombre de vues, avec le taux de drop-off entre chaque transition

### Requirement: Le panel SHALL afficher les événements récents
Les 10 derniers événements (vues, clics, achats, skips) SHALL être affichés dans une timeline avec le type, l'étape, la date et le montant (pour les achats).

#### Scenario: Affichage des événements récents
- **WHEN** les données sont chargées
- **THEN** une liste timeline montre les 10 derniers événements avec une icône par type (œil pour view, curseur pour click, panier pour purchase, flèche pour skip)

### Requirement: Un hook useInstructorFunnelAnalytics SHALL être créé
Un hook TanStack Query `useInstructorFunnelAnalytics(funnelId)` SHALL être ajouté dans `hooks.ts` pour fetcher les analytiques d'un funnel spécifique.

#### Scenario: Appel du hook
- **WHEN** le composant analytiques monte avec un `funnelId`
- **THEN** le hook fetch `GET /api/marketing/funnels/{funnelId}/events` et retourne `{ data, isLoading, error }`
