## 1. Schema Prisma & Migration

- [x] 1.1 Ajouter le champ `clientId` (String?, FK vers User) sur le modèle `Offer` dans `packages/db/prisma/schema.prisma` et ajouter la relation `client User? @relation("OffersReceived", fields: [clientId], references: [id])`
- [x] 1.2 Ajouter la relation inverse `offersReceived Offer[] @relation("OffersReceived")` sur le modèle `User`
- [x] 1.3 Exécuter `prisma migrate dev --name add-offer-clientId` pour créer la migration
- [x] 1.4 Régénérer le client Prisma (`pnpm --filter=db generate`)

## 2. Fix API critique — Service detail (crash Prisma)

- [x] 2.1 Corriger `apps/web/app/api/public/services/[slug]/route.ts` : remplacer `orderBy: { order: "asc" }` par `orderBy: { sortOrder: "asc" }` dans le include `media`
- [x] 2.2 Vérifier que toutes les autres requêtes Prisma sur `ServiceMedia` utilisent `sortOrder` et non `order`

## 3. Fix API — Projets & Budget mapping

- [x] 3.1 Corriger `apps/web/store/client.ts` : dans `syncAll()`, mapper `p.budgetMin`/`p.budgetMax` vers `budget: { type: "fixed", min: p.budgetMin, max: p.budgetMax }` au lieu de `p.budget || { ... }`
- [x] 3.2 Vérifier que `GET /api/public/projects` retourne `budgetMin` et `budgetMax` dans la réponse
- [x] 3.3 Corriger le composant `offres-projets/page.tsx` pour afficher `budgetMin`/`budgetMax` correctement

## 4. Endpoint candidatures côté client

- [x] 4.1 Créer `apps/web/app/api/projects/[id]/bids/route.ts` — GET retourne les `ProjectBid` d'un projet avec les profils freelance (include user + freelancerProfile), vérifie que le requêteur est le propriétaire du projet
- [x] 4.2 Ajouter dans `api-client.ts` la méthode `projectBidsApi.getByProject(projectId)` qui appelle `GET /api/projects/[id]/bids`
- [x] 4.3 Créer `apps/web/app/api/candidatures/[id]/accept/route.ts` — POST accepte une candidature : met `status: "acceptee"`, crée une `Order` avec les détails de la candidature, met le projet en status `pourvu`
- [x] 4.4 Créer `apps/web/app/api/candidatures/[id]/refuse/route.ts` — POST refuse une candidature : met `status: "refusee"`

## 5. Endpoint offres côté client

- [x] 5.1 Modifier `apps/web/app/api/offres/route.ts` — GET : si le requêteur est un client, retourner les offres avec `clientId` = userId OU `clientEmail` = userEmail ; si freelance, retourner ses offres envoyées
- [x] 5.2 Modifier `apps/web/app/api/offres/route.ts` — POST : résoudre `clientId` automatiquement en cherchant un User par `clientEmail` avant de créer l'offre
- [x] 5.3 Créer `apps/web/app/api/offres/[id]/accept/route.ts` — POST accepte une offre : vérifie que le client est le destinataire, met `status: ACCEPTE`, crée une `Order`
- [x] 5.4 Créer `apps/web/app/api/offres/[id]/refuse/route.ts` — POST refuse une offre : met `status: REFUSE`

## 6. Corrections stores Zustand

- [x] 6.1 Corriger `apps/web/store/client.ts` `syncProposals()` : appeler `GET /api/offres` en mode client (qui retourne maintenant les offres reçues) et mapper les champs correctement (freelance name via include, montant, statut)
- [x] 6.2 Corriger `apps/web/store/dashboard.ts` : normaliser la comparaison de status avec `.toUpperCase()` dans les filtres pour gérer le dual-mode DEV/Prisma
- [x] 6.3 Ajouter un appel `syncFromApi()` explicite dans `apps/web/app/dashboard/services/page.tsx` au montage du composant
- [x] 6.4 Corriger `apps/web/store/client.ts` `syncOrders()` : vérifier que les commandes du client sont bien récupérées et mappées avec les noms de freelance

## 7. Corrections pages frontend

- [x] 7.1 Corriger `apps/web/app/client/projets/[id]/page.tsx` : utiliser `projectBidsApi.getByProject(id)` pour afficher les candidatures reçues avec nom, avatar, montant, et boutons accepter/refuser
- [x] 7.2 Corriger `apps/web/app/client/propositions/page.tsx` : afficher les offres personnalisées reçues (depuis le store client corrigé) avec boutons accepter/refuser
- [x] 7.3 Vérifier `apps/web/app/(public)/explorer/page.tsx` : confirmer que les services s'affichent correctement depuis l'API publique
- [x] 7.4 Vérifier `apps/web/app/(public)/offres-projets/page.tsx` : confirmer que les projets s'affichent avec budget correct
- [x] 7.5 Vérifier `apps/web/app/dashboard/commandes/page.tsx` : confirmer que les commandes du freelance s'affichent
- [x] 7.6 Vérifier `apps/web/app/client/commandes/page.tsx` : confirmer que les commandes du client s'affichent

## 8. Seed data enrichi

- [x] 8.1 Enrichir `apps/web/app/api/admin/seed-marketplace/route.ts` : ajouter la création de 3+ commandes (Order + Payment + Conversation) avec statuts variés (EN_ATTENTE, EN_COURS, LIVRE)
- [x] 8.2 Ajouter la création de 10+ candidatures (ProjectBid) sur les projets seed avec statuts variés (en_attente, acceptee, refusee)
- [x] 8.3 Ajouter la création de 5+ offres personnalisées (Offer) avec `clientId` résolu et statuts variés (EN_ATTENTE, ACCEPTE, REFUSE, EXPIRE)
- [x] 8.4 Vérifier l'idempotence : le seed doit nettoyer les données existantes avant recréation (upsert ou delete+create)

## 9. Tests end-to-end des 3 flux

- [x] 9.1 Tester Flow 1 : vérifier qu'un service actif apparaît dans `/explorer`, que le détail s'affiche sans erreur, et qu'une commande peut être créée
- [x] 9.2 Tester Flow 2 : vérifier qu'un projet ouvert apparaît dans `/offres-projets`, qu'un freelance peut postuler, que le client voit la candidature, et que l'acceptation crée une commande
- [x] 9.3 Tester Flow 3 : vérifier qu'un freelance peut créer une offre, que le client la voit dans `/client/propositions`, et que l'acceptation crée une commande
- [x] 9.4 Vérifier les dashboards : freelance voit ses commandes/revenus/offres, client voit ses projets/propositions/commandes
- [x] 9.5 Exécuter le build complet (`pnpm build`) pour vérifier qu'il n'y a pas d'erreurs TypeScript
