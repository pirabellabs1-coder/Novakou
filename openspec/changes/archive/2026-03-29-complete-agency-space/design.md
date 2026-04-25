## Context

L'espace agence dispose de 25 pages fonctionnelles (dashboard, equipe, clients, services, commandes liste, finances, analytics, etc.) mais il manque 8 pages presentes dans l'espace freelance. L'approche est de reutiliser au maximum les composants et patterns du dashboard freelance en les adaptant aux specificites agence (gestion d'equipe, CA par membre, assignation de commandes).

Les pages freelance de reference existent et fonctionnent :
- `/dashboard/profil` — editeur avec onglet preview
- `/dashboard/commandes/[id]` — detail commande avec OrderPhasePipeline + chat
- `/dashboard/factures` — liste factures avec PDF
- `/dashboard/notifications` — centre de notifications
- `/dashboard/securite` — 2FA, sessions, mot de passe
- `/dashboard/litiges` — suivi litiges
- `/dashboard/favoris` — favoris organises

## Goals / Non-Goals

**Goals :**
- Completer les 8 pages manquantes de l'espace agence
- Reutiliser les composants existants (`OrderPhasePipeline`, `ImageUpload`, `useToastStore`)
- Adapter les pages freelance aux specificites agence (champs agence, assignation equipe, CA par membre)
- Mettre a jour la sidebar avec les nouvelles routes
- Garder la coherence visuelle (dark theme, meme patterns UI)

**Non-Goals :**
- Pas de nouveau schema Prisma ni de tables supplementaires (donnees demo statiques)
- Pas de nouveaux endpoints API (MVP frontend uniquement)
- Pas de generation de PDF reelle (simulation demo)
- Pas de signature electronique (prevue V3)
- Pas de logique backend de contrats (templates statiques demo)

## Decisions

### 1. Adapter plutot que copier les pages freelance
**Choix** : Chaque page agence est ecrite independamment mais suit la meme structure que son equivalent freelance, avec des adaptations specifiques agence.
**Raison** : Les agences ont des champs differents (logo vs photo, secteur, taille equipe, assignation membre). Copier litteralement et modifier serait fragile. Ecrire des pages adaptees est plus maintenable.
**Alternative rejetee** : Composants generiques partages freelance/agence — trop d'abstraction prematuree pour 2 consumers.

### 2. Donnees demo statiques dans chaque page
**Choix** : Constantes `const ORDERS = [...]` dans chaque fichier, comme fait dans le reste du projet.
**Raison** : Coherence avec l'approche MVP actuelle. Toutes les pages existantes utilisent des donnees demo locales.
**Alternative rejetee** : Centraliser dans `demo-data.ts` — ajouterait de la complexite pour la phase demo.

### 3. OrderPhasePipeline reutilise tel quel
**Choix** : Import direct du composant `OrderPhasePipeline` existant dans la page detail commande agence.
**Raison** : Le composant est deja concu pour etre reutilisable (props `status`, `timeline`, `revisionsLeft`). Pas besoin de modification.

### 4. Profil agence avec champs specifiques
**Choix** : Le profil agence a des champs differents du profil freelance : logo (pas avatar), nom agence, secteur d'activite, taille equipe, description agence, membres visibles publiquement, SIRET optionnel.
**Raison** : Le PRD definit un profil agence distinct avec formulaire dedie.

### 5. Sidebar — ajout des routes dans les sections existantes
**Choix** : Ajouter les nouvelles routes dans les sections existantes de `AgenceSidebar.tsx` (ex: Factures dans la section Finances, Litiges dans Communication).
**Raison** : La sidebar a deja une structure par sections. Les nouvelles pages s'integrent naturellement.

## Risks / Trade-offs

- **Duplication de donnees demo** : Chaque page a ses propres constantes demo, potentiellement incoherentes entre pages. → Acceptable en MVP, sera remplace par des appels API reels.
- **Pas de tests** : Pages frontend-only sans tests automatises. → Le projet n'a pas encore de suite de tests; sera ajoute plus tard.
- **Pages volumineuses** : Certaines pages (profil, commande detail) depasseront 400 lignes. → Acceptable en MVP, extraction de composants si necessaire en V1.
