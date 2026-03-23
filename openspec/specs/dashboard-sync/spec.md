## ADDED Requirements

### Requirement: Le dashboard freelance MUST afficher des données à jour
Le store Zustand du dashboard freelance MUST synchroniser les données avec l'API à chaque chargement de page. Les données persistées en localStorage ne DOIVENT PAS prendre priorité sur les données API.

#### Scenario: Freelance ouvre son dashboard
- **WHEN** un freelance authentifié accède à `/dashboard`
- **THEN** le système appelle `syncFromApi()` et affiche les revenus du mois, commandes actives, et statistiques basées sur les données API réelles

#### Scenario: Freelance consulte ses services
- **WHEN** un freelance accède à `/dashboard/services`
- **THEN** le système déclenche un sync et affiche la liste à jour de ses services avec les bons statuts (actif, en attente, pause)

#### Scenario: Filtrage des services par statut
- **WHEN** un freelance filtre ses services par "Actifs"
- **THEN** le filtre fonctionne indépendamment du case (uppercase Prisma `ACTIF` ou lowercase dev `actif`)

### Requirement: Le dashboard client MUST afficher des données à jour
Le store Zustand du client MUST synchroniser les projets, commandes, et propositions reçues avec les APIs correctes.

#### Scenario: Client ouvre son dashboard
- **WHEN** un client authentifié accède à `/client`
- **THEN** le système appelle `syncAll()` et affiche les projets actifs, commandes récentes, et dépenses du mois

#### Scenario: Client consulte ses projets
- **WHEN** un client accède à `/client/projets`
- **THEN** le système affiche ses projets avec les budgets corrects (pas €0 - €0) et le nombre de candidatures reçues

#### Scenario: Client consulte les propositions reçues
- **WHEN** un client accède à `/client/propositions`
- **THEN** le système affiche les offres personnalisées reçues (via clientId/clientEmail) — PAS les offres du freelance envoyées à d'autres clients

### Requirement: Les commandes MUST être visibles des deux côtés
Les commandes DOIVENT apparaître dans le dashboard du freelance ET du client qui y participent.

#### Scenario: Commande visible côté freelance
- **WHEN** une commande est créée sur un service du freelance
- **THEN** elle apparaît dans `/dashboard/commandes` avec le statut, montant, nom du client, et deadline

#### Scenario: Commande visible côté client
- **WHEN** un client crée ou reçoit une commande (via service, candidature acceptée, ou offre acceptée)
- **THEN** elle apparaît dans `/client/commandes` avec le statut, montant, nom du freelance, et deadline
