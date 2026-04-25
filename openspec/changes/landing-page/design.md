## Context

FreelanceHigh démarre à zéro : aucun code de production n'existe. La landing page est le premier écran à implémenter. Elle doit fidèlement reproduire la maquette de référence (`afriquefreelance_landing_page_1/code.html`) tout en adoptant la charte de marque FreelanceHigh (violet primaire `#6C2BD9`, bleu `#0EA5E9`, vert `#10B981`) et la stack technique validée (Next.js 14 App Router, Tailwind CSS, shadcn/ui).

La page est entièrement statique au MVP — aucune donnée en base requise. Les stats (freelances, missions, pays) sont des valeurs hardcodées révisables. La page s'inscrit dans la route `(public)/` du App Router.

## Goals / Non-Goals

**Goals:**
- Reproduire fidèlement la structure et la hiérarchie visuelle de la maquette de référence
- Implémenter les sections : Navbar · Hero · Stats · Catégories · Top Freelances · Comment ça marche · CTA · Footer
- Mobile-first, responsive (375px, 768px, 1280px)
- Interface claire, pas de mode sombre pour le MVP
- Sélecteur de devise dans la navbar piloté par Zustand (EUR par défaut)
- Liens de navigation fonctionnels vers `/explorer`, `/inscription`, `/connexion`
- SEO : balises meta, OpenGraph, JSON-LD Organization via Next.js Metadata API
- Page générée en SSG (Static Site Generation)

**Non-Goals:**
- Données dynamiques (freelances réels, stats live) — MVP statique uniquement
- Authentification et sessions
- Mode sombre
- i18n EN/AR — uniquement `fr` au MVP
- Blog, pages légales, page tarifs — implémentées dans des changements séparés

## Decisions

### Structure de fichiers
```
apps/web/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx          ← Layout partagé : Navbar + Footer
│   │   └── page.tsx            ← Landing page (SSG)
│   └── layout.tsx              ← Root layout (html, body, providers)
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── landing/
│       ├── HeroSection.tsx
│       ├── StatsBar.tsx
│       ├── CategoriesSection.tsx
│       ├── TopFreelancesSection.tsx
│       ├── HowItWorksSection.tsx
│       └── CtaSection.tsx
```

### Gestion de la devise (Zustand)
Un store `useCurrencyStore` minimal gère la devise active. Il est initialisé à `EUR`. Le sélecteur dans la Navbar met à jour ce store. Au MVP, l'affichage des devises dans la landing est purement cosmétique (pas de conversion réelle) — la conversion effective sera implémentée dans V1.

### Composants shadcn/ui utilisés
- `Button` (CTAs, navbar)
- `Input` (barre de recherche hero, newsletter footer)
- `Badge` (labels "Elite Network", "Vérifié")

Pas de composants supplémentaires non-shadcn pour éviter la dépendance à des libs externes.

### Images hero et profils freelances
Au MVP, les images de la section "Top Freelances" sont des placeholders via `next/image` avec des URLs d'images de stock (ou des avatars générés). Le composant est conçu pour accepter des URLs dynamiques en V1.

### SEO
```ts
// app/(public)/page.tsx
export const metadata: Metadata = {
  title: 'FreelanceHigh — La plateforme freelance qui élève votre carrière',
  description: 'Connectez-vous avec les meilleurs freelances d\'Afrique francophone...',
  openGraph: { ... },
}
```

## Risks / Trade-offs

| Risque | Mitigation |
|---|---|
| Images de profils non disponibles en production | Utiliser `next/image` avec `placeholder="blur"` et `blurDataURL` généré |
| Tailwind RTL non testé dès le départ | Classes `rtl:` ajoutées sur les composants Navbar et Hero même si arabe inactif au MVP |
| Zustand store non persistent entre SSR/CSR | Initialiser `useCurrencyStore` avec `persist` + `localStorage` dès le départ |
