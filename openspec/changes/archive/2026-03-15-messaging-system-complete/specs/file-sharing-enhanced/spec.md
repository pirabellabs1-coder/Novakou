## ADDED Requirements

### Requirement: User SHALL upload files in chat with type and size validation
Le systeme DOIT permettre aux utilisateurs d'uploader des fichiers dans le chat avec validation de type et de taille. Les types autorises sont : images (JPG, PNG, GIF, WebP), documents (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT), videos (MP4, WebM, MOV), archives (ZIP, RAR, 7z). La taille maximale DOIT etre de 25 MB par fichier.

#### Scenario: Upload d'une image valide
- **WHEN** l'utilisateur selectionne une image JPG de 2 MB via le bouton d'upload ou le drag-and-drop
- **THEN** le fichier est uploade vers Supabase Storage (bucket `message-attachments`), une barre de progression s'affiche, et un message de type "image" est envoye dans la conversation avec le preview inline

#### Scenario: Upload d'un fichier trop volumineux
- **WHEN** l'utilisateur selectionne un fichier de 30 MB
- **THEN** le systeme affiche un message d'erreur "Le fichier depasse la taille maximale de 25 MB" et l'upload est annule

#### Scenario: Upload d'un type de fichier non autorise
- **WHEN** l'utilisateur selectionne un fichier .exe ou .bat
- **THEN** le systeme affiche un message d'erreur "Ce type de fichier n'est pas autorise" et l'upload est annule

#### Scenario: Upload multiple simultane
- **WHEN** l'utilisateur selectionne 3 fichiers valides en meme temps
- **THEN** les 3 fichiers sont uploades en parallele avec des barres de progression individuelles, et 3 messages sont envoyes dans la conversation

### Requirement: Images SHALL display inline preview in chat
Le systeme DOIT afficher un preview inline pour les messages de type image. Le preview DOIT etre cliquable pour ouvrir l'image en taille reelle dans une modale.

#### Scenario: Preview inline d'une image
- **WHEN** un message de type image est affiche dans le chat
- **THEN** l'image est affichee en preview redimensionne (max 300px de large) directement dans la bulle de message

#### Scenario: Ouverture en plein ecran
- **WHEN** l'utilisateur clique sur le preview inline d'une image
- **THEN** l'image s'ouvre dans une modale lightbox en taille reelle avec possibilite de telecharger

### Requirement: Videos SHALL display inline player in chat
Le systeme DOIT afficher un lecteur video inline pour les messages de type video. Le lecteur DOIT etre natif HTML5 avec controles de lecture.

#### Scenario: Preview video inline
- **WHEN** un message de type video est affiche dans le chat
- **THEN** un lecteur video compact est affiche dans la bulle de message avec poster frame, bouton play, et controles de volume/progression

### Requirement: File messages SHALL display download button
Le systeme DOIT afficher un bouton de telechargement pour tous les types de fichiers partages (documents, archives). Le bouton DOIT generer une URL signee Supabase Storage avec expiration de 1 heure.

#### Scenario: Telechargement d'un document
- **WHEN** l'utilisateur clique sur le bouton de telechargement d'un fichier PDF
- **THEN** le fichier est telecharge via une URL signee Supabase Storage

### Requirement: Files shared in order conversations SHALL appear in project resources
Le systeme DOIT lier automatiquement les fichiers partages dans une conversation associee a une commande (`orderId` non null) a la section ressources de cette commande. Le fichier DOIT apparaitre dans les deux endroits : le chat et les ressources projet.

#### Scenario: Fichier partage dans une conversation de commande
- **WHEN** un utilisateur uploade un fichier dans une conversation qui a un `orderId` associe
- **THEN** le fichier est enregistre dans la table des ressources de commande en plus du message, et il apparait dans la page de suivi de commande section "Ressources"

#### Scenario: Fichier partage dans une conversation directe (sans commande)
- **WHEN** un utilisateur uploade un fichier dans une conversation sans `orderId`
- **THEN** le fichier est uniquement disponible dans le chat, sans liaison aux ressources projet

### Requirement: Upload progress SHALL be visually displayed
Le systeme DOIT afficher une barre de progression pendant l'upload de fichiers. La barre DOIT indiquer le pourcentage de progression et permettre l'annulation de l'upload.

#### Scenario: Affichage de la progression
- **WHEN** un fichier est en cours d'upload
- **THEN** une barre de progression s'affiche dans la zone de saisie avec le pourcentage et un bouton d'annulation

#### Scenario: Annulation d'un upload
- **WHEN** l'utilisateur clique sur le bouton d'annulation pendant l'upload
- **THEN** l'upload est annule, la barre de progression disparait, et aucun message n'est envoye

### Requirement: Drag-and-drop file upload SHALL be supported
Le systeme DOIT supporter le drag-and-drop de fichiers dans la zone de chat. Les fichiers deposes DOIVENT suivre les memes regles de validation que l'upload via bouton.

#### Scenario: Drag-and-drop d'un fichier valide
- **WHEN** l'utilisateur depose un fichier valide dans la zone de chat par drag-and-drop
- **THEN** le fichier est uploade et un message est envoye, identique au comportement du bouton d'upload

#### Scenario: Zone de drop visuelle
- **WHEN** l'utilisateur survole la zone de chat avec un fichier
- **THEN** une zone de drop visuelle s'affiche avec un message "Deposez vos fichiers ici"
