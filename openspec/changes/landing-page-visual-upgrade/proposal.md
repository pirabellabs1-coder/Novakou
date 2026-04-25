## Why

La page d'accueil Novakou souffre de monotonie visuelle : presque toutes les sections utilisent le même fond blanc/surface (#f6fbf2), rendant la page plate et sans rythme. La couleur principale `#006e2f` n'apparaît en fond que sur le CTA final. La section "Vendez localement sans friction" utilise un fond amber/jaune (`bg-amber-50`) qui casse l'harmonie de la palette verte. De plus, la section Écosystème est redondante avec cette section Paiements.

Version cible : **MVP** — c'est la page d'acquisition principale.

## What Changes

- **Refonte section "Vendez localement sans friction"** : remplacer le fond `bg-amber-50` par un fond `#006e2f` avec texte blanc, redesign des cartes checkout/retrait pour fonctionner sur fond sombre. Nouveau titre plus impactant.
- **Suppression section Écosystème** : contenu redondant avec la section Paiements redesignée — les pills paiements et automatisations seront intégrées ailleurs.
- **Ajout d'une section fond `#006e2f`** entre les features (section 5) et l'IA (section 6) : une bannière chiffrée immersive (stats clés de la plateforme) pour casser la monotonie des grilles blanches.
- **Fusion des sections Features (18 cards) + Outils Avancés (8 cards)** : regrouper en une seule section avec les 8 outils les plus marquants, supprimer la grille 18 cards trop dense.
- **Amélioration rythme visuel global** : alternance fond clair / fond `#006e2f` / fond blanc pour créer un rythme de lecture engageant.

## Capabilities

### New Capabilities
- `landing-visual-rhythm`: Alternance de fonds colorés (#006e2f, surfaces claires) entre les sections pour créer un rythme visuel engageant et mettre en valeur la marque Novakou.
- `landing-stats-banner`: Bannière immersive pleine largeur sur fond #006e2f affichant les métriques clés de la plateforme (créateurs, pays, ventes).
- `landing-payment-redesign`: Redesign de la section paiements avec fond #006e2f, cards translucides et titre plus impactant.

### Modified Capabilities

## Impact

- **Fichier principal** : `apps/web/app/(formations)/page.tsx` — restructuration des sections, suppression de sections redondantes, ajout de nouvelles sections.
- **Aucun impact backend** : changements purement frontend/visuels.
- **Aucune migration Prisma** nécessaire.
- **Aucun job BullMQ, handler Socket.io ou template email** affecté.
- **Aucun impact sur les autres rôles** : page publique uniquement.
