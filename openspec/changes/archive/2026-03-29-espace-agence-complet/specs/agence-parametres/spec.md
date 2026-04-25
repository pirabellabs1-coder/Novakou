## ADDED Requirements

### Requirement: Paramètres de l'agence en sections
La page paramètres SHALL organiser les options en sections navigables : Informations agence, Rôles & Permissions, Plan d'abonnement, Paiements, Notifications, Zone danger.

#### Scenario: Navigation entre sections
- **WHEN** l'utilisateur clique sur une section dans le menu latéral
- **THEN** la section correspondante est affichée

### Requirement: Informations agence modifiables
La section informations SHALL permettre de modifier : nom, logo, description, secteur, site web, pays, SIRET.

#### Scenario: Sauvegarde des informations
- **WHEN** l'utilisateur modifie les champs et clique "Enregistrer"
- **THEN** un toast de succès est affiché

### Requirement: Gestion des rôles et permissions
La section rôles SHALL afficher les permissions par rôle (admin, manager, membre, commercial) avec toggles.

#### Scenario: Modification d'une permission
- **WHEN** l'utilisateur active/désactive une permission
- **THEN** le changement est appliqué visuellement

### Requirement: Plan d'abonnement
La section plan SHALL afficher le plan actuel (Agence €99/mois) avec les fonctionnalités et un bouton de changement.

#### Scenario: Affichage du plan
- **WHEN** la section plan est ouverte
- **THEN** le plan Agence est affiché avec ses avantages et limites

### Requirement: Zone danger
La section zone danger SHALL permettre de désactiver le compte agence avec confirmation.

#### Scenario: Tentative de désactivation
- **WHEN** l'utilisateur clique "Désactiver le compte"
- **THEN** un modal de confirmation est affiché avec avertissement
