## ADDED Requirements

### Requirement: Explorer SHALL fetch services, freelancers and agencies from API
La page `/client/explorer` SHALL charger les services, freelances et agences depuis les APIs respectives avec filtres avances (categorie, prix, note, pays, langue, disponibilite) et pagination.

#### Scenario: Recherche par categorie
- **WHEN** le client selectionne la categorie "Developpement Web"
- **THEN** seuls les services/freelances/agences de cette categorie sont affiches

#### Scenario: Pagination des resultats
- **WHEN** plus de 12 resultats existent
- **THEN** une pagination est affichee et le client peut naviguer entre les pages

#### Scenario: Tri des resultats
- **WHEN** le client selectionne "Prix croissant"
- **THEN** les resultats sont retries par prix du plus bas au plus haut

### Requirement: Favorites SHALL be managed via API
La page `/client/favoris` SHALL gerer les favoris (freelances, services, agences) via l'API avec ajout, suppression et organisation en listes personnalisees.

#### Scenario: Ajouter un freelance aux favoris
- **WHEN** le client clique sur le coeur d'un profil freelance
- **THEN** l'API est appelee et le freelance apparait dans la page favoris

#### Scenario: Supprimer un favori
- **WHEN** le client clique "Retirer" sur un favori
- **THEN** l'API est appelee et le favori disparait de la liste

#### Scenario: Creer une liste de favoris
- **WHEN** le client cree une liste "Projet Logo" et y ajoute des freelances
- **THEN** la liste est sauvegardee via l'API et accessible depuis la page favoris
