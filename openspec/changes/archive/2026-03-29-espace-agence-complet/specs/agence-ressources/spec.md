## ADDED Requirements

### Requirement: Cloud partagé par projet
La page ressources SHALL afficher des dossiers organisés par projet/client avec fichiers uploadés.

#### Scenario: Navigation dans les dossiers
- **WHEN** l'utilisateur clique sur un dossier projet
- **THEN** les fichiers du dossier sont listés avec nom, taille, date, uploader

### Requirement: Upload de fichiers
Un bouton SHALL permettre d'uploader des fichiers dans un dossier avec zone de drag-and-drop.

#### Scenario: Upload réussi
- **WHEN** l'utilisateur sélectionne un fichier et l'uploade
- **THEN** le fichier apparaît dans la liste avec un toast de succès

### Requirement: Quota de stockage
Le quota de stockage SHALL être affiché : utilisé / total (50 GB pour le plan Agence).

#### Scenario: Affichage du quota
- **WHEN** la page ressources est chargée
- **THEN** une barre de progression montre l'espace utilisé vs le quota
