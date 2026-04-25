## ADDED Requirements

### Requirement: Admin can moderate formations through an approval queue
L'espace admin DOIT disposer d'une section "Formations" avec un tableau de bord dédié à `/admin/formations/dashboard`. L'admin DOIT pouvoir approuver, refuser ou archiver les formations soumises par les instructeurs. Un email DOIT être envoyé à l'instructeur à chaque décision de modération avec la raison en cas de refus.

#### Scenario: Approbation d'une formation en attente
- **WHEN** un admin clique sur "Approuver" pour une formation au statut `EN_ATTENTE`
- **THEN** le statut de la formation passe à `ACTIF`, `Formation.publishedAt` est défini à l'heure courante, la formation apparaît dans la marketplace publique, et un email de notification est envoyé à l'instructeur

#### Scenario: Refus d'une formation avec motif
- **WHEN** un admin clique sur "Refuser" et saisit un motif (ex: "Contenu insuffisant dans les leçons")
- **THEN** le statut reste à `EN_ATTENTE` (ou passe à `BROUILLON`), le motif est sauvegardé, et un email détaillant le motif de refus est envoyé à l'instructeur

#### Scenario: Archivage forcé d'une formation active par l'admin
- **WHEN** un admin archive une formation active (ex: contenu inapproprié signalé)
- **THEN** la formation passe au statut `ARCHIVE`, disparaît de la marketplace, et l'instructeur reçoit un email d'explication

#### Scenario: Dashboard formations admin avec métriques globales
- **WHEN** un admin accède à `/admin/formations/dashboard`
- **THEN** il voit les métriques en temps réel : total formations actives, total apprenants, CA formations du mois (100% avant redistribution), certifications délivrées ce mois, et des graphiques recharts des tendances

### Requirement: Admin manages instructor applications and accounts
L'admin DOIT pouvoir voir la liste des candidatures instructeurs en attente à `/admin/formations/instructeurs`, approuver ou refuser chaque candidature avec un motif, et suspendre/réactiver des instructeurs déjà approuvés. Un email DOIT être envoyé à l'instructeur pour chaque action.

#### Scenario: Approbation d'une candidature instructeur
- **WHEN** un admin clique sur "Approuver" pour une candidature `EN_ATTENTE`
- **THEN** `InstructeurProfile.status` passe à `APPROUVE`, l'accès à l'espace instructeur est débloqué pour cet utilisateur, et un email d'accès lui est envoyé avec un lien vers son dashboard instructeur

#### Scenario: Refus d'une candidature instructeur
- **WHEN** un admin refuse une candidature en saisissant un motif
- **THEN** `InstructeurProfile.status` reste `EN_ATTENTE` (ou passe à un statut `REFUSE`), et un email avec le motif de refus est envoyé au candidat

#### Scenario: Suspension d'un instructeur actif
- **WHEN** un admin suspend un instructeur approuvé
- **THEN** `InstructeurProfile.status` passe à `SUSPENDU`, les formations de l'instructeur passent au statut `ARCHIVE`, et l'instructeur ne peut plus accéder à son espace instructeur

#### Scenario: Vue des formations d'un instructeur depuis son profil admin
- **WHEN** un admin clique sur le nom d'un instructeur dans la liste admin
- **THEN** il accède à une vue détaillée montrant toutes les formations de l'instructeur (avec statuts), ses revenus générés, et ses apprenants

### Requirement: Admin manages learner enrollments and refund requests
L'admin DOIT pouvoir voir la liste de tous les apprenants et leurs inscriptions à `/admin/formations/apprenants`, et traiter les demandes de remboursement. Un remboursement approuvé DOIT déclencher un remboursement Stripe et révoquer l'accès à la formation.

#### Scenario: Traitement d'une demande de remboursement
- **WHEN** un admin approuve une demande de remboursement
- **THEN** l'API Stripe `refunds.create` est appelée pour le montant correspondant, l'`Enrollment` est marqué comme remboursé (statut dédié), l'accès au lecteur est révoqué, et des emails de confirmation sont envoyés à l'apprenant et à l'instructeur (avec déduction du revenu instructeur)

#### Scenario: Refus d'une demande de remboursement
- **WHEN** un admin refuse une demande de remboursement (ex: progression > 30%)
- **THEN** la demande est clôturée avec statut "Refusé", un email explicatif est envoyé à l'apprenant, et l'accès à la formation est maintenu

### Requirement: Admin oversees formations finances and instructor withdrawals
L'admin DOIT avoir une vue complète des finances formations à `/admin/formations/finances` : CA total, commissions perçues (30%), retraits des instructeurs en attente et traités. L'admin DOIT pouvoir approuver ou rejeter les demandes de retrait des instructeurs.

#### Scenario: Approbation d'une demande de retrait instructeur
- **WHEN** un admin approuve une demande de retrait
- **THEN** la demande passe au statut "Traité", le montant est déduit du solde disponible de l'instructeur, et un email de confirmation lui est envoyé. L'admin effectue le virement manuellement en dehors de la plateforme.

#### Scenario: Rapport financier formations exportable
- **WHEN** un admin clique sur "Exporter PDF" sur la page finances formations
- **THEN** un fichier PDF est généré et téléchargé avec le CA total, les commissions perçues, les retraits effectués et le solde plateforme pour la période sélectionnée

### Requirement: Admin can manage certificates and revoke fraudulent ones
L'admin DOIT pouvoir voir tous les certificats délivrés à `/admin/formations/certificats`, rechercher un certificat par son code unique, et révoquer un certificat en cas de fraude. La révocation DOIT rendre le certificat non valide sur la page de vérification publique.

#### Scenario: Recherche d'un certificat par code
- **WHEN** un admin saisit le code "FH-2026-A1B2C3" dans la barre de recherche
- **THEN** le certificat correspondant est affiché avec les informations de l'apprenant, de la formation et de la date d'émission

#### Scenario: Révocation d'un certificat frauduleux
- **WHEN** un admin révoque un certificat en saisissant un motif
- **THEN** un champ `Certificate.revokedAt` est défini, la page de vérification publique affiche "Ce certificat a été révoqué" pour ce code, et l'apprenant reçoit un email d'information

### Requirement: Admin manages formation categories
L'admin DOIT pouvoir créer, modifier et supprimer des catégories de formations à `/admin/formations/categories`. Chaque catégorie DOIT avoir un nom FR/EN, un slug, une icône, une couleur et un ordre d'affichage. La suppression d'une catégorie utilisée par des formations DOIT être bloquée ou demander une réaffectation.

#### Scenario: Création d'une nouvelle catégorie
- **WHEN** un admin crée une catégorie avec nom FR "Intelligence Artificielle", nom EN "Artificial Intelligence", icône et couleur
- **THEN** la catégorie apparaît dans la grille des catégories sur la landing page formations et dans les filtres de la marketplace

#### Scenario: Tentative de suppression d'une catégorie utilisée
- **WHEN** un admin tente de supprimer une catégorie associée à des formations existantes
- **THEN** un message "X formations utilisent cette catégorie. Réaffectez-les avant de supprimer." est affiché et la suppression est bloquée
