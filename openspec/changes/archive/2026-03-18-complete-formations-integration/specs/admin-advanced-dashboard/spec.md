## ADDED Requirements

### Requirement: Dashboard admin SHALL afficher des supergraphes avancés
Le dashboard admin (`/formations/admin/dashboard`) SHALL remplacer les graphiques basiques par des visualisations avancées incluant : un funnel de conversion (visiteur → inscription → premier achat → certificat), un graphe waterfall des revenus (revenus bruts → commissions → remboursements → net), un radar de performance par catégorie, et une heatmap d'activité hebdomadaire (52 semaines × 7 jours).

#### Scenario: Affichage du funnel de conversion
- **WHEN** l'admin accède au dashboard formations
- **THEN** un graphique en entonnoir affiche les 4 étapes (visiteurs uniques, inscriptions, premiers achats, certificats obtenus) avec les taux de conversion entre chaque étape

#### Scenario: Affichage du waterfall des revenus
- **WHEN** l'admin sélectionne une période (7j, 30j, 3m, 6m, 1an)
- **THEN** un graphe waterfall affiche les revenus bruts, les commissions plateforme (30%), les remboursements, et le revenu net avec des barres positives/négatives colorées

#### Scenario: Affichage de la heatmap d'activité
- **WHEN** le dashboard charge
- **THEN** une grille 52×7 affiche l'intensité d'activité (inscriptions + leçons complétées) par jour sur les 12 derniers mois avec 5 niveaux de couleur (gris → violet foncé)

#### Scenario: Affichage du radar de performance par catégorie
- **WHEN** le dashboard charge
- **THEN** un RadarChart affiche les 6 top catégories sur 5 axes (nombre de formations, étudiants, revenus, note moyenne, taux de complétion)

### Requirement: Dashboard admin SHALL afficher un tableau comparatif des instructeurs
Le dashboard admin SHALL inclure un tableau de comparaison des top 10 instructeurs avec colonnes : nom, formations actives, étudiants totaux, revenu total, note moyenne, taux de complétion moyen, tendance (↑/↓). Le tableau MUST être triable par chaque colonne.

#### Scenario: Affichage du tableau comparatif
- **WHEN** l'admin accède au dashboard
- **THEN** un tableau affiche les 10 meilleurs instructeurs triés par revenu par défaut

#### Scenario: Tri du tableau
- **WHEN** l'admin clique sur l'en-tête d'une colonne
- **THEN** le tableau se retrie par cette colonne (ascendant puis descendant au clic suivant)

### Requirement: Dashboard admin SHALL afficher la distribution géographique
Le dashboard SHALL afficher un graphique en barres horizontales montrant le top 10 des pays par nombre d'apprenants inscrits, avec drapeau emoji et pourcentage du total.

#### Scenario: Affichage de la distribution géographique
- **WHEN** le dashboard charge
- **THEN** un graphique en barres horizontales affiche les 10 pays avec le plus d'inscriptions, avec le nombre et le pourcentage

### Requirement: KPIs du dashboard SHALL inclure des tendances animées
Chaque KPI card (formations, étudiants, revenus, certificats) SHALL afficher un compteur animé au chargement et un badge de tendance (%) comparant la période actuelle à la précédente. La couleur du badge MUST être verte si positif, rouge si négatif.

#### Scenario: Animation des compteurs
- **WHEN** les données du dashboard sont chargées
- **THEN** les valeurs numériques des 4 KPI cards s'animent de 0 à la valeur réelle en 1 seconde

#### Scenario: Badge de tendance
- **WHEN** les données comparatives sont disponibles
- **THEN** chaque KPI affiche un badge vert (+X%) ou rouge (-X%) basé sur la comparaison avec la période précédente

### Requirement: API dashboard stats SHALL retourner les données avancées
L'API `GET /api/admin/formations/stats` SHALL retourner en plus des stats existantes : `conversionFunnel`, `revenueWaterfall`, `activityHeatmap`, `categoryRadar`, `topInstructors`, `geoDistribution`.

#### Scenario: Réponse API complète
- **WHEN** un admin authentifié appelle `GET /api/admin/formations/stats?period=30d`
- **THEN** la réponse inclut les champs : `conversionFunnel` (tableau de 4 étapes avec counts), `revenueWaterfall` (objet avec gross/commissions/refunds/net), `activityHeatmap` (tableau de {date, count}), `categoryRadar` (tableau de catégories avec 5 métriques), `topInstructors` (tableau de 10 instructeurs), `geoDistribution` (tableau de {country, count, percentage})
