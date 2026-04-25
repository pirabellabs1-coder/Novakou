## Why

Le système de paiement est le coeur de FreelanceHigh mais il est actuellement fragmenté et incomplet :

1. **Admin boosts** (`/admin/boosts`) : les données ne se mettent pas à jour, incohérences de champs entre dev stores et Prisma (`serviceName` vs `serviceTitle`, `clicksGenerated` vs `actualClicks`)
2. **Comptabilité** (`/admin/comptabilite`) : les commissions perçues, revenus boosts et abonnements affichent 0€ alors que des transactions réelles existent — le `platformFee` des orders et le `totalCost` des boosts ne remontent pas dans les KPIs
3. **Paiement abonnement** (`/dashboard/abonnement/paiement`) : le solde wallet n'est pas affiché, les moyens de paiement (Mobile Money, PayPal, virement) sont des mocks UI sans backend
4. **Boost payment** : le paiement est instantané sans vérification du solde wallet — risque de solde négatif
5. **Factures** : le template PDF existe (`lib/pdf/invoice-template.ts`) mais la liste des factures est toujours vide, pas d'envoi par email, pas de factures pour les boosts ni les abonnements
6. **Payment methods API** : retourne toujours un tableau vide en production (`[]`)
7. **Wallet balance** : pas affiché sur les pages de paiement alors que le modèle `WalletFreelance`/`WalletAgency` existe et fonctionne

Sans paiements fonctionnels, la plateforme ne peut pas générer de revenus. C'est le blocage MVP le plus critique.

## What Changes

### Données réelles admin
- **Admin boosts** : corriger les incohérences de noms de champs pour que les stats (impressions, clics, commandes) se mettent à jour depuis Prisma
- **Comptabilité** : corriger les KPIs pour afficher les vraies commissions perçues (`Order.platformFee`), revenus boosts (`Boost.totalCost`), et préparer le tracking des abonnements

### Paiements fonctionnels
- **Wallet balance sur toutes les pages de paiement** : afficher le solde disponible du freelance/agence depuis `WalletFreelance`/`WalletAgency`
- **Boost payment** : valider que le solde wallet couvre le prix avant de créer le boost, débiter le wallet
- **Payment methods** : retourner les vraies méthodes de paiement disponibles (au minimum carte Stripe + solde wallet)

### Facturation
- **Invoice API** : générer les factures depuis les ordres terminés, les boosts payés et les abonnements — les stocker et les rendre accessibles
- **Invoice par email** : envoyer la facture PDF par email à chaque achat/boost/abonnement via Resend
- **Historique factures** : rendre visible dans l'espace freelance/client/agence

### Comptabilité complète
- **Abonnements dans comptabilité** : tracker les paiements d'abonnements dans les KPIs admin
- **Commissions cohérentes** : s'assurer que `AdminWallet` + `AdminTransaction` reflètent TOUTES les sources de revenus

## Capabilities

### New Capabilities
- `payment-wallet-display`: Affichage du solde wallet sur toutes les pages de paiement (abonnement, boost, commande)
- `invoice-generation`: Génération automatique de factures PDF pour chaque transaction (ordre, boost, abonnement) + envoi par email + historique
- `boost-wallet-payment`: Validation du solde wallet et débit lors du paiement d'un boost

### Modified Capabilities
- `admin-data-persistence`: Les APIs admin boosts et comptabilité doivent utiliser les bons champs Prisma et retourner des données réelles cohérentes

## Impact

- **API routes modifiées** : `/api/admin/boosts`, `/api/admin/comptabilite`, `/api/services/[id]/boost`, `/api/billing/invoices`, `/api/payment-methods`, `/api/wallet`
- **Pages modifiées** : `/admin/boosts`, `/admin/comptabilite`, `/dashboard/abonnement/paiement`, pages factures freelance/client/agence
- **Stores** : `admin.ts` (boosts sync), potentiellement store dashboard pour wallet
- **Emails** : nouveau template React Email pour facture
- **Pas de migration Prisma** : on utilise les modèles existants (WalletFreelance, WalletAgency, Boost, Order, Payment, AdminWallet, AdminTransaction)
- **Version cible** : MVP
- **Rôles impactés** : Freelance (wallet, boost, factures), Client (factures commandes), Agence (wallet, factures), Admin (comptabilité, boosts)
