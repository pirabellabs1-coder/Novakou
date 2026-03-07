## ADDED Requirements

### Requirement: Ajout d'options supplémentaires
Le système SHALL permettre au vendeur d'ajouter des options supplémentaires (extras) à son service, chaque option contenant un titre, une description courte, un prix supplémentaire en EUR, et un délai supplémentaire en jours.

#### Scenario: Ajout d'une option
- **WHEN** l'utilisateur clique sur "Ajouter une option" et remplit le formulaire avec titre "Pack Premium", description "Design haute qualité", prix 50 EUR, délai 3 jours
- **THEN** l'option est ajoutée à la liste et affichée avec tous ses détails

#### Scenario: Modification d'une option
- **WHEN** l'utilisateur clique sur le bouton modifier d'une option existante
- **THEN** le formulaire d'édition s'affiche avec les données pré-remplies et l'utilisateur peut modifier les champs

#### Scenario: Suppression d'une option
- **WHEN** l'utilisateur clique sur le bouton supprimer d'une option
- **THEN** une confirmation est demandée et si confirmée, l'option est retirée de la liste

### Requirement: Limite d'options par plan
Le système SHALL limiter le nombre d'options selon le plan d'abonnement du vendeur : Gratuit 3 max, Pro 10 max, Business/Agence illimité.

#### Scenario: Limite atteinte plan Gratuit
- **WHEN** l'utilisateur sur plan Gratuit a déjà ajouté 3 options et clique sur "Ajouter une option"
- **THEN** un message "Vous avez atteint la limite de 3 options pour le plan Gratuit. Passez au plan Pro pour en ajouter jusqu'à 10." est affiché et le bouton est désactivé

#### Scenario: Limite plan Pro
- **WHEN** l'utilisateur sur plan Pro a déjà ajouté 10 options
- **THEN** le bouton "Ajouter une option" est désactivé avec le message approprié

#### Scenario: Plan Business sans limite
- **WHEN** l'utilisateur sur plan Business ajoute des options
- **THEN** aucune limite n'est imposée sur le nombre d'options

### Requirement: Badge recommandé sur une option
Le système SHALL permettre de marquer une option avec un badge "RECOMMANDÉ" via un toggle.

#### Scenario: Activer le badge recommandé
- **WHEN** l'utilisateur active le toggle "Recommandé" sur une option
- **THEN** un badge visuel "RECOMMANDÉ" est affiché sur cette option

#### Scenario: Un seul badge recommandé
- **WHEN** l'utilisateur active le badge recommandé sur une deuxième option
- **THEN** le badge est retiré de la première option et appliqué à la nouvelle

### Requirement: Réorganisation des options par drag and drop
Le système SHALL permettre de réorganiser l'ordre des options par drag and drop.

#### Scenario: Réorganisation par glissement
- **WHEN** l'utilisateur glisse une option de la position 3 à la position 1
- **THEN** l'ordre des options est mis à jour et reflété visuellement

### Requirement: Étape 3 facultative
L'étape 3 SHALL être considérée comme complétée même sans aucune option ajoutée (les options sont facultatives).

#### Scenario: Passage sans options
- **WHEN** l'utilisateur n'ajoute aucune option et clique sur "Enregistrer et suivant"
- **THEN** l'étape 3 est marquée comme complétée et l'étape 4 s'affiche
