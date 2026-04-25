## 1. Fix critique — Sync forcee + invalidation cache localStorage

- [x] 1.1 `store/dashboard.ts` — Bump persist key de `freelancehigh-dashboard-v2` a `freelancehigh-dashboard-v3` pour invalider le cache localStorage existant sur tous les navigateurs.
- [x] 1.2 `dashboard/commandes/[id]/page.tsx` — Ajouter `syncFromApi()` dans un `useEffect` au mount. Ajouter un fallback direct `ordersApi.get(orderId)` si la commande n'est pas trouvee dans le store. Ajouter un skeleton de chargement.
- [x] 1.3 `client/commandes/[id]/page.tsx` — Verifier que `syncOrders()` est bien appele au mount (deja fait). S'assurer que le fallback `ordersApi.get(id)` fonctionne.
- [x] 1.4 `agence/commandes/[id]/page.tsx` — Verifier que `syncAll()` est bien appele au mount (deja fait).

## 2. API — Envoi automatique de message "offer" lors de la creation d'offre

- [x] 2.1 `lib/dev/data-store.ts` — Etendre `conversationStore.sendMessage()` pour accepter un parametre optionnel `offerData`. Ajouter type "offer" au ChatMsg.
- [x] 2.2 `app/api/offres/route.ts` (POST) — Apres la creation de l'offre, trouver ou creer une conversation directe entre le freelance et le client. Envoyer un message de type `"offer"` avec `offerData` complet.

## 3. Composant — OfferMessageCard

- [x] 3.1 Creer `components/messaging/OfferMessageCard.tsx` — Carte riche avec : titre (bold), montant EUR (gros, emerald), delai, revisions, description (tronquee), countdown expiration. Boutons Accepter (emerald) / Refuser (outline rouge) visibles uniquement pour le client si status === "en_attente" et non expiree. Badges de statut : "Acceptee" (vert), "Refusee" (rouge), "Expiree" (gris muted).
- [x] 3.2 Le bouton Refuser ouvre un `ConfirmModal` avant l'appel API. Les deux boutons sont `disabled` quand `loading === true`.

## 4. Integration — Rendu carte dans ChatPanel

- [x] 4.1 Dans le composant de rendu des messages (`components/messaging/`), ajouter une condition : si `message.type === "offer" && message.offerData`, rendre `<OfferMessageCard>` au lieu du rendu texte. (OfferBubble existait deja, integration deja faite dans ChatPanel.tsx)
- [x] 4.2 Passer `onAcceptOffer` et `onRefuseOffer` depuis MessagingLayout avec appels API + reload messages. Passer `currentUserRole` au ChatPanel.

## 5. API — Message systeme apres acceptation d'offre

- [x] 5.1 `app/api/offres/[id]/accept/route.ts` — Apres creation de la commande, envoyer un message systeme dans la conversation : "Offre acceptee ! Commande #[orderId] creee. Le freelance dispose de 3 jours pour commencer le travail."
- [x] 5.2 Mettre a jour le message d'offre existant dans la conversation pour que `offerData.status` passe a `"acceptee"`.

## 6. Store messaging — Actions accept/refuse depuis le chat

- [x] 6.1 `store/messaging.ts` — onAcceptOffer/onRefuseOffer implementes directement dans MessagingLayout via fetch + loadMessages (pas besoin d'actions store separees car les handlers sont dans le composant parent).
- [x] 6.2 Meme approche — les handlers appellent l'API directement et reloaded les messages.

## 7. API — Auto-annulation commandes en_attente > 3 jours

- [x] 7.1 Creer `app/api/orders/auto-cancel/route.ts` (POST) — Scanner les commandes `en_attente` dont `createdAt` < (now - 72h). Retourner `{ cancelled: string[], count: number }`.
- [x] 7.2 `lib/dev/data-store.ts` — Ajouter `orderStore.autoCancelStale(): string[]`.

## 8. API — Auto-validation commandes livre > 7 jours

- [x] 8.1 Creer `app/api/orders/auto-validate/route.ts` (POST) — Scanner les commandes `livre` dont `deliveredAt` < (now - 7 jours). Liberer les fonds escrow. Retourner `{ validated: string[], count: number }`.
- [x] 8.2 `lib/dev/data-store.ts` — Ajouter `orderStore.autoValidateStale(): string[]`.

## 9. Liberation escrow automatique a la validation

- [x] 9.1 `app/api/orders/[id]/route.ts` (PATCH) — Validation manuelle cree deja les transactions vente + commission dans le store. Escrow libere de facto.
- [x] 9.2 `app/api/orders/auto-validate/route.ts` — Auto-validation cree aussi les transactions vente + commission + facture.

## 10. Integration — Auto-cancel/auto-validate au chargement

- [x] 10.1 `store/dashboard.ts` — Dans `syncFromApi()`, appeler auto-cancel + auto-validate en background.
- [x] 10.2 `store/client.ts` — Dans `syncOrders()`, meme logique.
- [x] 10.3 `store/agency.ts` — Dans `syncOrders()`, meme logique.

## 11. Verification end-to-end

- [ ] 11.1 Verifier : freelance cree une offre → message offer dans le chat → client voit la carte avec boutons → client accepte → commande creee → message systeme
- [ ] 11.2 Verifier : commande en_attente → freelance clique Accepter (banner visible) → confirmation modale → status en_cours → Livrer → livre
- [ ] 11.3 Verifier : client voit la commande livree → Valider → termine → formulaire avis → fonds liberes
- [ ] 11.4 Verifier : commande en_attente > 3 jours → auto-annulee au prochain chargement
- [ ] 11.5 Verifier : commande livre > 7 jours → auto-validee au prochain chargement → fonds liberes
- [ ] 11.6 Build reussi sans erreur TypeScript
