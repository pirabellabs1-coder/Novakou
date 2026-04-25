## 1. Landing Page — Hero Section

- [x] 1.1 Rendre les 3 stat cards (freelances actifs, clients satisfaits, projets livrés) sur une seule ligne horizontale sur tous les écrans avec taille/padding/police réduits sur mobile (`components/landing/StatsBar.tsx`)
- [x] 1.2 Empiler la barre de recherche hero verticalement sur mobile (< 640px) avec champs pleine largeur (`components/landing/HeroSection.tsx`)
- [x] 1.3 Réduire les tailles de titre hero et sous-titre sur mobile (text-2xl sm:text-4xl md:text-5xl lg:text-7xl) (`components/landing/HeroSection.tsx`)

## 2. Landing Page — Sections

- [x] 2.1 Corriger la grille catégories : 2 cols mobile, 3 cols md, 4 cols lg avec padding/icônes/texte réduits (`components/landing/CategoriesSection.tsx`)
- [x] 2.2 Corriger la grille services populaires : 1 col mobile, 2 cols sm, 3 cols lg avec gaps réduits (`components/landing/PopularServicesSection.tsx`)
- [x] 2.3 Rendre responsive la section "Comment ça marche" (`components/landing/HowItWorksSection.tsx`)
- [x] 2.4 Rendre responsive la section témoignages (`components/landing/TestimonialsSection.tsx`)
- [x] 2.5 Rendre responsive la section partenaires et footer (`components/landing/TrustSection.tsx` et `CtaSection.tsx`)
- [x] 2.6 Rendre responsive les sections restantes de la landing (TopFreelancesSection) avec tailles de texte et gaps adaptatifs

## 3. Navbar

- [x] 3.1 Améliorer le menu mobile : inclure sélecteur de devise, navigation complète, espacement touch-friendly (`components/layout/Navbar.tsx`)
- [x] 3.2 Ajuster les paddings navbar et logo pour mobile (px-4 sur mobile, px-6 sur sm, px-20 sur lg)

## 4. Sidebars — Contrainte max-width mobile

- [x] 4.1 Ajouter `max-w-[min(85vw,288px)]` au sidebar mobile freelance (`app/dashboard/layout.tsx`)
- [x] 4.2 Ajouter `max-w-[min(85vw,288px)]` au sidebar mobile client (`app/client/layout.tsx`)
- [x] 4.3 Ajouter `max-w-[min(85vw,288px)]` au sidebar mobile admin (`app/admin/layout.tsx`)
- [x] 4.4 Ajouter `max-w-[min(85vw,288px)]` au sidebar mobile agence (`app/agence/layout.tsx`)
- [x] 4.5 Ajouter `max-w-[min(85vw,288px)]` aux sidebars formations admin, instructeur et apprenant

## 5. Dashboard Freelance

- [x] 5.1 Corriger la grille stats : grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 avec gaps adaptatifs (`app/dashboard/page.tsx`)
- [x] 5.2 Corriger les grilles graphiques/charts : breakpoints progressifs avec md intermédiaire (`app/dashboard/page.tsx`)
- [x] 5.3 Rendre les tables responsive avec overflow-x-auto et min-width (`app/dashboard/page.tsx`)
- [x] 5.4 Ajuster header (titre + boutons) pour empiler sur mobile (`app/dashboard/page.tsx`)

## 6. Dashboard Client

- [x] 6.1 Corriger la grille stats KPI : breakpoints progressifs 2→3→4 colonnes (`app/client/page.tsx`)
- [x] 6.2 Corriger les grilles charts et sections avec breakpoint md (`app/client/page.tsx`)
- [x] 6.3 Rendre les tables projets responsive (`app/client/page.tsx`)

## 7. Dashboard Admin

- [x] 7.1 Corriger la grille stats : grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 (`app/admin/page.tsx`)
- [x] 7.2 Corriger les sections traffic, alertes, charts avec breakpoints progressifs (`app/admin/page.tsx`)
- [x] 7.3 Corriger quick links et activity feed pour mobile (`app/admin/page.tsx`)

## 8. Dashboard Agence

- [x] 8.1 Corriger la grille stats agence : breakpoints progressifs (`app/agence/page.tsx`)
- [x] 8.2 Corriger les charts et sections agence avec breakpoint md (`app/agence/page.tsx`)
- [x] 8.3 Ajuster le header agence (empiler boutons sur mobile) (`app/agence/page.tsx`)

## 9. Espaces Formations

- [x] 9.1 Remplacer `calc(100vh-200px)` et `calc(100vh-280px)` par `flex-1` dans formations admin layout (`app/formations/(admin)/layout.tsx`)
- [x] 9.2 Idem pour formations instructeur layout (`app/formations/(instructeur)/layout.tsx`)
- [x] 9.3 Idem pour formations apprenant layout (`app/formations/(apprenant)/layout.tsx`)
- [x] 9.4 Ajouter troncature des breadcrumbs sur mobile pour les 3 espaces formations

## 10. Composants partagés

- [x] 10.1 Rendre StatCard responsive : padding adaptatif (p-3 sm:p-4 lg:p-5), texte adaptatif (text-lg sm:text-xl lg:text-2xl) (`components/ui/StatCard.tsx`)
- [x] 10.2 Vérifier et corriger le responsive des sous-pages dashboard (services, commandes, finances)
- [x] 10.3 Vérifier et corriger le responsive des sous-pages admin (utilisateurs, KYC, litiges, services)
- [x] 10.4 Vérifier et corriger le responsive de la page explorer/marketplace (`app/(public)/explorer/page.tsx`)

## 11. Vérification finale

- [x] 11.1 TypeScript check passé sans erreur
- [ ] 11.2 Tester visuellement sur mobile/tablette/desktop
