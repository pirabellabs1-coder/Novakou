## ADDED Requirements

### Requirement: Tracker SHALL measure time spent on each page
Le tracker MUST mesurer la duree passee sur chaque page en secondes. Quand l'utilisateur quitte une page (navigation, fermeture), la duree est envoyee dans le champ `metadata.duration` de l'event `page_view` correspondant.

#### Scenario: Duration measured on navigation
- **WHEN** l'utilisateur passe 45 secondes sur `/services/web-design` puis navigue vers `/explorer`
- **THEN** un event `page_view` est envoye pour `/services/web-design` avec `metadata.duration = 45`

#### Scenario: Duration sent on page unload
- **WHEN** l'utilisateur ferme l'onglet apres 120 secondes sur une page
- **THEN** la duree est envoyee via `sendBeacon` avant la fermeture

### Requirement: Tracking store SHALL compute avg time on page
Le tracking store MUST exposer une methode `getAvgTimeOnPage(path)` qui retourne la duree moyenne passee sur un chemin donne.

#### Scenario: Average time computed from events
- **WHEN** l'admin demande le temps moyen sur `/services/web-design`
- **THEN** le store calcule la moyenne des `metadata.duration` de tous les events `page_view` pour ce chemin
