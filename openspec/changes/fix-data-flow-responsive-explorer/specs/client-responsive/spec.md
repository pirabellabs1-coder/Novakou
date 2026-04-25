## Purpose

Rendre l'espace client entièrement responsive sur mobile (375px), tablette (768px) et desktop (1280px). Corriger les boutons qui se coupent, les grilles qui ne reflow pas et les éléments mal positionnés.

## Requirements

- R1: Client dashboard table SHALL reflow from 3 columns (desktop) to stacked cards on mobile
- R2: All buttons in client space SHALL be fully visible and tappable on 375px screens
- R3: Client layout SHALL maintain minimum 16px padding on all screen sizes
- R4: Form elements SHALL not overflow their container on any screen size
- R5: Action button rows SHALL stack vertically on mobile (flex-col) and horizontally on desktop (flex-row)

## Scenarios

### Scénario 1 : Dashboard client sur mobile (375px)
1. L'utilisateur ouvre `/client` sur un iPhone SE (375px)
2. Les stats cards s'affichent en 1 colonne
3. Le tableau "Projets Actifs" s'affiche en cartes empilées (pas en grid-cols-12)
4. Tous les boutons sont visibles et cliquables sans scroll horizontal

### Scénario 2 : Dashboard client sur tablette (768px)
1. L'utilisateur ouvre `/client` sur un iPad (768px)
2. Les stats cards s'affichent en 2 colonnes
3. Le tableau est lisible avec les 3 colonnes visibles
4. Les boutons ne se chevauchent pas
