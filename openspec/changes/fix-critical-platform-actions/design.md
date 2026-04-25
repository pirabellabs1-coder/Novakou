## Context

FreelanceHigh est deployee sur Vercel (production) avec un mode dual : dev-store en memoire (local) et Prisma (Vercel). Plusieurs chemins de code Prisma sont incomplets ou retournent des shapes differentes du dev-store, causant des crashs frontend. Les actions critiques (publier, acheter, messagerie, admin) ne fonctionnent pas en production.

Architecture actuelle :
- API routes dans `apps/web/app/api/` avec `IS_DEV` branching
- Stores Zustand dans `apps/web/store/` appellent `lib/api-client.ts`
- Pages frontend consomment les stores
- Sur Vercel : `USE_PRISMA_FOR_DATA = true` (pas de dev-store)

## Goals / Non-Goals

**Goals :**
- Corriger TOUS les crashs toLocaleString (null safety)
- Rendre les images et videos des services visibles
- Permettre l'envoi de messages entre tous les roles
- Permettre a l'admin de valider/refuser/pause/feature les services
- Permettre au client d'acheter un service (creation commande)
- Permettre au client de voir et approuver les candidatures
- Rendre l'edition de service fonctionnelle (PATCH complet)

**Non-Goals :**
- Nouveau design UI (on corrige, on n'embellit pas)
- Paiement reel Stripe (le flux Order est cree sans paiement pour le MVP)
- Socket.io temps reel (les messages passent par API REST pour le MVP)
- Nouvelles fonctionnalites non mentionnees dans le proposal

## Decisions

### D1 — Null safety globale via `?? 0` sur tous les toLocaleString
**Choix :** Ajouter `(value ?? 0)` avant chaque `.toLocaleString()` sur des champs numeriques potentiellement undefined.
**Raison :** Approche la plus rapide et non-invasive. Alternative rejetee : helper function `safeFormat()` — trop de refactoring pour le meme resultat.

### D2 — Images ServiceCard : afficher `service.image` dans le composant
**Choix :** Ajouter `<img src={service.image}>` avant le gradient fallback dans la ServiceCard de l'explorer.
**Raison :** Le champ `image` est deja retourne par l'API publique mais jamais utilise dans le rendu.

### D3 — Video : iframe YouTube/Vimeo + video native en fallback
**Choix :** Detecter le type d'URL video et afficher un iframe (YouTube/Vimeo) ou un element `<video>` natif.
**Raison :** Pas de dependance externe, supporte les 3 cas d'usage principaux.

### D4 — Messagerie : POST `/api/conversations/[id]/messages` en Prisma
**Choix :** Verifier et corriger le endpoint de creation de message pour supporter le mode Prisma, et s'assurer que le composant MessagingLayout utilise le bon store.
**Raison :** L'infrastructure existe deja (API + store + composant), seul le wiring Prisma est incomplet.

### D5 — Admin actions : verifier le payload `{ action }` vs `{ status }`
**Choix :** S'assurer que le store admin envoie `{ action: "approve" }` au endpoint PATCH `/api/admin/services/[id]`, pas `{ status: "ACTIF" }`.
**Raison :** L'API attend `action`, le store pourrait envoyer `status` — mismatch a corriger.

### D6 — Commande service : modal inline sans page separee
**Choix :** Ajouter un modal de confirmation sur la page detail service (choix forfait deja fait, ajout requirements, bouton confirmer qui appelle POST `/api/orders`).
**Raison :** Plus simple qu'une page separee, le forfait est deja selectionne dans la sidebar.

### D7 — PATCH service complet : synchroniser ServiceMedia et ServiceOption
**Choix :** Sur PATCH, supprimer les anciennes media/options et recreer les nouvelles (delete + create, pas d'update individuel).
**Raison :** Plus simple et fiable que le diff individuel, pas de risque de doublons.

## Risks / Trade-offs

- **[Risk] toLocaleString fix incomplet** → Mitigation : grep exhaustif de tous les `.toLocaleString(` dans le projet, pas seulement les fichiers connus
- **[Risk] Admin actions marchent en dev mais pas en Prisma** → Mitigation : tester les deux chemins explicitement dans le code
- **[Risk] Delete + Create des media sur PATCH perd les IDs** → Mitigation : acceptable pour le MVP, les IDs ne sont pas references ailleurs
- **[Risk] Modal de commande sans paiement reel** → Mitigation : la commande est creee avec status EN_ATTENTE, le paiement sera integre en V1
