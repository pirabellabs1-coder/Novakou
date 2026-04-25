## 1. API Routes — Normalisation des champs nullable

- [x] 1.1 Fix `apps/web/app/api/public/services/[slug]/route.ts` : ajouter `?? []` sur `tags`, `extras`, `faq`, `reviews` dans la reponse
- [x] 1.2 Fix `apps/web/app/api/services/[id]/route.ts` : normaliser les champs tableau dans la reponse
- [x] 1.3 Fix `apps/web/app/api/orders/[id]/route.ts` : garantir que les sous-objets liste renvoient `[]`
- [x] 1.4 Fix `apps/web/app/api/formations/route.ts` : normaliser `sections`, `reviews`, `cohorts` dans les reponses

## 2. Page Detail Service — Gardes null frontend

- [x] 2.1 Fix `apps/web/app/(public)/services/[slug]/page.tsx` : proteger `service.tags.length` avec `(service.tags ?? [])`
- [x] 2.2 Fix meme fichier : proteger `service.extras.length` avec `(service.extras ?? [])`
- [x] 2.3 Fix meme fichier : proteger `service.faq.length` avec `(service.faq ?? [])`
- [x] 2.4 Fix meme fichier : proteger `service.images` et tout `.map()` sur des champs potentiellement null

## 3. Page Detail Formation — Gardes null frontend

- [x] 3.1 Fix `apps/web/app/formations/[slug]/page.tsx` : proteger `formation.sections.length` et `.reduce()`
- [x] 3.2 Fix meme fichier : proteger `formation.reviews.length`
- [x] 3.3 Fix meme fichier : proteger `formation.language.length`
- [x] 3.4 Fix meme fichier : proteger `formation.cohorts.length`

## 4. Pages Commandes — Gardes null frontend

- [x] 4.1 Fix `apps/web/app/client/commandes/page.tsx` : stores initialisent orders a [] — safe
- [x] 4.2 Fix `apps/web/app/dashboard/commandes/page.tsx` : stores initialisent orders a [] — safe
- [x] 4.3 Fix `apps/web/app/dashboard/commandes/[id]/page.tsx` : proteger data.reviews.length
- [x] 4.4 Fix `apps/web/app/agence/commandes/[id]/page.tsx` : verifie — safe

## 5. Autres pages avec patterns a risque

- [x] 5.1 Scan systematique avec grep de `.length` sur des champs potentiellement null dans toutes les pages `apps/web/app/`
- [x] 5.2 Corriger les occurrences trouvees dans les pages admin, agence, dashboard, client
- [x] 5.3 Corriger les occurrences dans les pages formations (instructeur, apprenant, admin)

## 6. Stores Zustand — Initialisation defensive

- [x] 6.1 Verifier et corriger l'initialisation des stores client/dashboard/agence pour que `orders`, `services`, `reviews` soient `[]` par defaut
- [x] 6.2 Verifier le dev data-store (`apps/web/lib/dev/data-store.ts`) pour que les valeurs par defaut soient coherentes

## 7. Verification

- [ ] 7.1 Build complet (`pnpm build`) sans erreur
- [ ] 7.2 Test navigation sur `/services/[slug]`, `/client/commandes`, `/dashboard/commandes`, `/[slug]`
