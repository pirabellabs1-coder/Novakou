## ADDED Requirements

### Requirement: Apprenant SHALL avoir une page d'historique de ses avis
Une nouvelle page `/formations/mes-avis` SHALL lister tous les avis que l'apprenant a laissés sur les formations, avec : formation, note, commentaire, date, statut (publié/en attente/rejeté), et réponse de l'instructeur si applicable.

#### Scenario: Liste des avis
- **WHEN** l'apprenant accède à `/formations/mes-avis`
- **THEN** un tableau/liste affiche tous ses avis triés par date (plus récent en premier)

#### Scenario: Aucun avis
- **WHEN** l'apprenant n'a laissé aucun avis
- **THEN** un EmptyState s'affiche avec un message encourageant à laisser un avis et un lien vers "Mes formations"

### Requirement: Apprenant SHALL pouvoir modifier un avis dans les 7 jours
L'apprenant SHALL pouvoir modifier la note et le commentaire d'un avis pendant 7 jours après sa publication.

#### Scenario: Modification d'un avis récent
- **WHEN** l'apprenant clique sur "Modifier" sur un avis de moins de 7 jours
- **THEN** un formulaire inline s'ouvre avec la note et le commentaire pré-remplis

#### Scenario: Modification d'un avis ancien
- **WHEN** l'apprenant tente de modifier un avis de plus de 7 jours
- **THEN** le bouton "Modifier" n'est pas affiché et un tooltip explique la limite de 7 jours

### Requirement: Apprenant SHALL pouvoir supprimer un avis
L'apprenant SHALL pouvoir supprimer son propre avis à tout moment, avec confirmation.

#### Scenario: Suppression d'un avis
- **WHEN** l'apprenant clique sur "Supprimer" et confirme
- **THEN** l'avis est supprimé (soft-delete), la note moyenne de la formation est recalculée, et un toast de confirmation s'affiche

### Requirement: Navigation apprenant SHALL inclure le lien avis
Le sidebar apprenant SHALL inclure un nouveau lien "Mes avis" positionné après "Discussions", avec l'icône `rate_review`.

#### Scenario: Lien avis visible
- **WHEN** l'apprenant est dans l'espace formations apprenant
- **THEN** le sidebar affiche le lien "Mes avis"

### Requirement: API avis apprenant SHALL exposer les données
`GET /api/apprenant/reviews` SHALL retourner les avis de l'apprenant, `PUT /api/apprenant/reviews/[id]` SHALL permettre la modification, et `DELETE /api/apprenant/reviews/[id]` la suppression.

#### Scenario: Appel API liste avis
- **WHEN** un apprenant authentifié appelle `GET /api/apprenant/reviews`
- **THEN** la réponse contient `{ reviews[] }` avec : id, formationTitle, formationSlug, rating, comment, status, createdAt, canEdit (boolean), instructorResponse

#### Scenario: Appel API modification
- **WHEN** un apprenant appelle `PUT /api/apprenant/reviews/[id]` avec `{ rating: 5, comment: "..." }` dans les 7 jours
- **THEN** l'avis est mis à jour et la note moyenne de la formation est recalculée

#### Scenario: Appel API modification hors délai
- **WHEN** un apprenant appelle `PUT /api/apprenant/reviews/[id]` après 7 jours
- **THEN** l'API retourne 403 avec le message "La modification n'est plus possible après 7 jours"
