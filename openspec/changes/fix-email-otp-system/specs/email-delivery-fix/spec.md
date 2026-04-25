## ADDED Requirements

### Requirement: Emails SHALL be delivered using a verified FROM address
Le système DOIT envoyer tous les emails depuis une adresse FROM fonctionnelle. Tant que le domaine custom n'est pas vérifié, l'adresse `onboarding@resend.dev` DOIT être utilisée par défaut.

#### Scenario: Envoi d'email sans domaine custom vérifié
- **WHEN** un email transactionnel est envoyé et que `RESEND_DOMAIN_VERIFIED` est `false` ou absent
- **THEN** l'email DOIT être envoyé depuis `FreelanceHigh <onboarding@resend.dev>`

#### Scenario: Envoi d'email avec domaine custom vérifié
- **WHEN** un email transactionnel est envoyé et que `RESEND_DOMAIN_VERIFIED` est `true`
- **THEN** l'email DOIT être envoyé depuis l'adresse définie dans `EMAIL_FROM`

#### Scenario: Échec d'envoi d'email
- **WHEN** l'envoi d'un email échoue
- **THEN** l'erreur DOIT être loggée avec le contexte (destinataire, sujet, erreur Resend) et l'action appelante NE DOIT PAS échouer (envoi non-bloquant)

### Requirement: OTP codes SHALL be stored in database
Les codes OTP DOIVENT être stockés dans une table Prisma `OtpCode` au lieu de la mémoire pour survivre aux cold starts Vercel.

#### Scenario: Génération d'un OTP
- **WHEN** un utilisateur s'inscrit et clique sur "S'inscrire"
- **THEN** un code OTP à 6 chiffres DOIT être généré, stocké en DB avec expiration de 10 minutes, et envoyé par email

#### Scenario: Vérification d'un OTP valide
- **WHEN** l'utilisateur saisit le code correct dans les 10 minutes et avec moins de 5 tentatives
- **THEN** le code DOIT être validé, supprimé de la DB, et l'email marqué comme vérifié

#### Scenario: OTP expiré
- **WHEN** l'utilisateur saisit un code après 10 minutes
- **THEN** le système DOIT retourner une erreur "Code expiré" et supprimer l'entrée

#### Scenario: Trop de tentatives OTP
- **WHEN** l'utilisateur échoue 5 fois à saisir le bon code
- **THEN** le code DOIT être supprimé et l'utilisateur DOIT renvoyer un nouveau code

#### Scenario: Renvoi d'un code OTP
- **WHEN** l'utilisateur clique sur "Renvoyer le code"
- **THEN** l'ancien code DOIT être supprimé, un nouveau code DOIT être généré et envoyé par email

### Requirement: Admin SHALL be able to test email delivery
L'admin DOIT pouvoir tester l'envoi d'emails via un endpoint dédié.

#### Scenario: Test d'envoi d'email par l'admin
- **WHEN** un admin appelle `POST /api/admin/email-test` avec un email destinataire
- **THEN** un email de test DOIT être envoyé et le résultat (succès/erreur, ID Resend) DOIT être retourné

#### Scenario: Utilisateur non-admin tente le test
- **WHEN** un utilisateur non-admin appelle l'endpoint
- **THEN** une erreur 403 DOIT être retournée

### Requirement: Email delivery SHALL be logged for monitoring
Chaque envoi d'email DOIT être loggé avec les informations nécessaires au diagnostic.

#### Scenario: Email envoyé avec succès
- **WHEN** un email est envoyé avec succès via Resend
- **THEN** un log DOIT contenir : destinataire, sujet, ID Resend, adresse FROM utilisée

#### Scenario: Email en échec
- **WHEN** un envoi d'email échoue
- **THEN** un log d'erreur DOIT contenir : destinataire, sujet, erreur Resend, tentative de fallback
