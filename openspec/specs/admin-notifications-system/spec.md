## ADDED Requirements

### Requirement: Admin SHALL send real email notifications to users via Resend
Lorsque l'admin envoie une notification ciblée depuis la page notifications, le système MUST envoyer un email réel via l'API Resend à chaque utilisateur ciblé. L'email utilise un template React Email dédié aux notifications admin.

#### Scenario: Admin sends broadcast notification to all freelancers
- **WHEN** l'admin envoie une notification avec le canal "email" ciblant le rôle "freelance"
- **THEN** le système récupère tous les utilisateurs avec `role = 'FREELANCE'` via Prisma, et envoie un email via Resend à chaque adresse email avec le titre et le message de la notification

#### Scenario: Admin sends targeted notification to specific users
- **WHEN** l'admin envoie une notification ciblant des utilisateurs spécifiques par ID
- **THEN** le système envoie un email uniquement aux utilisateurs listés

#### Scenario: Email sending failure does not block the action
- **WHEN** l'envoi d'email via Resend échoue (timeout, erreur API)
- **THEN** l'erreur est loguée mais la notification in-app est quand même créée en base, et l'admin reçoit un avertissement "Email envoyé partiellement — X/Y emails échoués"

### Requirement: Admin notifications SHALL be stored in database as user notifications
Chaque notification envoyée par l'admin MUST créer des entrées `UserNotification` en base de données pour chaque utilisateur ciblé. Ces notifications sont visibles dans les espaces freelance, client et agence.

#### Scenario: Notification creates database entries for each target user
- **WHEN** l'admin envoie une notification ciblant 50 utilisateurs
- **THEN** 50 entrées `UserNotification` sont créées en base avec `read = false`, le titre, le message, le type et le canal

#### Scenario: In-app notifications are visible in user dashboards
- **WHEN** un freelance se connecte à son dashboard après avoir reçu une notification admin
- **THEN** la notification apparaît dans sa liste de notifications avec le statut "non lu"

#### Scenario: User can mark notification as read
- **WHEN** un utilisateur clique sur une notification in-app
- **THEN** le champ `read` de `UserNotification` est mis à `true` via Prisma

### Requirement: Notification targeting SHALL support filtering by role, plan, status, and KYC level
Le système de ciblage des notifications MUST supporter les filtres suivants : rôle (freelance, client, agence), plan d'abonnement (gratuit, pro, business, agence), statut du compte (actif, suspendu), et niveau KYC (1-4). Les filtres sont combinables (AND).

#### Scenario: Filter by role and plan
- **WHEN** l'admin cible les freelancers avec un plan Pro
- **THEN** seuls les utilisateurs avec `role = 'FREELANCE'` ET `subscriptionTier = 'pro'` reçoivent la notification

#### Scenario: Filter by KYC level
- **WHEN** l'admin cible les utilisateurs avec KYC niveau 1 (email vérifié uniquement)
- **THEN** seuls les utilisateurs avec `kycLevel = 1` reçoivent la notification

### Requirement: Admin notification history SHALL be persisted and queryable
L'historique des notifications envoyées par l'admin MUST être persisté en base avec les métadonnées (date, admin expéditeur, critères de ciblage, nombre de destinataires, statut d'envoi).

#### Scenario: Admin views notification history
- **WHEN** l'admin consulte l'historique des notifications
- **THEN** la liste affiche toutes les notifications envoyées avec : date, titre, nombre de destinataires, canaux utilisés, statut (envoyé/échoué partiellement)

### Requirement: Admin actions on users SHALL trigger contextual email notifications
Les actions admin critiques (suspension, bannissement, approbation KYC, refus KYC, approbation service, refus service) MUST déclencher un email contextuel à l'utilisateur concerné via Resend, en utilisant un template React Email spécifique à chaque action.

#### Scenario: User suspension triggers email
- **WHEN** l'admin suspend un utilisateur
- **THEN** l'utilisateur reçoit un email "Votre compte a été suspendu" avec le motif et les instructions pour contester

#### Scenario: KYC approval triggers email
- **WHEN** l'admin approuve une demande KYC
- **THEN** l'utilisateur reçoit un email "Votre vérification a été approuvée — niveau X débloqué" avec les nouvelles fonctionnalités disponibles

#### Scenario: Service refusal triggers email
- **WHEN** l'admin refuse un service avec un motif
- **THEN** le freelance reçoit un email "Votre service a été refusé" avec le motif et les instructions pour corriger et resoumettre
