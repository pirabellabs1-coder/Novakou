## ADDED Requirements

### Requirement: Tableau des membres avec rôles et charge
La page équipe SHALL afficher un tableau avec colonnes : Collaborateur (avatar+nom), Rôle (badge coloré), Accès, Charge de travail (barre %), Actions. Les rôles SHALL être : admin (rouge), manager (violet), membre (bleu), commercial (ambre).

#### Scenario: Affichage du tableau
- **WHEN** l'utilisateur accède à `/agence/equipe`
- **THEN** tous les membres sont listés avec leur rôle en badge coloré et leur taux d'occupation en barre de progression

### Requirement: Onglets de filtrage
La page SHALL avoir 3 onglets : "Tous les membres (N)", "Disponibilité", "Demandes d'accès (N)".

#### Scenario: Filtrage par onglet
- **WHEN** l'utilisateur clique sur "Demandes d'accès"
- **THEN** seules les demandes d'accès en attente sont affichées

### Requirement: Modal d'invitation de membre
Un bouton "Ajouter un membre" SHALL ouvrir un modal avec formulaire : email, rôle, message d'invitation.

#### Scenario: Invitation d'un membre
- **WHEN** l'utilisateur remplit le formulaire et clique "Envoyer l'invitation"
- **THEN** un toast de succès est affiché et le modal se ferme

### Requirement: Filtrage par rôle
Un filtre par rôle SHALL permettre de filtrer les membres par admin, manager, membre, commercial.

#### Scenario: Filtre actif
- **WHEN** l'utilisateur sélectionne le filtre "Manager"
- **THEN** seuls les managers sont affichés dans le tableau

### Requirement: Statistiques d'équipe
La page SHALL afficher des stats : Charge Moyenne (%), Taux d'Activité (%), Projets Actifs (nombre).

#### Scenario: Affichage des stats
- **WHEN** la page équipe est chargée
- **THEN** les 3 stats sont affichées en cartes sous le tableau
