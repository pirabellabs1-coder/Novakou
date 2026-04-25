## 1. Schéma Prisma & Migration

- [x] 1.1 Ajouter le modèle `PlatformConfig` au schema Prisma (clé String @id, value Json, updatedAt, updatedBy)
- [x] 1.2 Réutiliser le modèle `Notification` existant (ligne 806 du schema) au lieu de créer UserNotification — déjà présent avec userId, title, message, type, read, link
- [x] 1.3 Ajouter le modèle `AdminNotificationLog` au schema Prisma (id, adminId, title, message, targetCriteria Json, recipientCount, failedCount, channels, createdAt)
- [x] 1.4 Régénérer le client Prisma via `pnpm --filter=db generate` (migration sera appliquée au prochain deploy)

## 2. Configuration Plateforme Persistée

- [x] 2.1 Créer un helper `lib/admin/config-service.ts` avec fonctions `getConfig()`, `updateConfig()`, `seedDefaultConfig()` qui utilisent Prisma pour la table PlatformConfig
- [x] 2.2 Refactorer GET `/api/admin/config/route.ts` pour lire depuis Prisma via le config-service au lieu de l'objet en mémoire
- [x] 2.3 Refactorer PATCH `/api/admin/config/route.ts` pour écrire via Prisma (upsert par clé) + créer un AuditLog
- [x] 2.4 Implémenter le seed des valeurs par défaut si la table PlatformConfig est vide (maintenance=false, commissions standard, devises actives)
- [x] 2.5 Middleware maintenance déjà en place (middleware.ts L97-116) — connecté maintenant au config-service persistent via /api/public/maintenance avec cache 60s

## 3. Dashboard & Statistiques Temps Réel

- [x] 3.1 Compléter la branche production de GET `/api/admin/dashboard/route.ts` — ajouté agrégations Prisma pour revenus, litiges, retraits en attente, orders by status détaillé, suspended/banned counts
- [x] 3.2 Métriques cross-space ajoutées (suspended/banned counts, orders by status complet, disputes réels depuis prisma.dispute.count)
- [x] 3.3 Graphique de revenus mensuels implémenté avec boucle sur 12 mois, agrégations prisma.order.aggregate + prisma.payment.aggregate par période

## 4. Finances — Implémentation Prisma

- [x] 4.1 Implémenter la branche production de GET `/api/admin/finances/route.ts` — transactions via prisma.payment.findMany avec payer/payee/order includes
- [x] 4.2 Implémenter le résumé financier en production : commissions, escrow, retraits, total paiements, remboursements via agrégations Prisma + monthly breakdown
- [x] 4.3 Implémenter les actions finance (block/unblock/approve) en production via prisma.payment.update + Notification + AuditLog

## 5. Système de Notifications Admin

- [x] 5.1 Refactorer POST `/api/admin/notifications/send/route.ts` — filtrer utilisateurs via Prisma (rôle, plan, statut, KYC, IDs)
- [x] 5.2 Créer des entrées Notification (modèle existant) en DB via prisma.notification.createMany
- [x] 5.3 Créer un AdminNotificationLog pour l'historique + AuditLog
- [x] 5.4 Intégrer l'envoi d'emails réels via Resend pour le canal email
- [x] 5.5 Créer sendAdminBroadcastEmail dans lib/admin/admin-emails.ts
- [x] 5.6 Gérer les erreurs email : try/catch par destinataire, compteur failedEmails, statut partiel retourné

## 6. Emails Contextuels sur Actions Admin

- [x] 6.1 Créer sendAccountSuspendedEmail et sendAccountBannedEmail dans lib/admin/admin-emails.ts
- [x] 6.2 sendKycApprovedEmail existait déjà dans lib/email/index.ts — vérifié fonctionnel
- [x] 6.3 sendKycRejectedEmail existait déjà dans lib/email/index.ts — vérifié fonctionnel
- [x] 6.4 sendServiceApprovedEmail existait déjà dans lib/email/index.ts — vérifié fonctionnel
- [x] 6.5 sendServiceRefusedEmail existait déjà dans lib/email/index.ts — vérifié fonctionnel
- [x] 6.6 Emails intégrés dans users/[id] PATCH (suspended/banned), services/[id] PATCH (approve/refuse). KYC route avait déjà les emails.

## 7. KYC — Implémentation Prisma

- [x] 7.1 GET /api/admin/kyc avait déjà une implémentation Prisma — vérifié fonctionnel
- [x] 7.2 Approbation KYC complétée : KycRequest update + User kyc level + Notification in-app + email + AuditLog
- [x] 7.3 Refus KYC complété : KycRequest update + Notification in-app + email + AuditLog

## 8. Litiges — Implémentation Prisma

- [x] 8.1 GET disputes : branche Prisma ajoutée avec prisma.dispute.findMany + includes order/client/freelance + summary
- [x] 8.2 Examine : prisma.dispute.update status EN_EXAMEN + notifications + AuditLog
- [x] 8.3 Resolve : prisma.dispute.update verdict/resolvedAt + prisma.order.update status + notifications + AuditLog

## 9. Blog & Catégories — Implémentation Prisma

- [x] 9.1 Blog GET/POST avait déjà une implémentation Prisma — vérifié fonctionnel
- [x] 9.2 Blog PATCH/DELETE avait déjà une implémentation Prisma dans le même fichier route.ts
- [x] 9.3 Créé `/api/admin/categories/route.ts` — CRUD complet Category via Prisma (GET/POST/PATCH/DELETE)

## 10. Audit Log — Implémentation Prisma

- [x] 10.1 Audit-log GET avait déjà une implémentation Prisma avec pagination et filtres — vérifié fonctionnel
- [x] 10.2 Helper `lib/admin/audit.ts` créé avec createAuditLog() — utilisé dans config, users, services, finances, kyc, disputes

## 11. Propagation Inter-Espaces

- [x] 11.1 La suspension (status=SUSPENDU) est vérifiée dans le middleware via le token JWT role — le user ne peut plus accéder à son espace. En prod, les services sont aussi mis en PAUSE via cascade.
- [x] 11.2 L'approbation/refus de service met à jour prisma.service.update(status) — le dashboard freelance lit les services via Prisma, donc le statut est visible immédiatement.
- [x] 11.3 Endpoint GET `/api/notifications` existait déjà avec Prisma — GET (liste + unreadCount) et POST (mark read) fonctionnels
- [x] 11.4 NotificationBell existait déjà dans `components/notifications/NotificationBell.tsx` et `components/navbar/NotificationBell.tsx`

## 12. Tests & Validation

- [x] 12.1 Dashboard prod branch : toutes les agrégations Prisma retournent 0 sur tables vides (pas de crash)
- [x] 12.2 Maintenance : middleware appelle /api/public/maintenance → config-service getMaintenanceState() avec cache 60s, redirige vers /maintenance si enabled
- [x] 12.3 Notifications : POST crée prisma.notification.createMany + Resend email par user + AdminNotificationLog
- [x] 12.4 KYC : POST approve → prisma.kycRequest.update(APPROUVE) + prisma.user.update(kyc) + notification + email + audit
- [x] 12.5 Services : PATCH approve → prisma.service.update(ACTIF) + notification + email + audit
