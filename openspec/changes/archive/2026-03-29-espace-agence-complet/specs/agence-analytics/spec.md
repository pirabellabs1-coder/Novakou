## ADDED Requirements

### Requirement: Performance de l'équipe
La page analytics SHALL afficher : commandes livrées, note moyenne, délai moyen par membre.

#### Scenario: Affichage performance
- **WHEN** l'utilisateur accède à `/agence/analytics`
- **THEN** les métriques de performance par membre sont affichées

### Requirement: Satisfaction clients (NPS)
Un indicateur NPS SHALL être affiché avec répartition : promoteurs, passifs, détracteurs.

#### Scenario: Affichage NPS
- **WHEN** la page est chargée
- **THEN** le score NPS est affiché avec graphique de répartition

### Requirement: Revenus par catégorie
Un graphique SHALL montrer la répartition des revenus par catégorie de service.

#### Scenario: Affichage par catégorie
- **WHEN** la page est chargée
- **THEN** un graphique en barres montre les revenus par catégorie

### Requirement: Comparaison de périodes et export
L'utilisateur SHALL pouvoir comparer 2 périodes et exporter les données en CSV.

#### Scenario: Export CSV
- **WHEN** l'utilisateur clique "Exporter"
- **THEN** un toast de confirmation est affiché (simulation)
