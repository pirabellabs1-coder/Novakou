## ADDED Requirements

### Requirement: System SHALL detect abandoned carts
Le système DOIT détecter les paniers abandonnés via un job BullMQ `abandoned-cart-check` exécuté toutes les 30 minutes. Un panier est considéré abandonné si un `CartItem` existe depuis plus de 1 heure sans Enrollment correspondant et sans session Stripe active.

#### Scenario: Détection d'un panier abandonné après 1h
- **WHEN** un utilisateur a ajouté une formation au panier il y a 1h30 sans finaliser l'achat
- **THEN** le job crée un enregistrement `AbandonedCart` avec `userId`, `cartItemIds`, `detectedAt`, `emailSequence: 0`, `status: DETECTE`

#### Scenario: Panier déjà traité ignoré
- **WHEN** le job détecte un panier qui a déjà un `AbandonedCart` en statut `DETECTE` ou `RELANCE_1`
- **THEN** le job ne crée pas de doublon

#### Scenario: Panier converti après détection
- **WHEN** un utilisateur finalise son achat après qu'un AbandonedCart a été créé
- **THEN** le webhook Stripe met à jour le statut de l'AbandonedCart en `CONVERTI`

### Requirement: System SHALL send abandoned cart email sequence
Le système DOIT envoyer une séquence de 3 emails de relance via BullMQ pour les paniers abandonnés. Chaque email a un template React Email dédié.

#### Scenario: Email de relance 1h (urgence douce)
- **WHEN** un AbandonedCart est détecté depuis 1h et `emailSequence === 0`
- **THEN** le système envoie l'email "Vous avez oublié quelque chose !" avec l'image et le titre de la formation, un bouton "Reprendre mon panier", et met `emailSequence: 1, lastEmailAt: now()`

#### Scenario: Email de relance 24h (rappel bénéfices)
- **WHEN** un AbandonedCart a `emailSequence === 1` et `lastEmailAt` date de plus de 23h
- **THEN** le système envoie l'email "Votre formation vous attend" avec les points clés de la formation (learnPoints), les avis récents, et met `emailSequence: 2`

#### Scenario: Email de relance 7j (dernière chance)
- **WHEN** un AbandonedCart a `emailSequence === 2` et `lastEmailAt` date de plus de 6 jours
- **THEN** le système envoie l'email "Dernière chance !" et met `emailSequence: 3, status: TERMINE`

#### Scenario: Utilisateur se désabonne des relances
- **WHEN** un utilisateur clique "Se désabonner" dans un email de relance
- **THEN** le système met `status: DESABONNE` sur tous ses AbandonedCart et ne lui envoie plus de relances

### Requirement: System SHALL handle failed payments
Le système DOIT détecter les paiements échoués via le webhook Stripe `payment_intent.payment_failed` et déclencher un email de relance à l'acheteur avec un lien pour réessayer.

#### Scenario: Paiement par carte échoué
- **WHEN** Stripe envoie l'événement `payment_intent.payment_failed` pour un checkout formations
- **THEN** le système envoie l'email "Votre paiement n'a pas abouti" avec le motif d'échec (carte déclinée, fonds insuffisants), un bouton "Réessayer le paiement" vers `/panier`, et log l'événement dans `MarketingEvent`

#### Scenario: Paiement échoué pour un produit numérique
- **WHEN** le paiement échoue pour un produit numérique
- **THEN** le même flux de relance est déclenché avec le template adapté (nom du produit au lieu de la formation)

### Requirement: System SHALL handle Stripe disputes
Le système DOIT écouter l'événement `charge.disputed` du webhook Stripe et notifier l'admin et l'instructeur concerné.

#### Scenario: Litige Stripe reçu
- **WHEN** Stripe envoie `charge.disputed` pour un enrollment formations
- **THEN** le système met `Enrollment.refundRequested: true`, notifie l'admin via un log dans le dashboard, et envoie un email à l'instructeur "Un litige a été ouvert sur votre formation"

### Requirement: System SHALL track marketing events
Le système DOIT persister les événements marketing dans un modèle `MarketingEvent` pour alimenter le dashboard instructeur. Les événements trackés sont : `PAGE_VIEW`, `ADD_TO_CART`, `CHECKOUT_STARTED`, `PURCHASE_COMPLETED`, `PAYMENT_FAILED`, `CART_ABANDONED`.

#### Scenario: Tracking d'un ajout au panier
- **WHEN** un utilisateur ajoute une formation au panier
- **THEN** le système crée un `MarketingEvent` avec `type: ADD_TO_CART`, `formationId`, `userId`, `metadata: { price, source }`, `createdAt`

#### Scenario: Tracking d'un achat complété
- **WHEN** le webhook Stripe confirme un paiement
- **THEN** le système crée un `MarketingEvent` avec `type: PURCHASE_COMPLETED`, `formationId`, `userId`, `metadata: { amount, promoCode, paymentMethod }`
