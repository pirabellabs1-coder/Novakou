## ADDED Requirements

### Requirement: Admin analytics SHALL display real tracking data
La page admin analytics MUST appeler `/api/tracking/stats` et afficher les metriques trafic reelles : visiteurs, sessions actives, pages populaires, taux de rebond, repartition appareils, tendances.

#### Scenario: Traffic section in admin analytics
- **WHEN** l'admin visite la page analytics
- **THEN** une section "Trafic" affiche : visiteurs uniques, sessions, pages vues, taux de rebond, duree moyenne

#### Scenario: Top pages displayed
- **WHEN** l'admin consulte les pages populaires
- **THEN** la liste affiche les 10 pages les plus visitees avec nombre de vues et temps moyen

### Requirement: Freelance dashboard SHALL show service performance from tracking
Le dashboard freelance MUST afficher pour chaque service : nombre de vues (depuis tracking), temps moyen passe, nombre de commandes, taux de conversion.

#### Scenario: Service stats from tracking
- **WHEN** un freelance consulte les stats de son service
- **THEN** il voit : vues (tracking), temps moyen (tracking), commandes (DB), taux de conversion (calcule)
