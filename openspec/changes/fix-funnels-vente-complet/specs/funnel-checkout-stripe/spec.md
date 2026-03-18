## ADDED Requirements

### Requirement: Le système SHALL créer une session Stripe Checkout pour les achats via funnel
Quand un visiteur clique sur "Confirmer et payer" dans l'étape CONFIRMATION d'un funnel, le système SHALL créer une session Stripe Checkout contenant tous les items acceptés (formations et produits numériques) avec leurs prix et réductions appliquées. La session SHALL inclure dans ses `metadata` : `funnelId`, `stepIndex`, `visitorId`, et la liste des `acceptedItems`.

#### Scenario: Création de session Stripe avec un seul produit
- **WHEN** un visiteur accepte la formation principale (59,99€) et clique "Confirmer et payer"
- **THEN** le système crée une session Stripe avec 1 line_item à 59,99€ et redirige le visiteur vers la page de paiement Stripe

#### Scenario: Création de session Stripe avec upsell accepté
- **WHEN** un visiteur accepte la formation principale (59,99€) et l'upsell Tailwind (29,99€ avec -40% = 17,99€) puis clique "Confirmer et payer"
- **THEN** le système crée une session Stripe avec 2 line_items (59,99€ + 17,99€ = 77,98€ total) et redirige vers Stripe

#### Scenario: Visiteur non connecté
- **WHEN** un visiteur non authentifié clique "Confirmer et payer"
- **THEN** le système SHALL permettre le paiement sans compte (mode guest checkout via Stripe) et collecter l'email dans la session Stripe

### Requirement: Le système SHALL tracker "purchase" uniquement après confirmation de paiement
L'événement "purchase" dans `SalesFunnelEvent` SHALL être enregistré uniquement quand le webhook Stripe confirme `checkout.session.completed`. Le clic sur le CTA d'une étape PRODUCT/UPSELL/DOWNSELL SHALL tracker un événement "click", jamais "purchase".

#### Scenario: Paiement réussi via webhook
- **WHEN** Stripe envoie un webhook `checkout.session.completed` avec `metadata.funnelId = "funnel_001"`
- **THEN** le système enregistre un événement "purchase" dans `SalesFunnelEvent` avec le `revenue` réel, met à jour `totalPurchases` et `totalRevenue` du funnel

#### Scenario: Paiement abandonné
- **WHEN** le visiteur abandonne le paiement sur Stripe et revient sans `session_id`
- **THEN** aucun événement "purchase" n'est enregistré et les stats restent inchangées

### Requirement: Le système SHALL afficher une page de succès après paiement
Après un paiement Stripe réussi, le visiteur SHALL être redirigé vers `/formations/f/[slug]?success=true&session_id=XXX`. Cette page SHALL afficher une confirmation avec les items achetés récupérés depuis la session Stripe.

#### Scenario: Retour après paiement réussi
- **WHEN** le visiteur revient sur le funnel avec `?success=true&session_id=cs_xxx`
- **THEN** le système vérifie la session Stripe, affiche une page de succès avec les items achetés, et inscrit automatiquement le visiteur aux formations/produits achetés

#### Scenario: Session Stripe invalide
- **WHEN** le visiteur accède avec un `session_id` invalide ou expiré
- **THEN** le système affiche un message d'erreur et un lien pour retourner au funnel

### Requirement: L'endpoint POST /api/marketing/funnels/checkout SHALL être créé
Une route API dédiée SHALL gérer la création de sessions Stripe pour les achats via funnel. Elle SHALL accepter `funnelId`, `acceptedItems` (liste d'objets avec `productId`, `price`, `discountPct`), et `visitorId`.

#### Scenario: Requête valide avec items
- **WHEN** le frontend envoie POST avec `funnelId`, `acceptedItems: [{productId: "form_001", price: 59.99, discountPct: null}]`
- **THEN** le système retourne `{ sessionId: "cs_xxx", url: "https://checkout.stripe.com/..." }` avec status 200

#### Scenario: Funnel inactif
- **WHEN** le frontend envoie POST avec un `funnelId` correspondant à un funnel inactif
- **THEN** le système retourne status 400 avec `{ error: "Ce tunnel de vente n'est pas actif" }`

### Requirement: Le mode DEV SHALL simuler le checkout sans Stripe
En mode `DEV_MODE`, l'endpoint `/api/marketing/funnels/checkout` SHALL simuler un paiement réussi sans appeler Stripe. Il SHALL retourner une URL de redirect vers la page de succès du funnel avec un `session_id` fictif.

#### Scenario: Checkout en mode dev
- **WHEN** `DEV_MODE=true` et le frontend envoie un POST checkout
- **THEN** le système retourne `{ sessionId: "dev_session_xxx", url: "/formations/f/[slug]?success=true&session_id=dev_session_xxx" }` et enregistre directement l'événement "purchase"
