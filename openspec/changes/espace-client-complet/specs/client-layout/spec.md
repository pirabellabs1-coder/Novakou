## ADDED Requirements

### Requirement: Client layout SHALL render a fixed dark sidebar with green branding
Le layout client (`apps/web/app/client/layout.tsx`) SHALL afficher un sidebar fixe gauche de largeur `w-64` (256px) avec un fond dark (`#112114`), le logo vert FreelanceHigh (icône bolt verte `#19e642`), le titre "Espace Client" et un sous-titre "Gestion de projets SaaS".

#### Scenario: Affichage du sidebar sur desktop
- **WHEN** l'utilisateur accède à n'importe quelle page `/client/*` sur un écran >= 1024px
- **THEN** le sidebar fixe gauche s'affiche avec le logo, le titre "Espace Client", et la navigation complète

#### Scenario: Sidebar masqué sur mobile avec overlay
- **WHEN** l'utilisateur accède à une page client sur un écran < 1024px
- **THEN** le sidebar est masqué par défaut et un bouton hamburger dans le header permet de l'ouvrir en overlay

### Requirement: Sidebar navigation SHALL contain exactly 6 items plus CTA
Le sidebar SHALL contenir les items de navigation suivants avec icônes Material Symbols Outlined, dans cet ordre : Tableau de bord (dashboard), Projets (assignment), Messages (chat), Favoris (favorite), Factures/Paiements (receipt_long). Un bouton CTA "+ Nouveau Projet" vert (`#19e642`) avec shadow SHALL être positionné en bas du sidebar.

#### Scenario: Navigation active state
- **WHEN** l'utilisateur est sur la page `/client` (dashboard)
- **THEN** l'item "Tableau de bord" SHALL avoir un fond `bg-primary/10` avec une bordure droite verte `#19e642` et le texte en couleur primaire

#### Scenario: Clic sur Nouveau Projet
- **WHEN** l'utilisateur clique sur le bouton "+ Nouveau Projet"
- **THEN** il est redirigé vers `/client/projets/nouveau`

### Requirement: Client header SHALL be sticky with search, notifications, and user avatar
Le header sticky (hauteur `h-16`, 64px) SHALL contenir : un champ de recherche avec placeholder "Rechercher un projet...", une icône notification (bell), une icône paramètres (settings), le nom de l'utilisateur "Jean Dupont" et son avatar.

#### Scenario: Header toujours visible au scroll
- **WHEN** l'utilisateur scrolle le contenu principal
- **THEN** le header reste fixe en haut de la zone de contenu avec un effet `backdrop-blur`

### Requirement: Layout SHALL use Manrope font family
Le layout client SHALL charger la police Manrope via `next/font/google` et l'appliquer à tout l'espace client.

#### Scenario: Police Manrope appliquée
- **WHEN** n'importe quelle page client se charge
- **THEN** tout le texte utilise la police Manrope (weights 200-800)

### Requirement: Layout SHALL enforce dark theme
Le layout client SHALL forcer le mode dark (`class="dark"`) avec les couleurs de fond `#112114` pour le body et `#1a2f1e` pour les surfaces/cards.

#### Scenario: Thème dark appliqué
- **WHEN** l'utilisateur accède à l'espace client
- **THEN** le fond de page est `#112114`, les cards ont un fond légèrement plus clair, les textes sont blancs/gris clair
