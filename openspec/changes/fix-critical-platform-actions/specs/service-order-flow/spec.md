## ADDED Requirements

### Requirement: Client SHALL order a service from the detail page
Le systeme SHALL afficher un modal de confirmation de commande lorsqu'un client authentifie clique sur "Commander" sur la page detail service. Le modal SHALL afficher le forfait selectionne (Basique/Standard/Premium), le prix, le delai, et un champ "requirements" optionnel. Le systeme SHALL creer une Order via POST `/api/orders` avec `serviceId`, `packageType`, et `requirements`.

#### Scenario: Client authentifie commande un service
- **WHEN** un client connecte clique sur "Commander" avec le forfait Standard selectionne
- **THEN** un modal s'ouvre avec le resume du forfait Standard (prix, delai, revisions)
- **THEN** le client peut ajouter des instructions (optionnel) et confirmer
- **THEN** POST `/api/orders` est appele avec `{ serviceId, packageType: "standard", requirements }`
- **THEN** une Order est creee avec status EN_ATTENTE et escrow_status HELD
- **THEN** le client est redirige vers `/client/commandes/[orderId]`

#### Scenario: Client non authentifie clique sur Commander
- **WHEN** un visiteur non connecte clique sur "Commander"
- **THEN** il est redirige vers `/connexion?redirect=/services/[slug]`
- **THEN** apres connexion, il revient sur la page du service

### Requirement: Order API SHALL handle service purchase
POST `/api/orders` SHALL valider le serviceId et packageType, creer l'Order avec le bon montant depuis le package selectionne, creer un Payment en attente, et creer une Conversation entre client et freelance.

#### Scenario: Creation de commande reussie
- **WHEN** POST `/api/orders` recoit `{ serviceId: "svc_123", packageType: "basic", requirements: "Logo minimaliste" }`
- **THEN** le systeme verifie que le service existe et est ACTIF
- **THEN** une Order est creee avec `amount` = prix du forfait basique
- **THEN** un Payment est cree avec status EN_ATTENTE
- **THEN** une Conversation ORDER est creee entre client et freelance
- **THEN** l'API retourne `{ order: { id, status, amount } }`
