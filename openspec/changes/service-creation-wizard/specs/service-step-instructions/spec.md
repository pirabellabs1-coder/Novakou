## ADDED Requirements

### Requirement: Choix du type de consignes
Le système SHALL permettre au vendeur de choisir entre "Consignes requises" (le client doit répondre avant le démarrage de la commande) et "Pas de consignes nécessaires".

#### Scenario: Sélection consignes requises
- **WHEN** l'utilisateur sélectionne "Consignes requises"
- **THEN** un éditeur rich text simplifié s'affiche pour rédiger le message de consignes

#### Scenario: Sélection pas de consignes
- **WHEN** l'utilisateur sélectionne "Pas de consignes nécessaires"
- **THEN** l'éditeur de consignes est masqué et l'étape est considérée comme complétée

### Requirement: Éditeur rich text simplifié pour les consignes
Le système SHALL fournir un éditeur rich text simplifié (gras, italique, listes, liens) pour rédiger les consignes, avec mots illimités.

#### Scenario: Rédaction des consignes
- **WHEN** l'utilisateur rédige un message de consignes avec formatage (gras, liste à puces)
- **THEN** le contenu est sauvegardé avec le formatage et peut être prévisualisé

### Requirement: Variables dynamiques dans les consignes
Le système SHALL proposer des variables cliquables ({nom_client}, {service}, {date_livraison}) que le vendeur peut insérer dans ses consignes.

#### Scenario: Insertion d'une variable
- **WHEN** l'utilisateur clique sur la variable {nom_client}
- **THEN** la variable est insérée à la position du curseur dans l'éditeur sous forme de chip visuel distinctif

#### Scenario: Prévisualisation avec variables
- **WHEN** l'utilisateur clique sur "Prévisualiser"
- **THEN** les variables sont affichées avec des valeurs d'exemple (ex: {nom_client} → "Jean Dupont")

### Requirement: Templates de consignes par catégorie
Le système SHALL proposer des templates de consignes prédéfinis selon la catégorie du service (ex: template design, template développement, template rédaction).

#### Scenario: Utilisation d'un template
- **WHEN** l'utilisateur clique sur un template "Design & Graphisme"
- **THEN** le contenu du template est inséré dans l'éditeur et peut être modifié par l'utilisateur

### Requirement: Étape 5 facultative
L'étape 5 SHALL être considérée comme complétée dès qu'un choix est fait (consignes requises ou non).

#### Scenario: Consignes requises mais contenu vide
- **WHEN** l'utilisateur sélectionne "Consignes requises" mais ne rédige aucun contenu et clique sur "Enregistrer et suivant"
- **THEN** un message "Veuillez rédiger vos consignes ou sélectionnez 'Pas de consignes nécessaires'" est affiché
