## ADDED Requirements

### Requirement: Vue Kanban des projets
La page projets SHALL afficher une vue Kanban avec 4 colonnes : "À faire", "En cours", "En révision", "Terminé". Chaque carte projet SHALL montrer : priorité (badge), titre, assigné (avatar), deadline, progression (barre).

#### Scenario: Affichage Kanban
- **WHEN** l'utilisateur accède à `/agence/projets`
- **THEN** les projets sont affichés dans les colonnes correspondant à leur statut

### Requirement: Vue Liste alternative
Un toggle SHALL permettre de basculer entre la vue Kanban et la vue Liste (tableau).

#### Scenario: Basculement de vue
- **WHEN** l'utilisateur clique sur "Liste"
- **THEN** les projets sont affichés en tableau avec tri possible

### Requirement: Filtres de projets
La sidebar de filtres SHALL permettre de filtrer par : client, membre d'équipe, priorité (urgente/normale/faible). La capacité agence SHALL être affichée en pourcentage.

#### Scenario: Filtrage par client
- **WHEN** l'utilisateur sélectionne un client dans le filtre
- **THEN** seuls les projets de ce client sont affichés

### Requirement: Création de projet
Un bouton "Nouveau Projet" SHALL ouvrir un formulaire avec : titre, client, description, membres assignés, deadline, budget, priorité.

#### Scenario: Création réussie
- **WHEN** l'utilisateur remplit et soumet le formulaire
- **THEN** un toast de succès est affiché et le projet apparaît dans la colonne "À faire"

### Requirement: Badges de priorité
Les projets SHALL afficher des badges de priorité colorés : Urgent (rouge), Normal (orange), Faible (gris).

#### Scenario: Affichage des priorités
- **WHEN** un projet a la priorité "Urgent"
- **THEN** un badge rouge "Urgent" est affiché sur la carte
