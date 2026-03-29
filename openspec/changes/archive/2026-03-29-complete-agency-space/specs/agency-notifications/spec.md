## ADDED Requirements

### Requirement: L'agence DOIT avoir un centre de notifications
Le systeme SHALL afficher a `/agence/notifications` la liste des notifications groupees par date (aujourd'hui, hier, cette semaine, plus ancien).

#### Scenario: Affichage des notifications
- **WHEN** l'utilisateur navigue vers `/agence/notifications`
- **THEN** les notifications sont affichees groupees par date avec icone, titre, description et horodatage

#### Scenario: Marquer comme lu
- **WHEN** l'utilisateur clique sur une notification non lue
- **THEN** la notification passe en statut "lue" visuellement

### Requirement: L'agence DOIT pouvoir marquer toutes les notifications comme lues
Le systeme SHALL proposer un bouton "Tout marquer comme lu" en haut de la page.

#### Scenario: Marquer tout comme lu
- **WHEN** l'utilisateur clique sur "Tout marquer comme lu"
- **THEN** toutes les notifications passent en statut "lues" et un toast de confirmation s'affiche

### Requirement: L'agence DOIT pouvoir filtrer par type de notification
Le systeme SHALL proposer des filtres par type : commandes, messages, equipe, finances, systeme.

#### Scenario: Filtrage par type
- **WHEN** l'utilisateur selectionne le filtre "Commandes"
- **THEN** seules les notifications liees aux commandes sont affichees
