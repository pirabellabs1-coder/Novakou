## Context

L'espace admin FreelanceHigh a des routes API critiques qui n'ont aucune implémentation Prisma. En production (ou sur Vercel), `USE_PRISMA_FOR_DATA` est true, mais certaines routes n'ont pas de branche Prisma et retournent soit des données vides, soit des données factices depuis les dev stores en mémoire.

**État actuel :**
- `/api/admin/orders/route.ts` : 52 lignes, utilise uniquement `orderStore.getAll()` — pas de `if (IS_DEV)` check, pas de Prisma
- `/api/admin/orders/[id]/route.ts` : 334 lignes, toutes les actions (force_delivery, release_escrow, refund) ne touchent que le dev store en mémoire
- `/api/admin/users/route.ts` : le path Prisma existe mais hardcode `revenue: 0` et `totalSpent: 0`
- `/api/admin/wallet/route.ts` : le path dev retourne un wallet vide (0 partout)
- `/api/admin/services/[id]/route.ts` : existe, mais il faut vérifier que le path Prisma fonctionne

**Pattern existant dans les routes admin qui marchent :**
```
const session = await getServerSession(authOptions);
if (role !== "admin" && role !== "ADMIN") return 403;
if (IS_DEV && !USE_PRISMA_FOR_DATA) { /* dev store */ }
// Production: Prisma
```

## Goals / Non-Goals

**Goals:**
- Toutes les routes admin orders fonctionnent avec Prisma en production
- Les actions admin (force_delivery, release_escrow, refund, cancel) persistent en DB avec transactions atomiques
- Les stats utilisateurs (revenue, totalSpent) sont calculées depuis les vraies données Prisma
- Le wallet admin affiche des données réelles même en dev mode
- La modération de services fonctionne de bout en bout avec Prisma

**Non-Goals:**
- Refactoring du frontend admin (les pages consomment déjà le bon format de données)
- Ajout de nouvelles fonctionnalités admin
- Migration des dev stores vers un autre système
- Tests automatisés (validation manuelle)

## Decisions

### 1. Ajouter le dual-mode IS_DEV aux routes orders, pas supprimer les dev stores

**Choix :** Conserver le dev store comme fallback pour le développement local sans DB, mais ajouter la branche Prisma production.

**Rationale :** Le pattern dual-mode est utilisé partout dans le codebase. Supprimer les dev stores casserait le workflow de développement local. On ajoute Prisma en plus, comme les autres routes admin.

### 2. Transactions atomiques pour les actions admin critiques

**Choix :** Utiliser `prisma.$transaction()` pour les actions qui touchent plusieurs tables (release_escrow, refund) — Order + Escrow + AdminWallet + AdminTransaction + Notification dans une seule transaction.

**Rationale :** Les actions financières admin sont critiques. Un échec partiel (escrow libéré mais wallet pas mis à jour) serait catastrophique.

### 3. Revenue/spending calculé via agrégats Prisma

**Choix :** Pour les users admin, calculer revenue avec `prisma.order.aggregate({ where: { freelanceId, status: "TERMINE" }, _sum: { freelancerPayout: true } })` et totalSpent avec `prisma.order.aggregate({ where: { clientId, status: { in: ["TERMINE", "LIVRE"] } }, _sum: { amount: true } })`.

**Rationale :** Plus fiable que maintenir des compteurs dénormalisés. Les agrégats Prisma sont performants sur des volumes MVP (<10K orders).

### 4. Wallet admin — supprimer le mock dev, toujours Prisma

**Choix :** Supprimer le fallback dev qui retourne `{ totalFeesHeld: 0, totalFeesReleased: 0, transactions: [], payouts: [] }`. Toujours utiliser Prisma (le wallet est créé on-the-fly si absent).

**Rationale :** Le wallet admin est une donnée financière critique. Même en dev, il devrait refléter les vrais chiffres de la DB locale.

## Risks / Trade-offs

**[Performance agrégats users]** → Calculer revenue/spending pour chaque user dans une liste fait N+1 queries. Mitigation : utiliser `Promise.all()` pour paralléliser, limiter à 100 users par page (déjà paginé).

**[Atomicité actions admin]** → Si Prisma transaction échoue (table manquante, contrainte), l'action admin échoue silencieusement. Mitigation : try/catch avec fallback basique (juste update Order) + log d'erreur explicite.

**[Wallet dev mode supprimé]** → En dev sans DB locale, l'admin wallet retournera une erreur. Mitigation : le `USE_PRISMA_FOR_DATA` est false en dev local, donc le dev store sera toujours utilisé pour les autres routes. Pour le wallet spécifiquement, on garde un try/catch Prisma avec fallback empty si la DB n'est pas accessible.
