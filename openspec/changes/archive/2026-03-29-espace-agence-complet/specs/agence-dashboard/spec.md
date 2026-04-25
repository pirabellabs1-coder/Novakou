## ADDED Requirements

### Requirement: Dashboard agence avec 6 KPI cards
Le dashboard SHALL afficher 6 cartes statistiques : CA mensuel (€), Projets actifs, Membres d'équipe, Commandes en cours, Satisfaction clients (%), Taux d'occupation (%). Chaque carte SHALL montrer la valeur et la variation par rapport à la période précédente.

#### Scenario: Affichage des KPI
- **WHEN** l'utilisateur accède à `/agence`
- **THEN** les 6 KPI sont affichés dans une grille responsive avec icônes et indicateurs de tendance

### Requirement: Graphique CA mensuel SVG
Le dashboard SHALL afficher un graphique en aire SVG montrant l'évolution du CA sur 6 mois avec des montants en EUR.

#### Scenario: Survol du graphique
- **WHEN** l'utilisateur survole le graphique
- **THEN** les points de données sont visibles avec les montants

### Requirement: Statut équipe en temps réel
Le dashboard SHALL afficher la liste des membres avec leur statut (Disponible/Occupé/Hors-ligne) via des indicateurs colorés.

#### Scenario: Affichage des membres
- **WHEN** le dashboard est chargé
- **THEN** chaque membre affiche son avatar, nom, rôle et indicateur de disponibilité

### Requirement: Tableau des projets actifs
Le dashboard SHALL afficher un tableau des projets actifs avec colonnes : Projet, Responsable, Statut, Progression (barre), Budget.

#### Scenario: Affichage du tableau
- **WHEN** le dashboard est chargé
- **THEN** les projets sont listés avec barres de progression colorées et badges de statut

### Requirement: Fil d'activité récente
Le dashboard SHALL afficher un fil chronologique des dernières actions de l'équipe.

#### Scenario: Affichage des activités
- **WHEN** le dashboard est chargé
- **THEN** les 5 dernières activités sont listées avec horodatage relatif
