## Why

La plateforme formations est actuellement intégrée dans FreelanceHigh avec les mêmes layouts, navbar et navigation. L'utilisateur voit toujours les menus FreelanceHigh (Services, Projets, Dashboard, etc.) quand il navigue dans les formations. **Le besoin est que la section formations soit une plateforme à part entière**, visuellement et fonctionnellement séparée de FreelanceHigh. Le seul lien entre les deux : un item "Formations" dans le menu de FreelanceHigh. Une fois cliqué, l'utilisateur entre dans un univers complètement différent avec ses propres menus, sa propre authentification, et ses propres espaces — tout en gardant la même charte graphique (couleurs, typographie, composants shadcn/ui).

**Version cible : MVP** (intégré au sprint actuel)

## What Changes

- **Nouveau layout formations autonome** : header/navbar dédié avec menus spécifiques formations (Accueil, Explorer, Catégories, Devenir Instructeur) — aucun menu FreelanceHigh visible
- **Authentification formations séparée** : pages de connexion (`/connexion`) et inscription (`/inscription`) propres à la plateforme formations, avec choix du rôle (Apprenant / Instructeur)
- **Navigation apprenant dédiée** : sidebar ou header avec menus spécifiques (Mes Formations, Certificats, Favoris, Panier, Paramètres)
- **Navigation instructeur dédiée** : sidebar ou header avec menus spécifiques (Dashboard, Mes Formations, Créer, Apprenants, Revenus, Avis, Statistiques, Paramètres)
- **Suppression des layouts FreelanceHigh** sur toutes les routes `/*` — les route groups `(apprenant)`, `(instructeur)`, `(paiement)`, `(public)/formations` utilisent désormais le layout formations
- **Lien retour vers FreelanceHigh** : un bouton/lien discret "← Retour à FreelanceHigh" dans le header formations pour permettre de revenir
- **Admin formations** : reste dans l'espace admin FreelanceHigh existant (`/admin/formations/*`) car l'admin gère les deux plateformes

## Capabilities

### New Capabilities
- `formations-standalone-layout`: Layout autonome avec header/navbar dédié pour la plateforme formations — menus publics, apprenant et instructeur distincts
- `formations-auth`: Pages de connexion et inscription dédiées à la plateforme formations avec choix du rôle (Apprenant / Instructeur), utilisant Supabase Auth existant
- `formations-navigation`: Système de navigation complet et séparé — header public formations, sidebar/header apprenant, sidebar/header instructeur

### Modified Capabilities
_(aucune modification de specs existantes — il s'agit d'une refonte UI/navigation, pas de changement de logique métier)_

## Impact

### Code affecté
- **Layouts** : nouveau `app/formations/layout.tsx` racine + sous-layouts par rôle (public, apprenant, instructeur)
- **Route groups** : réorganisation de `(apprenant)/formations/*`, `(instructeur)/formations/*`, `(public)/formations/*` sous un préfixe unifié `/*`
- **Composants** : nouveau `FormationsHeader.tsx`, `FormationsNavbar.tsx`, `ApprenantSidebar.tsx`, `InstructeurSidebar.tsx`
- **Middleware** : ajustement du middleware Next.js pour gérer l'auth formations séparément (routes `/connexion`, `/inscription`)
- **Navbar FreelanceHigh** : le lien "Formations" reste, pointe vers `/`

### Pas d'impact sur
- Schéma Prisma (aucun changement DB)
- API routes (toutes les API existantes restent identiques)
- Logique métier (paiements, certificats, quiz, etc.)
- Admin formations (reste dans `/admin/formations/*`)
- Templates email
- i18n (les traductions existantes sont réutilisées)

### Dépendances
- Aucune nouvelle dépendance — utilise shadcn/ui, Tailwind CSS, next-intl existants
- Supabase Auth existant réutilisé (pas de nouveau système d'auth)
