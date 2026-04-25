## ADDED Requirements

### Requirement: Admin SHALL pouvoir superviser les activités marketing de tous les instructeurs
Une nouvelle page `/admin/marketing` SHALL afficher un tableau de bord des activités marketing de tous les instructeurs : promotions actives, codes promo en cours, campagnes, pixels configurés, et revenus attribués au marketing.

#### Scenario: Affichage de la vue d'ensemble marketing
- **WHEN** l'admin accède à `/admin/marketing`
- **THEN** la page affiche 4 KPI cards (promotions actives, codes promo actifs, revenus marketing total, taux de conversion moyen) et un tableau listant toutes les promotions actives avec l'instructeur associé

#### Scenario: Filtrage par instructeur
- **WHEN** l'admin sélectionne un instructeur dans le dropdown de filtre
- **THEN** les données marketing affichées sont filtrées pour cet instructeur uniquement

### Requirement: Admin SHALL voir les promotions et codes promo actifs de tous les instructeurs
La page marketing admin SHALL afficher un onglet "Promotions" listant toutes les promotions et codes promo actifs avec : nom de l'instructeur, type (promotion/code promo/flash), valeur de réduction, dates de validité, nombre d'utilisations, et statut.

#### Scenario: Liste des promotions actives
- **WHEN** l'admin clique sur l'onglet "Promotions"
- **THEN** un tableau affiche toutes les promotions actives triées par date de création (plus récente en premier)

#### Scenario: Désactivation d'une promotion par l'admin
- **WHEN** l'admin clique sur "Désactiver" à côté d'une promotion
- **THEN** la promotion est désactivée et l'instructeur est notifié (audit log enregistré)

### Requirement: API marketing admin SHALL exposer les données consolidées
L'API `GET /api/admin/formations/marketing` SHALL retourner les statistiques marketing consolidées de tous les instructeurs, et `GET /api/admin/formations/marketing/promotions` SHALL retourner la liste paginée des promotions actives.

#### Scenario: Appel API marketing stats
- **WHEN** un admin authentifié appelle `GET /api/admin/formations/marketing`
- **THEN** la réponse contient `{ activePromotions, activePromoCodes, totalMarketingRevenue, avgConversionRate, promotionsByInstructor[] }`

#### Scenario: Appel API promotions
- **WHEN** un admin authentifié appelle `GET /api/admin/formations/marketing/promotions?page=1&limit=20`
- **THEN** la réponse contient `{ promotions[], total, totalPages }` avec les informations de l'instructeur incluses

### Requirement: Navigation admin SHALL inclure le lien marketing
Le sidebar admin SHALL inclure un nouveau lien "Marketing" dans la navigation, positionné après "Finances".

#### Scenario: Lien marketing visible
- **WHEN** l'admin est dans l'espace formations admin
- **THEN** le sidebar affiche le lien "Marketing" avec l'icône `campaign`
