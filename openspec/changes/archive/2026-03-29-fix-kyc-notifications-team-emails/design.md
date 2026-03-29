## Context

Diagnostic revele 4 problemes lies :
1. KYC : 5 champs manquants dans Prisma (firstName, lastName, city, address, dateOfBirth)
2. Notifications admin : crash car `prisma.adminNotificationLog` pas encore migre, historique en state local React
3. Equipe admin : email fire-and-forget, pas de toast, liste pas rafraichie
4. Emails : module `admin-emails.ts` duplique `lib/email/index.ts`, erreurs avalees

## Goals / Non-Goals

**Goals:**
- KYC submission fonctionne de bout en bout (freelance et agence)
- Notifications admin s'envoient sans erreur et l'historique persiste
- Ajout de collaborateur montre la personne avec statut "En attente" + email envoye
- Emails admin utilisent le meme module que les emails transactionnels
- Erreurs email visibles dans l'interface admin (pas avalees silencieusement)

**Non-Goals:**
- Pas de systeme de notification temps reel (Socket.io — V2)
- Pas de panneau notification utilisateur complexe (simple liste pour le MVP)
- Pas de gestion des preferences de notification par utilisateur

## Decisions

### 1. Champs KYC dans le modele User (pas dans une table separee)
Les champs `firstName`, `lastName`, `city`, `address`, `dateOfBirth` sont ajoutes directement au modele `User` comme colonnes optionnelles (`String?`, `DateTime?`). C'est ce que l'API attend deja.

### 2. Historique notifications via la table existante Notification
Au lieu de creer un endpoint GET separe pour l'historique admin, on utilise la table `AdminNotificationLog` qui est deja dans le schema Prisma. Le probleme etait que le client Prisma n'avait pas ete regenere apres l'ajout. Solution : regenerer + utiliser `prisma.adminNotificationLog` directement.

### 3. Email admin unifie avec lib/email
`admin-emails.ts` importera et utilisera la fonction `sendEmail` exportee depuis `lib/email/index.ts`. Plus de duplication de la logique Resend.

### 4. Erreurs email retournees a l'appelant
Les fonctions email retournent `{ success: boolean, error?: string }` au lieu de toujours retourner un faux succes.

## Risks / Trade-offs

- **[Migration Prisma]** → Ajout de colonnes optionnelles, pas de risque de perte de donnees. Les utilisateurs existants auront `null` pour ces champs.
- **[Emails synchrones]** → L'invitation attend l'envoi de l'email. Si Resend est lent (~500ms), l'action admin prend plus de temps. Acceptable pour le MVP.
