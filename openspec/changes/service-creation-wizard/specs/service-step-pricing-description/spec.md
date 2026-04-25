## ADDED Requirements

### Requirement: Prix de départ en EUR
Le système SHALL proposer un champ numérique pour le prix de départ en EUR avec un minimum de 5 EUR et un maximum de 5 000 EUR.

#### Scenario: Saisie d'un prix valide
- **WHEN** l'utilisateur entre 50 dans le champ prix
- **THEN** le prix est accepté et le calcul de commission est affiché

#### Scenario: Prix en dessous du minimum
- **WHEN** l'utilisateur entre 3 dans le champ prix
- **THEN** un message d'erreur "Le prix minimum est de 5 EUR" est affiché et le champ est entouré en rouge

#### Scenario: Prix au-dessus du maximum
- **WHEN** l'utilisateur entre 6000 dans le champ prix
- **THEN** un message d'erreur "Le prix maximum est de 5 000 EUR" est affiché et le champ est entouré en rouge

### Requirement: Calcul de commission en temps réel
Le système SHALL afficher en temps réel le montant net que le vendeur recevra après commission, en fonction de son plan d'abonnement (Gratuit 20%, Pro 15%, Business 10%, Agence 8%).

#### Scenario: Commission plan Gratuit
- **WHEN** l'utilisateur est sur le plan Gratuit et entre un prix de 100 EUR
- **THEN** le système affiche "Pour une commande à 100 EUR, vous recevrez 80 EUR" avec le détail "Commission FreelanceHigh : 20%"

#### Scenario: Commission plan Pro
- **WHEN** l'utilisateur est sur le plan Pro et entre un prix de 100 EUR
- **THEN** le système affiche "Pour une commande à 100 EUR, vous recevrez 85 EUR" avec le détail "Commission FreelanceHigh : 15%"

#### Scenario: Mise à jour dynamique
- **WHEN** l'utilisateur modifie le prix de 100 à 200 EUR
- **THEN** le montant net affiché se met à jour immédiatement sans rechargement

### Requirement: Délai de livraison basique
Le système SHALL proposer un dropdown de délai de livraison avec les options : 1, 2, 3, 5, 7, 10, 14, 21, 30 jours.

#### Scenario: Sélection d'un délai
- **WHEN** l'utilisateur sélectionne "7 jours" dans le dropdown
- **THEN** le délai de livraison de base est enregistré à 7 jours

### Requirement: Éditeur rich text complet pour la description
Le système SHALL fournir un éditeur rich text complet (Tiptap) avec mots illimités pour tous les plans d'abonnement, incluant tous les outils de formatage définis.

#### Scenario: Formatage gras et italique
- **WHEN** l'utilisateur sélectionne du texte et clique sur le bouton Gras dans la barre d'outils
- **THEN** le texte sélectionné est mis en gras et le bouton Gras est visuellement activé

#### Scenario: Insertion d'un tableau
- **WHEN** l'utilisateur clique sur "Insérer tableau" dans la barre d'outils
- **THEN** une grille de sélection de dimensions (max 10x10) apparaît et l'utilisateur peut choisir le nombre de lignes et colonnes

#### Scenario: Manipulation d'un tableau
- **WHEN** un tableau est inséré dans l'éditeur
- **THEN** l'utilisateur peut ajouter/supprimer des lignes et colonnes, fusionner des cellules, et modifier la couleur de fond des cellules

#### Scenario: Couleur de texte
- **WHEN** l'utilisateur sélectionne du texte et clique sur le bouton couleur de texte
- **THEN** une palette de couleurs s'affiche avec des couleurs prédéfinies et un champ pour entrer un code hexadécimal

#### Scenario: Surligneur
- **WHEN** l'utilisateur sélectionne du texte et clique sur le bouton surligneur
- **THEN** une palette de couleurs de fond s'affiche et la couleur choisie est appliquée en fond du texte sélectionné

#### Scenario: Taille de police
- **WHEN** l'utilisateur sélectionne du texte et choisit la taille 24 dans le dropdown de taille de police
- **THEN** le texte sélectionné est affiché en taille 24px

#### Scenario: Alignement du texte
- **WHEN** l'utilisateur clique sur le bouton "Centre"
- **THEN** le paragraphe courant est centré

#### Scenario: Insertion d'image dans la description
- **WHEN** l'utilisateur clique sur le bouton image dans la barre d'outils
- **THEN** un dialogue permet de choisir un fichier à uploader ou d'entrer une URL, et l'image est insérée dans le contenu

#### Scenario: Insertion d'un lien
- **WHEN** l'utilisateur sélectionne du texte et clique sur le bouton lien
- **THEN** un dialogue permet d'entrer l'URL et le texte est transformé en lien cliquable

#### Scenario: Emojis
- **WHEN** l'utilisateur clique sur le bouton emojis
- **THEN** un sélecteur d'emojis s'affiche et l'emoji choisi est inséré à la position du curseur

#### Scenario: Prévisualisation
- **WHEN** l'utilisateur clique sur l'onglet "Prévisualiser"
- **THEN** le contenu de l'éditeur est affiché en mode lecture seule avec le rendu final (tableaux, couleurs, images, etc.)

#### Scenario: Annuler et rétablir
- **WHEN** l'utilisateur clique sur le bouton Annuler
- **THEN** la dernière action dans l'éditeur est annulée et le bouton Rétablir devient actif

### Requirement: Interface de l'éditeur
L'éditeur SHALL avoir un fond blanc, une police propre, une taille de police par défaut de 14px, une hauteur minimum de 400px, et s'étendre automatiquement selon le contenu.

#### Scenario: Expansion automatique
- **WHEN** l'utilisateur rédige un texte long qui dépasse la hauteur minimum de 400px
- **THEN** l'éditeur s'agrandit automatiquement pour accommoder tout le contenu sans barre de défilement interne

### Requirement: Validation de l'étape 2
Le système SHALL valider que le prix est défini (entre 5 et 5000 EUR), le délai sélectionné, et la description non vide avant de permettre le passage à l'étape 3.

#### Scenario: Étape 2 complète
- **WHEN** l'utilisateur a renseigné un prix valide, un délai, et une description non vide
- **THEN** le bouton "Enregistrer et suivant" est actif et l'étape 2 est marquée comme complétée

#### Scenario: Description vide
- **WHEN** l'utilisateur n'a rien écrit dans l'éditeur et clique sur "Enregistrer et suivant"
- **THEN** un message "Veuillez rédiger une description pour votre service" est affiché
