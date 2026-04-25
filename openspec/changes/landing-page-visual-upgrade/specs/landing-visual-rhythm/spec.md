## ADDED Requirements

### Requirement: Alternance de fonds sur la page d'accueil
La page d'accueil SHALL alterner entre 3 types de fonds de section : surface clair (`#f6fbf2`), blanc (`#ffffff`), et primary dark (`#006e2f`). Il ne MUST jamais y avoir plus de 2 sections consécutives sur le même type de fond (sauf surface clair pour hero + dashboard qui forment un bloc logique).

#### Scenario: Vérification du rythme visuel
- **WHEN** un utilisateur fait défiler la page d'accueil de haut en bas
- **THEN** il rencontre au minimum 3 sections sur fond `#006e2f` (stats banner, IA feature, section paiements) avant le CTA final

### Requirement: Fusion des sections features en une grille unique de 8 cards
La page SHALL afficher une seule section "Fonctionnalités" avec exactement 8 cards au lieu des 2 sections actuelles (18 cards + 8 cards). Les 8 features retenues MUST être : Boutique en ligne, Paiements locaux, Assistant IA, Tunnels de vente, Hébergement vidéo, Certificats, Automatisations, 100% Mobile.

#### Scenario: Affichage de la grille features sur desktop
- **WHEN** un utilisateur consulte la page d'accueil sur un écran >= 1024px
- **THEN** les 8 features s'affichent en grille 2 colonnes × 4 rangées

#### Scenario: Affichage de la grille features sur mobile
- **WHEN** un utilisateur consulte la page d'accueil sur un écran < 768px
- **THEN** les 8 features s'affichent en colonne unique empilée

### Requirement: Suppression de la section Écosystème
La section "Écosystème — Paiements & intégrations" (2 cards : paiements + automatisations) SHALL être supprimée. Son contenu est redondant avec la section Paiements redesignée.

#### Scenario: Absence de la section Écosystème
- **WHEN** un utilisateur défile la page d'accueil complète
- **THEN** il ne voit aucune section titrée "Connecté à tout ce que vous utilisez" ni de pill "Écosystème"

### Requirement: Section IA sur fond primary dark
La section "IA intégrée" SHALL utiliser le fond `#006e2f` avec texte blanc au lieu du fond `bg-emerald-50`. La card chatbot mockup MUST rester sur fond blanc pour le contraste.

#### Scenario: Contraste de la section IA
- **WHEN** un utilisateur voit la section IA
- **THEN** le titre et la description sont en blanc sur fond `#006e2f`, et la card chatbot est blanche
