## 1. Fix litiges admin (examine + resolve)

- [x] 1.1 Ajouter les champs dispute optionnels à l'interface `StoredOrder` dans `apps/web/lib/dev/data-store.ts` : `disputeStatus?`, `disputeReason?`, `disputeVerdict?`, `disputeVerdictNote?`, `disputePartialPercent?`, `disputeResolvedAt?`
- [x] 1.2 Ajouter `disputeStatus: "ouvert"` et `disputeReason` aux seed orders ORD-1004 et ORD-1005 dans `getDefaultOrders()`
- [x] 1.3 Ajouter un dev auth bypass dans `POST /api/admin/disputes` (route.ts) — si `IS_DEV && !session`, utiliser un mock admin session au lieu de retourner 403
- [x] 1.4 Retirer les casts `as Partial<typeof order>` dans les appels `orderStore.update()` du handler POST — TypeScript doit valider naturellement grâce aux nouveaux champs
- [x] 1.5 Vérifier que `createNotification()` et `createAuditLog()` ne crashent pas en dev mode (try/catch si nécessaire)
- [x] 1.6 Tester manuellement : examiner un litige, puis résoudre avec chaque verdict (freelance, client, partiel)

## 2. Fix factures freelance liées aux vraies commandes

- [x] 2.1 Vérifier que les seed orders dans `getDefaultOrders()` incluent au moins 3 commandes avec `status: "termine"` et des `completedAt` valides pour le freelanceId dev (`user-freelance-001`)
- [x] 2.2 Vérifier la page `/dashboard/factures/page.tsx` : le filtre `orders.filter(o => o.status === "termine" || ...)` doit matcher les statuts des seed orders
- [x] 2.3 S'assurer que `syncFromApi()` dans le store dashboard charge correctement les orders depuis `/api/orders` en dev mode et que le freelanceId correspond
- [x] 2.4 Tester manuellement : les factures affichent des données cohérentes (client, montant, date) liées aux commandes réelles

## 3. Fix plan actif ignoré (productivité + automatisation)

- [x] 3.1 Dans `/dashboard/layout.tsx`, ajouter un `useEffect` qui lit `session.user.plan` via `useSession()` et appelle `useDashboardStore.getState().setCurrentPlan(normalizePlanName(plan))` au mount
- [x] 3.2 Vérifier que `setCurrentPlan` existe dans le store dashboard (l'ajouter si absent)
- [x] 3.3 Vérifier `/dashboard/productivite/page.tsx` : `hasProductiviteAccess(plan)` doit retourner true quand le plan est "ascension" ou supérieur
- [x] 3.4 Appliquer le même pattern dans `/agence/layout.tsx` si l'agence a des pages gate-kept par plan
- [x] 3.5 Tester manuellement : avec un user dev en plan "ascension", la page productivité affiche les features (pas le gate)

## 4. Fix plans admin (alignement clés)

- [x] 4.1 Mettre à jour `config-service.ts` : remplacer les clés `gratuit/pro/business/agence` par `decouverte/ascension/sommet/agence_starter/empire` dans `getDefaultConfig()` avec les valeurs de `lib/plans.ts` PLAN_RULES
- [x] 4.2 Mettre à jour la page `/admin/plans/page.tsx` pour lire les plans depuis `config.plans` avec les clés elevation et afficher correctement les 5 plans
- [x] 4.3 S'assurer que la sauvegarde admin persiste sous les bonnes clés elevation dans le config-service
- [x] 4.4 Grep exhaustif pour trouver toute référence aux anciennes clés (`config.plans.gratuit`, `config.commissions.gratuit`, etc.) et les migrer
- [x] 4.5 Tester manuellement : la page admin plans affiche les 5 plans avec les bons prix et commissions, et l'édition persiste

## 5. Validation finale

- [x] 5.1 Supprimer le fichier `orders.json` s'il existe dans le dossier dev data (pour forcer le reload des defaults propres)
- [x] 5.2 Lancer `pnpm dev --filter=@freelancehigh/web` et vérifier : litiges admin fonctionnent, factures affichent des données réelles, productivité respecte le plan, plans admin sont cohérents
- [x] 5.3 Vérifier qu'aucune erreur console n'apparaît sur les 4 pages corrigées
