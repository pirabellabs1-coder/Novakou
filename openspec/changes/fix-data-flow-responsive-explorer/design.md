## Context

La plateforme FreelanceHigh a un double mode : **dev mode** (stores JSON en mémoire via `IS_DEV`) et **production** (Prisma/Supabase). Les statuts des services et projets sont définis comme enums Prisma en UPPERCASE (`EN_ATTENTE`, `ACTIF`, `BROUILLON`) mais le code applicatif dev mode utilise des lowercase (`"en_attente"`, `"actif"`). Cela crée des désalignements dans les filtres API.

Pour les projets clients, le formulaire envoie `status: "actif"` mais l'API publique filtre par `status === "ouvert"` — les projets ne correspondent jamais.

L'espace client a été développé avec des grilles fixes (grid-cols-12) et des largeurs minimum qui ne s'adaptent pas aux petits écrans. La page Explorer utilise des filtres inline qui ne stackent pas sur mobile et un grid xl:grid-cols-5 trop serré.

## Goals / Non-Goals

**Goals :**
- Les services publiés par freelances/agences apparaissent en admin pour modération
- Après approbation admin, les services apparaissent dans la marketplace publique
- Les projets publiés par clients apparaissent sur `/offres-projets` pour tous les visiteurs
- L'espace client est utilisable sur mobile (375px), tablette (768px) et desktop (1280px)
- La page Explorer a des filtres propres, cohérents avec le menu catégories de l'accueil

**Non-Goals :**
- Pas de refonte du wizard de création de service (il fonctionne, seul le statut est incorrect)
- Pas de changement du schéma Prisma (les enums sont corrects)
- Pas de refonte complète du design client — corrections ciblées seulement
- Pas d'ajout de nouvelles fonctionnalités (filtres avancés, tri, etc.)

## Decisions

### D1 — Normalisation des statuts : UPPERCASE partout
Le code dev mode et production utilisera les valeurs Prisma enum exactes : `EN_ATTENTE`, `ACTIF`, `BROUILLON`, `PAUSE`, `REFUSE`, `VEDETTE` pour les services et `ouvert`, `pourvu`, `ferme` pour les projets.

**Fichiers impactés :**
- `apps/web/app/api/services/route.ts` — POST : `status: "EN_ATTENTE"`
- `apps/web/app/api/public/services/route.ts` — GET filtre : `status === "ACTIF"` (dev) et `status: "ACTIF"` (prod)
- `apps/web/app/api/admin/services/route.ts` — cohérence des statuts retournés
- `apps/web/app/api/admin/services/[id]/route.ts` — approve → `"ACTIF"`, refuse → `"REFUSE"`
- `apps/web/lib/dev/data-store.ts` — types et valeurs par défaut
- `apps/web/store/dashboard.ts` — comparaisons de statut
- `apps/web/app/admin/services/page.tsx` — tabs et filtres

### D2 — Projets clients : statut "ouvert" à la publication
Le formulaire client enverra `status: "ouvert"` au lieu de `"actif"`. Le store client et l'API de création seront alignés.

**Fichiers impactés :**
- `apps/web/app/client/projets/nouveau/page.tsx` — publier → `status: "ouvert"`
- `apps/web/store/client.ts` — type status inclut `"ouvert" | "pourvu" | "ferme"`
- `apps/web/app/api/projects/route.ts` — accepte et sauvegarde `"ouvert"`

### D3 — Responsive client : breakpoints adaptatifs
Remplacer `grid-cols-12` fixe par des grilles responsives avec `sm:`, `md:`, `lg:` breakpoints. Limiter les `min-w` fixes. Utiliser `flex-col sm:flex-row` pour les rangées de boutons.

### D4 — Explorer : filtres catégories + grid max 4 colonnes
- Grid service : `xl:grid-cols-4` (pas 5)
- Filtres : stacking vertical sur mobile, horizontal sur desktop
- Catégories : même style que le composant `CategoriesSection` de l'accueil
- Toggle vue grille/liste visible sur mobile

## Risks / Trade-offs

| Risque | Mitigation |
|--------|-----------|
| Le changement de statut uppercase casse les données dev existantes | Les données dev sont en mémoire, un redémarrage les recrée. Aucun impact sur la prod Prisma. |
| Le statut "ouvert" pour les projets est différent de "actif" pour les services | C'est voulu : les services passent par la modération admin (EN_ATTENTE → ACTIF), les projets sont publiés directement (ouvert). |
| Les corrections responsive peuvent affecter d'autres pages | On ne touche que les fichiers listés, avec des changements Tailwind ciblés. |
