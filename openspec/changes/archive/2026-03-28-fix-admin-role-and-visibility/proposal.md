# Proposal: Fix Admin Role Check + Visibility Issues

## Problème Racine

**Le rôle admin est stocké en UPPERCASE dans Prisma** (`"ADMIN"`) mais **la majorité des routes API admin vérifient en lowercase** (`role !== "admin"`). Résultat : **toutes les requêtes admin retournent 403 Accès refusé** sauf `/api/admin/orders` qui vérifie les deux casses.

### Impact
- Admin ne peut PAS voir les commandes → 403 (sauf orders qui check `"admin" || "ADMIN"`)
- Admin ne peut PAS voir les services → 403
- Admin ne peut PAS voir les litiges → 403
- Admin ne peut PAS voir/approuver le KYC → 403
- Admin ne peut PAS voir les transactions → 403
- Le litige créé par le client ne montre pas `reason`/`description` côté admin
- Le KYC ne retourne pas les metadata (URLs documents) dans la queue admin
- Le client ne voit pas le statut de son litige dans sa liste de commandes

### Routes affectées
Toutes les routes sous `/api/admin/*` qui ne font `role !== "admin"` au lieu de vérifier les deux casses.

## Solution

1. **Normaliser le role check** : Ajouter `.toLowerCase()` ou checker `"admin" || "ADMIN"` dans TOUTES les routes admin
2. **Admin disputes** : Retourner `reason` et `clientArgument` pour que l'admin voie pourquoi le litige a été ouvert
3. **Admin KYC** : Retourner les metadata (document URLs) dans la queue pour preview
4. **Notifications litige** : Notifier le freelance quand un litige est ouvert contre lui, et que son statut de commande change
5. **Client litige store** : Après ouverture d'un litige, re-sync les commandes pour voir le nouveau statut

## Fichiers à modifier
- Toutes routes `/api/admin/*/route.ts` — fix role check
- `/api/admin/disputes/route.ts` GET — ajouter reason/clientArgument dans response
- `/api/admin/kyc/route.ts` GET — ajouter metadata dans la réponse queue
- `/store/admin.ts` — étendre AdminKycRequest interface avec les champs manquants
