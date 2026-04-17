## Why

L'authentification et l'inscription de la plateforme présentent plusieurs bugs critiques qui empêchent le fonctionnement normal :
1. **L'inscription formations est cassée** — le formulaire envoie `formationsRole` mais l'API attend `role` avec des valeurs incompatibles ("apprenant"/"instructeur" vs "freelance"/"client"/"agence").
2. **La connexion formations ne distingue pas les rôles** — `formationsRole` n'est jamais injecté dans le JWT/session, donc tous les utilisateurs sont redirigés vers l'espace apprenant.
3. **Conflit middleware** — un utilisateur déjà connecté sur FreelanceHigh qui visite `/connexion` est redirigé vers `/dashboard` au lieu de rester dans formations.
4. **La page de connexion principale affiche "Afrique"** alors que la plateforme est internationale.
5. **L'inscription principale n'a pas de confirmation de mot de passe**.
6. **Des données démo/hardcodées** persistent dans plusieurs espaces (paiements, factures, litiges, etc.), ce qui donne une impression de fausse plateforme.
7. **Le mode vacances freelance** ne s'affiche pas sur le profil public.

**Version cible** : MVP (correctifs immédiats pour rendre la plateforme fonctionnelle).

## What Changes

### Authentification & Inscription
- Retirer la mention "Afrique" de la page de connexion principale — remplacer par un texte international
- Ajouter un champ de confirmation de mot de passe sur la page d'inscription principale (`/inscription`)
- **Corriger l'API `/api/auth/register`** pour accepter les rôles formations (`apprenant`, `instructeur`) via un champ `formationsRole` optionnel
- **Ajouter `formationsRole` au JWT et à la session NextAuth** dans `lib/auth/config.ts`
- Corriger la page `/connexion` pour rediriger correctement selon le `formationsRole`
- Corriger la page `/inscription` pour envoyer les bons champs à l'API
- **Corriger le middleware** pour ne pas rediriger les utilisateurs authentifiés qui visitent `/connexion` ou `/inscription` — permettre l'accès même connecté

### Suppression des données demo/hardcodées
- Remplacer `DEMO_METHODS` et `DEMO_HISTORY` dans `/dashboard/paiements/page.tsx` par des appels API
- Remplacer `DEMO_INVOICES` dans `/dashboard/factures/page.tsx` par des appels API
- Remplacer `DEMO_DISPUTES` dans `/dashboard/litiges/page.tsx` par des appels API
- Remplacer `DEMO_PROPOSALS` et `DEMO_CLIENT_PROJECTS` dans `/dashboard/propositions/page.tsx` par des appels API
- Remplacer `DEMO_TRANSACTIONS` dans `/dashboard/portefeuille-web3/page.tsx` par des appels API
- Remplacer `DEMO_SESSIONS` et `DEMO_LOGIN_HISTORY` dans `/dashboard/securite/page.tsx` par des appels API
- Remplacer `SAVED_METHODS` hardcodé dans `/client/paiements/page.tsx` par des appels API
- Nettoyer les stats hardcodées ("50k+ freelances actifs", "12k+ projets") de la page connexion

### Mode vacances freelance
- Afficher un badge/bannière "En vacances" sur le profil public quand `vacationMode` est actif
- Persister le mode vacances via l'API `/api/profile` (pas uniquement Zustand local)

### Robustesse générale
- S'assurer que chaque espace (apprenant, instructeur, admin formations) fonctionne sans erreur après connexion
- Vérifier que les boutons de suppression/corbeille fonctionnent partout où ils existent

## Capabilities

### New Capabilities
- `formations-auth`: Système d'authentification et d'inscription dédié aux formations — gestion du `formationsRole` (apprenant/instructeur) dans le JWT, API register adaptée, redirections correctes, pas de conflit avec la session FreelanceHigh principale
- `demo-data-cleanup`: Suppression de toutes les données démo/hardcodées dans les espaces dashboard, client et formations — remplacement par des appels API qui retournent des tableaux vides quand il n'y a pas de données
- `vacation-mode-public`: Affichage du mode vacances sur le profil public du freelance avec persistance via API

### Modified Capabilities

## Impact

### Fichiers impactés (~25-30 fichiers)

**Auth & Config :**
- `apps/web/lib/auth/config.ts` — ajout `formationsRole` au JWT et session
- `apps/web/app/api/auth/register/route.ts` — extension du schéma Zod
- `apps/web/middleware.ts` — exclusion des routes formations du redirect auth
- `apps/web/app/(auth)/connexion/page.tsx` — retrait "Afrique", nettoyage stats
- `apps/web/app/(auth)/inscription/page.tsx` — ajout confirmation mot de passe
- `apps/web/app/formations/connexion/page.tsx` — fix redirect formationsRole
- `apps/web/app/formations/inscription/page.tsx` — fix envoi API

**Données demo (dashboard freelance) :**
- `apps/web/app/dashboard/paiements/page.tsx`
- `apps/web/app/dashboard/factures/page.tsx`
- `apps/web/app/dashboard/litiges/page.tsx`
- `apps/web/app/dashboard/propositions/page.tsx`
- `apps/web/app/dashboard/portefeuille-web3/page.tsx`
- `apps/web/app/dashboard/securite/page.tsx`

**Données demo (client) :**
- `apps/web/app/client/paiements/page.tsx`

**Mode vacances :**
- `apps/web/app/(public)/freelances/[username]/page.tsx` — affichage badge vacances
- `apps/web/store/dashboard.ts` — persistance API du mode vacances

**Impact sur le schéma Prisma** : Aucune modification — `formationsRole` est stocké dans le dev store (mode dev) ou dans les custom claims Supabase (production). Le mode vacances utilise le champ `availability` déjà existant dans le profil.

**Pas de job BullMQ, Socket.io, ou template email requis.**

**Impact sur les rôles** : Touche les 4 rôles (freelance, client, apprenant formations, instructeur formations, admin) mais chaque modification est isolée par espace.
