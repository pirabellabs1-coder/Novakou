## 1. Initialisation du Monorepo

- [x] 1.1 Initialiser le monorepo avec `pnpm workspaces` + `turbo.json` à la racine
- [x] 1.2 Créer `apps/web` avec `create-next-app` (Next.js 14, TypeScript, Tailwind CSS, App Router)
- [x] 1.3 Créer `packages/ui` avec configuration shadcn/ui de base
- [x] 1.4 Créer `packages/types` avec les types partagés de base (Currency, Locale, NavItem)
- [x] 1.5 Créer `packages/config` avec les configs ESLint et TypeScript partagées
- [x] 1.6 Configurer Turborepo (`turbo.json`) avec les pipelines `dev`, `build`, `lint`

## 2. Configuration Next.js et Tailwind

- [x] 2.1 Configurer `tailwind.config.ts` avec les couleurs de marque (primaire `#0e7c66`, accent `#f2b705`, background-dark `#11211e`) et la police Manrope — exactement comme la maquette
- [x] 2.2 Configurer `next.config.ts` (domaines Cloudinary pour `next/image`, i18n stub)
- [x] 2.3 Installer et configurer `next-intl` pour la locale `fr` uniquement (MVP)
- [x] 2.4 Créer le root layout `app/layout.tsx` avec providers (Zustand, TanStack Query, next-intl)
- [x] 2.5 Initialiser le store Zustand `useCurrencyStore` avec persistance `localStorage`

## 3. Composants Layout partagés

- [x] 3.1 Créer le composant `Navbar` (`components/layout/Navbar.tsx`) : logo, liens nav, sélecteur devise, boutons Connexion/Inscription — avec support RTL (`rtl:`)
- [x] 3.2 Créer le menu mobile de la `Navbar` (hamburger + drawer)
- [x] 3.3 Créer le composant `Footer` (`components/layout/Footer.tsx`) : 4 colonnes (branding, Réseau Mondial, Support & Sécurité, Newsletter)
- [x] 3.4 Créer le layout `app/(public)/layout.tsx` qui encapsule `Navbar` + `{children}` + `Footer`

## 4. Section Hero

- [x] 4.1 Créer `components/landing/HeroSection.tsx` avec image de fond, overlay gradient `from-background-dark via-background-dark/80`, titre, sous-titre
- [x] 4.2 Ajouter la barre de recherche dans le Hero
- [x] 4.3 Ajouter les boutons CTA Hero ("Trouver un freelance" → `/explorer`, "Devenir Freelance" → `/inscription`)
- [x] 4.4 Rendre le Hero responsive (mobile : texte réduit, boutons empilés)

## 5. Section Stats

- [x] 5.1 Créer `components/landing/StatsBar.tsx` avec 3 cartes métriques (Freelances Vérifiés, Couverture Globale, Volume de Projets)
- [x] 5.2 Positionner la `StatsBar` en chevauchement avec le bas du Hero sur desktop (`-mt-20`)

## 6. Section Catégories

- [x] 6.1 Créer `components/landing/CategoriesSection.tsx` avec grille 4 colonnes
- [x] 6.2 Créer le composant `CategoryCard` réutilisable (icône Material Symbols, titre, description, hover primary)
- [x] 6.3 Ajouter les 4 catégories de la maquette : Design & Créa, Tech & Dev, Marketing Global, Traduction & Contenu
- [x] 6.4 Ajouter le lien "Toutes les catégories" → `/explorer`

## 7. Section Top Freelances

- [x] 7.1 Créer `components/landing/TopFreelancesSection.tsx` avec grille 3 colonnes
- [x] 7.2 Créer le composant `FreelanceCard` (photo, nom, titre, note étoiles, compétences, tarif journalier, badge ELITE)
- [x] 7.3 Câbler le tarif affiché avec `useCurrencyStore` pour refléter la devise sélectionnée
- [x] 7.4 Rendre les cartes cliquables → `/freelances/<username>`

## 8. Section Comment ça marche

- [x] 8.1 Créer `components/landing/HowItWorksSection.tsx` avec les 3 étapes numérotées (layout 2 colonnes : image gauche, étapes droite)
- [x] 8.2 Ajouter le bouton CTA "Démarrer une mission" → `/inscription`

## 9. Section CTA Finale

- [x] 9.1 Créer `components/landing/CtaSection.tsx` avec fond sombre, titre accrocheur, 2 boutons CTA
- [x] 9.2 Câbler les boutons ("Trouver un expert" → `/explorer`, "Devenir Freelance Global" → `/inscription`)

## 10. Page principale et SEO

- [x] 10.1 Créer `app/(public)/page.tsx` qui assemble toutes les sections dans l'ordre
- [x] 10.2 Exporter les `metadata` Next.js (title, description, OpenGraph, JSON-LD Organisation)
- [ ] 10.3 Valider que la page est générée en SSG (`next build` → `/` dans `output`)

## 11. Tests et Validation Playwright

- [ ] 11.1 Tester le rendu responsive : mobile (375px), tablette (768px), desktop (1280px)
- [ ] 11.2 Vérifier que tous les liens de navigation redirigent correctement
- [ ] 11.3 Tester le sélecteur de devise : changement + persistance localStorage
- [ ] 11.4 Vérifier la conformité visuelle avec la maquette de référence (screenshot comparatif)
- [ ] 11.5 Tester l'accessibilité de base : contraste, labels, navigation clavier
