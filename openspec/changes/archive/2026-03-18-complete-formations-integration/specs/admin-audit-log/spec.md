## ADDED Requirements

### Requirement: Système SHALL enregistrer toutes les actions administratives dans un journal d'audit
Chaque action admin de modification (approbation, rejet, suspension, révocation, suppression, fermeture de cohorte, modération de discussion) SHALL créer un enregistrement `AuditLog` avec : userId, action, targetType, targetId, metadata (JSON), ipAddress, createdAt.

#### Scenario: Enregistrement d'une approbation de formation
- **WHEN** l'admin approuve une formation
- **THEN** un `AuditLog` est créé avec action="formation_approved", targetType="formation", targetId=<formationId>, metadata={previousStatus: "EN_ATTENTE"}

#### Scenario: Enregistrement d'une révocation de certificat
- **WHEN** l'admin révoque un certificat
- **THEN** un `AuditLog` est créé avec action="certificate_revoked", targetType="certificate", targetId=<certificateId>, metadata={reason: "..."}

### Requirement: Admin SHALL pouvoir consulter le journal d'audit
Une nouvelle page `/formations/admin/audit-log` SHALL afficher l'historique chronologique de toutes les actions admin avec filtres par type d'action, par admin, et par période.

#### Scenario: Affichage du journal d'audit
- **WHEN** l'admin accède à `/formations/admin/audit-log`
- **THEN** une timeline affiche les 50 dernières actions avec : date/heure, nom de l'admin, action (badge coloré), cible (lien cliquable), et détails

#### Scenario: Filtrage par type d'action
- **WHEN** l'admin sélectionne un filtre (approbations, rejets, suspensions, révocations, modération)
- **THEN** seules les actions du type sélectionné sont affichées

#### Scenario: Filtrage par période
- **WHEN** l'admin sélectionne une période (aujourd'hui, 7j, 30j, 3m, tout)
- **THEN** seules les actions dans la période sélectionnée sont affichées

#### Scenario: Pagination
- **WHEN** l'admin fait défiler vers le bas
- **THEN** les actions suivantes sont chargées (pagination infinite scroll ou bouton "Charger plus")

### Requirement: API audit log SHALL exposer les données paginées
`GET /api/admin/formations/audit-log` SHALL retourner les actions d'audit paginées avec filtres.

#### Scenario: Appel API audit log
- **WHEN** un admin authentifié appelle `GET /api/admin/formations/audit-log?action=formation_approved&page=1&limit=50`
- **THEN** la réponse contient `{ logs[], total, totalPages }` avec les relations utilisateur incluses

### Requirement: Table AuditLog SHALL être ajoutée au schéma Prisma
Le schéma Prisma SHALL inclure une nouvelle table `AuditLog` avec les colonnes : id, userId, action (String), targetType (String), targetId (String), metadata (Json), ipAddress (String?), createdAt (DateTime).

#### Scenario: Migration Prisma
- **WHEN** la migration est exécutée
- **THEN** la table `AuditLog` est créée avec un index sur (action, createdAt) et un index sur (userId, createdAt)
