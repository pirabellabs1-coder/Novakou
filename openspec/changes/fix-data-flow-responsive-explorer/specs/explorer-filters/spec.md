## Purpose

Refondre les filtres de la page Explorer pour qu'ils soient propres, cohérents avec le menu catégories de la page d'accueil, et fonctionnels sur tous les écrans. Corriger le grid trop serré et le toggle vue manquant sur mobile.

## Requirements

- R1: Explorer service grid SHALL use max 4 columns on xl screens (not 5)
- R2: Explorer filters SHALL stack vertically on mobile (< 640px) and horizontally on desktop
- R3: Explorer category navigation SHALL match the visual style of the landing page CategoriesSection
- R4: View toggle (grid/list) SHALL be accessible on mobile screens
- R5: Filter dropdowns SHALL adapt their width to screen size (no fixed min-w-[240px] on mobile)
- R6: Explorer page SHALL maintain consistent gaps: gap-3 (mobile), gap-4 (tablet), gap-5 (desktop)

## Scenarios

### Scénario 1 : Explorer sur mobile (375px)
1. L'utilisateur ouvre `/explorer`
2. Les catégories s'affichent en pills scrollables horizontalement
3. Les filtres (prix, note, pays) sont empilés verticalement
4. Les services s'affichent en 1 colonne
5. Un toggle grille/liste est visible

### Scénario 2 : Explorer sur desktop (1280px)
1. Les catégories s'affichent en grille avec icônes (style page d'accueil)
2. Les filtres sont en ligne avec les dropdowns
3. Les services s'affichent en 3-4 colonnes
4. Le toggle grille/liste est visible dans la barre de filtres
