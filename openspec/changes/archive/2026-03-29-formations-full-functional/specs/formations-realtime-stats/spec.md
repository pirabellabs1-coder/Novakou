## ADDED Requirements

### Requirement: La page d'accueil formations DOIT afficher des compteurs dynamiques
La section statistiques de la page d'accueil formations (`/formations`) DOIT afficher des compteurs provenant de l'API `/api/formations/stats` au lieu de valeurs hardcodées.

#### Scenario: Chargement des statistiques de la page d'accueil
- **WHEN** la page d'accueil formations se charge
- **THEN** elle DOIT appeler `GET /api/formations/stats` et afficher les vrais compteurs : nombre de formations actives, nombre d'apprenants inscrits, nombre d'instructeurs actifs, note moyenne des formations

#### Scenario: API formations stats retourne les données réelles
- **WHEN** l'API `GET /api/formations/stats` est appelée
- **THEN** elle DOIT exécuter des requêtes Prisma `count()` et `aggregate()` sur les tables Formation, Enrollment, InstructeurProfile, FormationReview et retourner les compteurs réels

### Requirement: Le dashboard apprenant DOIT afficher des statistiques réelles
Le dashboard de l'espace apprenant DOIT afficher des données provenant exclusivement de requêtes Prisma : formations en cours, progression moyenne, certificats obtenus, heures totales d'apprentissage.

#### Scenario: Chargement du dashboard apprenant
- **WHEN** un apprenant accède à son dashboard
- **THEN** les statistiques affichées (formations en cours, progression, certificats) DOIVENT provenir de l'API `/api/apprenant/dashboard` avec des données Prisma réelles

### Requirement: Le dashboard instructeur DOIT afficher des statistiques de ventes réelles
Le dashboard instructeur DOIT afficher les revenus totaux, les ventes du mois, le nombre d'apprenants, la note moyenne — toutes ces données provenant d'APIs Prisma temps réel.

#### Scenario: Chargement du dashboard instructeur
- **WHEN** un instructeur accède à son dashboard
- **THEN** les métriques (revenus, ventes, apprenants, note) DOIVENT provenir de l'API `/api/instructeur/dashboard` avec des agrégations Prisma réelles

### Requirement: La page statistiques instructeur DOIT afficher des graphiques de revenus réels
La page `/formations/instructeur/statistiques` DOIT afficher des graphiques de revenus mensuels, inscriptions par formation, et taux de complétion — calculés à partir des données réelles en base.

#### Scenario: Graphique de revenus mensuels instructeur
- **WHEN** l'instructeur consulte sa page statistiques
- **THEN** le graphique de revenus DOIT montrer les vrais montants par mois calculés à partir des `Enrollment.paidAmount` groupés par mois

### Requirement: La page devenir-instructeur DOIT afficher des statistiques dynamiques
La page `/formations/devenir-instructeur` DOIT remplacer les compteurs hardcodés (500+ instructeurs, 50K+ apprenants) par des données réelles de l'API.

#### Scenario: Statistiques dynamiques sur devenir-instructeur
- **WHEN** la page devenir-instructeur se charge
- **THEN** les compteurs (instructeurs actifs, apprenants inscrits, pourcentage de revenus) DOIVENT être récupérés depuis `GET /api/formations/stats`
