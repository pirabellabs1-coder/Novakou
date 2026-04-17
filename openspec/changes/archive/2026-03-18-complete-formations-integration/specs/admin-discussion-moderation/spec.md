## ADDED Requirements

### Requirement: Admin SHALL pouvoir modérer les discussions de cours
Une nouvelle page `/admin/discussions` SHALL lister les discussions signalées et permettre leur modération (suppression, verrouillage, avertissement).

#### Scenario: Liste des discussions signalées
- **WHEN** l'admin accède à `/admin/discussions`
- **THEN** la page affiche les discussions ayant au moins 1 signalement, triées par nombre de signalements décroissant, avec : titre, formation, auteur, nombre de signalements, date, statut (actif/verrouillé/supprimé)

#### Scenario: Toutes les discussions
- **WHEN** l'admin clique sur l'onglet "Toutes"
- **THEN** toutes les discussions sont affichées (pas seulement les signalées)

### Requirement: Admin SHALL pouvoir verrouiller une discussion
L'admin SHALL pouvoir verrouiller une discussion, ce qui empêche l'ajout de nouvelles réponses mais garde le contenu visible.

#### Scenario: Verrouillage d'une discussion
- **WHEN** l'admin clique sur "Verrouiller" sur une discussion et confirme
- **THEN** le statut de la discussion passe à "locked", l'action est enregistrée dans l'audit log

### Requirement: Admin SHALL pouvoir supprimer une discussion ou réponse
L'admin SHALL pouvoir supprimer une discussion ou une réponse individuelle. La suppression MUST être soft-delete (statut changé, contenu masqué mais conservé en DB).

#### Scenario: Suppression d'une discussion
- **WHEN** l'admin clique sur "Supprimer" sur une discussion et confirme
- **THEN** le statut de la discussion passe à "deleted", elle n'apparaît plus pour les apprenants, l'action est enregistrée dans l'audit log

#### Scenario: Suppression d'une réponse
- **WHEN** l'admin clique sur "Supprimer" sur une réponse individuelle et confirme
- **THEN** le contenu de la réponse est remplacé par "[Contenu supprimé par un modérateur]" pour les apprenants

### Requirement: Apprenants et instructeurs SHALL pouvoir signaler une discussion ou réponse
Un bouton "Signaler" SHALL être disponible sur chaque discussion et réponse. Le signalement crée un enregistrement `DiscussionReport` en base.

#### Scenario: Signalement d'une discussion
- **WHEN** un utilisateur clique sur "Signaler" et sélectionne un motif (spam, harcèlement, contenu inapproprié, hors-sujet)
- **THEN** un `DiscussionReport` est créé avec le userId, discussionId, et le motif, et le compteur `reportCount` de la discussion est incrémenté

#### Scenario: Prévention double signalement
- **WHEN** un utilisateur tente de signaler une discussion qu'il a déjà signalée
- **THEN** l'action est refusée avec un message "Vous avez déjà signalé cette discussion"

### Requirement: API modération discussions SHALL exposer les données
`GET /api/admin/formations/discussions` SHALL retourner les discussions avec signalements, et `PUT /api/admin/formations/discussions/[id]` SHALL permettre la modération.

#### Scenario: Appel API discussions admin
- **WHEN** un admin authentifié appelle `GET /api/admin/formations/discussions?filter=reported`
- **THEN** la réponse contient `{ discussions[], total }` avec reportCount et reports[] inclus

#### Scenario: Appel API modération
- **WHEN** un admin authentifié appelle `PUT /api/admin/formations/discussions/[id]` avec `{ action: "lock" | "delete" | "restore" }`
- **THEN** le statut de la discussion est mis à jour et un audit log est créé
