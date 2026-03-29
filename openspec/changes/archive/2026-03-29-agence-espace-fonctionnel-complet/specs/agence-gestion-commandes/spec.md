## ADDED Requirements

### Requirement: Agency orders page SHALL display real orders from API with filters
La page des commandes (`/agence/commandes`) MUST afficher toutes les commandes de l'agence depuis l'API `/api/orders`. Les filtres MUST inclure : Toutes, En cours, Livrees, Annulees, En litige, En retard. Le tri MUST fonctionner par : date, montant, statut, membre assigne. La recherche MUST fonctionner par nom du client ou numero de commande. La pagination MUST afficher 20 commandes par page. Un bouton export CSV MUST etre fonctionnel.

#### Scenario: Liste des commandes depuis API
- **WHEN** un utilisateur agence accede a `/agence/commandes`
- **THEN** la liste affiche les commandes reelles depuis l'API, triees par date decroissante
- **THEN** un nouvel utilisateur voit une liste vide avec un message "Aucune commande pour le moment"

#### Scenario: Filtre par statut
- **WHEN** un utilisateur selectionne le filtre "En cours"
- **THEN** seules les commandes avec le statut "en_cours" sont affichees

#### Scenario: Recherche par client ou numero
- **WHEN** un utilisateur tape "Martin" dans la barre de recherche
- **THEN** les commandes dont le client s'appelle "Martin" sont affichees

#### Scenario: Export CSV
- **WHEN** un utilisateur clique sur "Export CSV"
- **THEN** un fichier CSV contenant toutes les commandes filtrees est telecharge

### Requirement: Agency order detail page SHALL display complete timeline and actions
La page de detail d'une commande (`/agence/commandes/[id]`) MUST afficher : la timeline complete (commande recue → paiement confirme → assignee au membre → en cours → livraison soumise → validee client → paiement libere), les informations de la commande (client, service, montant, membre assigne, date limite), et les actions fonctionnelles.

#### Scenario: Timeline de la commande
- **WHEN** un utilisateur accede au detail d'une commande
- **THEN** la timeline affiche les etapes completees avec dates et les etapes restantes

#### Scenario: Chat integre avec le client
- **WHEN** un utilisateur accede au detail d'une commande
- **THEN** un panneau de chat permet d'envoyer et recevoir des messages en temps reel avec le client

#### Scenario: Assigner un membre de l'equipe
- **WHEN** un utilisateur clique sur "Assigner un membre" et selectionne un membre
- **THEN** le membre est assigne a la commande via l'API
- **THEN** le membre assigne recoit une notification

#### Scenario: Livraison de fichiers
- **WHEN** un utilisateur upload des fichiers dans la zone de livraison et clique "Livrer"
- **THEN** les fichiers sont uploades via l'API `/api/upload/service-image` ou equivalent
- **THEN** le statut de la commande passe a "livree"
- **THEN** le client est notifie

#### Scenario: Demande d'extension de delai
- **WHEN** un utilisateur clique sur "Demander extension" et specifie le nouveau delai
- **THEN** la demande est envoyee au client via l'API
