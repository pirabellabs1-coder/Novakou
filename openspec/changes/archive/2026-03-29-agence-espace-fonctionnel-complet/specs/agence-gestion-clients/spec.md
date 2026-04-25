## ADDED Requirements

### Requirement: Agency clients page SHALL display all clients from API
La page clients (`/agence/clients`) MUST afficher la liste de tous les clients ayant commande un service de l'agence, depuis l'API. Chaque client MUST afficher : nom, avatar, email, pays, date premiere commande, date derniere commande, nombre total de commandes, CA total genere, statut (actif/inactif).

#### Scenario: Liste des clients depuis API
- **WHEN** un utilisateur agence accede a `/agence/clients`
- **THEN** la liste affiche les clients reels ayant commande des services de l'agence
- **THEN** un nouvel utilisateur voit une liste vide avec un message "Aucun client pour le moment"

#### Scenario: Tri et recherche clients
- **WHEN** un utilisateur recherche un client par nom ou email
- **THEN** les resultats filtres s'affichent instantanement

### Requirement: Agency client detail SHALL display complete history
La fiche client detaillee MUST afficher : historique complet des commandes avec ce client, conversations messagerie liees, factures generees, notes internes (visibles uniquement par l'agence), et un bouton "Contacter" pour ouvrir une conversation.

#### Scenario: Fiche client detaillee
- **WHEN** un utilisateur clique sur un client dans la liste
- **THEN** une fiche detaillee s'ouvre avec l'historique complet depuis l'API

#### Scenario: Notes internes agence
- **WHEN** un utilisateur ajoute une note interne sur un client
- **THEN** la note est sauvegardee via l'API et visible uniquement par les membres de l'agence
- **THEN** le client ne voit jamais les notes internes
