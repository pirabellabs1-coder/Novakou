## ADDED Requirements

### Requirement: Instructor application process requires admin approval
Tout utilisateur FreelanceHigh authentifié DOIT pouvoir soumettre une candidature pour devenir instructeur via le formulaire à `/devenir-instructeur`. La candidature DOIT créer un `InstructeurProfile` avec statut `EN_ATTENTE`. Un email de confirmation DOIT être envoyé au candidat et une notification créée pour l'admin. L'accès à l'espace instructeur DOIT être conditionné au statut `APPROUVE`.

#### Scenario: Soumission d'une candidature instructeur
- **WHEN** un utilisateur authentifié soumet le formulaire de candidature avec tous les champs requis (nom, email, domaines d'expertise, bio FR, bio EN)
- **THEN** un `InstructeurProfile` est créé avec statut `EN_ATTENTE`, un email de confirmation est envoyé via Resend, et l'utilisateur voit un message "Votre candidature a été soumise"

#### Scenario: Double soumission de candidature
- **WHEN** un utilisateur ayant déjà un `InstructeurProfile` tente d'accéder à `/devenir-instructeur`
- **THEN** il est redirigé vers son dashboard instructeur (si approuvé) ou vers une page confirmant que sa candidature est en cours de traitement

#### Scenario: Accès à l'espace instructeur sans approbation
- **WHEN** un utilisateur avec `InstructeurProfile.status = EN_ATTENTE` tente d'accéder à `/instructeur/dashboard`
- **THEN** il est redirigé vers une page l'informant que sa candidature est en cours d'examen

### Requirement: Instructor dashboard displays real-time business metrics
Le dashboard instructeur `/instructeur/dashboard` DOIT afficher des métriques calculées depuis la base de données (chiffre d'affaires du mois, total apprenants, formations actives, note moyenne) et des graphiques recharts interactifs (revenus par mois, nouveaux apprenants, performance des formations). Les données DOIVENT être filtrables par période (7j, 30j, 3m, 6m, 1 an).

#### Scenario: Affichage du CA du mois en cours
- **WHEN** un instructeur visite son dashboard en mars 2026
- **THEN** le chiffre "CA ce mois" représente la somme des `paidAmount * 0.70` de tous les `Enrollment` dont `createdAt` est en mars 2026, pour les formations de cet instructeur

#### Scenario: Graphique revenus filtré par période
- **WHEN** un instructeur sélectionne le filtre "3 mois" sur le graphique des revenus
- **THEN** le graphique bar recharts affiche les revenus nets (70%) par mois sur les 3 derniers mois

#### Scenario: Activité récente
- **WHEN** un nouvel apprenant s'inscrit à une formation de l'instructeur
- **THEN** cette inscription apparaît dans la section "Activité récente" du dashboard dans les 60 secondes suivant l'inscription

### Requirement: Course creation wizard validates and persists 5-step content
Le wizard de création de formation `/instructeur/creer` DOIT guider l'instructeur en 5 étapes : (1) Informations de base bilingues, (2) Médias et détails, (3) Prix et certificat, (4) Curriculum avec drag & drop, (5) Publication. La progression DOIT être sauvegardée automatiquement entre les étapes. La formation est créée avec le statut `BROUILLON` jusqu'à soumission explicite.

#### Scenario: Sauvegarde automatique de l'étape 1
- **WHEN** un instructeur complète l'étape 1 et passe à l'étape 2
- **THEN** les données saisies (titre FR, titre EN, catégorie, niveau, description) sont sauvegardées en DB dans une formation au statut `BROUILLON`, sans action manuelle

#### Scenario: Upload de l'image de couverture
- **WHEN** un instructeur dépose une image JPEG/PNG/WebP de moins de 5MB sur la zone drag & drop de l'étape 2
- **THEN** l'image est uploadée dans Cloudinary, son URL publique est sauvegardée dans `Formation.thumbnail`, et une prévisualisation est affichée immédiatement

#### Scenario: Upload d'un fichier trop volumineux
- **WHEN** un instructeur tente d'uploader une image de plus de 5MB
- **THEN** un message d'erreur "Fichier trop volumineux (max 5MB)" est affiché et aucun upload n'est effectué

#### Scenario: Ajout d'une leçon vidéo dans le curriculum
- **WHEN** un instructeur choisit le type "VIDEO" pour une nouvelle leçon dans l'étape 4
- **THEN** il peut saisir l'URL YouTube/Vimeo OU uploader un fichier MP4/WebM (max 2GB), le titre bilingue FR/EN, et marquer la leçon comme gratuite (aperçu)

#### Scenario: Réorganisation des sections par drag & drop
- **WHEN** un instructeur fait glisser une section pour la déplacer dans le curriculum
- **THEN** les champs `Section.order` sont mis à jour en base de données pour refléter le nouvel ordre

#### Scenario: Validation de la checklist à l'étape 5
- **WHEN** un instructeur arrive à l'étape 5 avec une formation incomplète (ex: moins de 3 sections)
- **THEN** la checklist affiche un indicateur rouge sur le critère non satisfait et le bouton "Soumettre pour modération" est désactivé

#### Scenario: Soumission de la formation pour modération
- **WHEN** un instructeur clique sur "Soumettre pour modération" avec une checklist entièrement validée
- **THEN** le statut de la formation passe à `EN_ATTENTE`, un email de confirmation est envoyé à l'instructeur, et la formation apparaît dans la file admin de modération

### Requirement: Instructor can manage existing formations with full CRUD
La page de gestion des formations `/instructeur/mes-formations` DOIT permettre à l'instructeur de voir toutes ses formations avec leurs statistiques, et d'effectuer les actions : modifier, prévisualiser, dupliquer, archiver, supprimer. La suppression DOIT être irréversible et protégée par une confirmation explicite.

#### Scenario: Modification d'une formation active
- **WHEN** un instructeur clique sur "Modifier" pour une formation au statut `ACTIF`
- **THEN** le wizard de création est chargé pré-rempli avec les données existantes. Toute modification re-soumet la formation pour modération (statut passe à `EN_ATTENTE`)

#### Scenario: Duplication d'une formation
- **WHEN** un instructeur clique sur "Dupliquer" pour une formation
- **THEN** une copie exacte est créée avec le statut `BROUILLON` et le titre "(Copie) [titre original]"

#### Scenario: Archivage d'une formation active
- **WHEN** un instructeur clique sur "Archiver" pour une formation au statut `ACTIF`
- **THEN** le statut passe à `ARCHIVE`, la formation disparaît de la marketplace publique, mais les apprenants déjà inscrits conservent leur accès

#### Scenario: Suppression d'une formation avec apprenants inscrits
- **WHEN** un instructeur tente de supprimer une formation qui a des `Enrollment` existants
- **THEN** un message d'avertissement indique "X apprenants sont inscrits. Cette action est irréversible." et une confirmation explicite est requise (saisie manuelle du titre de la formation)

### Requirement: Instructor finances show transparent revenue breakdown
La page des revenus `/instructeur/revenus` DOIT afficher le CA total, le CA du mois, le montant en attente (30 jours de délai de remboursement), la commission FreelanceHigh (30%), le net instructeur (70%), l'historique des transactions et les demandes de retrait. Le montant minimum de retrait DOIT être de 20€.

#### Scenario: Calcul du revenu net instructeur
- **WHEN** un apprenant paie 50€ pour une formation
- **THEN** la transaction enregistrée affiche : brut=50€, commission_plateforme=15€ (30%), net_instructeur=35€ (70%)

#### Scenario: Montant disponible vs. montant en attente
- **WHEN** un apprenant achète une formation
- **THEN** le montant net instructeur est d'abord comptabilisé comme "En attente" pendant 30 jours (délai de remboursement), puis passe à "Disponible" après ce délai

#### Scenario: Demande de retrait avec montant suffisant
- **WHEN** un instructeur demande un retrait de 50€ et que son solde disponible est de 75€
- **THEN** une demande de retrait est créée avec statut "En attente", un email de confirmation est envoyé, et le solde disponible est réduit de 50€

#### Scenario: Tentative de retrait sous le minimum
- **WHEN** un instructeur tente de demander un retrait de 15€ (inférieur au minimum de 20€)
- **THEN** un message d'erreur "Montant minimum de retrait : 20€" est affiché et aucune demande n'est créée

#### Scenario: Export des transactions en CSV
- **WHEN** un instructeur clique sur "Exporter CSV"
- **THEN** un fichier CSV est téléchargé contenant l'historique complet des transactions avec les colonnes : date, formation, apprenant, montant_brut, commission, montant_net, statut

### Requirement: Instructor can respond to reviews publicly
La page des avis `/instructeur/avis` DOIT permettre à l'instructeur de voir tous les avis reçus sur ses formations, filtrés par formation et par note, et de répondre publiquement à chaque avis. Une seule réponse par avis est autorisée. La réponse est visible sur la page détail de la formation.

#### Scenario: Réponse à un avis
- **WHEN** un instructeur saisit et soumet une réponse à un avis
- **THEN** la réponse est sauvegardée dans `FormationReview.response` et est immédiatement visible sur la page détail de la formation dans l'onglet "Avis"

#### Scenario: Modification d'une réponse existante
- **WHEN** un instructeur tente de répondre à un avis auquel il a déjà répondu
- **THEN** le formulaire de réponse affiche la réponse existante en mode édition et permet de la modifier
