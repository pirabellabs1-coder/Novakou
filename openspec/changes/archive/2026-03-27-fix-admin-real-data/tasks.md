## 1. Admin Orders — Ajout Prisma

- [x] 1.1 Modifier `/api/admin/orders/route.ts` : ajouter la branche `if (!IS_DEV || USE_PRISMA_FOR_DATA)` avec `prisma.order.findMany()` incluant service (title, category), client (name, image), freelance (name, image). Mapper les champs au même format que le dev store (status lowercase, messagesCount via _count, etc.). Supporter le filtre `?status=`
- [x] 1.2 Modifier `/api/admin/orders/[id]/route.ts` GET : ajouter la branche Prisma avec `prisma.order.findUnique()` incluant toutes les relations (service, client, freelance, payments, escrow, reviews, revisions). Mapper au format attendu par le frontend
- [x] 1.3 Modifier `/api/admin/orders/[id]/route.ts` PATCH action `force_delivery` : ajouter branche Prisma — `prisma.order.update({ status: "LIVRE", deliveredAt: new Date() })` + `prisma.notification.create()` pour les deux parties
- [x] 1.4 Modifier `/api/admin/orders/[id]/route.ts` PATCH action `force_cancel` : ajouter branche Prisma — `prisma.order.update({ status: "ANNULE" })` + notifications
- [x] 1.5 Modifier `/api/admin/orders/[id]/route.ts` PATCH action `release_escrow` : ajouter branche Prisma avec `prisma.$transaction()` atomique — update order (TERMINE, escrowStatus RELEASED) + update escrow (RELEASED) + update AdminWallet (fees held→released) + update AdminTransaction (PENDING→CONFIRMED) + credit freelancer wallet + notifications
- [x] 1.6 Modifier `/api/admin/orders/[id]/route.ts` PATCH action `refund` : ajouter branche Prisma avec `prisma.$transaction()` — update order (ANNULE, escrowStatus REFUNDED) + update escrow (REFUNDED) + reverse AdminWallet.totalFeesHeld + create AdminTransaction type REFUND + notifications
- [x] 1.7 Modifier `/api/admin/orders/[id]/route.ts` PATCH action `mark_disputed` : ajouter branche Prisma — update escrowStatus DISPUTED + escrow status DISPUTED
- [x] 1.8 Modifier `/api/admin/orders/[id]/route.ts` PATCH action `update_status` : ajouter branche Prisma — `prisma.order.update({ status })` + notifications

## 2. Admin Service Moderation — Vérifier Prisma

- [x] 2.1 Lire `/api/admin/services/[id]/route.ts` et vérifier que la branche Prisma existe pour chaque action (approve, refuse, feature, unfeature). Si absente, ajouter le pattern `if (!IS_DEV || USE_PRISMA_FOR_DATA)` avec les mutations Prisma correspondantes
- [x] 2.2 Vérifier que les notifications sont créées via `prisma.notification.create()` dans le path Prisma (pas seulement via notificationStore)

## 3. Admin Users — Fix revenue/spending

- [x] 3.1 Modifier `/api/admin/users/route.ts` path Prisma : remplacer `revenue: 0` par un agrégat `prisma.order.aggregate({ where: { freelanceId: user.id, status: "TERMINE" }, _sum: { freelancerPayout: true } })` — utiliser `Promise.all()` pour paralléliser sur tous les users de la page
- [x] 3.2 Modifier `/api/admin/users/route.ts` path Prisma : remplacer `totalSpent: 0` par un agrégat `prisma.order.aggregate({ where: { clientId: user.id, status: { in: ["TERMINE", "LIVRE", "EN_COURS"] } }, _sum: { amount: true } })`

## 4. Admin Wallet — Toujours Prisma

- [x] 4.1 Modifier `/api/admin/wallet/route.ts` GET : supprimer le fallback dev qui retourne `{ totalFeesHeld: 0, totalFeesReleased: 0, transactions: [], payouts: [] }` — toujours utiliser Prisma (avec upsert du wallet si absent)
- [x] 4.2 Modifier `/api/admin/wallet/route.ts` POST : supprimer le fallback dev pour la création de payout — toujours utiliser Prisma

## 5. Vérification

- [x] 5.1 Vérifier que `/admin/commandes` affiche les vrais commandes depuis Prisma (pas de données factices)
- [x] 5.2 Vérifier que les actions admin (approuver service, forcer livraison, libérer escrow) persistent bien en DB
- [x] 5.3 Vérifier que `/admin/utilisateurs` affiche les vrais revenus/dépenses des utilisateurs
- [x] 5.4 Vérifier que `/admin/finances` affiche les vrais totaux du wallet admin
