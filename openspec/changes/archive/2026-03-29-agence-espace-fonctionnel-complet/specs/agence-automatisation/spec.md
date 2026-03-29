## ADDED Requirements

### Requirement: Agency automation page SHALL provide visual scenario builder
La page automatisation (`/agence/automatisation`) MUST fournir un createur de scenarios visuels identique a l'espace freelance. Chaque scenario MUST avoir : un declencheur configurable (nouvelle commande, nouveau message, avis recu, delai proche, client inactif), des conditions configurables (montant > X, statut = Y), et des actions configurables (envoyer message, envoyer email, mettre a jour statut, notifier membre). La fonctionnalite MUST etre disponible uniquement pour les plans Pro et Business — le plan Gratuit voit un message d'upgrade.

#### Scenario: Creation d'un scenario d'automatisation
- **WHEN** un utilisateur Pro/Business cree un nouveau scenario avec un declencheur et une action
- **THEN** le scenario est sauvegarde via l'API et s'active immediatement

#### Scenario: Plan Gratuit voit message d'upgrade
- **WHEN** un utilisateur avec le plan Gratuit accede a la page automatisation
- **THEN** un message s'affiche proposant de passer au plan Pro pour acceder a cette fonctionnalite

#### Scenario: Historique des declenchements
- **WHEN** un scenario a ete declenche
- **THEN** l'historique affiche la date, le declencheur, et l'action executee

### Requirement: Agency automation SHALL support team-specific scenarios
Les scenarios MUST pouvoir etre appliques a toute l'equipe ou a un membre specifique. Les statistiques par scenario (nombre de declenchements, taux de succes) MUST etre affichees.

#### Scenario: Scenario applique a un membre specifique
- **WHEN** un utilisateur configure un scenario pour un membre specifique
- **THEN** le scenario ne se declenche que pour les commandes/evenements du membre selectionne

#### Scenario: Statistiques par scenario
- **WHEN** un utilisateur consulte un scenario
- **THEN** les statistiques (declenchements total, ce mois, taux de succes) sont affichees
