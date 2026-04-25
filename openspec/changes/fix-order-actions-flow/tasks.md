## 1. Stores — Propagation d'erreurs et suppression des fallbacks locaux

- [x] 1.1 `store/dashboard.ts` — Modifier `apiAcceptOrder` : supprimer le fallback local dans le catch, retourner `{ success: false, error: string }` au lieu de `true` en cas d'erreur. Extraire le message d'erreur du `Error` object.
- [x] 1.2 `store/dashboard.ts` — Modifier `apiDeliverOrder` : même pattern — supprimer fallback local, retourner l'erreur.
- [x] 1.3 `store/client.ts` — Modifier `validateDelivery` : retourner `{ success: boolean, error?: string }` au lieu de `boolean`. Catcher le message d'erreur.
- [x] 1.4 `store/client.ts` — Modifier `requestRevision` : même pattern.
- [x] 1.5 `store/client.ts` — Modifier `openDispute` : même pattern.
- [x] 1.6 `store/agency.ts` — Modifier `acceptOrder` et `deliverOrder` : même pattern.

## 2. Page Freelance — Confirmation modale + appels API

- [x] 2.1 `dashboard/commandes/[id]/page.tsx` — Ajouter un state `showAcceptModal` et un ConfirmModal pour l'action "Accepter la commande". Le bouton banner ouvre le modal au lieu d'appeler `handleStart` directement.
- [x] 2.2 `dashboard/commandes/[id]/page.tsx` — Ajouter un state `showDeliverModal` et un ConfirmModal pour l'action "Livrer la commande". Le bouton banner ouvre le modal au lieu d'appeler `handleDeliver` directement.
- [x] 2.3 `dashboard/commandes/[id]/page.tsx` — Modifier `handleStart` : utiliser le nouveau retour d'erreur de `apiAcceptOrder`. Afficher le vrai message d'erreur dans le toast en cas d'échec. Supprimer le fallback `updateOrderStatus`.
- [x] 2.4 `dashboard/commandes/[id]/page.tsx` — Modifier `handleDeliver` : utiliser le nouveau retour d'erreur de `apiDeliverOrder`. Supprimer le fallback `updateOrderStatus`.
- [x] 2.5 `dashboard/commandes/[id]/page.tsx` — Dans le banner `livre`, remplacer `updateOrderStatus(order.id, "termine")` et `updateOrderStatus(order.id, "revision")` par des appels API (`ordersApi.update`) avec ConfirmModal. Ces actions sont celles du CLIENT, pas du freelance — vérifier que le banner `livre` côté freelance affiche seulement "En attente de validation par le client" sans bouton d'action (c'est déjà le cas mais les boutons Valider/Revision dans le banner sont incorrects).

## 3. Page Client — Confirmation modale + appels API

- [x] 3.1 `client/commandes/[id]/page.tsx` — Ajouter un state `showValidateModal` et un ConfirmModal pour "Valider la livraison". Le bouton dans le banner `livre` ouvre le modal.
- [x] 3.2 `client/commandes/[id]/page.tsx` — Modifier `handleValidateDelivery` : utiliser le retour enrichi de `validateDelivery`. Afficher le vrai message d'erreur.
- [x] 3.3 `client/commandes/[id]/page.tsx` — Le modal de revision existe déjà (`showRevisionModal`). Vérifier que `handleRequestRevision` utilise le retour enrichi.
- [x] 3.4 `client/commandes/[id]/page.tsx` — Vérifier que le formulaire d'avis post-validation fonctionne : quand le statut passe à `termine`, le re-sync doit recharger l'ordre avec le nouveau statut pour que le formulaire s'affiche.

## 4. Page Agence — Confirmation modale

- [x] 4.1 `agence/commandes/[id]/page.tsx` — Ajouter un ConfirmModal pour "Accepter la commande" (le `handleAccept` existe déjà, ajouter juste la confirmation).
- [x] 4.2 `agence/commandes/[id]/page.tsx` — Ajouter un ConfirmModal pour "Livrer la commande" (le `handleDeliver` existe déjà, ajouter juste la confirmation).
- [x] 4.3 `agence/commandes/[id]/page.tsx` — Adapter les handlers pour utiliser le retour enrichi des stores.

## 5. Fix critique — Banner freelance sur statut `livre`

- [x] 5.1 `dashboard/commandes/[id]/page.tsx` — Le banner quand `status === "livre"` affiche des boutons "Valider la livraison" et "Demander une revision" — ces actions sont celles du CLIENT, pas du freelance. Remplacer ces boutons par un message informatif "En attente de validation par le client" (le freelance ne peut rien faire quand c'est `livre`).

## 6. Vérification end-to-end

- [ ] 6.1 Vérifier que le flux complet fonctionne : commande `en_attente` → clic Accepter → confirmation → `en_cours` → clic Livrer → confirmation → `livre` → (côté client) clic Valider → confirmation → `termine` → formulaire avis → publier avis
- [ ] 6.2 Vérifier que les erreurs API sont correctement propagées (tester avec une commande inexistante)
- [ ] 6.3 Build réussi (`pnpm build --filter=@freelancehigh/web`) sans erreur TypeScript
