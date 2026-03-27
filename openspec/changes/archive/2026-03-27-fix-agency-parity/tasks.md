## 1. Corrections API — Filtrage agence

- [x] 1.1 Modifier `/api/orders/route.ts` Prisma path : quand `userRole === "AGENCE"` et pas de `?side` filtre, utiliser `{ OR: [{ agencyId: agencyProfileId }, { clientId: session.user.id }] }` — exclure `{ freelanceId }` pour ne pas mélanger commandes personnelles et agence. Idem pour `?side=seller` : filtrer UNIQUEMENT par `agencyId`, pas `freelanceId`
- [x] 1.2 Modifier `/api/propositions/route.ts` GET Prisma path : détecter l'agencyProfileId si le user a le rôle AGENCE, puis utiliser `{ OR: [{ freelanceId: session.user.id }, { agencyId: agencyProfileId }] }` au lieu de juste `{ freelanceId }`

## 2. Commission agence — Corriger le taux

- [x] 2.1 Modifier `/agence/finances/page.tsx` : remplacer `const COMMISSION_RATE = 0.1` par un import depuis `@/lib/plans` — utiliser `getPlanLimits("agence").commissionRate` ou directement `0.08` pour le plan Agence

## 3. Page escrow agence

- [x] 3.1 Créer `/agence/escrow/page.tsx` : adapter la page freelance escrow — utiliser `useAgencyStore` pour récupérer les commandes agence, mapper les statuts vers les catégories escrow (depot/validation/libere/litige), afficher une grille filtrable avec statut, montant, commission, net, lien commande
- [x] 3.2 Ajouter un lien "Escrow" dans la sidebar/navigation agence si ce n'est pas déjà fait

## 4. Page propositions agence

- [x] 4.1 Créer `/agence/propositions/page.tsx` : fetch `GET /api/propositions?role=freelance`, afficher la liste avec titre, client, montant, délai, statut coloré (SENT=bleu, VIEWED=indigo, ACCEPTED=vert, REJECTED=rouge, EXPIRED=gris), filtres par statut, lien vers commande si acceptée
- [x] 4.2 Ajouter un lien "Propositions" dans la sidebar/navigation agence si ce n'est pas déjà fait

## 5. Vérification cohérence

- [x] 5.1 Vérifier que `/agence/commandes/[id]` affiche le statut escrow de la commande (escrowStatus devrait déjà être présent dans les données order)
- [x] 5.2 Vérifier que les notifications sont créées pour les événements agence (acceptation proposition, livraison, escrow release) en vérifiant que le Prisma path des routes concernées inclut bien `agencyId` dans les notifications
