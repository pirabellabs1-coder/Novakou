## Why

L'espace agence a des fonctionnalités manquantes ou cassées par rapport à l'espace freelance. Les commandes mélangent les ordres personnels et agence car le filtre API ne priorise pas `agencyId`. Les propositions envoyées par l'agence sont invisibles car l'API ne query que par `freelanceId`. La page escrow est absente. La commission est hardcodée à 10% au lieu de 8% (plan Agence). Ces problèmes empêchent les agences de gérer correctement leurs opérations. Version cible : **MVP**.

## What Changes

### Corrections API critiques
- **`/api/orders/route.ts`** : Quand le rôle est AGENCE sans filtre `?side`, prioriser `agencyId` dans le filtre OR au lieu de mélanger avec `freelanceId`
- **`/api/propositions/route.ts`** : Ajouter `agencyId` dans le filtre GET pour que les propositions agence soient visibles (OR freelanceId, agencyId)

### Commission correcte
- **`/agence/finances/page.tsx`** : Remplacer `COMMISSION_RATE = 0.1` (10%) par `0.08` (8%) conforme au plan Agence

### Pages manquantes
- **`/agence/escrow/page.tsx`** : Créer la page escrow pour l'agence (adapter depuis la version freelance) montrant les fonds en dépôt, en validation, libérés, et en litige
- **`/agence/propositions/page.tsx`** : Créer la page listant les propositions envoyées par l'agence avec statuts (SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED)

### Vérification cohérence
- S'assurer que les notifications sont créées pour les événements agence (commande, proposition, escrow)
- Vérifier que le détail commande agence (`/agence/commandes/[id]`) affiche bien l'escrow status

## Capabilities

### New Capabilities
- `agency-escrow-page`: Page de suivi escrow pour l'espace agence avec visibilité sur les fonds bloqués/libérés
- `agency-propositions-page`: Page de gestion des propositions envoyées par l'agence

### Modified Capabilities
- `agency-profile-sections`: L'API orders et propositions doit filtrer correctement par agencyId. La commission doit être 8%.

## Impact

### Code affecté
- **API routes** : `/api/orders/route.ts` (filtre agence), `/api/propositions/route.ts` (filtre agence)
- **Frontend** : `/agence/finances/page.tsx` (commission), `/agence/escrow/page.tsx` (nouveau), `/agence/propositions/page.tsx` (nouveau)
- **Store** : `store/agency.ts` — ajouter syncEscrow et syncPropositions si nécessaire

### Impact multi-rôles
- **Agence** : Voit ses vraies commandes (pas les personnelles mélangées), ses propositions, son escrow
- **Freelance** : Pas d'impact (le filtre freelanceId reste inchangé)
- **Client** : Pas d'impact

### Dépendances
- Aucune migration Prisma
- Aucun nouveau job BullMQ
- Aucun template email
