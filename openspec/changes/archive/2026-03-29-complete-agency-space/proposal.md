## Why

L'espace agence (`/agence/`) possede 25 pages fonctionnelles mais il manque 8 pages essentielles presentes dans l'espace freelance. Les agences ne peuvent pas : editer leur profil, voir le detail d'une commande avec le suivi pipeline, generer des factures, gerer les notifications/securite/litiges, ni sauvegarder des favoris. Ces lacunes bloquent l'utilisation complete de l'espace agence au niveau MVP et V1.

## What Changes

- **Profil agence** (`/agence/profil`) : editeur de profil agence avec preview (logo, nom, description, secteur, equipe visible, liens) — adapte du profil freelance mais avec champs specifiques agence
- **Detail commande** (`/agence/commandes/[id]`) : page detail commande avec `OrderPhasePipeline`, chat integre, livraison fichiers, assignation a un membre de l'equipe — adapte du detail commande freelance
- **Factures** (`/agence/factures`) : liste des factures PDF telechargeables, historique paiements, rapport de depenses — adapte des factures freelance avec CA par membre
- **Notifications** (`/agence/notifications`) : centre de notifications in-app avec parametrage par type d'evenement — copie du centre freelance
- **Securite** (`/agence/securite`) : gestion 2FA, sessions actives, mot de passe, journal de securite — copie de la page securite freelance
- **Litiges** (`/agence/litiges`) : suivi des litiges ouverts, historique, timeline echanges — copie de la page litiges freelance
- **Favoris** (`/agence/favoris`) : freelances/services/agences favoris organises en listes — copie de la page favoris freelance
- **Contrats** (`/agence/contrats`) : templates de contrats, historique des contrats signes — page specifique agence
- **Mise a jour sidebar** : ajouter les nouvelles routes dans `AgenceSidebar.tsx`

## Capabilities

### New Capabilities
- `agency-profile`: Editeur de profil agence avec preview temps reel (logo, description, secteur, membres publics, liens, completion %)
- `agency-order-detail`: Page detail commande agence avec OrderPhasePipeline, chat, livraison fichiers, assignation membre
- `agency-invoices`: Factures agence avec PDF, historique paiements, rapport depenses, CA par membre
- `agency-notifications`: Centre de notifications parametrable par type d'evenement
- `agency-security`: Gestion 2FA, sessions actives, mot de passe, journal securite
- `agency-disputes`: Suivi litiges ouverts, timeline echanges, historique verdicts
- `agency-favorites`: Favoris organises (freelances, services, agences) en listes
- `agency-contracts`: Templates contrats personnalisables, historique signes, generation automatique

### Modified Capabilities
<!-- Pas de modification de capabilities existantes — uniquement des ajouts -->

## Impact

- **Fichiers modifies** : `components/agence/AgenceSidebar.tsx` (ajout routes)
- **Nouveaux fichiers** : 8 pages dans `apps/web/app/agence/`
- **Composants reutilises** : `OrderPhasePipeline`, `ImageUpload`, `useToastStore`, patterns existants du dashboard freelance
- **Pas d'impact schema Prisma** : donnees demo statiques (MVP)
- **Pas de nouveaux jobs BullMQ ni handlers Socket.io** : fonctionnalites frontend uniquement
- **Version cible** : MVP pour profil/commandes/factures, V1 pour contrats/litiges/notifications/securite/favoris
