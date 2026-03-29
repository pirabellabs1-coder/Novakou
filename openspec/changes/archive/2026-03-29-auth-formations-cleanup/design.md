## Context

La plateforme FreelanceHigh utilise NextAuth (credentials provider) avec un JWT strategy pour l'authentification. Le système actuel gère 4 rôles principaux : `freelance`, `client`, `agence`, `admin`. Un module formations a été ajouté récemment avec 3 sous-rôles (`apprenant`, `instructeur`, `admin formations`) mais son intégration auth est incomplète :

- L'API `/api/auth/register` n'accepte que `role: "freelance" | "client" | "agence"` via Zod
- Le JWT ne contient pas de champ `formationsRole`
- Le middleware redirige les utilisateurs authentifiés loin des pages d'auth formations
- La page de connexion principale mentionne "Afrique" alors que la plateforme est internationale
- L'inscription n'a pas de confirmation de mot de passe
- ~8 pages dashboard contiennent des tableaux DEMO_ hardcodés
- Le mode vacances freelance n'est pas visible sur le profil public

## Goals / Non-Goals

**Goals:**
- Rendre l'authentification formations pleinement fonctionnelle (inscription + connexion + redirection par rôle)
- Supprimer toutes les données démo/hardcodées de chaque espace
- Afficher le mode vacances sur le profil public du freelance
- Corriger le texte "Afrique" et ajouter la confirmation de mot de passe
- Zéro conflit entre la session FreelanceHigh principale et l'espace formations

**Non-Goals:**
- Pas de migration Prisma — `formationsRole` est stocké dans le dev store (dev) ou custom claims Supabase (prod)
- Pas de refactoring de l'architecture auth (on étend NextAuth, on ne le remplace pas)
- Pas de création d'API backend Fastify/tRPC pour les données dashboard — on utilise les API routes Next.js existantes qui retournent `[]` quand pas de données
- Pas de modification du schéma Prisma

## Decisions

### 1. `formationsRole` dans le JWT NextAuth

**Choix** : Ajouter un champ optionnel `formationsRole?: "apprenant" | "instructeur"` dans le JWT callback et la session NextAuth dans `lib/auth/config.ts`.

**Raison** : Le JWT est déjà le vecteur de rôle pour la plateforme principale (`role`). Ajouter `formationsRole` en parallèle permet au middleware et aux pages de connaître le rôle formations sans requête DB supplémentaire. Les deux rôles coexistent car un freelance peut aussi être apprenant.

**Alternative rejetée** : Stocker le rôle formations uniquement en localStorage → ne serait pas disponible côté serveur pour le middleware.

### 2. Extension de l'API register avec `formationsRole` optionnel

**Choix** : Étendre le schéma Zod de `/api/auth/register` pour accepter un champ `formationsRole` optionnel. Si présent, le rôle principal est automatiquement mis à `"freelance"` (valeur par défaut) et `formationsRole` est stocké séparément.

**Raison** : Ne casse pas les inscriptions existantes (freelance/client/agence). Le champ est optionnel et ne modifie le comportement que pour les inscriptions formations.

### 3. Middleware — exclusion des routes formations auth

**Choix** : Retirer `/formations/connexion` et `/formations/inscription` de la liste `AUTH_ROUTES` dans `middleware.ts`. Permettre l'accès même si l'utilisateur est déjà authentifié.

**Raison** : Un freelance connecté doit pouvoir s'inscrire en tant qu'apprenant sans être redirigé vers `/dashboard`.

### 4. Remplacement des DEMO_ par des appels API retournant `[]`

**Choix** : Remplacer chaque tableau `DEMO_*` par un appel `fetch` ou TanStack Query vers une API route Next.js. L'API retourne `[]` quand il n'y a pas de données. L'UI affiche un état vide ("Aucune donnée pour le moment").

**Raison** : Pattern cohérent — chaque page est "prête pour la prod" dès maintenant. Quand les APIs backend Fastify seront implémentées, il suffira de changer l'URL de l'API route.

**Alternative rejetée** : Supprimer simplement les DEMO_ et montrer `[]` en dur → ne prépare pas l'intégration future.

### 5. Mode vacances — badge sur profil public

**Choix** : Lire le champ `vacationMode` depuis l'API profil et afficher un badge "En vacances" sur la page `/freelances/[username]`. Persister l'activation via `PATCH /api/profile` au lieu du Zustand seul.

**Raison** : Le mode vacances doit être visible par les visiteurs (pas juste le freelance lui-même).

## Risks / Trade-offs

- **Deux rôles en parallèle (role + formationsRole)** → Complexité modérée dans le middleware. Mitigation : le formationsRole est optionnel et n'affecte que les routes `/formations/*`.
- **APIs retournant `[]`** → L'UI sera vide tant que les vrais backends ne sont pas implémentés. Mitigation : états vides bien designés avec CTA ("Commencez par...").
- **Pas de migration Prisma** → En mode dev, le `formationsRole` est dans le JSON store. En production avec Supabase Auth, il sera dans les custom claims. Mitigation : l'abstraction via `lib/auth/config.ts` centralise la lecture du rôle.
