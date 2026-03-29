## ADDED Requirements

### Requirement: L'agence DOIT voir la liste de ses contrats
Le systeme SHALL afficher a `/agence/contrats` la liste des contrats avec titre, client, date de creation, statut (brouillon/envoye/signe/expire) et boutons d'action.

#### Scenario: Affichage de la liste des contrats
- **WHEN** l'utilisateur navigue vers `/agence/contrats`
- **THEN** la liste des contrats est affichee avec filtres par statut et recherche par nom

#### Scenario: Filtrage par statut
- **WHEN** l'utilisateur selectionne le filtre "Signes"
- **THEN** seuls les contrats signes sont affiches

### Requirement: L'agence DOIT pouvoir creer un contrat a partir d'un template
Le systeme SHALL proposer des templates de contrats (mission, prestation, NDA) avec champs pre-remplis modifiables.

#### Scenario: Creation depuis un template
- **WHEN** l'utilisateur clique sur "Nouveau contrat" et selectionne un template
- **THEN** un formulaire pre-rempli s'affiche avec les champs du template modifiables

#### Scenario: Sauvegarde du contrat
- **WHEN** l'utilisateur remplit le formulaire et clique sur "Enregistrer"
- **THEN** le contrat est sauvegarde en brouillon et un toast "Contrat cree" s'affiche

### Requirement: L'agence DOIT pouvoir voir le detail d'un contrat
Le systeme SHALL afficher le contenu complet d'un contrat avec les parties, les clauses et le statut de signature.

#### Scenario: Consultation d'un contrat
- **WHEN** l'utilisateur clique sur un contrat dans la liste
- **THEN** le detail du contrat s'affiche avec toutes les clauses et informations des parties

### Requirement: L'agence DOIT pouvoir telecharger un contrat en PDF
Le systeme SHALL permettre le telechargement d'un contrat au format PDF.

#### Scenario: Telechargement PDF du contrat
- **WHEN** l'utilisateur clique sur "Telecharger PDF"
- **THEN** un toast "Contrat telecharge" s'affiche (simulation demo)
