## Why

Le système RBAC admin est **défini mais jamais appliqué**. Les permissions existent dans `lib/admin-permissions.ts` (6 rôles, matrice de permissions, `hasPermission()`) mais :

1. **Le JWT/Session ne contient pas `adminRole`** — `lib/auth/config.ts` n'extrait pas le rôle admin de la DB
2. **Le sidebar est hard-codé `"super_admin"`** — tous les admins voient toute la navigation
3. **Les routes API ne vérifient que `role === "admin"`** — un modérateur peut inviter, changer les rôles, supprimer des membres
4. **La page équipe n'a aucune vérification de permission** — les boutons actions sont toujours visibles
5. **L'invitation ne filtre pas le rôle `super_admin`** dans l'éditeur de rôle (modification)

Résultat : un admin avec le rôle "support" peut faire exactement la même chose qu'un "super_admin". C'est une **faille de sécurité critique**.

**Version cible : MVP** — La sécurité admin est non-négociable.

## What Changes

### A. JWT/Session : ajouter `adminRole`
- Modifier `lib/auth/config.ts` pour extraire `adminRole` de la DB et l'ajouter au JWT et à la session
- Ajouter le champ dans les interfaces `User`, `Session`, `JWT`

### B. Sidebar : lire le vrai rôle
- Remplacer le `return "super_admin"` hard-codé dans `AdminSidebar.tsx` par `useSession()` → `session.user.adminRole`
- Le filtrage par `hasPermission()` s'activera automatiquement

### C. API routes : appliquer `hasPermission()`
- Dans toutes les routes `/api/admin/team/*`, extraire `adminRole` de la session et vérifier les permissions avec `hasPermission(adminRole, "team.manage")` avant chaque action destructive
- Retourner 403 avec message "Vous n'êtes pas autorisé à effectuer cette action" si refusé

### D. Page équipe : conditionner les actions au rôle
- Lire `adminRole` depuis la session
- Masquer/désactiver les boutons d'actions (modifier rôle, supprimer, inviter) si l'utilisateur n'a pas `team.manage`
- Afficher un avertissement si tentative d'accès non autorisé
- Filtrer `super_admin` du dropdown de modification de rôle (sauf si l'utilisateur est super_admin)

### E. Toutes les pages admin : guard RBAC
- Créer un hook `useAdminPermission(permission)` qui retourne `{ allowed, adminRole, isLoading }`
- Appliquer ce hook sur les pages sensibles pour afficher "Accès non autorisé" avec avertissement

### F. Offres freelance/agence : sélection client depuis messagerie
- **Problème** : Le formulaire d'offre personnalisée (`/dashboard/offres`) demande de taper manuellement le nom du client + son email. Le freelance ne devrait PAS avoir l'email du client (tout doit rester sur la plateforme).
- **Fix** : Remplacer le champ texte "Nom du client" par un dropdown qui liste les clients issus des conversations de messagerie (via `useMessagingStore()` → `participants` avec `role === "client"`). Supprimer le champ email. L'offre est envoyée directement dans la conversation de messagerie.
- **Agence** : Le formulaire `/agence/offres` ne fait actuellement aucun appel API (mock seulement). Connecter au vrai endpoint + même picker de contacts.

### G. Client paiement/facturation : données vides malgré des commandes
- **Problème** : Sur `/client/factures`, les cards "Total dépensé", "En attente", "Crédits" restent à 0 même avec des données. L'API `/api/finances/summary` fonctionne en mode Prisma mais en mode dev (IS_DEV) elle retourne des valeurs par défaut car les devData ne sont pas calculés depuis les commandes.
- **Fix** : En mode dev, calculer `totalSpent` et `pending` depuis les commandes du dev store. Rendre la carte "Crédits" réactive (remplacer `useClientStore.getState()` par le hook store). S'assurer que `syncFinanceSummary()` remonte les erreurs pour debug.

**Impact sur les rôles :**
- **Admin** : RBAC complet
- **Freelance/Agence** : Offres liées à la messagerie
- **Client** : Paiements/facturation fonctionnels

**Pas de migration Prisma** — les champs existent déjà
**Pas de job BullMQ/Socket.io/email**

## Capabilities

### New Capabilities
- `admin-rbac-enforcement`: Application complète du RBAC admin — JWT, sidebar, API, pages, hook de permission
- `offer-messaging-integration`: Sélection client depuis contacts messagerie + envoi dans la conversation

### Modified Capabilities
_(Aucune spec existante)_

## Impact

- `lib/auth/config.ts` — JWT/Session callbacks (ajouter adminRole)
- `components/admin/AdminSidebar.tsx` — Lire rôle depuis session
- `app/api/admin/team/route.ts` — Vérification permissions
- `app/api/admin/equipe/invite/route.ts` — Vérification permissions
- `app/admin/equipe/page.tsx` — Conditionner UI au rôle
- `lib/admin-permissions.ts` — Ajouter helpers `useAdminPermission()` + `requireAdminPermission()`
- Toutes les pages `/admin/*` — Guard RBAC optionnel
- `app/dashboard/offres/page.tsx` — Picker contacts + supprimer email
- `app/agence/offres/page.tsx` — Connecter API + picker contacts
- `app/client/factures/page.tsx` — Crédits réactifs
- `app/api/finances/summary/route.ts` — Dev mode calcul depuis commandes
- `store/client.ts` — syncFinanceSummary erreur handling
