## Why

L'erreur `Cannot read properties of null (reading 'length')` survient sur plusieurs pages critiques de la plateforme (page service, commandes, formations), empechant les utilisateurs de consulter les services et de passer commande. Les champs tableaux (`tags`, `extras`, `faq`, `reviews`, `sections`, `orders`) peuvent etre `null` depuis l'API ou le store Zustand, mais le frontend appelle `.length` sans garde null.

## What Changes

- Ajout de gardes null (`?? []`) sur tous les acces `.length` a des champs potentiellement null dans les pages frontend
- Normalisation des reponses API pour garantir des tableaux vides (`[]`) au lieu de `null` pour les champs liste
- Initialisation defensive des stores Zustand pour que les arrays ne soient jamais `null`
- Version cible : **MVP** (bug bloquant en production)

## Capabilities

### New Capabilities
- `null-safe-arrays`: Securisation de tous les acces a `.length`, `.map()`, `.filter()`, `.reduce()` sur les champs tableaux potentiellement null dans les pages services, commandes, formations et les API routes associees

### Modified Capabilities

## Impact

- **Pages frontend touchees :**
  - `apps/web/app/(public)/services/[slug]/page.tsx` — `tags.length`, `extras.length`, `faq.length`
  - `apps/web/app/formations/[slug]/page.tsx` — `sections.length`, `reviews.length`, `language.length`
  - `apps/web/app/client/commandes/page.tsx` — `orders.filter().length`
  - `apps/web/app/dashboard/commandes/page.tsx` — `orders.filter().length`
  - Autres pages utilisant des patterns similaires
- **API routes touchees :**
  - `apps/web/app/api/public/services/[slug]/route.ts` — normalisation des champs nullable
  - `apps/web/app/api/orders/[id]/route.ts`
- **Stores Zustand :** initialisation defensive des tableaux
- **Pas d'impact sur le schema Prisma** — corrections purement frontend/API
- **Pas de job BullMQ, Socket.io ou template email concerne**
- **Impact sur tous les roles** : le bug touche les pages publiques (visiteurs), freelance (dashboard commandes) et client (commandes, explorer)
