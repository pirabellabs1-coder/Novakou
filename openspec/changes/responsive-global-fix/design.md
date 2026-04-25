## Context

Le site FreelanceHigh utilise Tailwind CSS avec shadcn/ui mais de nombreux composants manquent de breakpoints intermédiaires (`md:`) et utilisent des tailles fixes (padding, largeurs, polices) qui ne s'adaptent pas aux écrans mobiles. Le marché cible (Afrique francophone) accède majoritairement via mobile, rendant cette correction critique pour le MVP.

Les problèmes principaux identifiés :
- **Landing page** : Hero stats cards non alignés horizontalement, catégories trop grandes, recherche non empilée
- **Sidebars** : `w-72` fixe sans contrainte `max-w` sur mobile, déborde sur petits écrans
- **Grilles dashboards** : sauts de colonnes sans breakpoint `md:` (ex: 2 cols → 6 cols direct)
- **Formations layouts** : `calc(100vh-200px)` hardcodés non adaptatifs
- **Cards** : padding et polices fixes, pas de retour à la ligne correct

## Goals / Non-Goals

**Goals :**
- Rendre chaque page du site utilisable sur mobile (375px), tablette (768px) et desktop (1280px)
- Appliquer des breakpoints Tailwind progressifs et cohérents sur tout le site
- Hero stats cards : 3 cards alignées horizontalement sur une seule ligne même sur mobile (taille réduite)
- Cards catégories : 2 par ligne sur mobile avec taille et police réduites
- Sidebars mobile : contraindre la largeur pour ne jamais déborder
- Tables : scroll horizontal avec overflow visible sur mobile

**Non-Goals :**
- Refonte visuelle ou changement de design — on adapte l'existant, on ne le redesigne pas
- Ajout de nouvelles fonctionnalités ou composants
- Support d'écrans ultra-petits (< 320px)
- Ajout de mode sombre ou thème alternatif
- Modifications backend, API ou schéma DB

## Decisions

### D1 — Stratégie de breakpoints Tailwind cohérente
On adopte un système de breakpoints progressif sur tout le site :
- **Mobile** (< 640px) : 1-2 colonnes, tailles réduites, sidebars en overlay
- **sm** (640px) : 2 colonnes pour les cards
- **md** (768px) : breakpoint intermédiaire (tablette portrait) — actuellement manquant dans la majorité des composants
- **lg** (1024px) : layout desktop avec sidebar visible
- **xl** (1280px) : grilles élargies (4-6 colonnes)

### D2 — Hero stats cards : `flex` horizontal sur toutes les tailles
Les 3 cards (freelances actifs, clients satisfaits, projets livrés) restent toujours sur une ligne horizontale. On réduit leur taille, padding et police sur mobile plutôt que de les empiler verticalement.

### D3 — Cards catégories : grille 2 colonnes mobile
Au lieu de `grid-cols-2 lg:grid-cols-4`, on utilise `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` avec réduction de padding (`p-4` au lieu de `p-10`) et taille d'icône (`text-3xl` au lieu de `text-5xl`) sur mobile.

### D4 — Sidebars mobiles : max-width contraint
Toutes les sidebars en overlay mobile reçoivent `max-w-[min(85vw,288px)]` pour ne jamais déborder sur les petits écrans (iPhone SE 375px, vieux Android 360px).

### D5 — Formations layouts : hauteurs flexibles
Remplacer les `min-h-[calc(100vh-200px)]` et `min-h-[calc(100vh-280px)]` par `min-h-[calc(100dvh-12rem)]` ou `flex-1` selon le contexte — `100dvh` respecte la barre d'adresse mobile.

### D6 — Approche CSS-only (Tailwind)
Toutes les corrections sont faites en classes Tailwind uniquement. Pas de media queries custom, pas de JS pour le responsive. Pas de nouvelles dépendances.

## Risks / Trade-offs

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Volume de fichiers à modifier (~30+) | Régression visuelle possible | Tester chaque espace après modification |
| Breakpoint `md:` ajouté partout | Incohérence si partiellement appliqué | Traiter par groupes logiques (landing, puis dashboards, puis formations) |
| Stats cards horizontaux forcés sur mobile | Texte trop petit sur très petits écrans | Réduire à l'essentiel (chiffre + label court), police min `text-xs` |
| `100dvh` non supporté sur vieux navigateurs | Layout cassé sur Safari < 15.4 | Fallback `100vh` via `min-h-[calc(100vh-12rem)]` avec `supports` |
