## Context

Plusieurs pages critiques de la plateforme FreelanceHigh crashent avec l'erreur `Cannot read properties of null (reading 'length')`. Le probleme vient d'un pattern repete : le frontend appelle `.length`, `.map()`, `.filter()` ou `.reduce()` sur des champs qui peuvent etre `null` ou `undefined` au lieu d'etre des tableaux vides.

Sources du probleme :
1. Les API routes renvoient parfois `null` pour des champs JSON Prisma optionnels (`tags`, `extras`, `faq`)
2. Les stores Zustand initialisent certains champs a `null` au lieu de `[]`
3. Le dev data-store ne reproduit pas toujours le meme shape que la DB reelle

## Goals / Non-Goals

**Goals:**
- Eliminer 100% des erreurs `Cannot read properties of null (reading 'length')` sur les pages services, commandes et formations
- Garantir que les API routes renvoient toujours des tableaux vides (`[]`) au lieu de `null` pour les champs liste
- Appliquer des gardes null defensives sur le frontend pour les champs critiques

**Non-Goals:**
- Refactoring complet du typage TypeScript (hors scope)
- Migration vers un pattern global de validation Zod cote client
- Modification du schema Prisma (les champs JSON restent optionnels)

## Decisions

### 1. Defense en profondeur — corriger aux deux niveaux (API + Frontend)

**Choix :** Appliquer `?? []` a la fois dans les reponses API ET dans les composants frontend.

**Raison :** Corriger uniquement l'API ne protege pas contre les donnees deja en cache cote client (TanStack Query). Corriger uniquement le frontend masque le fait que l'API renvoie des donnees mal formees. La double protection garantit la robustesse.

### 2. Pattern `(value ?? [])` plutot que `value || []`

**Choix :** Utiliser le nullish coalescing (`??`) et non le OR logique (`||`).

**Raison :** `||` convertirait aussi un tableau vide `[]` (falsy en aucun cas, mais eviter la confusion avec `0` ou `""` sur d'autres champs). `??` ne declenche que sur `null`/`undefined`, ce qui est plus precis et idiomatique en TypeScript.

### 3. Pas d'utilitaire generique — corrections inline

**Choix :** Corriger chaque occurrence directement avec `?? []` plutot que de creer un helper `ensureArray()`.

**Raison :** Un bug fix ne doit pas introduire d'abstraction. Les corrections inline sont plus lisibles, plus faciles a reviewer, et ne creent pas de dependance.

## Risks / Trade-offs

- **Risque : oubli d'une occurrence** → Mitigation : recherche systematique avec `grep` sur `.length`, `.map(`, `.filter(`, `.reduce(` dans toutes les pages identifiees
- **Risque : regression sur le rendu conditionnel** → Mitigation : les conditions `(arr ?? []).length > 0` produisent le meme resultat que `arr.length > 0` quand `arr` est un tableau valide
- **Trade-off : duplication du `?? []`** → Acceptable pour un bug fix ; un refactoring futur pourra normaliser les types
