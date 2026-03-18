## ADDED Requirements

### Requirement: Apprenant SHALL pouvoir demander un remboursement
L'apprenant SHALL pouvoir demander un remboursement pour une formation achetée dans les 14 jours suivant l'inscription, à condition d'avoir complété moins de 30% du contenu. L'interface se trouve dans la page de détail de la formation ou depuis la page d'achats.

#### Scenario: Demande de remboursement éligible
- **WHEN** l'apprenant clique sur "Demander un remboursement" sur une formation inscrite depuis moins de 14 jours et avec moins de 30% de progression
- **THEN** un formulaire demande le motif (qualité insuffisante, ne correspond pas à la description, problème technique, autre), et la demande est soumise

#### Scenario: Demande de remboursement non éligible — délai dépassé
- **WHEN** l'inscription date de plus de 14 jours
- **THEN** le bouton "Demander un remboursement" n'est pas affiché et un message explique que le délai est dépassé

#### Scenario: Demande de remboursement non éligible — progression trop avancée
- **WHEN** la progression est supérieure à 30%
- **THEN** le bouton "Demander un remboursement" n'est pas affiché et un message explique que trop de contenu a été consommé

### Requirement: Apprenant SHALL pouvoir suivre le statut de ses demandes de remboursement
Une section dans la page `/formations/mes-achats` SHALL lister les demandes de remboursement en cours avec leur statut : en attente, approuvé, refusé.

#### Scenario: Suivi des remboursements
- **WHEN** l'apprenant accède à la page "Mes achats"
- **THEN** un onglet "Remboursements" affiche les demandes avec : formation, montant, motif, date, statut, note admin (si refusé)

### Requirement: Admin SHALL pouvoir traiter les demandes de remboursement
La page admin finances SHALL inclure un onglet "Remboursements" listant les demandes en attente avec les boutons "Approuver" et "Refuser".

#### Scenario: Approbation d'un remboursement
- **WHEN** l'admin approuve un remboursement
- **THEN** le statut passe à "approved", l'inscription de l'apprenant est suspendue, le montant est déduit du wallet de l'instructeur, un email de confirmation est envoyé à l'apprenant, et un audit log est créé

#### Scenario: Refus d'un remboursement
- **WHEN** l'admin refuse un remboursement avec un motif
- **THEN** le statut passe à "rejected", le motif est enregistré, un email est envoyé à l'apprenant avec le motif du refus

### Requirement: Table RefundRequest SHALL être ajoutée au schéma Prisma
Le schéma Prisma SHALL inclure une nouvelle table `RefundRequest` avec : id, userId, enrollmentId, amount, reason (String), status (PENDING/APPROVED/REJECTED), adminNote (String?), createdAt, resolvedAt, resolvedBy.

#### Scenario: Migration Prisma
- **WHEN** la migration est exécutée
- **THEN** la table `RefundRequest` est créée avec les relations vers User et Enrollment

### Requirement: API remboursements SHALL exposer les données
`POST /api/apprenant/refunds` pour créer une demande, `GET /api/apprenant/refunds` pour lister les demandes, `PUT /api/admin/formations/refunds/[id]` pour traiter.

#### Scenario: Création de demande
- **WHEN** un apprenant authentifié appelle `POST /api/apprenant/refunds` avec `{ enrollmentId, reason }`
- **THEN** une `RefundRequest` est créée avec status=PENDING et le montant est automatiquement récupéré depuis l'enrollment

#### Scenario: Liste des demandes
- **WHEN** un apprenant appelle `GET /api/apprenant/refunds`
- **THEN** la réponse contient `{ refunds[] }` avec les champs : id, formationTitle, amount, reason, status, adminNote, createdAt, resolvedAt

#### Scenario: Traitement admin
- **WHEN** un admin appelle `PUT /api/admin/formations/refunds/[id]` avec `{ action: "approve" | "reject", note?: "..." }`
- **THEN** le statut est mis à jour, un audit log est créé, et un email est envoyé à l'apprenant
