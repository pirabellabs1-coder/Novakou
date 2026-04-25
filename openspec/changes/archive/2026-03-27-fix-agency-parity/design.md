## Context

L'espace agence (`/agence`) est structurellement à 70-80% complet mais a des problèmes critiques de filtrage API et des pages manquantes par rapport à l'espace freelance (`/dashboard`). L'agence a un `AgencyProfile` avec un `id` distinct du `userId`, et les commandes/propositions peuvent être liées via `agencyId`.

**État actuel :**
- `/api/orders` : Quand rôle=AGENCE sans filtre `?side`, inclut `freelanceId` ET `agencyId` dans OR → mélange commandes perso et agence
- `/api/propositions` : GET ne filtre que par `freelanceId`, ignore `agencyId` → propositions agence invisibles
- `/agence/finances` : `COMMISSION_RATE = 0.1` hardcodé (devrait être 0.08)
- `/agence/escrow` : Page absente
- `/agence/propositions` : Page absente
- `/agence/commandes/[id]` : Existe déjà, mais sans info escrow

## Goals / Non-Goals

**Goals:**
- Orders API filtre correctement par agencyId pour les agences (pas de mélange avec ordres personnels)
- Propositions API inclut agencyId dans le filtre GET
- Commission agence = 8% partout
- Page escrow agence créée (miroir de la version freelance)
- Page propositions agence créée

**Non-Goals:**
- Page affiliation agence (V1+)
- Page productivité agence (V2+)
- Page certifications agence (V3)
- Refactoring du store agence

## Decisions

### 1. Filtre orders : prioriser agencyId quand le rôle est AGENCE

**Choix :** Quand `userRole === "AGENCE"` et qu'il n'y a pas de filtre `?side`, utiliser `{ OR: [{ agencyId: agencyProfileId }, { clientId: session.user.id }] }` — exclure `{ freelanceId }` pour ne pas mélanger les commandes personnelles.

**Rationale :** Un owner d'agence peut aussi être freelance indépendant. L'espace agence doit montrer UNIQUEMENT les commandes de l'agence.

### 2. Filtre propositions : OR freelanceId + agencyId

**Choix :** Pour le rôle freelance/agence, utiliser `{ OR: [{ freelanceId }, { agencyId }] }` en détectant l'agencyProfileId.

**Rationale :** Les propositions agence ont `agencyId` set lors de la création. Le freelanceId est aussi set (l'owner). On veut les deux pour couvrir les cas.

### 3. Commission : utiliser la constante centralisée

**Choix :** Remplacer `COMMISSION_RATE = 0.1` par import depuis `@/lib/plans` (getPlanLimits).

**Alternative rejetée :** Hardcoder `0.08` — fragile si le taux change.

### 4. Page escrow : adapter la version freelance

**Choix :** Copier la structure de `/dashboard/escrow/page.tsx` mais utiliser `useAgencyStore` au lieu de `useDashboardStore`. Filtrer les commandes par `agencyId`.

**Rationale :** La logique escrow est identique (mêmes statuts, mêmes étapes). Seule la source de données change.

### 5. Page propositions : composant léger

**Choix :** Créer `/agence/propositions/page.tsx` qui fetch `GET /api/propositions?role=freelance` (les propositions envoyées par l'agence) et affiche la liste avec statuts.

**Rationale :** L'API propositions sera corrigée pour inclure agencyId, donc les propositions agence seront visibles.

## Risks / Trade-offs

**[Filtre orders sans freelanceId]** → Un agency owner qui est aussi freelance ne verra pas ses commandes freelance dans l'espace agence. C'est voulu : l'espace agence = commandes agence, l'espace dashboard = commandes perso. L'user peut basculer entre les deux espaces.

**[Page escrow dupliquée]** → On copie du code de la version freelance. Si la logique escrow change, il faudra mettre à jour les deux pages. Mitigation : extraire un composant partagé dans une future itération.
