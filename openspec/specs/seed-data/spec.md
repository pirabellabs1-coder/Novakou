## ADDED Requirements

### Requirement: Le seed MUST créer des données couvrant tous les flux
L'endpoint `POST /api/admin/seed-marketplace` MUST créer un jeu de données complet permettant de tester les 3 flux principaux : service→commande, projet→candidature→commande, offre→commande.

#### Scenario: Seed crée des services avec commandes
- **WHEN** l'admin exécute le seed marketplace
- **THEN** le système crée au minimum 8 services actifs, 3 commandes en cours (avec statuts variés : EN_ATTENTE, EN_COURS, LIVRE), et les payments/conversations associés

#### Scenario: Seed crée des projets avec candidatures
- **WHEN** l'admin exécute le seed marketplace
- **THEN** le système crée au minimum 5 projets ouverts, 10 candidatures (ProjectBid) avec des statuts variés (en_attente, acceptee, refusee), et les profils freelance associés

#### Scenario: Seed crée des offres personnalisées
- **WHEN** l'admin exécute le seed marketplace
- **THEN** le système crée au minimum 5 offres personnalisées avec `clientId` résolu, des statuts variés (EN_ATTENTE, ACCEPTE, REFUSE, EXPIRE), et les données client/freelance associées

#### Scenario: Seed est idempotent
- **WHEN** l'admin exécute le seed marketplace deux fois de suite
- **THEN** le système ne crée pas de doublons — les données existantes sont réutilisées ou nettoyées avant recréation

### Requirement: Les utilisateurs seed MUST avoir des profils complets
Chaque utilisateur de démonstration MUST avoir un profil complété (FreelancerProfile, ClientProfile, ou AgencyProfile) avec des données réalistes pour tester l'affichage des pages.

#### Scenario: Freelance seed avec profil complet
- **WHEN** le seed crée un freelance
- **THEN** l'utilisateur a un `FreelancerProfile` avec bio, titre, compétences, avatar, ville, pays, et au moins 2 services actifs

#### Scenario: Client seed avec profil complet
- **WHEN** le seed crée un client
- **THEN** l'utilisateur a un `ClientProfile` avec company, sector, size, et au moins 1 projet ouvert
