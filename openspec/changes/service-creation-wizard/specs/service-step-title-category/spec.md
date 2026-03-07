## ADDED Requirements

### Requirement: Sélection de la langue du service
Le système SHALL proposer un dropdown de sélection de langue pour le service parmi : Français, English, Espanol, Portugues, Arabe, et autres langues disponibles.

#### Scenario: Sélection d'une langue
- **WHEN** l'utilisateur sélectionne "Français" dans le dropdown de langue
- **THEN** la langue "Français" est enregistrée pour le service

#### Scenario: Avertissement langue non modifiable
- **WHEN** l'utilisateur sélectionne une langue
- **THEN** un message d'avertissement "La langue ne pourra plus être modifiée après publication" est affiché sous le dropdown

### Requirement: Titre du service au format "Je vais"
Le système SHALL imposer un champ titre avec le préfixe "Je vais" pré-rempli et non modifiable, suivi d'un champ de saisie libre limité à 100 caractères au total.

#### Scenario: Saisie d'un titre valide
- **WHEN** l'utilisateur tape "créer un site web professionnel responsive" dans le champ titre
- **THEN** le compteur affiche "48 / 100 caractères" et une indication "Parfait !" est affichée en vert

#### Scenario: Titre trop court
- **WHEN** l'utilisateur tape "un site" dans le champ titre (< 10 caractères utiles)
- **THEN** un avertissement "Titre trop court. Soyez plus précis pour attirer les clients." est affiché

#### Scenario: Titre dépassant la limite
- **WHEN** l'utilisateur atteint 100 caractères dans le champ titre
- **THEN** la saisie est bloquée et le compteur affiche "100 / 100 caractères" en rouge

#### Scenario: Titre contenant un prix
- **WHEN** l'utilisateur tape un titre contenant "50€" ou "$100" ou "5 euros"
- **THEN** un avertissement "Ne mentionnez pas de prix dans le titre" est affiché

### Requirement: Règles de titre affichées
Le système SHALL afficher les règles de rédaction du titre sous le champ : pas de prix, pas de majuscules excessives, pas de ponctuation inutile, soyez précis et concis.

#### Scenario: Affichage des règles
- **WHEN** l'utilisateur arrive sur l'étape 1
- **THEN** les 4 règles de rédaction sont visibles sous le champ titre sous forme de liste

### Requirement: Catégorie et sous-catégorie dynamiques
Le système SHALL proposer un dropdown de catégorie principale alimenté depuis la base de données admin, et un dropdown de sous-catégorie qui se met à jour automatiquement selon la catégorie sélectionnée.

#### Scenario: Sélection d'une catégorie
- **WHEN** l'utilisateur sélectionne la catégorie "Développement & IT"
- **THEN** le dropdown de sous-catégorie se met à jour avec les sous-catégories associées (ex: "Sites web", "Applications mobiles", "WordPress", etc.)

#### Scenario: Changement de catégorie
- **WHEN** l'utilisateur change de catégorie après avoir sélectionné une sous-catégorie
- **THEN** la sous-catégorie est réinitialisée et le dropdown affiche les nouvelles sous-catégories

#### Scenario: Avertissement catégorie non modifiable
- **WHEN** l'utilisateur sélectionne une catégorie
- **THEN** un message "La catégorie ne pourra plus être modifiée après publication" est affiché

### Requirement: Tags du service
Le système SHALL permettre l'ajout de 1 à 5 tags au service, avec des suggestions automatiques basées sur la catégorie sélectionnée.

#### Scenario: Ajout d'un tag
- **WHEN** l'utilisateur tape un tag et appuie sur Entrée ou clique sur une suggestion
- **THEN** le tag est ajouté à la liste des tags du service et un chip visuel apparaît

#### Scenario: Limite de tags atteinte
- **WHEN** l'utilisateur a déjà ajouté 5 tags
- **THEN** le champ d'ajout de tag est désactivé avec un message "Maximum 5 tags atteint"

#### Scenario: Suppression d'un tag
- **WHEN** l'utilisateur clique sur le bouton de suppression d'un tag
- **THEN** le tag est retiré de la liste et le champ redevient actif si on était à 5 tags

#### Scenario: Suggestions de tags par catégorie
- **WHEN** l'utilisateur a sélectionné la catégorie "Design & Graphisme"
- **THEN** des suggestions de tags pertinentes sont affichées (ex: "logo", "charte graphique", "illustration", "branding")

### Requirement: Validation de l'étape 1
Le système SHALL valider que tous les champs obligatoires de l'étape 1 sont remplis avant de permettre le passage à l'étape 2 : langue, titre (min 10 caractères), catégorie, sous-catégorie, et au moins 1 tag.

#### Scenario: Étape 1 complète
- **WHEN** l'utilisateur a rempli tous les champs obligatoires de l'étape 1
- **THEN** le bouton "Enregistrer et suivant" est actif et l'étape 1 est marquée comme complétée dans la sidebar

#### Scenario: Étape 1 incomplète
- **WHEN** l'utilisateur n'a pas sélectionné de catégorie et clique sur "Enregistrer et suivant"
- **THEN** le champ catégorie est entouré en rouge avec le message "Veuillez sélectionner une catégorie" et la navigation est bloquée
