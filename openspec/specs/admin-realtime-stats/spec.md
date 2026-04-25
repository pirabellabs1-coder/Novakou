## ADDED Requirements

### Requirement: Dashboard statistics SHALL be computed from real Prisma aggregations
Le dashboard admin MUST afficher des statistiques calculées en temps réel depuis la base de données Prisma : nombre d'utilisateurs par rôle, nombre de commandes par statut, revenus totaux, commission plateforme, services publiés, litiges ouverts.

#### Scenario: Total users count reflects database
- **WHEN** l'admin charge le dashboard
- **THEN** le nombre total d'utilisateurs est calculé via `prisma.user.count()` et correspond au nombre réel d'utilisateurs inscrits

#### Scenario: Revenue is calculated from real payments
- **WHEN** l'admin charge le dashboard
- **THEN** le revenu total est calculé via `prisma.payment.aggregate({ _sum: { amount: true } })` sur les paiements avec statut `COMPLETED`

#### Scenario: Monthly revenue chart uses real data
- **WHEN** l'admin consulte le graphique de revenus mensuels
- **THEN** chaque mois affiche la somme des paiements `COMPLETED` groupés par `prisma.payment.groupBy({ by: ['createdAt'] })` sur les 12 derniers mois

#### Scenario: Active disputes count reflects database
- **WHEN** l'admin charge le dashboard
- **THEN** le nombre de litiges ouverts est `prisma.dispute.count({ where: { status: 'OPEN' } })`

### Requirement: Finance page SHALL display real transaction data from Prisma
La page finances admin MUST afficher les transactions réelles de la plateforme depuis la table `Payment`, avec les filtres par type (paiement, retrait, remboursement) et par statut (en attente, complété, échoué, bloqué).

#### Scenario: Transactions list shows real payments
- **WHEN** l'admin consulte la page finances en production
- **THEN** la liste affiche les entrées de `prisma.payment.findMany()` avec les montants réels, les dates, les parties (payeur/bénéficiaire), et le statut

#### Scenario: Finance summary aggregates real data
- **WHEN** l'admin consulte le résumé financier
- **THEN** les totaux (revenu plateforme, fonds en escrow, retraits en attente) sont calculés via agrégations Prisma sur la table `Payment`

#### Scenario: Transaction filtering works with Prisma
- **WHEN** l'admin filtre les transactions par type "retrait" et statut "en attente"
- **THEN** seules les transactions correspondantes sont retournées via `prisma.payment.findMany({ where: { type: 'WITHDRAWAL', status: 'PENDING' } })`

### Requirement: Analytics page SHALL compute metrics from real database data
La page analytics admin MUST calculer les métriques depuis les tables Prisma : inscriptions par période, revenus par catégorie, revenus par pays, taux de conversion (inscription → première commande), distribution des avis.

#### Scenario: Registration trend shows real signups
- **WHEN** l'admin consulte le graphique d'inscriptions
- **THEN** les données sont `prisma.user.groupBy({ by: ['createdAt'] })` groupées par jour/semaine/mois selon la période sélectionnée

#### Scenario: Revenue by category uses real orders
- **WHEN** l'admin consulte le revenu par catégorie de service
- **THEN** les montants sont calculés via une jointure Prisma entre `Payment`, `Order`, `Service` et `Category`

#### Scenario: Review statistics reflect real reviews
- **WHEN** l'admin consulte les statistiques d'avis
- **THEN** la distribution des notes (1-5 étoiles) et la note moyenne sont calculées via `prisma.review.aggregate()` et `prisma.review.groupBy()`

### Requirement: Dashboard stats SHALL include cross-space activity metrics
Le dashboard admin MUST afficher des métriques qui reflètent l'activité de tous les espaces : nombre de freelancers actifs (ont eu une commande dans les 30 derniers jours), nombre de clients actifs, nombre d'agences, services publiés par espace (freelance vs agence).

#### Scenario: Active freelancers count reflects recent activity
- **WHEN** l'admin charge le dashboard
- **THEN** le nombre de freelancers actifs est calculé comme le nombre d'utilisateurs avec `role = 'FREELANCE'` ayant au moins une commande dans les 30 derniers jours

#### Scenario: Services count distinguishes freelance vs agency
- **WHEN** l'admin consulte la répartition des services
- **THEN** le dashboard affiche séparément le nombre de services publiés par des freelancers et par des agences

### Requirement: Admin dashboard data SHALL refresh periodically
Les données du dashboard admin MUST se rafraîchir automatiquement à intervalle régulier pour refléter les changements en temps quasi-réel.

#### Scenario: Dashboard auto-refreshes every 30 seconds in production
- **WHEN** l'admin est sur la page dashboard
- **THEN** les données sont re-fetched automatiquement toutes les 30 secondes (intervalle configurable dans le store Zustand)

#### Scenario: Manual refresh is available
- **WHEN** l'admin clique sur un bouton "Actualiser"
- **THEN** toutes les métriques du dashboard sont re-fetched immédiatement
