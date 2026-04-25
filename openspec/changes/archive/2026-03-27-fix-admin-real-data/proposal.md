## Why

L'espace admin est partiellement cassé en production : plusieurs routes API critiques n'ont aucune implémentation Prisma et utilisent uniquement les dev stores en mémoire. Les commandes admin (`/api/admin/orders`) ne montrent que des données factices, les actions admin (forcer livraison, refund, libérer escrow) ne persistent pas en DB, la route de modération de services (`/api/admin/services/[id]`) n'existe pas du tout (404), et les stats revenus/dépenses des utilisateurs sont hardcodées à 0. Version cible : **MVP**.

## What Changes

### Routes API admin — Prisma manquant
- **`/api/admin/orders/route.ts`** : Ajouter implémentation Prisma complète (GET liste de toutes les commandes avec filtres, stats)
- **`/api/admin/orders/[id]/route.ts`** : Ajouter implémentation Prisma pour GET détail + PATCH actions admin (force_delivery, release_escrow, refund, cancel, mark_disputed) avec transactions atomiques
- **`/api/admin/services/[id]/route.ts`** : Créer la route manquante pour approuver/refuser/mettre en avant un service via Prisma

### Données hardcodées
- **`/api/admin/users/route.ts`** : Corriger le calcul revenue/totalSpent dans le path Prisma (actuellement hardcodé à 0)
- **`/api/admin/wallet/route.ts`** : Supprimer le fallback dev mode qui retourne un wallet vide — toujours utiliser Prisma

### Frontend admin
- Vérifier que les pages admin consomment correctement les données réelles depuis les APIs corrigées
- S'assurer que les actions admin (approve, ban, refund) fonctionnent de bout en bout

## Capabilities

### New Capabilities
- `admin-orders-prisma`: Implémentation Prisma complète pour la gestion admin des commandes (liste, détail, actions mutations)
- `admin-service-moderation`: Route API pour approuver/refuser/mettre en avant des services depuis l'admin

### Modified Capabilities
- `admin-data-persistence`: Les routes admin users et wallet doivent retourner des données réelles (revenue, spending, wallet balances) au lieu de valeurs hardcodées

## Impact

### Code affecté
- **API routes** : `/api/admin/orders/route.ts`, `/api/admin/orders/[id]/route.ts`, `/api/admin/services/[id]/route.ts` (nouveau), `/api/admin/users/route.ts`, `/api/admin/wallet/route.ts`
- **Frontend** : `/admin/commandes/`, `/admin/services/`, `/admin/utilisateurs/` — aucun changement frontend nécessaire si les APIs retournent le même format
- **Prisma** : Pas de nouvelles tables, utilisation des modèles existants (Order, Service, User, AdminWallet, Escrow, etc.)

### Impact multi-rôles
- **Admin** : Peut enfin voir les vraies commandes, approuver les services, voir les revenus réels des utilisateurs
- **Freelance/Client** : Les actions admin (résolution litiges, escrow release, refund) se reflètent réellement dans leurs dashboards

### Dépendances
- Aucune migration Prisma requise (tous les modèles existent)
- Aucun nouveau job BullMQ
- Aucun nouveau template email
