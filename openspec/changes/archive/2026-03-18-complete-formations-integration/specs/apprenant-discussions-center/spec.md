## ADDED Requirements

### Requirement: Apprenant SHALL avoir une page centralisée de discussions
Une nouvelle page `/mes-discussions` SHALL lister toutes les discussions de cours auxquelles l'apprenant participe ou a créées, avec : titre, formation, nombre de réponses, dernière activité, statut (ouvert/résolu/verrouillé).

#### Scenario: Liste des discussions
- **WHEN** l'apprenant accède à `/mes-discussions`
- **THEN** un tableau/liste affiche toutes les discussions où l'apprenant est auteur ou a répondu, triées par dernière activité

#### Scenario: Filtrage par statut
- **WHEN** l'apprenant sélectionne un filtre (Toutes, Ouvertes, Résolues, Mes questions)
- **THEN** seules les discussions correspondantes sont affichées

#### Scenario: Navigation vers la discussion
- **WHEN** l'apprenant clique sur une discussion
- **THEN** il est redirigé vers la page de la formation correspondante avec la discussion ouverte

### Requirement: Apprenant SHALL pouvoir voir les réponses non lues
Chaque discussion SHALL afficher un badge indiquant le nombre de nouvelles réponses depuis la dernière visite de l'apprenant.

#### Scenario: Badge réponses non lues
- **WHEN** une discussion a 3 nouvelles réponses depuis la dernière visite de l'apprenant
- **THEN** un badge "3" s'affiche à côté du titre de la discussion

### Requirement: Navigation apprenant SHALL inclure le lien discussions
Le sidebar apprenant SHALL inclure un nouveau lien "Discussions" positionné après "Certificats", avec l'icône `forum`.

#### Scenario: Lien discussions visible
- **WHEN** l'apprenant est dans l'espace formations apprenant
- **THEN** le sidebar affiche le lien "Discussions" avec un badge de notifications non lues si applicable

### Requirement: API discussions apprenant SHALL exposer les données
`GET /api/apprenant/discussions` SHALL retourner les discussions de l'apprenant avec statistiques de lecture.

#### Scenario: Appel API discussions
- **WHEN** un apprenant authentifié appelle `GET /api/apprenant/discussions`
- **THEN** la réponse contient `{ discussions[], totalUnread }` avec les champs : id, title, formationTitle, repliesCount, unreadCount, lastActivityAt, status, isAuthor
