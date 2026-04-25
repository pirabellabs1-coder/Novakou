## ADDED Requirements

### Requirement: Layout agence avec sidebar et header
Le système SHALL afficher un layout à 2 colonnes pour l'espace Agence : sidebar à gauche (w-64) + zone principale avec header sticky en haut. Le thème vert agence SHALL être appliqué via CSS custom properties dans le layout.

#### Scenario: Affichage desktop
- **WHEN** l'utilisateur accède à une page `/agence/*` sur un écran >= 1024px
- **THEN** la sidebar est visible à gauche, le header est sticky en haut, la zone principale occupe le reste

#### Scenario: Affichage mobile
- **WHEN** l'utilisateur accède à une page `/agence/*` sur un écran < 1024px
- **THEN** la sidebar est masquée, un bouton hamburger apparaît dans le header, cliquer dessus ouvre la sidebar en overlay avec backdrop

### Requirement: Sidebar agence avec navigation complète
La sidebar SHALL contenir 10 items principaux et 4 items secondaires avec icônes Material Symbols. L'item actif SHALL être mis en surbrillance avec le style `bg-primary/10 text-primary`. Un bouton CTA "Nouveau Projet" SHALL apparaître en bas de la sidebar.

#### Scenario: Navigation active
- **WHEN** l'utilisateur est sur `/agence/equipe`
- **THEN** l'item "Équipe" est surligné en vert avec `bg-primary/10 text-primary`

### Requirement: Header agence avec recherche et actions
Le header SHALL contenir une barre de recherche, des liens vers notifications, aide, paramètres, et le profil agence avec nom et avatar.

#### Scenario: Liens du header
- **WHEN** l'utilisateur clique sur l'icône notifications dans le header
- **THEN** il est redirigé vers la page messages de l'agence
