## 1. Corriger l'API /api/admin/finances

- [x] 1.1 Refactorer le calcul `platformRevenue` pour utiliser `AdminWallet.totalFeesReleased` au lieu de `Payment.aggregate(type=commission)`. Créer l'AdminWallet s'il n'existe pas (upsert pattern).
- [x] 1.2 Refactorer le calcul `escrowFunds` pour utiliser `Escrow.aggregate(status=HELD)` au lieu de `Order.aggregate(status IN active)`. Ajouter un fallback `Order.platformFee` pour les commandes sans row Escrow.
- [x] 1.3 Corriger `totalPayments` pour sommer `Order.amount` des commandes non annulées/remboursées au lieu de `Payment.aggregate(type=paiement)`.
- [x] 1.4 Ajouter le calcul `subscriptionRevenue` depuis `Payment.aggregate(type=abonnement, status=COMPLETE)` et l'inclure dans la réponse summary.
- [x] 1.5 Corriger `totalTransactions` pour utiliser le vrai `Payment.count()` et ajouter le count des transactions bloquées.

## 2. Corriger l'API /api/admin/comptabilite

- [x] 2.1 Ajouter `include: { client: { select: { name: true } } }` sur les queries Order pour afficher le vrai nom du payeur dans les opérations.
- [x] 2.2 Ajouter la résolution du nom utilisateur pour les Boosts (include User).
- [x] 2.3 Vérifier et corriger les mappings de statut d'enum Prisma (TERMINE vs DELIVERED, etc.) pour éviter les erreurs de query.
- [x] 2.4 S'assurer que le endpoint retourne un JSON valide même quand il n'y a aucune donnée (objet KPIs avec tous les champs à 0, tableau operations vide).

## 3. Ajuster le frontend (si nécessaire)

- [x] 3.1 Vérifier que `financeSummary.subscriptionRevenue` est bien utilisé dans la carte "Abonnements" au lieu de `financeSummary.byType.abonnement`.
- [x] 3.2 S'assurer que la page comptabilité gère proprement le cas données vides (pas d'erreur toast inutile quand les KPIs sont tous à 0).

## 4. Validation

- [x] 4.1 Tester `/api/admin/finances` en production (Vercel) et vérifier que les KPIs correspondent aux données AdminWallet/Escrow réelles.
- [x] 4.2 Tester `/api/admin/comptabilite` avec chaque période (1m, 3m, 6m, 1y, 5y) et vérifier que les opérations chargent sans erreur.
- [x] 4.3 Vérifier la cohérence : `platformRevenue` sur /finances == `totalCommissions` sur /comptabilite pour la même période.
