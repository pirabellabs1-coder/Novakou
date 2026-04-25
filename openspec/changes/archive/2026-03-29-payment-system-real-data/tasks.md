## 1. Admin boosts — données réelles et champs cohérents

- [x] 1.1 Normaliser la réponse de `/api/admin/boosts` : retourner `serviceTitle`, `userName`, `impressions`, `clicks`, `orders`, `totalCost` depuis Prisma (`service.title`, `user.name`, `actualImpressions`, `actualClicks`, `actualOrders`, `totalCost`). Supprimer les fallbacks `serviceName`/`clicksGenerated`.
- [x] 1.2 Mettre à jour la page `/admin/boosts` pour utiliser les champs normalisés sans `(b as any)` casts.

## 2. Comptabilité — KPIs complets avec toutes les sources de revenus

- [x] 2.1 Dans `/api/admin/comptabilite` `buildPrismaResponse` : corriger le filtre des ordres pour calculer `totalCommissions` depuis les ordres `TERMINE` + `LIVRE` (pas seulement `notIn ANNULE`).
- [x] 2.2 Ajouter le calcul `revenueAbonnements` depuis `Payment.aggregate(type=abonnement, status=COMPLETE)` dans la période au lieu du hardcode `0`.
- [x] 2.3 Corriger le `netResult` pour inclure `totalCommissions + revenueBoosts + revenueAbonnements - totalRefunds`.
- [x] 2.4 Ajouter les opérations d'abonnement dans le tableau des opérations (depuis `Payment` type=abonnement avec `payer.name`).

## 3. Wallet balance — affichage sur les pages de paiement

- [x] 3.1 Créer l'endpoint `/api/wallet/balance` qui retourne `{ balance, pending, currency }` depuis `WalletFreelance` ou `WalletAgency` selon le rôle. Auto-créer le wallet si absent.
- [x] 3.2 Mettre à jour la page `/dashboard/abonnement/paiement` pour fetch et afficher le vrai solde wallet au lieu du "0,00 EUR" hardcodé.

## 4. Payment methods — données réelles

- [x] 4.1 Modifier `/api/payment-methods` en production pour retourner au minimum : carte bancaire (available: true), solde wallet (avec balance réelle, available si > 0), et les autres méthodes en `available: false` avec label "Bientôt disponible".

## 5. Boost payment — validation wallet et débit

- [x] 5.1 Dans `/api/services/[id]/boost` : avant de créer le boost, vérifier que `WalletFreelance.balance >= boostPrice`. Retourner 400 "Solde insuffisant" si insuffisant.
- [x] 5.2 Débiter `WalletFreelance.balance` du prix du boost et créer un `WalletTransaction` de type débit.

## 6. Factures — génération et historique

- [x] 6.1 Corriger `/api/billing/invoices` en production : reconstruire les factures depuis les Orders (`TERMINE`/`LIVRE`) + Boosts (`paidAt` non null) + Payments (`type=abonnement, status=COMPLETE`). Inclure le nom du payeur via include Prisma.
- [x] 6.2 Ajouter un endpoint GET `/api/billing/invoices/[id]/pdf` qui génère le PDF à la volée en utilisant `lib/pdf/invoice-template.ts` et les données de la transaction.
- [x] 6.3 Créer un helper `sendInvoiceEmail(userId, invoiceData)` utilisant Resend + le template PDF pour envoyer la facture par email.
- [x] 6.4 Appeler `sendInvoiceEmail` dans le flux boost (après paiement réussi dans `/api/services/[id]/boost`).

## 7. Validation

- [x] 7.1 Build Next.js sans erreur après toutes les modifications.
- [x] 7.2 Vérifier que `/admin/boosts` affiche les bons champs depuis Prisma.
- [x] 7.3 Vérifier que `/admin/comptabilite` affiche des KPIs non-zéro quand des transactions existent.
- [x] 7.4 Vérifier que `/dashboard/abonnement/paiement` affiche le vrai solde wallet.
