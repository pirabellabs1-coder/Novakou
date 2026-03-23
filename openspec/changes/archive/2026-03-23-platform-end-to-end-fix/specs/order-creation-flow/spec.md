## ADDED Requirements

### Requirement: Commande créée depuis un service MUST initialiser l'escrow
Le système SHALL créer une commande complète lorsqu'un client commande un service actif. La commande MUST inclure les enregistrements `Payment`, une `Conversation`, et un `escrowStatus` à `HELD`.

#### Scenario: Client commande un service basique
- **WHEN** un client authentifié commande le forfait "Basique" d'un service actif
- **THEN** une `Order` est créée avec `status: EN_ATTENTE`, `escrowStatus: HELD`, `packageType: "basique"`, le montant du forfait, et la commission calculée selon le plan du freelance

#### Scenario: Commande visible par le freelance
- **WHEN** une commande est créée sur un service du freelance
- **THEN** la commande apparaît dans `/dashboard/commandes` du freelance avec le statut, le montant, et les détails du client

#### Scenario: Commande visible par le client
- **WHEN** un client crée une commande
- **THEN** la commande apparaît dans `/client/commandes` avec le statut, le montant, et les détails du freelance

### Requirement: Commande créée depuis l'acceptation d'une candidature
Le système SHALL créer automatiquement une commande lorsqu'un client accepte une candidature (`ProjectBid`). Le montant de la commande MUST correspondre au `amount` proposé par le freelance dans sa candidature.

#### Scenario: Client accepte une candidature
- **WHEN** un client accepte une candidature sur son projet
- **THEN** une `Order` est créée avec le montant proposé, le `freelanceId` du candidat, `status: EN_ATTENTE`, `escrowStatus: HELD`, et le status de la candidature passe à `acceptee`

#### Scenario: Les autres candidatures sont notifiées
- **WHEN** un client accepte une candidature sur un projet
- **THEN** le projet passe en status `pourvu` et les autres candidatures restent en status `en_attente` (notification future V2)

### Requirement: Commande créée depuis l'acceptation d'une offre personnalisée
Le système SHALL créer automatiquement une commande lorsqu'un client accepte une offre personnalisée (`Offer`). Le montant MUST correspondre à l'`amount` de l'offre.

#### Scenario: Client accepte une offre
- **WHEN** un client accepte une offre personnalisée qui lui est adressée
- **THEN** une `Order` est créée avec le montant de l'offre, le `freelanceId`, `status: EN_ATTENTE`, `escrowStatus: HELD`, et le status de l'offre passe à `ACCEPTE`
