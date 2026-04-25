## ADDED Requirements

### Requirement: Structure de la Navbar
La Navbar publique SHALL afficher le logo FreelanceHigh, les liens de navigation, un sélecteur de devise et les boutons Connexion / Inscription.

#### Scenario: Affichage desktop
- **WHEN** la page est affichée sur un écran ≥768px
- **THEN** la Navbar affiche le logo à gauche, les liens de navigation centrés et les actions (devise + connexion + inscription) à droite

#### Scenario: Affichage mobile
- **WHEN** la page est affichée sur un écran <768px
- **THEN** les liens de navigation sont masqués et un menu hamburger est affiché

#### Scenario: Comportement sticky
- **WHEN** le visiteur fait défiler la page vers le bas
- **THEN** la Navbar reste fixée en haut de l'écran avec un effet de flou (backdrop-blur)

---

### Requirement: Liens de navigation
La Navbar SHALL afficher les liens "Explorer", "Projets" et un lien contextuel selon le rôle.

#### Scenario: Navigation vers Explorer
- **WHEN** le visiteur clique sur "Explorer"
- **THEN** il est redirigé vers `/explorer`

#### Scenario: Navigation vers Projets
- **WHEN** le visiteur clique sur "Projets"
- **THEN** il est redirigé vers `/projets`

---

### Requirement: Sélecteur de devise
La Navbar SHALL afficher un sélecteur de devise permettant de choisir entre EUR, FCFA, USD, GBP et MAD.

#### Scenario: Devise par défaut
- **WHEN** un visiteur arrive sur la page pour la première fois
- **THEN** la devise affichée est EUR (€)

#### Scenario: Changement de devise
- **WHEN** le visiteur sélectionne une devise dans le menu déroulant
- **THEN** le store Zustand `useCurrencyStore` est mis à jour et la devise sélectionnée est persistée dans `localStorage`

#### Scenario: Persistance de la devise
- **WHEN** le visiteur revient sur la page après avoir changé de devise
- **THEN** la devise préalablement choisie est restaurée depuis `localStorage`

---

### Requirement: Boutons d'authentification
La Navbar SHALL afficher les boutons "Connexion" et "Inscription" pour les visiteurs non connectés.

#### Scenario: Clic sur Connexion
- **WHEN** le visiteur clique sur "Connexion"
- **THEN** il est redirigé vers `/connexion`

#### Scenario: Clic sur Inscription
- **WHEN** le visiteur clique sur "Inscription"
- **THEN** il est redirigé vers `/inscription`
