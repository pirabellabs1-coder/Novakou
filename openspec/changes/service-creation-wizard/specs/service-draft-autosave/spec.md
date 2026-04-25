## ADDED Requirements

### Requirement: Sauvegarde automatique en brouillon
Le système SHALL sauvegarder automatiquement le brouillon du service toutes les 30 secondes lorsque des modifications ont été effectuées.

#### Scenario: Sauvegarde automatique déclenchée
- **WHEN** l'utilisateur modifie un champ et 30 secondes se sont écoulées depuis la dernière modification
- **THEN** le brouillon est sauvegardé automatiquement en base de données et un indicateur "Sauvegardé il y a quelques secondes" est affiché

#### Scenario: Pas de sauvegarde sans modification
- **WHEN** 30 secondes se sont écoulées mais aucune modification n'a été effectuée
- **THEN** aucune sauvegarde n'est déclenchée et l'indicateur de dernière sauvegarde reste inchangé

#### Scenario: Sauvegarde en cours
- **WHEN** une sauvegarde automatique est en cours
- **THEN** un indicateur discret "Sauvegarde en cours..." est affiché brièvement puis remplacé par "Sauvegardé il y a quelques secondes"

### Requirement: Indicateur de dernière sauvegarde
Le système SHALL afficher en permanence un indicateur textuel montrant le temps écoulé depuis la dernière sauvegarde (ex: "Sauvegardé il y a 2 min").

#### Scenario: Affichage du temps relatif
- **WHEN** le brouillon a été sauvegardé il y a 45 secondes
- **THEN** l'indicateur affiche "Sauvegardé il y a moins d'une minute"

#### Scenario: Mise à jour de l'indicateur
- **WHEN** le brouillon a été sauvegardé il y a 3 minutes
- **THEN** l'indicateur affiche "Sauvegardé il y a 3 min"

### Requirement: Reprise de brouillon
Le système SHALL permettre de reprendre un brouillon de service depuis la liste des services du vendeur.

#### Scenario: Reprise d'un brouillon existant
- **WHEN** l'utilisateur clique sur un service avec le statut "brouillon" dans sa liste de services
- **THEN** le wizard s'ouvre à la dernière étape complétée avec toutes les données précédemment saisies restaurées

#### Scenario: Nouveau service vs reprise
- **WHEN** l'utilisateur a un brouillon en cours et accède à la page de création de service
- **THEN** le wizard s'ouvre en mode création (nouveau service) et le brouillon précédent reste accessible depuis la liste des services

### Requirement: Sauvegarde locale immédiate
Le système SHALL sauvegarder immédiatement chaque modification dans le localStorage du navigateur pour une reprise instantanée en cas de fermeture accidentelle.

#### Scenario: Fermeture accidentelle du navigateur
- **WHEN** l'utilisateur ferme accidentellement le navigateur pendant la création d'un service
- **THEN** au retour sur la page de création, les données du localStorage sont proposées pour reprise si elles sont plus récentes que la sauvegarde DB

#### Scenario: Conflit localStorage vs DB
- **WHEN** les données localStorage sont plus récentes que la dernière sauvegarde DB
- **THEN** un message "Vous avez des modifications non sauvegardées. Voulez-vous les reprendre ?" est affiché avec les options "Reprendre" et "Ignorer"

### Requirement: Indicateur de modifications non sauvegardées
Le système SHALL afficher un indicateur visuel lorsque des modifications n'ont pas encore été sauvegardées en base de données.

#### Scenario: Modifications non sauvegardées
- **WHEN** l'utilisateur modifie un champ et la sauvegarde automatique n'a pas encore eu lieu
- **THEN** un indicateur "Modifications non sauvegardées" est affiché discrètement

#### Scenario: Confirmation avant quitter
- **WHEN** l'utilisateur tente de quitter la page avec des modifications non sauvegardées
- **THEN** une alerte du navigateur "Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?" est affichée
