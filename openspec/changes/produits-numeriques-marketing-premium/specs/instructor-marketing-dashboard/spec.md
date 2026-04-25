## ADDED Requirements

### Requirement: Instructeur SHALL access marketing dashboard
Le système DOIT fournir un tableau de bord marketing accessible à `/instructeur/marketing` affichant les métriques de conversion de l'instructeur. Le dashboard comprend : funnel de conversion (vues → ajouts panier → checkouts → achats), taux de conversion, revenus, paniers abandonnés récupérés, et paiements échoués.

#### Scenario: Affichage du funnel de conversion
- **WHEN** un instructeur accède à son dashboard marketing
- **THEN** le système affiche un funnel visuel avec : nombre de vues de pages (PAGE_VIEW), nombre d'ajouts panier (ADD_TO_CART), nombre de checkouts initiés (CHECKOUT_STARTED), nombre d'achats (PURCHASE_COMPLETED), avec le taux de conversion entre chaque étape et la comparaison avec le mois précédent

#### Scenario: Dashboard vide pour un nouvel instructeur
- **WHEN** un nouvel instructeur sans ventes accède au dashboard marketing
- **THEN** le système affiche un état vide avec des conseils : "Partagez vos formations sur les réseaux sociaux", "Configurez vos pixels publicitaires", "Créez une promotion flash"

### Requirement: Instructeur SHALL view abandoned cart analytics
Le système DOIT afficher les métriques de paniers abandonnés sur le dashboard marketing : nombre de paniers abandonnés, nombre récupérés (convertis après email), taux de récupération, revenus récupérés.

#### Scenario: Statistiques paniers abandonnés
- **WHEN** un instructeur consulte la section "Paniers abandonnés" du dashboard
- **THEN** le système affiche : 45 paniers abandonnés ce mois, 12 récupérés (26.7% taux de récupération), 348€ de revenus récupérés, graphique d'évolution sur les 6 derniers mois

### Requirement: Instructeur SHALL view revenue by source
Le système DOIT ventiler les revenus de l'instructeur par source : ventes directes, ventes via code promo, ventes récupérées (paniers abandonnés convertis), ventes via promotion flash.

#### Scenario: Répartition des revenus
- **WHEN** un instructeur consulte la section "Revenus par source"
- **THEN** le système affiche un graphique camembert avec : 65% ventes directes, 15% via code promo, 12% promotions flash, 8% récupération paniers — avec les montants en EUR

### Requirement: Instructeur SHALL manage flash promotions from dashboard
Le système DOIT permettre la création et gestion des promotions flash directement depuis le dashboard marketing, avec un calendrier visuel des promotions passées, actives et programmées.

#### Scenario: Créer une promotion flash depuis le dashboard
- **WHEN** un instructeur clique "Nouvelle promotion flash" et configure -25% sur sa formation "React Avancé" du 20 au 22 mars, max 30 utilisations
- **THEN** la promotion est créée, apparaît dans le calendrier, et le countdown timer s'active automatiquement à la date de début sur la page publique

#### Scenario: Voir l'historique des promotions
- **WHEN** un instructeur consulte le calendrier des promotions
- **THEN** le système affiche les promotions passées (avec résultats : ventes générées, revenus), actives (avec countdown), et programmées (avec date de début)

### Requirement: API SHALL provide marketing statistics
Le système DOIT fournir une API `GET /api/instructeur/marketing/stats` retournant toutes les métriques agrégées pour le dashboard marketing de l'instructeur authentifié.

#### Scenario: Appel API marketing stats
- **WHEN** l'API est appelée par un instructeur authentifié avec les paramètres `?period=30d`
- **THEN** le système retourne un JSON contenant : `funnel` (pageViews, addToCarts, checkouts, purchases avec taux), `abandonedCarts` (total, recovered, recoveryRate, recoveredRevenue), `revenueBySource` (direct, promo, flash, recovered), `flashPromotions` (active, scheduled, pastWithResults), `pixelStatus` (configured pixels et leur statut)
