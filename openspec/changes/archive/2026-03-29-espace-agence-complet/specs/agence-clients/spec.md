## ADDED Requirements

### Requirement: Liste des clients avec pipeline visuel
La page clients SHALL afficher un CRM avec 4 colonnes pipeline : Prospect, Devis envoyé, Commande active, Livré. Chaque client SHALL avoir une fiche avec nom, entreprise, CA total, dernière interaction.

#### Scenario: Affichage du pipeline
- **WHEN** l'utilisateur accède à `/agence/clients`
- **THEN** les clients sont répartis dans les colonnes selon leur statut

### Requirement: Ajout de client
Un bouton "Ajouter un client" SHALL ouvrir un formulaire avec : nom, entreprise, email, téléphone, notes.

#### Scenario: Ajout réussi
- **WHEN** l'utilisateur remplit et soumet le formulaire
- **THEN** un toast de succès est affiché

### Requirement: Fiches client avec historique
Chaque client SHALL avoir un panneau de détail avec : informations, historique des commandes, notes internes, rappels.

#### Scenario: Ouverture de la fiche
- **WHEN** l'utilisateur clique sur un client
- **THEN** le panneau de détail s'affiche avec toutes les informations

### Requirement: Notes internes et relances
L'utilisateur SHALL pouvoir ajouter des notes internes et programmer des relances pour chaque client.

#### Scenario: Ajout de note
- **WHEN** l'utilisateur écrit une note et clique "Ajouter"
- **THEN** la note est ajoutée à la fiche client avec horodatage
