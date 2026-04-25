## ADDED Requirements

### Requirement: Orders page SHALL display order tracking with 3-step timeline
La page `/client/commandes` SHALL afficher le suivi d'une commande avec une timeline horizontale de 3 étapes : "Commande passée" (complétée, check vert), "En cours de réalisation" (active, 80% réalisé), "Livraison effectuée" (en attente). Chaque étape affiche une date/heure et un statut.

#### Scenario: Affichage de la timeline
- **WHEN** l'utilisateur accède à la page commandes et sélectionne une commande
- **THEN** la timeline 3 étapes s'affiche avec les cercles verts connectés par des lignes, l'étape active pulsant

### Requirement: Orders SHALL show countdown timer
Un countdown SHALL afficher le temps restant avant la deadline en 4 blocs : Jours, Heures, Min, Sec, dans des cards séparées avec des chiffres en grand format.

#### Scenario: Affichage du countdown
- **WHEN** une commande a une deadline future
- **THEN** le countdown affiche 02 Jours, 14 Heures, 35 Min, 00 Sec (données de démo)

### Requirement: Orders SHALL include file delivery section
La section "Livraison des fichiers finaux" SHALL afficher une zone de drag & drop avec bordure dashed verte, le texte "Glissez-déposez vos fichiers ici" et les formats acceptés (ZIP, FIG, PSD, PDF, Max 500MB). Un bouton "Parcourir les fichiers" permet la sélection manuelle. La liste des fichiers brouillons s'affiche en dessous (nom, taille, date, bouton supprimer).

#### Scenario: Upload de fichier via drag & drop
- **WHEN** l'utilisateur dépose un fichier dans la zone
- **THEN** le fichier apparaît dans la liste des brouillons avec son nom, sa taille et un bouton supprimer

#### Scenario: Parcourir les fichiers
- **WHEN** l'utilisateur clique "Parcourir les fichiers"
- **THEN** un sélecteur de fichier s'ouvre

### Requirement: Orders SHALL include contextual chat panel
Le panneau droit SHALL afficher un chat contextuel avec le freelance : avatar + nom + statut "En ligne" (point vert animé), bulles de messages (entrantes en fond slate, sortantes en fond vert `#19e642` avec texte dark), indicateur "est en train d'écrire...", zone de saisie avec boutons pièce jointe, emoji et envoi.

#### Scenario: Envoi d'un message
- **WHEN** l'utilisateur tape un message et clique envoyer (ou appuie Entrée)
- **THEN** le message apparaît dans le chat comme bulle verte à droite avec l'heure

#### Scenario: Indicateur de frappe
- **WHEN** le chat est ouvert
- **THEN** l'indicateur "Thomas est en train d'écrire..." s'affiche en bas du chat (simulation démo)

### Requirement: Orders list SHALL be filterable by status
La page SHALL permettre de filtrer les commandes par statut : Toutes, En cours, Livrées, Terminées, Litige.

#### Scenario: Filtrage par statut "En cours"
- **WHEN** l'utilisateur sélectionne le filtre "En cours"
- **THEN** seules les commandes avec statut "En cours" sont affichées
