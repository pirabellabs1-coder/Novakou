# Data Reset — Spec

## Overview
Remise à zéro complète de toutes les données de test sur la plateforme FreelanceHigh.

## Requirements

### R1: Suppression fichiers dev-store
- DOIT supprimer tous les fichiers JSON persistés dans `apps/web/lib/dev/` :
  - `services.json`
  - `orders.json`
  - `reviews.json`
  - `users.json`
  - `profiles.json`
  - `propositions.json`
  - `messaging.json`
  - Tout autre `*.json` généré par le dev-store
- Les fichiers `.ts` source NE DOIVENT PAS être supprimés

### R2: Données seed minimales
- Après reset, le dev-store DOIT repartir avec les données par défaut de `getDefaultServices()`, `getDefaultUsers()`, etc.
- Les données par défaut DOIVENT être vides ou minimales (pas de faux comptes, pas de fausses commandes)
- Les seed vendors dans `SEED_VENDORS` PEUVENT rester comme données de démonstration

### R3: Reset Prisma (si données en base)
- DOIT fournir une route `POST /api/admin/reset-data` protégée par auth admin
- DOIT supprimer dans l'ordre (respect des FK) : reviews, orders, escrows, wallet_transactions, services, freelancer_profiles, users (sauf admin)
- DOIT remettre les compteurs admin à zéro (AdminWallet, AdminTransaction, AdminPayout)
- NE DOIT PAS supprimer les catégories, sous-catégories, ou la configuration plateforme

### R4: Stats à zéro
- Les dashboards admin DOIVENT afficher 0 pour tous les compteurs après reset
- Les dashboards freelance/client DOIVENT être vides (pas de commandes, pas de revenus)

### R5: Nettoyage complet
- Aucun compte utilisateur de test NE DOIT rester (sauf le compte admin principal)
- Aucune commande de test NE DOIT rester
- Aucun service de test NE DOIT rester
- Aucun avis de test NE DOIT rester
