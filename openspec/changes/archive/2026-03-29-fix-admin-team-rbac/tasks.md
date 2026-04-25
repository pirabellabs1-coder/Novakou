## 1. JWT/Session : ajouter adminRole

- [x] 1.1 Dans `lib/auth/config.ts`, ajouter `adminRole?: string` aux interfaces `User`, `Session` et `JWT`
- [x] 1.2 Dans le callback `jwt()`, extraire `adminRole` depuis la DB (table User ou AdminTeamMember) pour les users avec `role === "admin"` et l'ajouter au token. Default à `"super_admin"` si absent.
- [x] 1.3 Dans le callback `session()`, propager `token.adminRole` vers `session.user.adminRole`
- [x] 1.4 Vérifier que le type `Session` est bien étendu pour TypeScript (fichier `next-auth.d.ts` si existant)

## 2. Helper RBAC côté serveur

- [x] 2.1 Dans `lib/admin-permissions.ts`, ajouter une fonction `requireAdminPermission(session, permission)` qui retourne `{ allowed: boolean, role: string, errorResponse?: NextResponse }` — prêt à utiliser dans les routes API
- [x] 2.2 La fonction doit extraire `adminRole` de `session.user.adminRole`, default à `"super_admin"` si absent, et appeler `hasPermission()`

## 3. API team : appliquer RBAC

- [x] 3.1 Dans `app/api/admin/team/route.ts` (GET), vérifier `team.view` — retourner 403 si non autorisé
- [x] 3.2 Dans `app/api/admin/team/route.ts` (POST invite), vérifier `team.manage` — retourner 403 si non autorisé
- [x] 3.3 Dans `app/api/admin/team/route.ts` (PATCH change role), vérifier `team.manage` + empêcher d'assigner `super_admin` si l'appelant n'est pas super_admin
- [x] 3.4 Dans `app/api/admin/team/route.ts` (DELETE remove), vérifier `team.manage` — retourner 403 si non autorisé
- [x] 3.5 Dans `app/api/admin/equipe/invite/route.ts`, appliquer la même vérification `team.manage`

## 4. Sidebar : lire le vrai rôle

- [x] 4.1 Dans `components/admin/AdminSidebar.tsx`, remplacer `return "super_admin"` par `useSession()` → `session?.user?.adminRole || "super_admin"`
- [x] 4.2 Vérifier que le filtrage `hasPermission()` fonctionne avec le rôle réel (les nav items non autorisés disparaissent)

## 5. Hook useAdminPermission()

- [x] 5.1 Créer le hook `useAdminPermission(permission?: string)` dans `lib/use-admin-permission.ts` qui utilise `useSession()` et retourne `{ allowed, role, isLoading }`
- [x] 5.2 Si `permission` est fourni, `allowed` = `hasPermission(role, permission)`. Si non fourni, `allowed` = true (juste pour obtenir le rôle).

## 6. Page équipe : conditionner les actions

- [x] 6.1 Dans `app/admin/equipe/page.tsx`, utiliser `useAdminPermission("team.manage")` pour déterminer si l'utilisateur peut gérer l'équipe
- [x] 6.2 Si `team.view` mais pas `team.manage` : masquer les boutons invite/modifier/supprimer et afficher un bandeau "Lecture seule"
- [x] 6.3 Si ni `team.view` ni `team.manage` : afficher page "Accès non autorisé" avec le rôle de l'utilisateur et un lien vers le dashboard
- [x] 6.4 Dans le dropdown de modification de rôle, filtrer `super_admin` si l'utilisateur n'est pas super_admin
- [x] 6.5 Corriger les boutons d'actions pour qu'ils soient visibles et fonctionnels (bug actuel : actions non visibles)

## 7. Guard RBAC sur les pages admin sensibles

- [x] 7.1 Créer un composant `AdminPermissionGuard` qui wrap le contenu d'une page et affiche "Accès non autorisé" si le rôle ne permet pas l'accès
- [x] 7.2 Appliquer le guard sur `/admin/finances` (requiert `finances.view`)
- [x] 7.3 Appliquer le guard sur `/admin/utilisateurs` (requiert `users.view`)
- [x] 7.4 Appliquer le guard sur `/admin/configuration` (requiert `config.view`)
- [x] 7.5 Le message d'avertissement doit inclure : le rôle actuel, la permission requise, et un lien "Contactez un super administrateur"

## 8. Offres freelance : picker contacts messagerie

- [x] 8.1 Dans `app/dashboard/offres/page.tsx`, importer `useMessagingStore` et extraire la liste des clients uniques depuis les conversations (filtrer `participants` par `role === "client"`)
- [x] 8.2 Remplacer l'input texte "Nom du client" par un `<select>` dropdown avec les clients des conversations
- [x] 8.3 Supprimer le champ "Email du client" du formulaire et de la validation
- [x] 8.4 Supprimer `clientEmail` du body envoyé à `POST /api/offres`
- [x] 8.5 Afficher "Aucun contact — démarrez une conversation d'abord" si la liste est vide et désactiver le bouton submit
- [x] 8.6 Charger les conversations au mount via `useMessagingStore().syncFromApi()` si pas déjà chargées

## 9. Offres agence : connecter au vrai API + picker contacts

- [x] 9.1 Dans `app/agence/offres/page.tsx`, remplacer le submit mock (toast seul) par un appel à `POST /api/offres`
- [x] 9.2 Ajouter le même picker contacts messagerie que pour le freelance
- [x] 9.3 Supprimer tout champ email si présent

## 10. Client facturation : données financières réelles

- [x] 10.1 Dans `app/client/factures/page.tsx`, remplacer `useClientStore.getState().credits` par `useClientStore(s => s.credits)` pour rendre la valeur réactive
- [x] 10.2 Dans `app/api/finances/summary/route.ts`, en mode dev (IS_DEV), calculer `totalSpent` et `pending` depuis les commandes du dev store au lieu de retourner des zéros
- [x] 10.3 S'assurer que les cards "En attente" et "Total dépensé" affichent les montants financiers (pas juste le nombre de factures)

## 11. Vérification

- [x] 11.1 Vérifier que le build passe : `pnpm build --filter=@freelancehigh/web`
- [x] 11.2 Tester : un super_admin voit tout et peut tout faire
- [x] 11.3 Tester : un modérateur ne voit que ses pages autorisées dans le sidebar
- [x] 11.4 Tester : le formulaire d'offre affiche les contacts messagerie et envoie correctement
- [x] 11.5 Tester : la page client factures affiche les montants corrects
