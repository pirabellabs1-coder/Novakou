## 1. Authentification — Connexion principale

- [x] 1.1 Retirer la mention "Afrique" de la page `/connexion` (panneau gauche) et remplacer par un texte international
- [x] 1.2 Nettoyer les stats hardcodées ("50k+ freelances actifs", "12k+ projets") de la page `/connexion`

## 2. Authentification — Inscription principale

- [x] 2.1 Ajouter un champ "Confirmer le mot de passe" sur la page `/inscription` avec validation côté client

## 3. Authentification — API register & JWT

- [x] 3.1 Étendre le schéma Zod de `/api/auth/register` pour accepter `formationsRole` optionnel (`"apprenant"` | `"instructeur"`)
- [x] 3.2 Ajouter `formationsRole` au JWT callback et au session callback dans `lib/auth/config.ts`
- [x] 3.3 Stocker `formationsRole` dans le dev store (users.json / dev-store.ts) lors de l'inscription

## 4. Authentification — Middleware & routes formations

- [x] 4.1 Corriger le middleware pour ne pas rediriger les utilisateurs authentifiés qui visitent `/connexion` ou `/inscription`
- [x] 4.2 Corriger la page `/inscription` pour envoyer `role: "freelance"` + `formationsRole` à l'API
- [x] 4.3 Corriger la page `/connexion` pour rediriger selon `session.user.formationsRole` (apprenant → mes-formations, instructeur → instructeur/dashboard)

## 5. Suppression données démo — Dashboard freelance

- [x] 5.1 Remplacer `DEMO_METHODS` et `DEMO_HISTORY` dans `/dashboard/paiements/page.tsx` par des appels API + états vides
- [x] 5.2 Remplacer `DEMO_INVOICES` dans `/dashboard/factures/page.tsx` par des appels API + états vides
- [x] 5.3 Remplacer `DEMO_DISPUTES` dans `/dashboard/litiges/page.tsx` par des appels API + états vides
- [x] 5.4 Remplacer `DEMO_PROPOSALS` et `DEMO_CLIENT_PROJECTS` dans `/dashboard/propositions/page.tsx` par des appels API + états vides
- [x] 5.5 Remplacer `DEMO_TRANSACTIONS` dans `/dashboard/portefeuille-web3/page.tsx` par des appels API + états vides
- [x] 5.6 Remplacer `DEMO_SESSIONS` et `DEMO_LOGIN_HISTORY` dans `/dashboard/securite/page.tsx` par des appels API + états vides

## 6. Suppression données démo — Espace client

- [x] 6.1 Remplacer `SAVED_METHODS` hardcodé dans `/client/paiements/page.tsx` par des appels API + états vides

## 7. Mode vacances — Profil public

- [x] 7.1 Afficher un badge "En vacances" sur `/freelances/[username]` quand `vacationMode` est actif
- [x] 7.2 Persister le mode vacances via `PATCH /api/profile` dans `store/dashboard.ts` au lieu du Zustand seul

## 8. Vérification

- [x] 8.1 Vérifier que le build TypeScript passe sans erreur (`npx tsc --noEmit`)
- [x] 8.2 Vérifier que chaque espace formations (apprenant, instructeur, admin) est accessible après connexion
