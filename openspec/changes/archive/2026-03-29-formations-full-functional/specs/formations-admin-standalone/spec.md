## ADDED Requirements

### Requirement: L'admin formations DOIT avoir son propre layout standalone
Le système DOIT afficher l'espace admin formations dans le layout standalone formations (avec FormationsHeader + FormationsFooter) et non dans le layout admin FreelanceHigh. L'admin formations DOIT avoir sa propre sidebar avec les liens de navigation spécifiques aux formations.

#### Scenario: Accès au dashboard admin formations
- **WHEN** un utilisateur admin accède à `/formations/admin/dashboard`
- **THEN** la page s'affiche avec le FormationsHeader en haut, une sidebar admin formations à gauche, et le FormationsFooter en bas — sans aucun élément du layout admin FreelanceHigh visible

#### Scenario: Navigation sidebar admin formations
- **WHEN** la sidebar admin formations est affichée
- **THEN** elle DOIT contenir les liens : Dashboard, Formations, Instructeurs, Apprenants, Finances, Certificats, Catégories, Codes Promo, avec des icônes Material Symbols et un indicateur d'état actif

### Requirement: L'admin formations DOIT être protégé par le middleware
Le middleware Next.js DOIT vérifier que l'utilisateur a le rôle `admin` avant d'autoriser l'accès aux routes `/formations/admin/*`. Les utilisateurs non-admin DOIVENT être redirigés.

#### Scenario: Utilisateur non-admin tente d'accéder à l'admin formations
- **WHEN** un utilisateur avec le rôle `apprenant` ou `instructeur` tente d'accéder à `/formations/admin/dashboard`
- **THEN** le système DOIT le rediriger vers `/formations/connexion`

#### Scenario: Utilisateur admin accède à l'admin formations
- **WHEN** un utilisateur avec le rôle `admin` accède à `/formations/admin/dashboard`
- **THEN** le système DOIT afficher le dashboard admin formations normalement

### Requirement: Le dashboard admin formations DOIT afficher des métriques temps réel
Le dashboard admin formations DOIT afficher des statistiques provenant de l'API `/api/admin/formations/stats` avec des données Prisma réelles : nombre total de formations, apprenants inscrits, instructeurs actifs, revenus totaux, avis en attente.

#### Scenario: Chargement du dashboard admin
- **WHEN** le dashboard admin formations se charge
- **THEN** il DOIT appeler l'API `/api/admin/formations/stats` et afficher les métriques réelles avec des graphiques d'évolution

### Requirement: L'admin formations DOIT pouvoir gérer les formations
L'admin DOIT pouvoir voir la liste de toutes les formations, les approuver, les refuser avec motif, et les archiver. Les actions DOIVENT appeler les APIs existantes.

#### Scenario: Approbation d'une formation en attente
- **WHEN** l'admin clique sur "Approuver" sur une formation avec le statut EN_ATTENTE
- **THEN** le système DOIT appeler `POST /api/admin/formations/approve/[id]` et mettre à jour la liste sans rechargement de page

### Requirement: L'admin formations DOIT avoir une page gestion des instructeurs
L'admin DOIT pouvoir voir la liste des instructeurs, les approuver, les refuser, les suspendre. Les instructeurs en attente DOIVENT être mis en évidence.

#### Scenario: Suspension d'un instructeur
- **WHEN** l'admin clique sur "Suspendre" sur un instructeur approuvé
- **THEN** le système DOIT appeler l'API correspondante, mettre à jour le statut à SUSPENDU, et les formations de cet instructeur DOIVENT être masquées de l'explorateur

### Requirement: L'admin formations DOIT pouvoir gérer les finances
L'admin DOIT pouvoir voir les revenus totaux, les retraits en attente, approuver/refuser les demandes de retrait des instructeurs.

#### Scenario: Approbation d'un retrait instructeur
- **WHEN** l'admin approuve une demande de retrait
- **THEN** le système DOIT appeler `POST /api/admin/formations/finances/withdrawal/[id]` avec le statut APPROUVE et le retrait DOIT changer de statut

### Requirement: Mobile responsive pour l'admin formations
La sidebar admin formations DOIT se transformer en overlay mobile sur les écrans < 1024px avec un bouton hamburger pour l'ouvrir/fermer.

#### Scenario: Affichage mobile de l'admin formations
- **WHEN** la largeur d'écran est inférieure à 1024px
- **THEN** la sidebar DOIT être masquée par défaut et un bouton hamburger DOIT apparaître dans la barre supérieure pour l'ouvrir en overlay
