## Context

FreelanceHigh a les modèles Prisma nécessaires (WalletFreelance, WalletAgency, Boost, Escrow, AdminWallet, AdminTransaction, Payment, Order) mais les données ne circulent pas correctement entre eux. Le résultat : des KPIs à 0€ en comptabilité, des factures vides, et des paiements de boosts sans validation de solde.

### Fichiers clés existants
- `apps/web/app/api/admin/boosts/route.ts` — API admin boosts (champs incohérents)
- `apps/web/app/api/admin/comptabilite/route.ts` — API comptabilité (KPIs incomplets)
- `apps/web/app/api/services/[id]/boost/route.ts` — Paiement boost (pas de validation wallet)
- `apps/web/app/api/billing/invoices/route.ts` — Liste factures (retourne vide)
- `apps/web/app/api/payment-methods/route.ts` — Méthodes paiement (retourne [] en prod)
- `apps/web/app/api/wallet/route.ts` — Wallet API (fonctionne mais pas utilisé partout)
- `apps/web/lib/pdf/invoice-template.ts` — Template PDF facture (complet)
- `apps/web/app/dashboard/abonnement/paiement/page.tsx` — Page paiement abonnement (wallet=0 hardcodé)

## Goals / Non-Goals

**Goals:**
- Les KPIs comptabilité affichent les vrais montants (commissions, boosts, abonnements)
- Les admin boosts affichent les bonnes stats depuis Prisma
- Le solde wallet est visible sur toute page de paiement
- Le boost valide le solde wallet avant de débiter
- Les factures PDF sont générées pour chaque transaction et envoyées par email
- L'historique des factures est accessible dans l'espace utilisateur
- Les méthodes de paiement retournent au minimum "carte" et "solde wallet"

**Non-Goals:**
- Intégration CinetPay/Flutterwave complète (V1)
- Stripe webhooks pour abonnements (prochaine itération)
- Paiement crypto (V4)
- Facturation conforme à chaque législation africaine (hors scope)
- Modification du schéma Prisma

## Decisions

### 1. Admin boosts — correction des champs

Le problème est que l'API retourne `serviceName` (dev) vs `service.title` (Prisma) et la page fait des fallbacks avec `(b as any).serviceName`.

**Solution** : normaliser la réponse API pour toujours retourner les mêmes champs (`serviceTitle`, `userName`, `impressions`, `clicks`, `orders`) que la source soit dev stores ou Prisma.

### 2. Comptabilité — KPIs depuis les bonnes tables

| KPI | Source actuelle | Source corrigée |
|-----|----------------|-----------------|
| Commissions perçues | `Order.platformFee` (OK mais filtré trop strictement) | `Order.platformFee` pour ordres `TERMINE` + `LIVRE` |
| Revenus boosts | `Boost.totalCost` (champ correct maintenant) | Identique — s'assurer que le filtre `startedAt` n'exclut pas les boosts actifs |
| Abonnements | Hardcodé à 0 | `Payment.aggregate(type=abonnement, status=COMPLETE)` |
| Résultat net | Commissions + boosts - refunds | Commissions + boosts + abonnements - refunds |

### 3. Wallet balance sur les pages de paiement

Créer un endpoint léger `/api/wallet/balance` qui retourne juste `{ balance, pending, currency }` pour le user courant. L'utiliser dans les pages de paiement via un fetch simple.

**Alternative rejetée** : Passer par le store Zustand — trop lourd pour un simple affichage de solde sur une page de paiement.

### 4. Boost payment — validation wallet

Avant de créer un boost, vérifier que `WalletFreelance.balance >= boostPrice`. Si insuffisant, retourner une erreur 400. Débiter le wallet de la somme du boost.

### 5. Factures — génération à chaque transaction

Réutiliser `lib/pdf/invoice-template.ts` (déjà complet). Workflow :
1. Quand un ordre est complété / boost payé → générer la facture PDF
2. Envoyer par email via Resend avec le PDF en pièce jointe
3. Stocker la référence dans un nouveau champ ou utiliser la table Payment comme source

Pour l'historique : l'API `/api/billing/invoices` reconstruit les factures depuis les Orders terminés + Boosts payés + Payments type=abonnement.

### 6. Payment methods — données réelles

Retourner au minimum :
- `{ type: "card", label: "Carte bancaire", provider: "stripe", available: true }`
- `{ type: "wallet", label: "Solde FreelanceHigh", balance: X, available: balance > 0 }`

Les méthodes Mobile Money, PayPal, virement restent en `available: false` avec label "Bientôt disponible" jusqu'à l'intégration réelle.

## Risks / Trade-offs

- **Pas de webhooks Stripe** → Les paiements d'abonnements ne seront pas automatiquement trackés dans la comptabilité. Pour le MVP, on crée un Payment manuellement lors du checkout success. [Risk] → Mitigation : ajouter les webhooks en prochaine itération.
- **Factures PDF en mémoire** → Pas de stockage Supabase Storage des PDFs. On régénère à la volée depuis les données. [Risk] → Acceptable au MVP, stocker dans Storage en V1.
- **Wallet débit sans vrai paiement** → Le boost débite le wallet mais le wallet est alimenté par les revenus des commandes. Si un freelance n'a pas de revenus, il ne peut pas booster. [Risk] → C'est le comportement attendu.
