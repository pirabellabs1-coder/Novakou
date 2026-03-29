## 1. Fix détection plan pour boosts

- [x] 1.1 Dans `app/dashboard/boost/page.tsx`, importer `currentPlan` depuis `useDashboardStore` et `canBoost`/`normalizePlanName` depuis `lib/plans.ts`
- [x] 1.2 Appeler `canBoost(normalizePlanName(currentPlan), monthlyBoostCount)` et n'afficher le message de blocage que si le plan ne le permet vraiment pas
- [x] 1.3 Afficher le nom du plan actuel dans le message (ex: "Votre plan Ascension permet X boosts/mois")

## 2. Fix dashboard client vide

- [x] 2.1 Dans `store/client.ts` → `syncAll()`, stocker le résultat de `financesApi.summary()` dans `state.financeSummary` (le fetch existe mais le résultat n'est pas assigné)
- [x] 2.2 Ajouter une méthode `syncFinanceSummary()` dédiée dans le store client pour les pages qui en ont besoin isolément
- [x] 2.3 Dans `app/client/page.tsx`, connecter les cartes du dashboard aux bonnes données : commandes actives depuis `orders`, dépenses depuis `financeSummary.totalSpent`, projets actifs depuis `projects`
- [x] 2.4 S'assurer que `syncAll()` charge aussi les projets et commandes correctement

## 3. Fix diagramme mobile (répartition commandes client)

- [x] 3.1 Dans `app/client/page.tsx`, détecter la taille d'écran (hook ou media query)
- [x] 3.2 Sur mobile : désactiver les labels inline du PieChart (`label={false}`) et afficher la légende en dessous avec `flexWrap` et retour à la ligne
- [x] 3.3 Sur desktop : garder les labels inline existants

## 4. Fix avis client — blocage litige + erreur détaillée

- [x] 4.1 Dans `app/api/reviews/route.ts` (POST), ajouter une validation : si `order.status === "litige"` ou `"DISPUTE"`, retourner 400 avec message "Impossible de laisser un avis pour une commande en litige"
- [x] 4.2 Dans `app/client/avis/page.tsx`, filtrer les commandes en litige de la liste des "avis à donner" (ne pas afficher les commandes avec statut litige/dispute)
- [x] 4.3 Dans `store/client.ts` → `submitReview()`, retourner le message d'erreur de l'API au lieu de juste `false`
- [x] 4.4 Dans `app/client/avis/page.tsx`, afficher le message d'erreur spécifique dans le toast au lieu du message générique

## 5. Fix paiement & facturation client vides

- [x] 5.1 Dans `app/client/factures/page.tsx`, appeler `syncFinanceSummary()` au chargement (en plus de syncOrders/syncInvoices)
- [x] 5.2 Connecter les cartes "Total dépensé", "En attente", "Crédits" aux données de `financeSummary`
- [x] 5.3 S'assurer que les factures s'affichent correctement si des données existent

## 6. Système de crédits client (structure)

- [x] 6.1 Ajouter le champ `credits: number` (default 0) dans le `ClientState` du store
- [x] 6.2 Populer `credits` depuis la réponse API finance summary (ou default 0)
- [x] 6.3 Afficher la carte "Crédits" dans `/client/factures` avec le solde
- [x] 6.4 Ajouter un bouton "Recharger" qui affiche un toast "Rechargement de crédits bientôt disponible"

## 7. Suspension de projets client

- [x] 7.1 Ajouter une méthode `pauseProject(id)` et `resumeProject(id)` dans `store/client.ts` qui appellent `PATCH /api/projects/[id]`
- [x] 7.2 Dans `app/api/projects/[id]/route.ts`, gérer le PATCH pour `{ status: "suspendu" }` et `{ status: "ouvert" }` (vérifier que le projet appartient au client)
- [x] 7.3 Dans `app/client/projets/page.tsx`, ajouter un bouton "Suspendre" pour les projets ouverts et "Reprendre" pour les projets suspendus
- [x] 7.4 Afficher un badge "Suspendu" sur les projets en pause

## 8. Fix litiges client vides

- [x] 8.1 Dans `store/client.ts` → `syncDisputes()`, normaliser les statuts avec `.toLowerCase()` pour filtrer les commandes en litige (gérer "litige", "DISPUTE", "dispute")
- [x] 8.2 Dans `app/client/litiges/page.tsx`, s'assurer que les compteurs (en cours, en attente, résolus, total) sont calculés correctement
- [x] 8.3 Vérifier que les litiges s'affichent dans la liste même si le statut est en uppercase

## 9. Fix boosts freelance/agence — badges et visibilité

- [x] 9.1 Dans `app/dashboard/services/page.tsx`, afficher un badge "Boosted" sur les services qui ont un boost actif (vérifier le champ `isBoosted` ou `activeBoost`)
- [x] 9.2 Afficher la date d'expiration du boost sous le badge
- [x] 9.3 Dans `app/agence/services/page.tsx`, ajouter le même badge boost pour les services de l'agence
- [x] 9.4 S'assurer que les stats de boost (vues, clics) sont accessibles depuis la page des services

## 10. Vérification

- [x] 10.1 Vérifier que le build passe : `pnpm build --filter=@freelancehigh/web`
- [x] 10.2 Tester manuellement les corrections sur les pages impactées
