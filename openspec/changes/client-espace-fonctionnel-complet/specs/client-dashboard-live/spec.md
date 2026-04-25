## ADDED Requirements

### Requirement: Dashboard SHALL display real KPI cards from API
Le dashboard `/client` SHALL afficher des cartes KPI connectees aux APIs : projets actifs, depenses totales, commandes en cours, freelances engages, taux de satisfaction.

#### Scenario: Cartes KPI chargees depuis l'API
- **WHEN** le client accede a `/client`
- **THEN** les cartes affichent les valeurs reelles depuis `statsApi.getClientStats()` avec formatage EUR

#### Scenario: Cartes en skeleton pendant le chargement
- **WHEN** les stats sont en cours de chargement
- **THEN** chaque carte affiche un skeleton anime

### Requirement: Dashboard SHALL display functional charts with real data
Le dashboard SHALL afficher des graphiques Recharts avec donnees reelles : BarChart depenses mensuelles, PieChart repartition commandes par statut.

#### Scenario: Graphique depenses mensuelles
- **WHEN** le dashboard est charge
- **THEN** un BarChart affiche les depenses des 12 derniers mois avec les montants en EUR

### Requirement: Dashboard SHALL display recent activity feed
Le dashboard SHALL afficher un feed d'activite recente avec items cliquables vers les pages correspondantes.

#### Scenario: Click sur une activite de commande
- **WHEN** le client clique sur une activite "Commande livree"
- **THEN** il est redirige vers `/client/commandes/[id]`

### Requirement: Dashboard SHALL auto-refresh periodically
Le dashboard SHALL rafraichir les statistiques automatiquement toutes les 60 secondes.

#### Scenario: Auto-refresh des stats
- **WHEN** 60 secondes se sont ecoulees depuis le dernier chargement
- **THEN** `syncStats()` est appele automatiquement pour mettre a jour les KPIs
