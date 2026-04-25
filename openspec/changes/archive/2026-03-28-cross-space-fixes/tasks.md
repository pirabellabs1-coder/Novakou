# Tasks: Cross-Space Fixes

## P0 — Critique (bloque le fonctionnement production)

- [x] 1. DISPUTE: Dans api/orders/[id]/route.ts branche Prisma, quand status passe à LITIGE, créer un Dispute record (prisma.dispute.create) dans la même transaction avec orderId, clientId, freelanceId, reason, clientArgument + créer notification admin
- [x] 2. DISPUTE: Dans api/admin/disputes/route.ts branche Prisma POST, implémenter la résolution avec transaction atomique (verdict freelance/client/partiel → escrow release/refund + wallet updates + AdminWallet + notifications aux 2 parties)
- [x] 3. KYC: Dans api/admin/kyc/route.ts, ajouter handler POST Prisma pour approve (KycRequest.status → APPROUVE, User.kyc → requestedLevel, notification user, audit log) et reject (KycRequest.status → REFUSE, rejectionReason, notification user, audit log) — DÉJÀ IMPLÉMENTÉ (Prisma $transaction + audit log + event emission)
- [x] 4. KYC: Vérifier que le admin store (useAdminStore) appelle correctement les endpoints avec les bons paramètres pour approveKyc et refuseKyc — VÉRIFIÉ OK (POST /api/admin/kyc avec action, userId, level, requestId)

## P1 — Important (expérience utilisateur dégradée)

- [x] 5. WALLET: Vérifier et corriger le flow complet dans api/orders/[id]/route.ts branche Prisma quand status→TERMINE : escrow RELEASED + AdminWallet held→released + Wallet freelance/agence crédité + WalletTransaction créée + AdminTransaction PENDING→CONFIRMED + service orderCount incrémenté — VÉRIFIÉ COMPLET (7 étapes atomiques dans $transaction)
- [x] 6. CRM NOTES: Créer api/agence/clients/notes/route.ts — POST pour sauvegarder une note (clientId, note) dans AgencyProfile.settings.clientNotes, GET pour récupérer toutes les notes
- [x] 7. CRM NOTES: Modifier agence/clients/page.tsx — remplacer le fake setTimeout save par un fetch POST vers l'API notes, charger les notes au mount
- [x] 8. NOTIFICATIONS: Réduire le polling interval des notifications à 10s dans les layouts (dashboard, client, agence) et ajouter un refresh immédiat après actions critiques (commande, litige, livraison)

## P2 — Amélioration (nice-to-have pour MVP)

- [x] 9. ASSIGNMENT: Créer api/agence/orders/[id]/assign/route.ts — PATCH pour assigner un membre à une commande (stocker dans order metadata JSON) + notifier le membre
- [x] 10. ASSIGNMENT: Modifier agence/commandes/[id]/page.tsx — persister le select d'assignee via l'API au lieu de state local
- [x] 11. REVIEW REPLY: Vérifier que api/reviews/[id]/reply/route.ts fonctionne en Prisma (update Review.response) et crée une notification pour l'auteur de l'avis
- [x] 12. ADMIN DISPUTES DEV: Dans la branche dev store de api/admin/disputes/route.ts POST, implémenter resolve avec les mêmes effets (orderStore.update, transactionStore, notificationStore) que la branche Prisma — DÉJÀ IMPLÉMENTÉ (examine + resolve freelance/client/partiel avec transactions + notifications)
