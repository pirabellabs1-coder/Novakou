## ADDED Requirements

### Requirement: Agency SEO page SHALL calculate and display SEO score per service
La page SEO (`/agence/seo` ou `/agence/services/seo`) MUST afficher pour chaque service de l'agence : un score SEO calcule (0-100), le meta titre (60 chars max), la meta description (160 chars max), l'URL slug modifiable, les mots-cles (10 max), les alt text des images, une previsualisation SERP (Google), et une checklist SEO avec conseils.

#### Scenario: Score SEO calcule par service
- **WHEN** un utilisateur agence accede a la page SEO
- **THEN** chaque service affiche un score SEO calcule depuis l'API `/api/services/[id]/seo`

#### Scenario: Modification des meta tags
- **WHEN** un utilisateur modifie le meta titre ou la meta description d'un service
- **THEN** les modifications sont sauvegardees via l'API
- **THEN** le score SEO est recalcule immediatement

#### Scenario: Previsualisation SERP
- **WHEN** un utilisateur consulte la previsualisation SERP
- **THEN** un apercu Google affiche le titre, l'URL, et la description tels qu'ils apparaitraient dans les resultats de recherche

#### Scenario: Checklist SEO avec conseils
- **WHEN** un service a un score SEO inferieur a 70
- **THEN** une checklist affiche les points a ameliorer avec des conseils concrets
