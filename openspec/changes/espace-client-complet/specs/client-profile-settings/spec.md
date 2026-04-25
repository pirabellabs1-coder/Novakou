## ADDED Requirements

### Requirement: Profile page SHALL display company info form
La page `/client/profil` SHALL afficher un formulaire de profil entreprise avec : logo/avatar, nom de l'entreprise, description, site web, secteur d'activité, taille d'équipe, coordonnées de contact. Un bouton "Enregistrer les modifications" sauvegarde les changements.

#### Scenario: Modification du profil
- **WHEN** l'utilisateur modifie le nom de l'entreprise et clique "Enregistrer"
- **THEN** un toast de confirmation s'affiche et les données sont mises à jour localement

### Requirement: Settings page SHALL have sidebar tab navigation
La page `/client/parametres` SHALL afficher un layout 2 colonnes conforme à la maquette `param_tres_profil_et_compte` : sidebar navigation gauche (w-72) avec 5 onglets (Profil Public [actif en fond vert plein], Sécurité, Paiements & Facturation, Langues & Devises, Notifications) + un lien "Voir mon profil public". Le contenu change selon l'onglet sélectionné.

#### Scenario: Navigation entre onglets
- **WHEN** l'utilisateur clique sur "Sécurité"
- **THEN** l'onglet "Sécurité" est surligné en vert et le contenu sécurité s'affiche à droite

### Requirement: Profile Public tab SHALL show avatar and form fields
L'onglet "Profil Public" SHALL afficher : avatar (96px, rounded-2xl) avec bouton caméra overlay, nom "Jean Dupont", sous-titre "Développeur Fullstack · Dakar, Sénégal". Formulaire : champs Nom Complet et Email (2 colonnes), Bio Professionnelle (textarea). Bouton "Enregistrer les modifications".

#### Scenario: Upload avatar
- **WHEN** l'utilisateur clique sur l'icône caméra de l'avatar
- **THEN** un sélecteur de fichier s'ouvre pour choisir une nouvelle photo

#### Scenario: Sauvegarde du profil
- **WHEN** l'utilisateur modifie la bio et clique "Enregistrer les modifications"
- **THEN** un toast de succès s'affiche

### Requirement: Security tab SHALL show password change form
L'onglet "Sécurité du compte" SHALL afficher un formulaire 3 colonnes : Mot de passe actuel, Nouveau mot de passe, bouton "Mettre à jour". Une icône sécurité (shield) s'affiche dans le header de section.

#### Scenario: Changement de mot de passe
- **WHEN** l'utilisateur remplit les deux champs et clique "Mettre à jour"
- **THEN** un toast de succès s'affiche et les champs sont vidés

### Requirement: Language & Currency tab SHALL allow preference selection
L'onglet "Langue et Devise" SHALL afficher : sélecteur de langue avec 2 boutons (Français [actif avec check_circle vert], English), dropdown devise préférée (FCFA, EUR, USD, NGN). Une note "Les conversions sont approximatives et basées sur le taux du marché en temps réel" s'affiche.

#### Scenario: Changement de langue
- **WHEN** l'utilisateur clique sur "English"
- **THEN** le bouton "English" devient actif avec le check vert et "Français" est décoché

#### Scenario: Changement de devise
- **WHEN** l'utilisateur sélectionne "EUR" dans le dropdown
- **THEN** la devise préférée est mise à jour et un toast confirme

### Requirement: Danger zone SHALL allow account deactivation
En bas de page, une section "Désactiver le compte" en fond rouge teinté SHALL afficher un avertissement et un bouton "Désactiver" rouge. La description précise que le profil sera masqué jusqu'à la prochaine connexion.

#### Scenario: Clic sur Désactiver
- **WHEN** l'utilisateur clique sur "Désactiver"
- **THEN** un modal de confirmation s'affiche demandant la confirmation avant désactivation
