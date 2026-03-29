## ADDED Requirements

### Requirement: Agency service creation wizard SHALL be identical to freelance wizard with agency extras
Le wizard de creation de service de l'agence MUST reproduire exactement les 7 etapes du wizard freelance : Etape 1 (titre + categorie), Etape 2 (prix + description rich text), Etape 3 (options supplementaires), Etape 4 (livraison express), Etape 5 (consignes de realisation), Etape 6 (galerie medias), Etape 7 (publication). Le wizard MUST ajouter une fonctionnalite specifique agence : l'assignation du service a un membre de l'equipe.

#### Scenario: Wizard agence a les memes 7 etapes que le freelance
- **WHEN** un utilisateur agence accede a `/agence/services/creer`
- **THEN** le wizard affiche 7 etapes avec navigation (precedent/suivant), barre de progression, et les memes champs que le wizard freelance

#### Scenario: Etape 2 contient un editeur rich text complet
- **WHEN** un utilisateur agence est a l'etape 2 du wizard
- **THEN** l'editeur de description supporte le texte riche (gras, italique, listes, tableaux, couleurs, taille de police)

#### Scenario: Assignation d'un membre de l'equipe
- **WHEN** un utilisateur agence est a l'etape 7 (publication) du wizard
- **THEN** un selecteur permet de choisir un membre de l'equipe pour assigner le service
- **THEN** si aucun membre n'est selectionne, le service est assigne au proprietaire de l'agence par defaut

#### Scenario: Service publie avec badge "Agence"
- **WHEN** un service est publie via le wizard agence
- **THEN** le service est cree avec le flag `isAgency: true` et affiche un badge "Agence" dans le feed et le profil public
- **THEN** le service est publie sous le nom de l'agence (pas le nom du membre)

#### Scenario: Sauvegarde des donnees via API
- **WHEN** un utilisateur complete le wizard et clique "Publier"
- **THEN** les donnees sont envoyees a l'API `/api/services/publish` avec toutes les informations des 7 etapes
- **THEN** le service est cree avec le statut "en_attente" jusqu'a approbation admin
