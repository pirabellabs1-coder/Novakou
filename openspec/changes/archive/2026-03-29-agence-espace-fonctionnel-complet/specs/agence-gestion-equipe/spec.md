## ADDED Requirements

### Requirement: Agency team page SHALL display real team members from API
La page de gestion de l'equipe (`/agence/equipe`) MUST afficher une grille de cards des membres de l'agence depuis l'API. Chaque card MUST afficher : photo de profil, nom complet, role dans l'agence, statut (actif/inactif), nombre de commandes actives, CA genere. Les statistiques globales de l'equipe MUST etre affichees en haut de la page.

#### Scenario: Grille des membres depuis API
- **WHEN** un utilisateur agence accede a `/agence/equipe`
- **THEN** la grille affiche les membres reels de l'agence depuis l'API
- **THEN** un nouvel utilisateur voit uniquement lui-meme comme proprietaire

#### Scenario: Stats equipe en haut de page
- **WHEN** la page equipe se charge
- **THEN** les statistiques affichent : nombre total de membres, membres actifs, CA total equipe, commandes en cours

### Requirement: Agency team SHALL support member invitation via email
Le systeme MUST permettre d'inviter un nouveau membre par email. Le formulaire d'invitation MUST contenir : email et role (Proprietaire, Manager, Freelance, Commercial). L'invitation MUST envoyer un email via Resend avec un lien valide 48h.

#### Scenario: Inviter un membre
- **WHEN** un utilisateur clique "Inviter un membre", remplit l'email et le role, et valide
- **THEN** un email d'invitation est envoye a l'adresse specifiee
- **THEN** l'invitation apparait dans la liste avec le statut "en attente"

#### Scenario: Lien d'invitation expire apres 48h
- **WHEN** le destinataire clique sur le lien apres 48h
- **THEN** le lien est invalide et un message indique que l'invitation a expire

### Requirement: Agency team SHALL support role management and member actions
Le systeme MUST permettre de : modifier le role d'un membre, voir ses commandes assignees, voir son CA genere, desassigner ses commandes, retirer un membre de l'agence (avec confirmation).

#### Scenario: Modifier le role d'un membre
- **WHEN** un proprietaire ou manager change le role d'un membre
- **THEN** le role est mis a jour via l'API et les permissions du membre changent immediatement

#### Scenario: Retirer un membre de l'agence
- **WHEN** un proprietaire clique "Retirer" sur un membre et confirme
- **THEN** le membre est retire de l'agence via l'API
- **THEN** ses commandes en cours sont desassignees et doivent etre reassignees

### Requirement: Agency member profile SHALL display complete information
Le profil de chaque membre MUST afficher : photo de profil + photo de couverture, informations personnelles, competences, commandes en cours, historique commandes, CA genere pour l'agence, avis recus dans l'agence, graphique de performance.

#### Scenario: Profil membre complet
- **WHEN** un utilisateur clique sur un membre pour voir son profil
- **THEN** toutes les informations du membre sont affichees depuis l'API
- **THEN** un graphique de performance (commandes completees par mois) est affiche avec recharts
