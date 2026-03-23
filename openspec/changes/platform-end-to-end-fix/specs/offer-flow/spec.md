## ADDED Requirements

### Requirement: Le modèle Offer MUST avoir un clientId FK vers User
Le schéma Prisma MUST inclure un champ `clientId` optionnel sur le modèle `Offer` qui référence la table `User`. Cela permet d'associer une offre à un utilisateur client authentifié.

#### Scenario: Création d'une offre avec clientId résolu
- **WHEN** un freelance crée une offre avec `clientEmail: "client@test.com"` et qu'un utilisateur avec cet email existe
- **THEN** l'offre est créée avec `clientId` automatiquement résolu vers l'ID de l'utilisateur correspondant

#### Scenario: Création d'une offre sans utilisateur existant
- **WHEN** un freelance crée une offre avec un email qui ne correspond à aucun utilisateur
- **THEN** l'offre est créée avec `clientId: null` et `clientEmail` stocké — le clientId sera résolu si l'utilisateur s'inscrit ultérieurement

### Requirement: Un client MUST pouvoir voir les offres qui lui sont adressées
Le système SHALL fournir un moyen pour un client authentifié de consulter les offres reçues, filtrées par son `clientId` ou son email.

#### Scenario: Client consulte ses offres reçues
- **WHEN** un client authentifié accède à `/client/propositions`
- **THEN** le système affiche les offres qui lui sont adressées (par `clientId` ou `clientEmail`) avec pour chacune : titre, freelance, montant, délai, révisions, statut, et date d'expiration

#### Scenario: Client sans offres
- **WHEN** un client authentifié n'a aucune offre qui lui est adressée
- **THEN** le système affiche un état vide avec un message explicatif

### Requirement: Un client MUST pouvoir accepter ou refuser une offre
Le système SHALL fournir un endpoint `POST /api/offres/[id]/accept` et `POST /api/offres/[id]/refuse` pour permettre au client de répondre à une offre.

#### Scenario: Client accepte une offre
- **WHEN** un client accepte une offre avec `status: EN_ATTENTE`
- **THEN** le statut de l'offre passe à `ACCEPTE` et une commande est créée automatiquement avec le montant et le freelance de l'offre

#### Scenario: Client refuse une offre
- **WHEN** un client refuse une offre
- **THEN** le statut de l'offre passe à `REFUSE`, aucune commande n'est créée

#### Scenario: Offre expirée non acceptable
- **WHEN** un client tente d'accepter une offre dont la date `expiresAt` est passée
- **THEN** le système retourne une erreur 400 "Offre expirée"

### Requirement: Un freelance MUST pouvoir créer et suivre ses offres
Le système SHALL permettre au freelance de créer des offres personnalisées et de suivre leur statut.

#### Scenario: Freelance crée une offre
- **WHEN** un freelance crée une offre avec titre, description, montant, délai, révisions, clientEmail, et validityDays
- **THEN** l'offre est créée avec `status: EN_ATTENTE`, `expiresAt` calculé, et `freelanceId` du freelance connecté

#### Scenario: Freelance consulte ses offres envoyées
- **WHEN** un freelance accède à `/dashboard/offres`
- **THEN** le système affiche toutes ses offres avec statut, montant, client, et date d'expiration
