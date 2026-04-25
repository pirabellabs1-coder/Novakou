## Context

FreelanceHigh a 6 rôles admin (super_admin, moderateur, validateur_kyc, analyste, support, financier) avec une matrice de permissions bien définie dans `lib/admin-permissions.ts`. Mais cette matrice n'est jamais appliquée : le JWT ne contient pas `adminRole`, le sidebar est hard-codé, et les API acceptent tout admin sans distinction.

## Goals / Non-Goals

**Goals:**
- Le JWT et la session contiennent `adminRole`
- Le sidebar ne montre que les pages autorisées pour le rôle
- Les API team rejettent les actions non autorisées avec 403
- La page équipe masque les actions non autorisées
- Un hook `useAdminPermission()` permet de protéger n'importe quelle page admin
- Un admin non autorisé voit un message d'avertissement clair

**Non-Goals:**
- Pas de modification du middleware Next.js (trop complexe pour le MVP — le guard côté page suffit)
- Pas de refonte de la matrice de permissions (elle est déjà bien conçue)
- Pas de logs d'audit pour les tentatives non autorisées (existe déjà via audit-log)

## Decisions

### 1. adminRole dans le JWT : extraction depuis la DB

**Choix** : Dans le callback `jwt()` de NextAuth, lire `adminRole` depuis la table `User` (ou `AdminTeamMember`) et l'ajouter au token JWT. Le callback `session()` le propage à `session.user.adminRole`.

**Rationale** : Le JWT est lu à chaque requête sans DB call. Le rôle admin est rarement modifié, donc le cache JWT est acceptable.

**Fallback** : Si `adminRole` est absent (ancien token), default à `"super_admin"` pour le créateur de la plateforme, sinon `null`.

### 2. Hook `useAdminPermission()` : pattern client-side

**Choix** : Créer un hook dans `lib/admin-permissions.ts` :
```ts
function useAdminPermission(permission: string): { allowed: boolean; role: AdminRole | null; isLoading: boolean }
```
Utilise `useSession()` pour obtenir `adminRole`, puis appelle `hasPermission()`.

**Rationale** : Réutilisable sur toutes les pages admin. Le check API reste le vrai garde-fou, le hook est pour l'UX.

### 3. API : helper `requireAdminPermission()`

**Choix** : Créer un helper dans `lib/admin-permissions.ts` :
```ts
function requireAdminPermission(session, permission): { allowed: boolean; role: string; response?: NextResponse }
```
Retourne une 403 prête à envoyer si non autorisé.

**Rationale** : DRY — toutes les routes API admin peuvent l'utiliser en 2 lignes.

### 4. Sidebar : `useSession()` au lieu du hard-code

**Choix** : Remplacer `return "super_admin"` par `session?.user?.adminRole || null`. Le filtrage existant via `hasPermission()` s'active naturellement.

### 5. Page équipe : masquer + avertissement

**Choix** : Si l'utilisateur n'a pas `team.manage`, masquer les boutons d'action et afficher un bandeau "Lecture seule — votre rôle ne permet pas de gérer l'équipe". Si l'utilisateur n'a pas `team.view`, afficher "Accès non autorisé".

### 6. Offres : picker contacts messagerie au lieu de champ texte

**Choix** : Dans le formulaire d'offre (`/dashboard/offres`), remplacer l'input texte "Nom du client" + l'input email par un `<select>` dropdown qui liste les contacts clients issus de `useMessagingStore()`. On filtre les `participants` des conversations avec `role === "client"`. Supprimer complètement le champ email (les communications doivent rester sur la plateforme).

**Rationale** : Le freelance ne doit pas connaître l'email du client. L'offre est envoyée dans la conversation existante.

### 7. Offres agence : connecter au vrai API

**Choix** : Le formulaire agence (`/agence/offres`) ne fait actuellement qu'afficher un toast sans appel API. Le connecter au même endpoint `POST /api/offres` que le freelance, avec le même picker de contacts.

### 8. Client factures : dev mode + crédits réactifs

**Choix** :
- En mode dev (`IS_DEV`), l'API `/api/finances/summary` doit calculer `totalSpent` et `pending` depuis les commandes du dev store au lieu de retourner des zéros.
- Remplacer `useClientStore.getState().credits` (non-réactif) par le hook `useClientStore(s => s.credits)`.

## Risks / Trade-offs

- **Cache JWT stale** : Si un super_admin change le rôle d'un membre, son JWT garde l'ancien rôle jusqu'à re-login → Mitigation : amélioration future.

- **Première connexion** : Les admins existants sans `adminRole` seront defaultés à `super_admin` → Acceptable car le fondateur est le seul admin actuel.

- **Contacts messagerie** : Si le freelance n'a encore aucune conversation, le dropdown sera vide → Mitigation : afficher un message "Aucun contact — démarrez une conversation d'abord".
