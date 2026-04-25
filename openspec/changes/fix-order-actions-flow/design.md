## Context

Le flux de commande FreelanceHigh suit 5 étapes : `en_attente` → `en_cours` → `livre` → `termine` → avis.

**État actuel :**
- L'API `/api/orders/[id]` PATCH fonctionne correctement en mode dev (IS_DEV bypass auth, orderStore.accept/deliver/update fonctionnent)
- Les stores Zustand (`dashboard.ts`, `client.ts`, `agency.ts`) appellent `ordersApi.update()` qui fait un PATCH vers l'API
- Les boutons d'action existent sur les pages de détail de commande
- **Problème principal** : quand une action échoue (erreur réseau, erreur API), les stores catch l'erreur et retournent `false` sans message — l'UI affiche un toast générique "Erreur" sans la vraie raison
- **Problème secondaire** : les actions ne demandent pas de confirmation avant exécution (sauf annulation sur la page freelance qui a déjà un ConfirmModal)
- **Problème tertiaire** : sur la page freelance (`dashboard/commandes/[id]`), les boutons "Valider la livraison" et "Demander une revision" dans le banner `livre` utilisent `updateOrderStatus` (local seulement) au lieu d'appeler l'API

## Goals / Non-Goals

**Goals:**
- Chaque action de commande DOIT passer par l'API (pas de fallback local-only)
- Chaque action critique DOIT demander confirmation via ConfirmModal avant exécution
- Chaque erreur DOIT afficher le vrai message d'erreur (pas un générique)
- Le flux complet accepter → livrer → valider → avis DOIT fonctionner de bout en bout
- L'état UI DOIT se re-synchroniser après chaque action réussie

**Non-Goals:**
- Pas de changement au schéma Prisma
- Pas de nouveau endpoint API (le PATCH existant couvre tout)
- Pas de modification de l'escrow logic (déjà correct)
- Pas de modification du flow de paiement
- Pas d'ajout de messagerie sur les pages de commande

## Decisions

### 1. Pattern d'action : API-first avec ConfirmModal

**Choix :** Chaque action suit le pattern :
```
Bouton cliqué → ConfirmModal s'ouvre → Utilisateur confirme →
Loading state → Appel API via store → Succès: toast + re-sync | Erreur: toast avec message
```

**Alternative rejetée :** Appel direct sans confirmation — risqué car les actions sont irréversibles (accepter une commande, valider une livraison).

**Rationale :** Le ConfirmModal existe déjà et est utilisé pour l'annulation. On étend son usage à toutes les actions critiques.

### 2. Propagation d'erreurs des stores

**Choix :** Les fonctions store qui catch les erreurs retournent `{ success: boolean; error?: string }` au lieu de `boolean` simple. Cela permet à l'UI d'afficher le vrai message.

**Alternative rejetée :** Laisser les stores throw — incompatible avec le pattern try/catch actuel de toutes les pages.

**Alternative rejetée :** Garder le retour `boolean` et afficher un toast générique — l'utilisateur ne sait pas pourquoi ça échoue.

### 3. Re-sync après action

**Choix :** Après chaque action réussie, appeler `syncOrders()` pour recharger l'état depuis l'API. Cela garantit que l'UI reflète exactement l'état serveur (timeline mise à jour, progress, statut).

**Rationale :** Les fonctions `apiAcceptOrder` et `apiDeliverOrder` dans dashboard.ts font déjà un `mapApiOrderToLocal(result)` pour mettre à jour l'état — mais si l'API échoue, le fallback local crée un décalage. En supprimant le fallback local et en forçant le re-sync, on évite les incohérences.

### 4. Pas de fallback local

**Choix :** Supprimer les fallbacks locaux dans les stores (le code qui fait `updateOrderStatus(order.id, "en_cours")` quand l'API échoue). Si l'API échoue, l'action échoue et l'erreur est affichée.

**Rationale :** Un fallback local crée un état incohérent entre l'UI et le serveur. L'utilisateur croit que l'action a réussi alors que le serveur n'a pas changé d'état. Sur Vercel (lecture seule), les mutations locales ne persistent pas entre les recharges de page.

### 5. Page freelance : actions dans le banner uniquement

**Choix :** Les actions principales (Accepter, Livrer) sont UNIQUEMENT dans les banners en haut de page. Pas de duplication dans d'autres sections.

**Rationale :** Évite la confusion de l'utilisateur qui ne sait pas quel bouton utiliser.

## Risks / Trade-offs

- **[Latence réseau]** → Le loading state et le spinner montrent que l'action est en cours. Le bouton est disabled pendant le chargement.
- **[Double clic]** → Le bouton disabled pendant le loading empêche les doubles soumissions.
- **[Erreur API silencieuse]** → Le message d'erreur de l'API est propagé jusqu'au toast.
- **[Vercel read-only FS]** → Le data-store.ts gère déjà le mode Vercel (mémoire cache vs fichier). Pas de risque supplémentaire.
