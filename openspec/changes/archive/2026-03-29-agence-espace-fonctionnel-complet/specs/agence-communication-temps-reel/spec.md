## ADDED Requirements

### Requirement: Agency space SHALL communicate in real-time with all other spaces via APIs
Toutes les donnees de l'espace agence MUST communiquer en temps reel avec les autres espaces (client, admin, freelance) via les APIs internes et Socket.io. Les updates MUST etre instantanes pour : nouvelles commandes, messages, avis, paiements, statuts commandes.

#### Scenario: Nouvelle commande par un client mise a jour en temps reel
- **WHEN** un client commande un service de l'agence
- **THEN** le dashboard agence met a jour la carte "Commandes actives" sans rechargement
- **THEN** une notification in-app apparait immediatement
- **THEN** les statistiques sont recalculees automatiquement

#### Scenario: Livraison par un membre met a jour le client
- **WHEN** un membre de l'agence livre une commande
- **THEN** le client est notifie immediatement
- **THEN** les statistiques de l'agence (finances, commandes) sont mises a jour

#### Scenario: Avis laisse par un client met a jour l'agence
- **WHEN** un client laisse un avis sur un service de l'agence
- **THEN** la note moyenne de l'agence est recalculee
- **THEN** l'avis apparait sur le profil public de l'agence
- **THEN** l'agence recoit une notification

### Requirement: Real-time update frequency SHALL match event criticality
Les frequences de mise a jour MUST etre : nouvelles commandes (temps reel via Socket.io), messages (temps reel via Socket.io), stats dashboard (refetch toutes les minutes via TanStack Query), graphiques (refetch toutes les 5 minutes), solde financier (refetch a chaque transaction).

#### Scenario: Stats dashboard auto-refresh
- **WHEN** un utilisateur est sur le dashboard depuis plus d'une minute
- **THEN** les cartes statistiques se rechargent automatiquement avec les donnees les plus recentes

#### Scenario: Messages en temps reel
- **WHEN** un message est envoye par un client
- **THEN** le message apparait dans la messagerie de l'agence en moins d'une seconde
