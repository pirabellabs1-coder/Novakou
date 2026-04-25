# Proposal: Cross-Space Fixes — Audit Complet & Corrections

## Problem

Après 4 sessions de développement intensif (real-service-data-seo-boost, fix-admin-real-data, fix-agency-parity, agency-public-profile-polish), un audit exhaustif des 4 espaces révèle des **lacunes critiques dans les connexions inter-espaces** et des **fonctionnalités incomplètes** qui empêchent un flux de travail end-to-end.

### Issues Critiques Identifiées

#### 1. DISPUTE FLOW CASSÉ (P0)
- **Client** ouvre un litige via `PATCH /api/orders/[id]` avec `status: "litige"` → l'ordre passe à LITIGE/DISPUTED
- **MAIS** aucun `prisma.dispute.create()` n'est jamais appelé
- **Admin** cherche les disputes via `prisma.dispute.findMany()` → **liste toujours vide**
- Résultat: le client ouvre un litige, l'admin ne le voit jamais

#### 2. KYC APPROVAL MANQUANT (P0)
- Admin peut VOIR la file d'attente KYC (GET fonctionne)
- **MAIS** pas de PATCH/POST pour approuver/rejeter une demande KYC
- Les fonctions store `approveKyc()` et `refuseKyc()` appellent des endpoints qui n'existent pas ou ne font rien côté Prisma
- Résultat: impossible de faire progresser les utilisateurs au-delà du KYC niveau 1

#### 3. NOTIFICATIONS SANS TEMPS RÉEL (P1)
- Les notifications sont créées côté serveur (Prisma) lors d'événements
- **MAIS** le client polling est à 30s dans le layout → délai inacceptable
- Pas de push via Socket.io ou Supabase Realtime pour les notifications critiques

#### 4. CLIENT ORDER DETAIL — Actions manquantes côté Prisma (P1)
- L'action "Valider la livraison" → marque l'ordre comme TERMINE mais le **wallet freelance n'est pas crédité** dans certains chemins (vérification nécessaire)
- L'action "Demander révision" fonctionne en dev store mais flow Prisma à vérifier

#### 5. AGENCE — CRM Notes non persistées (P1)
- L'UI du CRM permet d'écrire des notes clients
- **MAIS** `handleNotesBlur()` fait un `setTimeout` simulant un save — aucun appel API
- Les notes disparaissent au refresh

#### 6. AGENCE — Assignation membres aux commandes (P2)
- L'agence ne peut pas assigner un membre spécifique à une commande
- Le `assignee` state est local uniquement dans le composant

## Solution

Corriger toutes les connexions inter-espaces cassées en se concentrant sur les flux critiques :

1. **Dispute**: Quand client change status → litige, créer automatiquement un `Dispute` record en DB
2. **KYC Admin**: Implémenter PATCH `/api/admin/kyc` pour approve/reject avec update du User.kyc
3. **Notifications push**: Ajouter un mécanisme de refresh immédiat (polling court ou SSE)
4. **Wallet crediting**: Vérifier et corriger le flow complet escrow → wallet
5. **CRM persistence**: Sauvegarder les notes client dans agencyProfile.settings ou table dédiée
6. **Order assignment**: Ajouter un champ assignedTo dans Order + API de mise à jour

## Impact

- **Utilisateurs impactés**: Tous (client + freelance + agence + admin)
- **Risque si non corrigé**: La plateforme ne peut pas fonctionner en production — litiges invisibles, KYC bloqué, agences ne peuvent pas gérer leur équipe
- **Complexité**: Modérée (modifications ciblées sur des routes existantes)
