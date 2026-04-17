## ADDED Requirements

### Requirement: Sidebar apprenant avec menus dédiés
Le système DOIT afficher une sidebar latérale gauche dans l'espace apprenant (`/(apprenant)/*`) avec les liens suivants : Mes Formations, Certificats, Favoris, Panier, Paramètres. La sidebar DOIT utiliser les couleurs FreelanceHigh et inclure l'avatar de l'utilisateur.

#### Scenario: Apprenant voit sa sidebar sur desktop
- **WHEN** un apprenant connecté accède à `/mes-formations` sur un écran >= 1024px
- **THEN** une sidebar gauche fixe s'affiche avec les liens : Mes Formations, Certificats, Favoris, Panier, Paramètres, et son avatar/nom en haut

#### Scenario: Apprenant navigue entre les pages via la sidebar
- **WHEN** un apprenant clique sur "Certificats" dans la sidebar
- **THEN** il est redirigé vers `/certificats` et le lien "Certificats" est visuellement actif dans la sidebar

#### Scenario: Sidebar apprenant en mode mobile
- **WHEN** un apprenant connecté accède à `/mes-formations` sur un écran < 1024px
- **THEN** la sidebar est masquée et remplacée par un menu hamburger ou un bottom navigation avec les mêmes liens

### Requirement: Sidebar instructeur avec menus dédiés
Le système DOIT afficher une sidebar latérale gauche dans l'espace instructeur (`/(instructeur)/*`) avec les liens suivants : Dashboard, Mes Formations, Créer une Formation, Apprenants, Revenus, Avis, Statistiques, Paramètres.

#### Scenario: Instructeur voit sa sidebar sur desktop
- **WHEN** un instructeur connecté accède à `/instructeur/dashboard` sur un écran >= 1024px
- **THEN** une sidebar gauche fixe s'affiche avec les liens : Dashboard, Mes Formations, Créer, Apprenants, Revenus, Avis, Statistiques, Paramètres, et son avatar/nom en haut

#### Scenario: Instructeur navigue entre les pages via la sidebar
- **WHEN** un instructeur clique sur "Revenus" dans la sidebar
- **THEN** il est redirigé vers `/instructeur/revenus` et le lien "Revenus" est visuellement actif dans la sidebar

#### Scenario: Sidebar instructeur en mode mobile
- **WHEN** un instructeur connecté accède à `/instructeur/dashboard` sur un écran < 1024px
- **THEN** la sidebar est masquée et remplacée par un menu hamburger avec les mêmes liens

### Requirement: Header formations contextuel selon le rôle
Le header formations DOIT changer ses menus selon le contexte de l'utilisateur : menus publics pour les visiteurs, menus apprenant pour les apprenants, menus instructeur pour les instructeurs.

#### Scenario: Header en mode public (non connecté)
- **WHEN** un visiteur non connecté navigue sur `/`
- **THEN** le header affiche : Accueil, Explorer, Catégories, Devenir Instructeur + boutons Connexion/Inscription

#### Scenario: Header en mode apprenant (connecté)
- **WHEN** un apprenant connecté navigue sur `/explorer` (page publique)
- **THEN** le header affiche : Accueil, Explorer, Catégories + raccourcis Mes Formations, Panier + avatar dropdown

#### Scenario: Header en mode instructeur (connecté)
- **WHEN** un instructeur connecté navigue sur `/` (page publique)
- **THEN** le header affiche : Accueil, Explorer, Catégories + raccourci Dashboard Instructeur + avatar dropdown

### Requirement: Indicateur visuel de la page active
La navigation (header et sidebar) DOIT indiquer visuellement la page active avec un style distinct (couleur, bordure ou fond) pour que l'utilisateur sache toujours où il se trouve.

#### Scenario: Lien actif dans la sidebar apprenant
- **WHEN** un apprenant est sur `/certificats`
- **THEN** le lien "Certificats" dans la sidebar est mis en évidence visuellement (fond coloré, bordure latérale, ou texte en gras)

#### Scenario: Lien actif dans le header public
- **WHEN** un visiteur est sur `/explorer`
- **THEN** le lien "Explorer" dans le header est mis en évidence visuellement

### Requirement: Transition fluide entre espaces
L'utilisateur DOIT pouvoir basculer entre les pages publiques formations et son espace personnel sans rechargement de page complet (navigation côté client Next.js).

#### Scenario: Apprenant passe de l'explorer à ses formations
- **WHEN** un apprenant connecté clique sur "Mes Formations" depuis `/explorer`
- **THEN** la navigation s'effectue côté client (pas de rechargement complet), la sidebar apprenant apparaît, et le header s'adapte

### Requirement: Breadcrumb formations
Les pages internes (espace apprenant et instructeur) DOIVENT afficher un fil d'Ariane (breadcrumb) pour aider la navigation. Exemple : "Formations > Mes Formations > Python Avancé".

#### Scenario: Breadcrumb sur la page de détail d'une formation apprenant
- **WHEN** un apprenant est sur `/apprendre/123`
- **THEN** un breadcrumb s'affiche : "Formations > Mes Formations > [Nom de la formation]"

#### Scenario: Breadcrumb sur la page revenus instructeur
- **WHEN** un instructeur est sur `/instructeur/revenus`
- **THEN** un breadcrumb s'affiche : "Formations > Instructeur > Revenus"
