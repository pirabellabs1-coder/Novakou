## Context

FreelanceHigh est une marketplace freelance en phase MVP. Les modèles Prisma (Service, Order, Review, Boost, Proposition, AdminWallet, etc.) et les routes API existent déjà. Le problème : le frontend affiche des données factices depuis les dev stores Zustand au lieu des vraies données Prisma. Les fonctionnalités SEO, boost et propositions ont des endpoints API mais pas d'UI fonctionnelle connectée.

**État actuel :**
- Cards services : affichent `orderCount`, `rating`, `ratingCount` depuis l'API, mais les valeurs sont souvent 0 ou hardcodées dans les dev stores
- SEO : API GET/PATCH `/api/services/[id]/seo` existe, pas d'UI d'édition, `generateMetadata` n'utilise pas les champs SEO
- Boost : API POST/GET `/api/services/[id]/boost` existe, pas d'UI de sélection/paiement/suivi
- Propositions : API GET/POST `/api/propositions` existe, pas de PATCH accept/reject, pas d'affichage des statuts
- Admin wallet : API existe, pas de dashboard frontend

## Goals / Non-Goals

**Goals:**
- Les cards de services affichent les vraies données Prisma (ventes, avis, note) partout
- Le SEO est fonctionnel de bout en bout (édition → meta tags → Google)
- Le boost a une UI complète (sélection → paiement → stats)
- Les propositions ont un flux complet (envoi → statut → acceptation/rejet)
- Les commissions arrivent dans l'admin wallet à chaque vente
- Tout fonctionne identiquement pour freelance et agence

**Non-Goals:**
- Recherche sémantique IA (V3)
- Boost avec paiement Stripe réel (MVP = déduction wallet interne)
- Notifications push (V4)
- Traduction temps réel dans le chat (V3)
- Meilisearch (V2)

## Decisions

### 1. Supprimer le dual-mode IS_DEV pour les données affichées

**Choix :** Les routes API publiques (`/api/public/services`, `/api/public/top-services`) DOIVENT toujours requêter Prisma, même en dev. Les dev stores restent pour le prototypage de nouvelles pages uniquement.

**Rationale :** Le mode dual (IS_DEV → store, sinon → Prisma) est la cause racine des données factices. En production, IS_DEV=false fonctionne, mais en dev les développeurs voient des faux chiffres et ne détectent pas les bugs de requêtes Prisma.

**Alternative rejetée :** Garder le dual-mode avec un sync store↔Prisma — trop complexe, source de bugs permanente.

### 2. Prisma `_count` et agrégats pour les cards

**Choix :** Utiliser `include: { _count: { select: { orders: true, reviews: true } } }` dans les queries Prisma pour obtenir les vrais compteurs sans requêtes supplémentaires.

**Rationale :** Plus performant que des sous-requêtes ou des champs dénormalisés à maintenir. Prisma `_count` génère un seul `LEFT JOIN` en SQL.

**Note :** Les champs `orderCount`, `rating`, `ratingCount` dénormalisés sur le modèle Service sont maintenus comme cache pour les tris/filtres, mais les cards affichent les valeurs Prisma `_count` pour la fraîcheur.

### 3. SEO via Next.js `generateMetadata` dynamique

**Choix :** La page `/services/[slug]` implémente `generateMetadata()` qui fetch les champs `metaTitle`, `metaDescription`, `tags`, `images` du service via Prisma. Ajouter JSON-LD `Schema.org/Service`.

**Rationale :** C'est le mécanisme natif Next.js 14 pour le SEO. Pas besoin de librairie tierce.

### 4. Boost UI — workflow en 3 étapes

**Choix :**
1. Page `/dashboard/services/boost` : sélectionner un service, choisir le tier (Standard/Premium/Ultime), voir le calcul automatique
2. Confirmation : montrer coût, impressions estimées, durée
3. Page stats `/dashboard/services/boost/[boostId]` : graphiques impressions/clics/contacts/commandes par jour

**Rationale :** Découpage simple en pages plutôt qu'un wizard complexe. Chaque étape est une URL bookmarkable.

### 5. Tracking des impressions boost via middleware léger

**Choix :** Dans les pages explorer et landing, quand un service boosté est affiché, appeler `POST /api/services/[id]/track-view` avec un flag `fromBoost: true`. L'API incrémente le `BoostDailyStat` du jour si un boost est actif.

**Alternative rejetée :** Intersection Observer pour ne tracker que les cards visibles — over-engineering pour le MVP.

### 6. Commission automatique à la création de commande

**Choix :** Dans le flux `order-creation-flow`, après création de l'escrow, calculer la commission selon le plan du freelance (`FREE=20%, PRO=15%, BUSINESS=10%, AGENCE=8%`) et créer un `AdminTransaction` de type `SERVICE_FEE` avec statut `PENDING`. À la libération de l'escrow (validation livraison), le statut passe à `CONFIRMED`.

**Rationale :** La commission est calculée au moment de la commande (le plan ne changera pas rétroactivement). La transaction admin est `PENDING` tant que l'escrow est `HELD`, pour éviter de comptabiliser des revenus non confirmés.

### 7. Propositions — PATCH endpoint simple

**Choix :** Ajouter `PATCH /api/propositions/[id]` avec actions `accept` et `reject`. L'acceptation crée automatiquement une commande (réutilise le flux order-creation-flow). Le rejet met le statut à `REJECTED` + notification.

**Rationale :** Réutiliser le flux de commande existant plutôt que créer un nouveau flux.

## Risks / Trade-offs

**[Performance cards explorer]** → Les queries Prisma avec `_count` + `include` sur 12 services/page sont rapides (<100ms). Si ça ralentit à >500 services, on ajoutera un index composé. Mitigation : pagination existante à 12 items.

**[Données SEO vides au début]** → Les services existants n'ont pas de `metaTitle`/`metaDescription`. Mitigation : fallback sur `title` et `description` du service si les champs SEO sont null.

**[Boost sans paiement réel]** → Au MVP, le boost est "gratuit" (pas de Stripe). Mitigation : le coût est enregistré dans l'escrow et le wallet admin, prêt pour l'intégration Stripe. Le boost est limité par le plan (Gratuit=0, Pro=1/mois, etc.).

**[Dual data freelance/agence]** → Les services agence utilisent les mêmes routes API que les services freelance (filtré par `userId` ou `agencyId`). Risk : bug si un service a les deux. Mitigation : validation Prisma — un service a SOIT `userId` SOIT `agencyId`, jamais les deux.
