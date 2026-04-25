## ADDED Requirements

### Requirement: Agency sidebar SHALL display all navigation links without hiding any
La sidebar de l'espace agence SHALL afficher tous les liens de navigation sans element cache, collapse par defaut, ou overflow hidden. Si le contenu depasse la hauteur de l'ecran, la sidebar MUST etre scrollable. L'ordre des liens est : Dashboard, Equipe, Services, Commandes, Clients, Messages, Finances, Factures, Avis, Statistiques, Boost, SEO, Automatisation, Litiges, Aide, Parametres.

#### Scenario: Tous les liens de navigation sont visibles
- **WHEN** un utilisateur agence accede a n'importe quelle page de l'espace agence
- **THEN** la sidebar affiche tous les liens de navigation dans l'ordre defini
- **THEN** aucun lien n'est cache par un mecanisme de collapse, accordion ferme par defaut, ou overflow hidden
- **THEN** si le contenu depasse la hauteur de l'ecran, un scroll vertical est disponible

#### Scenario: Navigation vers chaque page fonctionne
- **WHEN** un utilisateur clique sur un lien de la sidebar
- **THEN** la page correspondante s'affiche sans erreur 404 ou page blanche

### Requirement: Agency sidebar SHALL display agency profile at bottom
La sidebar MUST afficher en bas : le logo de l'agence, le nom de l'agence, le plan actuel (badge), et un lien vers le profil agence. Un bouton de deconnexion MUST etre present.

#### Scenario: Profil agence visible en bas de la sidebar
- **WHEN** un utilisateur agence voit la sidebar
- **THEN** le bas de la sidebar affiche le logo de l'agence (ou avatar par defaut), le nom de l'agence, un badge avec le plan actuel (Gratuit/Pro/Business/Agence), et un lien vers `/agence/profil` ou `/agence/parametres`

#### Scenario: Bouton deconnexion fonctionne
- **WHEN** un utilisateur clique sur le bouton "Se deconnecter" dans la sidebar
- **THEN** la session est terminee et l'utilisateur est redirige vers la page de connexion
