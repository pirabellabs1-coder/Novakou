## ADDED Requirements

### Requirement: L'agence DOIT voir le detail complet d'une commande
Le systeme SHALL afficher une page detail commande a `/agence/commandes/[id]` avec le pipeline de suivi (`OrderPhasePipeline`), les informations du client, le service concerne, le montant et le statut.

#### Scenario: Acces au detail d'une commande
- **WHEN** l'utilisateur clique sur une commande dans la liste `/agence/commandes`
- **THEN** le systeme affiche la page detail avec le pipeline de phases, les informations completes et le chat

#### Scenario: Affichage du pipeline de suivi
- **WHEN** la commande est en statut "en_cours"
- **THEN** le pipeline affiche les phases "Creee" et "Acceptee" comme terminees, "En cours" comme active, et les suivantes comme a venir

### Requirement: L'agence DOIT pouvoir communiquer avec le client via chat integre
Le systeme SHALL afficher un panneau de chat dans la page detail commande permettant d'echanger des messages avec le client.

#### Scenario: Envoi d'un message
- **WHEN** l'utilisateur saisit un message et appuie sur Entree ou clique sur Envoyer
- **THEN** le message apparait dans le chat avec l'horodatage "maintenant"

#### Scenario: Affichage de l'historique
- **WHEN** l'utilisateur ouvre le detail d'une commande
- **THEN** les messages precedents sont affiches dans l'ordre chronologique

### Requirement: L'agence DOIT pouvoir assigner une commande a un membre
Le systeme SHALL afficher un selecteur de membre d'equipe permettant d'assigner la commande a un freelance de l'agence.

#### Scenario: Assignation a un membre
- **WHEN** l'utilisateur selectionne un membre dans le dropdown d'assignation
- **THEN** le membre assigne est affiche sur la commande et un toast de confirmation s'affiche

### Requirement: L'agence DOIT pouvoir livrer des fichiers
Le systeme SHALL afficher une zone de livraison de fichiers avec drag-and-drop et bouton de parcours.

#### Scenario: Upload d'un fichier de livraison
- **WHEN** l'utilisateur uploade un fichier via drag-and-drop ou via le bouton
- **THEN** le fichier apparait dans la liste des fichiers brouillons avec son nom et sa taille
