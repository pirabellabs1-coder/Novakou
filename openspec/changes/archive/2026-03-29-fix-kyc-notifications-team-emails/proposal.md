## Why

Plusieurs fonctionnalites critiques de la plateforme FreelanceHigh sont cassees en production :

1. **KYC** : la soumission de verification KYC (freelance/agence) retourne une erreur serveur car le schema Prisma User manque 5 champs (`firstName`, `lastName`, `city`, `address`, `dateOfBirth`) que l'API attend
2. **Notifications admin** : l'envoi fonctionne mais affiche "erreur d'envoi" a cause d'un crash serveur (prisma.adminNotificationLog sur un modele pas encore migre), et l'historique des notifications n'est pas persiste (stocke en state local React uniquement)
3. **Equipe admin** : l'ajout de collaborateur ne s'affiche pas dans la liste et aucun email d'invitation n'est envoye (fire-and-forget sans feedback, pas de toast de confirmation)
4. **Emails** : les emails admin ne partent pas car le module `admin-emails.ts` duplique la logique de `lib/email/index.ts` au lieu de la reutiliser, et les erreurs sont avalees silencieusement

**Version cible : MVP.**

## What Changes

### KYC — Ajouter les champs manquants au schema Prisma
- Ajouter `firstName`, `lastName`, `city`, `address`, `dateOfBirth` au modele `User` dans schema.prisma
- Regenerer le client Prisma pour que l'API KYC fonctionne en production

### Notifications admin — Corriger le flux complet
- Corriger l'API `/api/admin/notifications/send` pour ne pas crasher (gerer l'absence d'AdminNotificationLog en prod)
- Ajouter un endpoint GET pour l'historique des notifications envoyees
- La page admin doit charger l'historique depuis l'API, pas depuis le state local React
- Les notifications doivent etre cliquables et lisibles (comme Comeup) avec un panneau de lecture

### Equipe admin — Corriger l'ajout et l'email
- Ajouter un toast de confirmation apres l'invitation
- Attendre (await) l'envoi de l'email avant de repondre au client
- Retourner le statut de l'email dans la reponse API
- S'assurer que `syncTeam()` rafraichit bien la liste apres l'ajout

### Emails — Unifier et corriger
- `admin-emails.ts` doit reutiliser la fonction `sendEmail` de `lib/email/index.ts` au lieu de dupliquer la logique
- Les erreurs d'email doivent etre retournees a l'appelant, pas avalees silencieusement
- Supprimer le placeholder `"re_placeholder"` — si pas de cle API, retourner une erreur claire

## Capabilities

### New Capabilities
- `fix-kyc-schema`: Ajouter les champs personnels manquants au modele User Prisma pour que la soumission KYC fonctionne
- `fix-admin-notifications-flow`: Corriger le flux complet des notifications admin — envoi, historique persiste, lecture par les utilisateurs
- `fix-admin-team-invite`: Corriger l'ajout de collaborateurs admin — email, feedback UI, affichage dans la liste
- `fix-email-reliability`: Unifier les modules email et corriger la gestion d'erreurs

### Modified Capabilities

## Impact

### Schema Prisma
- Ajout de 5 colonnes au modele `User` : `firstName`, `lastName`, `city`, `address`, `dateOfBirth`
- Migration Prisma necessaire

### Code impacte
- `apps/web/app/api/kyc/route.ts` — fonctionnera apres migration schema
- `apps/web/app/api/admin/notifications/send/route.ts` — correction du crash + historique
- `apps/web/app/admin/notifications/page.tsx` — charger historique depuis API + panneau lecture
- `apps/web/app/api/admin/team/route.ts` — await email + retourner statut
- `apps/web/app/admin/equipe/page.tsx` — toast confirmation
- `apps/web/lib/admin/admin-emails.ts` — reutiliser sendEmail de lib/email
- `apps/web/lib/email/index.ts` — supprimer placeholder, meilleure gestion erreurs
- `apps/web/store/admin.ts` — type sendNotification corrige

### Impact sur les autres roles
- **Freelance** : peut soumettre sa verification KYC sans erreur serveur
- **Agence** : meme correction KYC
- **Tous** : recoit les notifications admin dans un panneau lisible
