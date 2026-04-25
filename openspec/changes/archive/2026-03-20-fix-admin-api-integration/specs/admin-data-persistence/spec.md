## ADDED Requirements

### Requirement: Admin API routes SHALL use Prisma for all database operations in production mode
Toutes les routes API sous `/api/admin/*` MUST utiliser des requêtes Prisma vers Supabase Postgres lorsque `IS_DEV` est `false`. Le pattern dual-layer existant (dev store / Prisma) est conservé, mais chaque branche `else` (production) MUST être implémentée avec des requêtes Prisma fonctionnelles.

#### Scenario: Dashboard stats are fetched from Prisma in production
- **WHEN** l'admin accède au dashboard et `IS_DEV` est `false`
- **THEN** les métriques (nombre d'utilisateurs, commandes, services, revenus, litiges) sont calculées via `prisma.user.count()`, `prisma.order.count()`, `prisma.service.count()`, `prisma.payment.aggregate()`, `prisma.dispute.count()`

#### Scenario: User management operations persist via Prisma
- **WHEN** l'admin suspend, bannit ou réactive un utilisateur en production
- **THEN** le champ `status` de la table `User` est mis à jour via `prisma.user.update()` et un `AuditLog` est créé

#### Scenario: Service moderation persists via Prisma
- **WHEN** l'admin approuve, refuse ou met en vedette un service en production
- **THEN** le champ `status` de la table `Service` est mis à jour via `prisma.service.update()` et un `AuditLog` est créé

#### Scenario: Finance data is fetched from Prisma in production
- **WHEN** l'admin consulte la page finances et `IS_DEV` est `false`
- **THEN** les transactions sont récupérées via `prisma.payment.findMany()` avec les agrégations par type et statut

### Requirement: KYC management endpoints SHALL have Prisma implementation
Les routes API KYC (`/api/admin/kyc`) MUST lire et écrire dans la table `KycRequest` via Prisma. L'approbation ou le refus d'une demande KYC MUST mettre à jour le `kyc_level` dans la table `User`.

#### Scenario: KYC requests are listed from database
- **WHEN** l'admin consulte la page KYC en production
- **THEN** les demandes sont récupérées via `prisma.kycRequest.findMany()` avec le profil utilisateur associé

#### Scenario: KYC approval updates user level
- **WHEN** l'admin approuve une demande KYC de niveau 3
- **THEN** `prisma.kycRequest.update()` met le statut à `APPROVED` ET `prisma.user.update()` met `kycLevel` à `3`

#### Scenario: KYC refusal keeps current level
- **WHEN** l'admin refuse une demande KYC avec un motif
- **THEN** `prisma.kycRequest.update()` met le statut à `REJECTED` avec le motif, le `kycLevel` de l'utilisateur reste inchangé

### Requirement: Dispute resolution endpoints SHALL have Prisma implementation
Les routes API litiges (`/api/admin/disputes`) MUST lire et écrire dans la table `Dispute` via Prisma. Le verdict d'un litige MUST mettre à jour le statut de la commande associée.

#### Scenario: Disputes are listed from database
- **WHEN** l'admin consulte la page litiges en production
- **THEN** les litiges sont récupérés via `prisma.dispute.findMany()` avec les commandes, clients et freelances associés

#### Scenario: Dispute resolution updates order status
- **WHEN** l'admin rend un verdict sur un litige (en faveur du client, du freelance, ou remboursement partiel)
- **THEN** `prisma.dispute.update()` met le statut à `RESOLVED` avec le verdict ET le statut de la commande associée est mis à jour

### Requirement: Blog management endpoints SHALL have Prisma implementation
Les routes API blog (`/api/admin/blog`) MUST lire et écrire dans la table `BlogPost` via Prisma.

#### Scenario: Blog articles are managed via Prisma
- **WHEN** l'admin crée, modifie ou supprime un article de blog en production
- **THEN** les opérations sont effectuées via `prisma.blogPost.create()`, `prisma.blogPost.update()`, ou `prisma.blogPost.delete()`

### Requirement: Audit log endpoints SHALL read from Prisma
Les routes API audit log (`/api/admin/audit-log`) MUST lire depuis la table `AuditLog` via Prisma.

#### Scenario: Audit entries are fetched from database
- **WHEN** l'admin consulte le journal d'audit en production
- **THEN** les entrées sont récupérées via `prisma.auditLog.findMany()` triées par date décroissante avec l'acteur et la cible

### Requirement: Admin actions SHALL create audit log entries
Chaque action admin qui modifie des données (suspension, bannissement, approbation service, verdict litige, changement KYC) MUST créer une entrée dans la table `AuditLog` avec l'acteur, l'action, la cible et les détails.

#### Scenario: User suspension creates audit entry
- **WHEN** l'admin suspend un utilisateur
- **THEN** une entrée `AuditLog` est créée avec `action: 'user.suspended'`, `actorId: adminId`, `targetUserId: userId`, et les détails de la suspension

#### Scenario: Service approval creates audit entry
- **WHEN** l'admin approuve un service
- **THEN** une entrée `AuditLog` est créée avec `action: 'service.approved'`, `actorId: adminId`, et l'identifiant du service
