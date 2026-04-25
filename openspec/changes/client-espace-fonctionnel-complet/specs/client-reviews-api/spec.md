## ADDED Requirements

### Requirement: Reviews page SHALL display real reviews from API
La page `/client/avis` SHALL charger les avis donnes et en attente depuis l'API reviews.

#### Scenario: Affichage des avis donnes
- **WHEN** le client accede a `/client/avis`
- **THEN** les avis qu'il a donnes sont affiches avec note, commentaire, date et freelance concerne

#### Scenario: Avis en attente
- **WHEN** le client a des commandes terminees sans avis
- **THEN** un onglet "En attente" affiche les commandes qui attendent un avis

### Requirement: Client SHALL be able to submit and edit reviews
Le client SHALL pouvoir soumettre un nouvel avis apres validation de commande et modifier un avis existant dans les 7 jours.

#### Scenario: Soumettre un nouvel avis
- **WHEN** le client remplit le formulaire (note qualite, communication, delai + commentaire) et clique "Soumettre"
- **THEN** l'avis est envoye via `POST /api/reviews` et apparait dans la liste des avis donnes

#### Scenario: Modifier un avis recent
- **WHEN** le client clique "Modifier" sur un avis de moins de 7 jours
- **THEN** un formulaire pre-rempli permet de modifier les notes et le commentaire

#### Scenario: Modification impossible apres 7 jours
- **WHEN** le client tente de modifier un avis de plus de 7 jours
- **THEN** le bouton "Modifier" n'est pas affiche
