## Why

Le site FreelanceHigh n'est pas responsive sur mobile. La page d'accueil (hero, stats cards, catégories, recherche), les espaces dashboard (admin, freelance, client, agence), les espaces formations (admin, instructeur, apprenant) et les composants partagés (cards, grilles, sidebars) ne s'adaptent pas correctement aux écrans mobiles. C'est critique car le marché cible (Afrique francophone) accède majoritairement au web via mobile.

**Version cible :** MVP

## What Changes

### Page d'accueil / Landing
- Hero section : les 3 stat cards (freelances actifs, clients satisfaits, projets livrés) passent sur une seule ligne horizontale avec taille réduite sur mobile
- Section catégories : réduction taille des cards, 2 cards par ligne sur mobile, police réduite
- Section services populaires : 1 card par ligne mobile, 2 sur tablette
- Barre de recherche hero : layout vertical empilé sur mobile
- Sections "Comment ça marche", témoignages, partenaires : responsive complet

### Sidebars (tous les espaces)
- Contrainte `max-w-[min(85vw,288px)]` sur les sidebars mobile pour éviter le débordement sur petits écrans
- Breakpoints sidebar cohérents sur tous les espaces

### Dashboards (admin, freelance, client, agence)
- Grilles stats : breakpoints progressifs (1 col mobile → 2 col sm → 3 col md → 4-6 col xl)
- Graphiques : hauteurs adaptatives, labels lisibles
- Tables : scroll horizontal avec indicateur sur mobile
- Cards : retour à la ligne correct, 1-2 par ligne mobile

### Espaces Formations (admin, instructeur, apprenant)
- Remplacement des `calc(100vh-200px)` et `calc(100vh-280px)` hardcodés par des valeurs flexibles
- Sidebars formations : contrainte max-width mobile
- Breadcrumbs : troncature sur mobile

### Composants partagés
- StatCard : padding et tailles de texte adaptatifs
- Cards de services : grille responsive 1→2→3 colonnes
- Navbar : menu mobile amélioré

## Capabilities

### New Capabilities
- `responsive-layouts`: Ensemble de corrections responsive couvrant toutes les pages et composants du site — breakpoints Tailwind cohérents, grilles adaptatives, sidebars mobiles contraintes, typographie responsive

### Modified Capabilities
_(Pas de modifications de spécifications existantes — il s'agit uniquement de corrections CSS/Tailwind)_

## Impact

**Impact sur tous les rôles :** Freelance, Client, Agence, Admin, Instructeur, Apprenant — chaque espace est touché.

**Code affecté :**
- ~30+ fichiers de composants et pages dans `apps/web/`
- Composants landing : `HeroSection.tsx`, `CategoriesSection.tsx`, `PopularServicesSection.tsx`, `HowItWorksSection.tsx`, `TestimonialsSection.tsx`
- Layouts : `dashboard/layout.tsx`, `client/layout.tsx`, `agence/layout.tsx`, `admin/layout.tsx`, formations layouts
- Pages dashboard : `dashboard/page.tsx`, `client/page.tsx`, `agence/page.tsx`, `admin/page.tsx`
- Sidebars : `Sidebar.tsx`, `ClientSidebar.tsx`, `AdminSidebar.tsx`, formations sidebars
- Composants UI : `StatCard.tsx`, `Navbar.tsx`
- Explorer/marketplace : `explorer/page.tsx`

**Pas d'impact sur :** Schéma Prisma, API routes, jobs BullMQ, templates email, Socket.io handlers.
**Pas de nouvelles dépendances requises.**
