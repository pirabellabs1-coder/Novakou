## ADDED Requirements

### Requirement: Freelance peut accepter une commande en attente
Le système SHALL permettre au freelance de passer une commande de `en_attente` à `en_cours` via un bouton d'action avec confirmation modale.

#### Scenario: Freelance accepte une commande avec succès
- **WHEN** le freelance clique sur "Accepter la commande" sur la page `/dashboard/commandes/[id]` d'une commande en statut `en_attente`, puis confirme dans le modal de confirmation
- **THEN** l'API PATCH `/api/orders/[id]` est appelée avec `{ status: "en_cours" }`, le statut passe à `en_cours`, la progression passe à 10%, un événement timeline "Travail démarré" est ajouté, un toast "Commande acceptée" s'affiche, et la page se met à jour

#### Scenario: Freelance annule la confirmation d'acceptation
- **WHEN** le freelance clique sur "Accepter la commande" puis clique "Annuler" dans le modal
- **THEN** aucune action n'est exécutée et le modal se ferme

#### Scenario: L'acceptation échoue
- **WHEN** le freelance confirme l'acceptation mais l'API retourne une erreur
- **THEN** un toast d'erreur s'affiche avec le message d'erreur de l'API, le statut de la commande ne change pas

### Requirement: Freelance peut livrer une commande en cours
Le système SHALL permettre au freelance de passer une commande de `en_cours` à `livre` via un bouton "Livrer la commande" avec confirmation modale.

#### Scenario: Freelance livre une commande avec succès
- **WHEN** le freelance clique sur "Livrer la commande" sur une commande en statut `en_cours`, puis confirme dans le modal
- **THEN** l'API PATCH est appelée avec `{ deliveryMessage: "Livraison effectuee", deliveryFiles: [...] }`, le statut passe à `livre`, la progression passe à 100%, un événement timeline "Livraison effectuée" est ajouté, un toast "Commande livrée" s'affiche

#### Scenario: La livraison échoue
- **WHEN** le freelance confirme la livraison mais l'API retourne une erreur
- **THEN** un toast d'erreur s'affiche avec le message d'erreur, le statut ne change pas

### Requirement: Client peut valider la livraison
Le système SHALL permettre au client de passer une commande de `livre` à `termine` via un bouton "Valider la livraison" avec confirmation modale. La validation DOIT libérer les fonds escrow.

#### Scenario: Client valide la livraison avec succès
- **WHEN** le client clique sur "Valider la livraison" sur la page `/client/commandes/[id]` d'une commande en statut `livre`, puis confirme dans le modal
- **THEN** l'API PATCH est appelée avec `{ status: "termine" }`, le statut passe à `termine`, la progression passe à 100%, les fonds escrow sont libérés, un toast "Livraison validée ! Les fonds ont été libérés." s'affiche, et le formulaire d'avis apparaît

#### Scenario: La validation échoue
- **WHEN** le client confirme la validation mais l'API retourne une erreur
- **THEN** un toast d'erreur s'affiche, le statut ne change pas, les fonds restent bloqués

### Requirement: Client peut demander une révision
Le système SHALL permettre au client de passer une commande de `livre` à `revision` via un bouton "Demander une révision" qui ouvre un modal avec champ de commentaire.

#### Scenario: Client demande une révision avec succès
- **WHEN** le client clique sur "Demander une revision", saisit un commentaire, puis confirme
- **THEN** l'API PATCH est appelée avec `{ status: "revision" }`, le nombre de révisions restantes est décrémenté, un toast "Révision demandée" s'affiche

#### Scenario: Plus de révisions disponibles
- **WHEN** le client demande une révision mais `revisionsLeft` est à 0
- **THEN** l'API retourne une erreur 400 "Nombre de revisions epuise" et un toast d'erreur s'affiche

### Requirement: Client peut laisser un avis après validation
Le système SHALL afficher un formulaire d'avis (qualité, communication, délai + commentaire) uniquement quand la commande est en statut `termine`.

#### Scenario: Client soumet un avis avec succès
- **WHEN** la commande est en statut `termine`, le client note les 3 critères et clique "Publier l'avis"
- **THEN** l'API POST `/api/reviews` est appelée, un toast "Avis publié" s'affiche, et le formulaire est remplacé par une confirmation

#### Scenario: Avis déjà publié
- **WHEN** la commande est en statut `termine` et un avis existe déjà
- **THEN** le formulaire d'avis n'est pas affiché, un message "Avis publié" est affiché à la place

### Requirement: Agence peut accepter et livrer une commande
Le système SHALL permettre à l'agence les mêmes actions que le freelance (accepter, livrer) avec confirmation modale sur la page `/agence/commandes/[id]`.

#### Scenario: Agence accepte une commande
- **WHEN** l'agence clique sur "Accepter la commande" et confirme
- **THEN** le même flow que le freelance s'exécute via `acceptOrder` du store agency

#### Scenario: Agence livre une commande
- **WHEN** l'agence clique sur "Livrer la commande" et confirme
- **THEN** le même flow que le freelance s'exécute via `deliverOrder` du store agency

### Requirement: Toute action critique DOIT avoir une confirmation modale
Le système SHALL afficher un ConfirmModal AVANT d'exécuter toute action qui change le statut d'une commande.

#### Scenario: Chaque transition de statut demande confirmation
- **WHEN** un utilisateur clique sur un bouton d'action (Accepter, Livrer, Valider, Demander révision, Annuler, Ouvrir litige)
- **THEN** un ConfirmModal s'ouvre avec le titre de l'action, un message explicatif, et les boutons Confirmer/Annuler

### Requirement: Les erreurs API DOIVENT être affichées à l'utilisateur
Le système SHALL propager le message d'erreur de l'API jusqu'au toast UI au lieu d'afficher un message générique.

#### Scenario: Erreur API avec message spécifique
- **WHEN** l'API retourne `{ error: "Nombre de revisions epuise" }` avec status 400
- **THEN** le toast d'erreur affiche "Nombre de revisions epuise" (pas "Erreur lors de la validation")
