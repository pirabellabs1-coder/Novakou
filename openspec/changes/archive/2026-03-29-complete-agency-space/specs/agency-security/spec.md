## ADDED Requirements

### Requirement: L'agence DOIT pouvoir gerer la securite du compte
Le systeme SHALL afficher a `/agence/securite` les options de securite : changement de mot de passe, activation/desactivation 2FA, et liste des sessions actives.

#### Scenario: Affichage de la page securite
- **WHEN** l'utilisateur navigue vers `/agence/securite`
- **THEN** le systeme affiche les sections mot de passe, 2FA et sessions actives

### Requirement: L'agence DOIT pouvoir changer son mot de passe
Le systeme SHALL proposer un formulaire de changement de mot de passe avec ancien mot de passe, nouveau mot de passe et confirmation.

#### Scenario: Changement de mot de passe
- **WHEN** l'utilisateur remplit le formulaire et clique sur "Modifier"
- **THEN** un toast "Mot de passe modifie" s'affiche et le formulaire est reinitialise

### Requirement: L'agence DOIT pouvoir activer le 2FA
Le systeme SHALL permettre l'activation de la double authentification via TOTP (Google Authenticator) ou SMS.

#### Scenario: Activation 2FA TOTP
- **WHEN** l'utilisateur clique sur "Activer 2FA" et choisit Google Authenticator
- **THEN** un QR code est affiche avec un champ de verification du code

### Requirement: L'agence DOIT voir ses sessions actives
Le systeme SHALL afficher la liste des sessions actives avec navigateur, OS, localisation et date de derniere activite.

#### Scenario: Revocation d'une session
- **WHEN** l'utilisateur clique sur "Revoquer" sur une session
- **THEN** la session est supprimee de la liste et un toast de confirmation s'affiche

### Requirement: L'agence DOIT voir le journal de securite
Le systeme SHALL afficher un journal chronologique des evenements de securite (connexions, changements de mot de passe, activations 2FA).

#### Scenario: Consultation du journal
- **WHEN** l'utilisateur fait defiler le journal de securite
- **THEN** les evenements sont affiches avec type, date, IP et navigateur
