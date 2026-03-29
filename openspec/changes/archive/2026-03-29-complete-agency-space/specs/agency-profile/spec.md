## ADDED Requirements

### Requirement: L'agence DOIT pouvoir editer son profil
Le systeme SHALL afficher un formulaire d'edition du profil agence a la route `/agence/profil` avec les champs : logo, nom agence, description, secteur d'activite, taille d'equipe, pays, site web, SIRET (optionnel), liens sociaux (LinkedIn, Twitter).

#### Scenario: Affichage du formulaire de profil agence
- **WHEN** l'utilisateur agence navigue vers `/agence/profil`
- **THEN** le formulaire s'affiche avec les donnees actuelles pre-remplies et une barre de completion du profil

#### Scenario: Modification du logo agence
- **WHEN** l'utilisateur clique sur le logo et uploade une nouvelle image
- **THEN** le logo est mis a jour et un toast de confirmation s'affiche

#### Scenario: Sauvegarde du profil
- **WHEN** l'utilisateur modifie les champs et clique sur "Enregistrer"
- **THEN** les modifications sont sauvegardees et un toast "Profil mis a jour" s'affiche

### Requirement: L'agence DOIT pouvoir previsualiser son profil public
Le systeme SHALL proposer un onglet "Previsualisation" permettant de voir le rendu du profil public agence en temps reel.

#### Scenario: Basculer vers la previsualisation
- **WHEN** l'utilisateur clique sur l'onglet "Previsualisation"
- **THEN** le systeme affiche le profil public avec logo, nom, description, secteur, taille, membres publics, services publies, liens

#### Scenario: Modifications refletees en temps reel
- **WHEN** l'utilisateur modifie un champ en mode edition puis bascule vers la previsualisation
- **THEN** les modifications sont visibles immediatement dans la previsualisation

### Requirement: Le profil agence DOIT afficher la liste des membres publics
Le systeme SHALL afficher dans la previsualisation la liste des membres de l'equipe qui ont consenti a etre visibles publiquement.

#### Scenario: Affichage des membres publics
- **WHEN** l'agence a 3 membres dont 2 sont visibles publiquement
- **THEN** la previsualisation affiche uniquement les 2 membres visibles avec leur nom, titre et photo
