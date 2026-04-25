## Context

Le module formations dispose d'un pipeline complet (API cart, checkout, enrollment, progress, dashboard stats) mais le flux est cassé à 3 endroits critiques :

1. **baseUrl incorrect** : `checkout/route.ts` utilise `process.env.NEXTAUTH_URL ?? "http://localhost:3450"` — le port par défaut est 3450 (config Playwright) alors que l'app Next.js tourne sur 3000. En mock mode, le payment crée les enrollments mais redirige vers un port mort.

2. **Mock payment handling côté client** : Quand `PaymentService` retourne `provider: "mock"` avec `checkoutUrl: null`, le checkout route renvoie `{ url: "http://localhost:3450/formations/succes?..." }` au client, mais le client fait `window.location.href = data.url` — ce qui redirige vers le mauvais port. Même une fois le port fixé, le flow mock devrait idéalement rediriger côté serveur plutôt que de construire un URL absolu.

3. **Pas de feedback UX** : Les boutons "Ajouter au panier" et "Acheter" n'affichent aucun toast/notification de succès ni d'erreur. L'utilisateur ne sait pas si l'action a fonctionné.

Conséquence en cascade : comme aucun enrollment ne se crée correctement, le dashboard apprenant affiche 0 partout.

## Goals / Non-Goals

**Goals:**
- Corriger le baseUrl pour utiliser `http://localhost:3000` en dev (cohérent avec le port Next.js)
- Corriger le flux mock payment pour que `buyNow()` et `checkout()` fonctionnent sans Stripe configuré
- Ajouter un feedback visuel (toast) pour "Ajouter au panier"
- S'assurer que les enrollments se créent correctement après achat (mock ou Stripe)
- Valider que le dashboard stats affiche les données réelles après qu'un enrollment existe

**Non-Goals:**
- Refactorer le PaymentService (fonctionne correctement)
- Modifier le schéma Prisma
- Toucher à la marketplace / services / commandes
- Ajouter de nouvelles fonctionnalités au module formations
- Implémenter des vrais paiements Stripe (MVP = mock mode)

## Decisions

### D1 : Utiliser `NEXT_PUBLIC_APP_URL` comme source de vérité pour le baseUrl

**Choix** : Remplacer `process.env.NEXTAUTH_URL ?? "http://localhost:3450"` par `process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"`.

**Pourquoi** : `NEXT_PUBLIC_APP_URL` est déjà utilisé dans d'autres routes (e.g. `progress/route.ts:145`). Le fallback `localhost:3000` correspond au port Next.js par défaut configuré dans le turbo.json.

**Alternative rejetée** : Utiliser uniquement `NEXTAUTH_URL` — cela nécessite que l'env var soit définie même en dev local, ce qui n'est pas garanti.

### D2 : Redirection client-side avec URL relative pour mock payments

**Choix** : Quand le checkout retourne un résultat mock (`mock: true`), utiliser `router.push("/succes?session_id=xxx")` au lieu de `window.location.href = data.url` (URL absolue).

**Pourquoi** : Les URL relatives fonctionnent quelque soit le port. Cela évite totalement le problème de baseUrl pour le flow mock.

**Alternative rejetée** : Toujours utiliser `window.location.href` — cela nécessite un baseUrl correct, plus fragile.

### D3 : Toast simple avec Tailwind (pas de lib supplémentaire)

**Choix** : Utiliser un composant toast inline (state local + animation Tailwind) plutôt que react-hot-toast ou sonner.

**Pourquoi** : Le projet utilise déjà shadcn/ui qui inclut un composant Toast. On peut utiliser un simple state + auto-dismiss pour le feedback "Ajouté au panier".

**Alternative rejetée** : Installer `sonner` ou `react-hot-toast` — dépendance supplémentaire inutile pour un seul message.

### D4 : Pas de modification au calcul des stats

**Choix** : Le code stats dans `/api/apprenant/enrollments` est correct. Les stats affichent 0 uniquement parce que les enrollments ne se créent jamais. Fixer le flow d'achat suffit.

**Pourquoi** : Après relecture, le calcul de `inProgress`, `completed`, `certificates`, `totalHours`, `streak` est correct. Il n'y a pas de bug de division ou d'edge case non géré dans les stats.

## Risks / Trade-offs

- **[Risk] Le flow mock crée les enrollments dans le handler checkout** → Si le process crash après création mais avant le redirect, l'enrollment existe mais l'utilisateur ne le sait pas. **Mitigation** : Le `/checkout/verify` gère déjà ce cas (fallback enrollment creation). Acceptable pour MVP.

- **[Risk] `router.push` pour les mocks vs `window.location.href` pour Stripe** → Deux chemins de redirection différents. **Mitigation** : Clairement conditionné sur `data.mock === true`. En production avec Stripe, seul `window.location.href` sera utilisé (vers Stripe Checkout).

- **[Trade-off] Toast inline vs composant shadcn Toast** → Le toast inline est plus simple mais moins réutilisable. Acceptable pour un seul use case. On pourra migrer vers le composant shadcn si d'autres toasts sont nécessaires plus tard.
