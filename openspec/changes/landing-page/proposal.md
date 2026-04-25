## Why

La plateforme FreelanceHigh n'a pas encore de code de production. Le projet démarre à la phase MVP et la landing page est la première surface visible — c'est elle qui capte les premières inscriptions, installe la crédibilité de la marque et convainc freelances, clients et agences de rejoindre la plateforme. Sans elle, aucune autre fonctionnalité ne peut être testée ni déployée.

## What Changes

- Création de la route publique `/` (landing page) dans `apps/web/app/(public)/page.tsx`
- Mise en place du layout public partagé (`apps/web/app/(public)/layout.tsx`) avec navbar et footer
- Composants UI réutilisables dans `packages/ui/` : `Navbar`, `Footer`, `HeroSection`, `StatsBar`, `CategoryCard`, `FreelanceCard`, `HowItWorks`, `CtaSection`
- Initialisation de la structure monorepo `apps/web` avec Next.js 14 App Router, Tailwind CSS et shadcn/ui
- Configuration `next-intl` pour le routing `fr` (MVP) avec namespace `common` et `landing`

## Capabilities

### New Capabilities
- `landing-page` : Page d'accueil publique complète avec hero, stats, catégories, top freelances, "comment ça marche", CTA, et footer — fidèle à la maquette de référence `afriquefreelance_landing_page_1`
- `public-navbar` : Barre de navigation sticky avec logo FreelanceHigh, liens de navigation, sélecteur de devise (Zustand), boutons Connexion / Inscription
- `public-footer` : Footer avec colonnes Plateforme / Support / Newsletter et liens légaux

### Modified Capabilities
<!-- Aucune spec existante modifiée — c'est la première fonctionnalité du projet -->

## Impact

- **apps/web** : initialisation complète de la structure Next.js 14 App Router (dossiers `app/`, `components/`, `public/`, configuration Tailwind, next-intl)
- **packages/ui** : premiers composants shadcn/ui partagés (Button, Input, Badge)
- **packages/types** : types partagés de base (Currency, Locale, NavItem)
- **Schéma Prisma** : aucun impact — la landing page est 100 % statique / SSG au MVP
- **Aucun job BullMQ, handler Socket.io ou template email** requis pour cette fonctionnalité
- **Version cible** : MVP (Mois 1–3)
