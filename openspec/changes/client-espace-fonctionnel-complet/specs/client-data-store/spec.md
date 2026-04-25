## ADDED Requirements

### Requirement: Client store SHALL centralize all client space state
Le systeme SHALL fournir un store Zustand `store/client.ts` qui centralise l'etat de l'espace client : projets, commandes, favoris, avis, litiges, factures, notifications, transactions, propositions, activites, statistiques, et filtres actifs.

#### Scenario: Store initialise au chargement de l'espace client
- **WHEN** l'utilisateur accede a une page sous `/client/`
- **THEN** le store client est initialise et `syncAll()` est appele pour charger les donnees depuis les APIs

#### Scenario: Sync individuel par domaine
- **WHEN** une page specifique est chargee (ex: `/client/projets`)
- **THEN** seul le sync du domaine concerne est appele (ex: `syncProjects()`) pour minimiser les appels API

### Requirement: Store SHALL track loading and error states per domain
Le store SHALL maintenir un etat `loading` et `error` par domaine (projects, orders, reviews, etc.) pour permettre aux composants d'afficher des skeletons ou des messages d'erreur.

#### Scenario: Affichage skeleton pendant le chargement
- **WHEN** `syncProjects()` est en cours
- **THEN** `loading.projects` est `true` et la page affiche un skeleton de chargement

#### Scenario: Affichage erreur en cas d'echec API
- **WHEN** un appel API echoue
- **THEN** `error.projects` contient le message d'erreur et la page affiche un message d'erreur avec bouton de retry

### Requirement: Store SHALL provide computed counts for sidebar badges
Le store SHALL exposer des compteurs calcules : `activeOrdersCount`, `unreadNotificationsCount`, `pendingReviewsCount` que la sidebar peut consommer directement.

#### Scenario: Badge commandes actives dans la sidebar
- **WHEN** le store contient 3 commandes avec statut "en_cours"
- **THEN** la sidebar affiche un badge "3" a cote du lien Commandes

### Requirement: Store SHALL build activity feed from API data
Le store SHALL construire automatiquement un feed d'activite recente a partir des commandes, projets, avis et notifications recentes.

#### Scenario: Feed genere a partir des commandes et avis
- **WHEN** `syncAll()` est appele
- **THEN** le store genere une liste d'activites triees par date (nouvelle commande, avis recu, projet mis a jour, candidature recue)
