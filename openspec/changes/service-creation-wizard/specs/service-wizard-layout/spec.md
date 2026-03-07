## ADDED Requirements

### Requirement: Layout 2 colonnes avec sidebar d'étapes
Le système SHALL afficher un layout à 2 colonnes sur desktop : une sidebar de navigation à gauche (30% de largeur) et le contenu de l'étape active à droite (70% de largeur).

#### Scenario: Affichage desktop du wizard
- **WHEN** l'utilisateur accède à la page de création de service sur un écran >= 1024px
- **THEN** le système affiche une sidebar à gauche avec la liste des 7 étapes et le contenu de l'étape active à droite

#### Scenario: Affichage mobile du wizard
- **WHEN** l'utilisateur accède à la page de création de service sur un écran < 1024px
- **THEN** la sidebar est remplacée par un menu horizontal compact en haut de page et les étapes s'affichent en mode accordéon

### Requirement: Indicateurs d'état des étapes dans la sidebar
La sidebar SHALL afficher chaque étape avec un numéro, un titre, et un indicateur visuel d'état : vert (complétée), bleu (en cours), gris (pas encore faite).

#### Scenario: Étape complétée
- **WHEN** une étape a été complétée et validée
- **THEN** la sidebar affiche un indicateur vert (check) à côté du numéro de l'étape

#### Scenario: Étape en cours
- **WHEN** l'utilisateur est sur une étape spécifique
- **THEN** la sidebar affiche un indicateur bleu à côté du numéro de cette étape et la ligne est visuellement mise en avant

#### Scenario: Étape non commencée
- **WHEN** une étape n'a pas encore été atteinte
- **THEN** la sidebar affiche un indicateur gris à côté du numéro de l'étape et le texte est grisé

### Requirement: Navigation entre étapes
Le système SHALL permettre la navigation entre étapes via les boutons "Précédent" et "Enregistrer et suivant" dans le contenu, et via un clic sur une étape complétée dans la sidebar.

#### Scenario: Navigation vers l'étape suivante
- **WHEN** l'utilisateur clique sur "Enregistrer et suivant" et que l'étape courante est valide
- **THEN** les données de l'étape sont sauvegardées et l'étape suivante s'affiche

#### Scenario: Navigation vers l'étape suivante avec erreurs
- **WHEN** l'utilisateur clique sur "Enregistrer et suivant" et que l'étape courante contient des erreurs de validation
- **THEN** les erreurs sont affichées sous les champs concernés et l'utilisateur reste sur l'étape courante

#### Scenario: Navigation vers une étape précédente via sidebar
- **WHEN** l'utilisateur clique sur une étape déjà complétée dans la sidebar
- **THEN** le contenu de cette étape s'affiche avec les données précédemment saisies

#### Scenario: Tentative de navigation vers une étape non atteinte
- **WHEN** l'utilisateur clique sur une étape non encore atteinte dans la sidebar
- **THEN** rien ne se passe (le clic est ignoré)

### Requirement: Indicateur de brouillon
Le système SHALL afficher un bandeau "Service (brouillon)" en haut de la page tant que le service n'est pas publié.

#### Scenario: Affichage du bandeau brouillon
- **WHEN** l'utilisateur est sur n'importe quelle étape du wizard et le service n'a pas encore été publié
- **THEN** un bandeau "Service (brouillon)" est affiché en haut de la zone de contenu

### Requirement: Routes distinctes freelance et agence
Le wizard SHALL être accessible depuis `/dashboard/services/creer` pour les freelances et depuis `/agence/services/creer` pour les agences, avec les mêmes composants partagés.

#### Scenario: Accès freelance
- **WHEN** un utilisateur avec le rôle "freelance" accède à `/dashboard/services/creer`
- **THEN** le wizard de création de service s'affiche avec le service associé au compte freelance

#### Scenario: Accès agence
- **WHEN** un utilisateur avec le rôle "agence" accède à `/agence/services/creer`
- **THEN** le wizard de création de service s'affiche avec le service associé au compte agence

#### Scenario: Accès non autorisé
- **WHEN** un utilisateur non authentifié ou avec un rôle client accède à l'une des routes de création de service
- **THEN** le système redirige vers la page de connexion

### Requirement: Section aide contextuelle
La sidebar SHALL afficher une section "Besoin d'aide ?" en bas avec des conseils contextuels selon l'étape active et un lien vers la documentation.

#### Scenario: Aide contextuelle par étape
- **WHEN** l'utilisateur est sur l'étape 1 (Titre et catégorie)
- **THEN** la section aide affiche des conseils spécifiques à la rédaction d'un bon titre et au choix de catégorie

#### Scenario: Aide contextuelle change avec l'étape
- **WHEN** l'utilisateur passe de l'étape 1 à l'étape 2
- **THEN** les conseils de la section aide se mettent à jour pour correspondre à l'étape 2 (Prix et description)
