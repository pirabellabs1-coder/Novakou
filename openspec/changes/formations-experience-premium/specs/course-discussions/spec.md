## ADDED Requirements

### Requirement: Students SHALL create discussion threads in a course
Les apprenants inscrits DOIVENT pouvoir créer des fils de discussion dans une formation, avec un titre et un contenu.

#### Scenario: Création d'une discussion
- **WHEN** un apprenant inscrit à la formation remplit le formulaire de nouvelle discussion (titre + contenu) et soumet
- **THEN** la discussion est créée et apparaît en haut de la liste des discussions

#### Scenario: Utilisateur non inscrit
- **WHEN** un utilisateur non inscrit à la formation tente de créer une discussion
- **THEN** le système retourne une erreur 403

### Requirement: Users SHALL reply to discussion threads
Les apprenants inscrits et l'instructeur DOIVENT pouvoir répondre à un fil de discussion existant.

#### Scenario: Réponse à une discussion
- **WHEN** un utilisateur inscrit (apprenant ou instructeur) soumet une réponse à une discussion
- **THEN** la réponse apparaît sous la discussion avec le nom de l'auteur, la date et un badge "Instructeur" si c'est l'instructeur

#### Scenario: Indicateur réponse instructeur
- **WHEN** l'instructeur répond à une discussion
- **THEN** la réponse est marquée visuellement comme réponse officielle de l'instructeur

### Requirement: Instructor SHALL moderate discussions
L'instructeur DOIT pouvoir épingler, marquer comme résolu et supprimer des discussions dans ses formations.

#### Scenario: Épingler une discussion
- **WHEN** l'instructeur clique sur "Épingler" sur une discussion
- **THEN** la discussion est marquée comme épinglée et apparaît en premier dans la liste

#### Scenario: Marquer comme résolu
- **WHEN** l'instructeur clique sur "Marquer comme résolu"
- **THEN** la discussion est marquée avec un badge "Résolu" visible par tous

#### Scenario: Supprimer une discussion
- **WHEN** l'instructeur clique sur "Supprimer" sur une discussion
- **THEN** la discussion et toutes ses réponses sont supprimées définitivement

### Requirement: System SHALL provide discussion API endpoints
Le système DOIT exposer les endpoints CRUD pour les discussions et réponses.

#### Scenario: Liste des discussions
- **WHEN** GET `/api/formations/[id]/discussions?page=1` est appelé
- **THEN** le système retourne les discussions paginées (20 par page) triées par isPinned DESC puis createdAt DESC, avec le nombre de réponses

#### Scenario: Détail + réponses d'une discussion
- **WHEN** GET `/api/formations/[id]/discussions/[discussionId]` est appelé
- **THEN** le système retourne la discussion avec toutes ses réponses triées par createdAt ASC

#### Scenario: Modération instructeur
- **WHEN** PATCH `/api/formations/[id]/discussions/[discussionId]` est appelé par l'instructeur avec `{ isPinned: true }` ou `{ isResolved: true }`
- **THEN** le système met à jour le champ correspondant

### Requirement: Discussion tab SHALL be accessible from course player
Le player de cours DOIT avoir un onglet "Discussions" accessible depuis l'interface d'apprentissage.

#### Scenario: Accès aux discussions depuis le player
- **WHEN** l'apprenant est sur le player d'un cours
- **THEN** il voit un onglet "Discussions" dans le panneau latéral à côté de "Curriculum" et "Notes"
