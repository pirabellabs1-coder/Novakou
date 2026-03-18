## ADDED Requirements

### Requirement: Dashboard apprenant SHALL afficher des graphiques de progression enrichis
La page `/formations/mes-formations` SHALL inclure des graphiques avancés : un AreaChart des heures d'apprentissage par semaine (8 dernières semaines), un indicateur visuel de streak (jours consécutifs), un radar de compétences par catégorie, et une barre d'objectifs hebdomadaires.

#### Scenario: Affichage du graphique d'heures par semaine
- **WHEN** l'apprenant accède à ses formations
- **THEN** un AreaChart avec gradient affiche les heures d'apprentissage des 8 dernières semaines

#### Scenario: Affichage du streak
- **WHEN** l'apprenant a des jours consécutifs d'apprentissage
- **THEN** un badge animé affiche le nombre de jours de streak avec une icône flamme et la série en cours

#### Scenario: Affichage du radar de compétences
- **WHEN** l'apprenant est inscrit à des formations dans au moins 3 catégories
- **THEN** un RadarChart affiche le taux de progression moyen par catégorie

#### Scenario: Objectifs hebdomadaires
- **WHEN** le dashboard charge
- **THEN** une barre de progression circulaire affiche le pourcentage de l'objectif hebdomadaire atteint (heures d'apprentissage cette semaine / objectif configuré)

### Requirement: Dashboard apprenant SHALL afficher des recommandations de formations
Une section "Recommandations" SHALL afficher 4 formations recommandées basées sur les catégories des formations auxquelles l'apprenant est déjà inscrit, en excluant celles déjà inscrites.

#### Scenario: Affichage des recommandations
- **WHEN** l'apprenant est inscrit à au moins une formation
- **THEN** 4 formations des mêmes catégories (non inscrites) sont affichées sous forme de cartes avec titre, thumbnail, note, prix

#### Scenario: Aucune recommandation disponible
- **WHEN** aucune formation correspondante n'est trouvée ou l'apprenant n'a aucune inscription
- **THEN** la section affiche les 4 formations les plus populaires de la plateforme avec le label "Populaires"

### Requirement: API enrollments SHALL retourner les données enrichies
`GET /api/apprenant/enrollments` SHALL retourner en plus des données existantes : `weeklyHours` (8 dernières semaines), `skillRadar` (progression par catégorie), `recommendations` (4 formations), et `weeklyGoalProgress`.

#### Scenario: Réponse API enrichie
- **WHEN** un apprenant authentifié appelle `GET /api/apprenant/enrollments`
- **THEN** la réponse inclut `weeklyHours[]`, `skillRadar[]`, `recommendations[]`, et `weeklyGoalProgress` en plus des champs existants

### Requirement: KPI cards du dashboard apprenant SHALL avoir des compteurs animés
Les 4 stat cards (en cours, terminées, certificats, heures totales) SHALL afficher des compteurs animés au chargement.

#### Scenario: Animation des compteurs
- **WHEN** les données sont chargées
- **THEN** les valeurs numériques s'animent de 0 à la valeur réelle en 800ms avec easing
