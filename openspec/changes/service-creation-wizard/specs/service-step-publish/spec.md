## ADDED Requirements

### Requirement: Récapitulatif complet avant publication
Le système SHALL afficher un résumé complet du service avant publication : titre, catégorie + sous-catégorie, prix de départ, délai de livraison, nombre d'options ajoutées, image principale en miniature, statut livraison express, et un extrait de la description.

#### Scenario: Affichage du récapitulatif
- **WHEN** l'utilisateur arrive sur l'étape 7
- **THEN** tous les éléments du récapitulatif sont affichés avec les données saisies dans les étapes précédentes

#### Scenario: Modification depuis le récapitulatif
- **WHEN** l'utilisateur clique sur un élément du récapitulatif (ex: le titre)
- **THEN** le wizard revient à l'étape correspondante (étape 1 pour le titre) pour permettre la modification

### Requirement: Checklist de validation avant publication
Le système SHALL afficher une checklist avec les éléments requis (titre, catégorie, prix, description, image principale) et les éléments facultatifs (options, vidéo), avec des indicateurs visuels (check vert pour rempli, case vide pour non rempli).

#### Scenario: Tous les éléments requis remplis
- **WHEN** tous les champs obligatoires sont remplis
- **THEN** tous les éléments requis ont un check vert et le bouton "Publier mon service" est actif

#### Scenario: Éléments requis manquants
- **WHEN** la description est vide
- **THEN** l'élément "Description complète" a une case vide/rouge, le bouton "Publier mon service" est désactivé, et un lien "Compléter" renvoie à l'étape correspondante

### Requirement: Prévisualisation du service
Le système SHALL permettre de prévisualiser le service tel qu'il apparaîtra publiquement en ouvrant un nouvel onglet avec le rendu final.

#### Scenario: Clic sur prévisualiser
- **WHEN** l'utilisateur clique sur "Prévisualiser mon service"
- **THEN** un nouvel onglet s'ouvre avec le rendu complet du service (titre, description formatée, galerie, prix, options) tel que les clients le verront

### Requirement: Sauvegarde en brouillon
Le système SHALL permettre de sauvegarder le service en brouillon sans le publier, pour y revenir plus tard.

#### Scenario: Sauvegarde en brouillon
- **WHEN** l'utilisateur clique sur "Sauvegarder en brouillon"
- **THEN** le service est sauvegardé avec le statut "draft" et l'utilisateur est redirigé vers sa liste de services avec un message de confirmation

### Requirement: Publication du service
Le système SHALL permettre de soumettre le service pour modération admin. Le service passe en statut "en_attente" après publication.

#### Scenario: Publication réussie
- **WHEN** l'utilisateur clique sur "Publier mon service" et tous les champs requis sont remplis
- **THEN** le service est sauvegardé avec le statut "pending", un message de confirmation "Votre service a été soumis ! Il sera visible après validation par notre équipe (sous 24h). Vous recevrez une notification par email." est affiché

#### Scenario: Notification après publication
- **WHEN** le service est soumis pour modération
- **THEN** un email de confirmation est envoyé au vendeur et le service apparaît dans la file de modération admin

### Requirement: Vérification limite de services par plan
Le système SHALL vérifier que le vendeur n'a pas atteint sa limite de services actifs selon son plan (Gratuit: 3, Pro: 15, Business/Agence: illimité) avant de permettre la publication.

#### Scenario: Limite de services atteinte
- **WHEN** un utilisateur sur plan Gratuit a déjà 3 services actifs et tente de publier un nouveau service
- **THEN** un message "Vous avez atteint la limite de 3 services pour le plan Gratuit. Passez au plan Pro pour publier jusqu'à 15 services." est affiché et la publication est bloquée

#### Scenario: Services en brouillon non comptés
- **WHEN** un utilisateur sur plan Gratuit a 2 services actifs et 5 services en brouillon
- **THEN** la publication est autorisée car seuls les services actifs comptent dans la limite
