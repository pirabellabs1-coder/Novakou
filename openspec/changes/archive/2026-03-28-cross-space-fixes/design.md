# Design: Cross-Space Fixes

## Architecture des corrections

### 1. Dispute Record Creation

**Fichier**: `apps/web/app/api/orders/[id]/route.ts`

Quand le status passe à "litige" dans la branche Prisma, ajouter dans la transaction:
```
tx.dispute.create({
  data: {
    orderId: order.id,
    clientId: order.clientId,
    freelanceId: order.freelanceId,
    reason: body.reason || "Litige ouvert par le client",
    clientArgument: body.description || "",
    status: "OUVERT",
  }
})
```

Aussi créer une notification admin et incrémenter le compteur disputes du dashboard.

**Fichier**: `apps/web/app/api/admin/disputes/route.ts` — Prisma branch
- Vérifier que le GET inclut bien les disputes avec status OUVERT
- Ajouter POST pour résolution si manquant dans la branche Prisma

### 2. KYC Admin Approval/Rejection

**Fichier**: `apps/web/app/api/admin/kyc/route.ts`

Ajouter handler POST (ou PATCH) :
- Action "approve":
  - Update `KycRequest` status → APPROUVE
  - Update `User.kyc` → requestedLevel
  - Create notification pour l'utilisateur
  - Create audit log
- Action "reject":
  - Update `KycRequest` status → REFUSE, rejectionReason
  - Create notification pour l'utilisateur
  - Create audit log

### 3. Notification Refresh Rapide

**Approche**: Réduire le polling interval de 30s à 10s pour les notifications + ajouter un refresh forcé après chaque action utilisateur.

**Fichier**: `apps/web/app/dashboard/layout.tsx` et `apps/web/app/client/layout.tsx`
- Ajouter `refreshNotifications()` appelé après chaque action de commande
- Réduire l'interval de polling des notifications

### 4. Wallet Crediting Verification

**Fichier**: `apps/web/app/api/orders/[id]/route.ts`

Vérifier que la branche `status === "termine"` dans le PATCH Prisma :
1. Libère l'escrow (Escrow.status → RELEASED)
2. Met à jour AdminWallet (held → released)
3. Crédite le Wallet du freelance/agence
4. Crée WalletTransaction
5. Met à jour AdminTransaction (PENDING → CONFIRMED)

### 5. CRM Notes Persistence

**Approche**: Utiliser le champ `settings` JSON de AgencyProfile pour stocker les notes client.

**Fichier**: Créer `apps/web/app/api/agence/clients/notes/route.ts`
- POST: Sauvegarder note { clientId, note } dans settings.clientNotes
- GET: Retourner les notes existantes

**Fichier**: `apps/web/app/agence/clients/page.tsx`
- Remplacer le fake save par un appel API réel

### 6. Order Assignment (si temps)

**Approche**: Utiliser le champ `metadata` JSON de Order pour stocker l'assignee.

**Fichier**: Créer `apps/web/app/api/agence/orders/[id]/assign/route.ts`
- PATCH: Mettre à jour order.metadata.assignedTo = memberId
- Notifier le membre assigné

## Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `api/orders/[id]/route.ts` | Ajouter Dispute.create dans la branche litige Prisma + vérifier wallet |
| `api/admin/kyc/route.ts` | Ajouter POST handler pour approve/reject KYC |
| `api/admin/disputes/route.ts` | Vérifier POST resolve avec Prisma transaction |
| `api/agence/clients/notes/route.ts` | NOUVEAU — persistence notes CRM |
| `agence/clients/page.tsx` | Remplacer fake save par API call |
| `dashboard/layout.tsx` | Réduire polling notifications |
| `client/layout.tsx` | Réduire polling notifications |
| `agence/layout.tsx` | Réduire polling notifications |

## Contraintes

- Ne PAS modifier le schema Prisma (pas de migration) — utiliser les modèles existants
- Toutes les modifications doivent supporter le dual-mode (dev store + Prisma)
- Transactions atomiques pour toute opération financière
