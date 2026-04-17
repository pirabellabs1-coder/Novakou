## ADDED Requirements

### Requirement: Welcome email SHALL be sent on every registration method
Un email de bienvenue DOIT être envoyé pour chaque nouvelle inscription, quel que soit le mode d'inscription.

#### Scenario: Inscription par email/mot de passe
- **WHEN** un utilisateur s'inscrit via le formulaire email/mot de passe
- **THEN** un email de bienvenue DOIT être envoyé à son adresse email

#### Scenario: Inscription via Google OAuth
- **WHEN** un utilisateur se connecte pour la première fois via Google
- **THEN** un email de bienvenue DOIT être envoyé à son adresse Gmail

#### Scenario: Inscription via LinkedIn OAuth
- **WHEN** un utilisateur se connecte pour la première fois via LinkedIn
- **THEN** un email de bienvenue DOIT être envoyé à son adresse email LinkedIn

#### Scenario: Inscription sur la partie formations
- **WHEN** un utilisateur s'inscrit comme apprenant ou instructeur sur `/inscription`
- **THEN** un email de bienvenue formations DOIT être envoyé

#### Scenario: Utilisateur existant se connecte (pas première fois)
- **WHEN** un utilisateur existant se reconnecte (OAuth ou credentials)
- **THEN** aucun email de bienvenue NE DOIT être envoyé

### Requirement: OTP verification email SHALL be sent on registration
Un email contenant le code OTP DOIT être envoyé immédiatement après l'inscription.

#### Scenario: OTP envoyé après inscription credentials
- **WHEN** l'utilisateur s'inscrit via email/mot de passe
- **THEN** un email avec le code OTP à 6 chiffres DOIT être envoyé dans les 5 secondes

#### Scenario: OTP envoyé après inscription formations
- **WHEN** l'utilisateur s'inscrit sur la partie formations
- **THEN** un email OTP DOIT être envoyé

#### Scenario: Pas d'OTP pour OAuth
- **WHEN** l'utilisateur s'inscrit via Google ou LinkedIn
- **THEN** aucun email OTP NE DOIT être envoyé (l'email est déjà vérifié par le provider OAuth)

### Requirement: Transactional emails SHALL be sent for key platform actions
Les emails transactionnels DOIVENT être envoyés pour toutes les actions critiques de la plateforme.

#### Scenario: Commande passée — notification client
- **WHEN** un client passe une commande sur un service
- **THEN** un email de confirmation de commande DOIT être envoyé au client

#### Scenario: Commande passée — notification freelance
- **WHEN** un client passe une commande sur un service
- **THEN** un email de nouvelle commande DOIT être envoyé au freelance/agence

#### Scenario: Nouveau message reçu
- **WHEN** un utilisateur reçoit un nouveau message dans la messagerie
- **THEN** un email de notification DOIT être envoyé (si l'utilisateur n'est pas en ligne)

#### Scenario: Livraison effectuée
- **WHEN** un freelance marque une commande comme livrée
- **THEN** un email DOIT être envoyé au client pour l'informer de la livraison

#### Scenario: Paiement reçu par le freelance
- **WHEN** les fonds escrow sont libérés vers le portefeuille du freelance
- **THEN** un email de confirmation de paiement DOIT être envoyé au freelance

#### Scenario: KYC approuvé
- **WHEN** un admin approuve la vérification KYC d'un utilisateur
- **THEN** un email de confirmation DOIT être envoyé à l'utilisateur

#### Scenario: KYC refusé
- **WHEN** un admin refuse la vérification KYC
- **THEN** un email avec le motif du refus DOIT être envoyé à l'utilisateur

#### Scenario: Service approuvé par la modération
- **WHEN** un admin approuve un service soumis
- **THEN** un email DOIT informer le freelance que son service est publié

#### Scenario: Service refusé par la modération
- **WHEN** un admin refuse un service
- **THEN** un email avec le motif DOIT être envoyé au freelance
