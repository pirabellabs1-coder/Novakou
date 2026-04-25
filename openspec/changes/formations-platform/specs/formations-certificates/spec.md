## ADDED Requirements

### Requirement: Certificate is automatically generated when all completion criteria are met
Un certificat DOIT être automatiquement généré lorsque les 3 conditions suivantes sont réunies simultanément : (1) 100% des leçons de la formation sont marquées complétées dans `LessonProgress`, (2) tous les quiz de section ont un score supérieur ou égal à leur `passingScore`, (3) le quiz final (si configuré comme obligatoire) a été réussi. La génération DOIT être déclenchée de manière asynchrone via un job BullMQ `certificate-generator`. Le PDF est généré avec `@react-pdf/renderer` côté serveur Node.js.

#### Scenario: Déclenchement automatique de la génération de certificat
- **WHEN** un apprenant complète la dernière leçon d'une formation et que toutes les conditions de validation sont réunies
- **THEN** un job BullMQ `generate-certificate` est enqueued immédiatement, `Enrollment.completedAt` est défini à l'heure courante, et le statut de la formation dans le dashboard apprenant passe à "Complétée"

#### Scenario: Génération PDF réussie par le worker BullMQ
- **WHEN** le worker BullMQ `certificate-generator` traite le job `generate-certificate`
- **THEN** un fichier PDF est généré avec `@react-pdf/renderer`, uploadé dans le bucket Supabase Storage `certificates/[userId]/[formationSlug].pdf`, et l'URL signée est sauvegardée dans `Certificate.pdfUrl`

#### Scenario: Formation sans quiz final — génération déclenchée à 100% de leçons
- **WHEN** une formation n'a pas de quiz final obligatoire et un apprenant complète sa dernière leçon
- **THEN** le certificat est généré sans attendre de score de quiz final

#### Scenario: Échec du quiz final bloque la génération du certificat
- **WHEN** un apprenant a complété 100% des leçons mais a échoué au quiz final (score < passingScore)
- **THEN** `Enrollment.completedAt` reste null et aucun certificat n'est généré jusqu'à la réussite du quiz

#### Scenario: Retry automatique en cas d'erreur de génération PDF
- **WHEN** le worker BullMQ échoue à générer le PDF (ex: erreur réseau Supabase Storage)
- **THEN** le job est retenté automatiquement jusqu'à 3 fois avec backoff exponentiel avant d'être marqué comme échoué et notifié à l'admin via Sentry

### Requirement: Certificate has a bilingual PDF design with unique verification code
Le certificat PDF DOIT être bilingue FR/EN sur le même document. Il DOIT inclure : le logo FreelanceHigh, le titre "CERTIFICAT D'ACCOMPLISSEMENT / CERTIFICATE OF COMPLETION", le nom complet de l'apprenant, le titre bilingue de la formation, le nom de l'instructeur, le score obtenu, la durée de la formation, la date d'obtention, un code unique au format `FH-YYYY-XXXXXX` (où YYYY est l'année et XXXXXX est un identifiant alphanumérique unique), et un QR code pointant vers la page de vérification publique.

#### Scenario: Code unique de certificat généré sans collision
- **WHEN** un `Certificate` est créé en base de données
- **THEN** le code généré au format `FH-2026-XXXXXX` est unique dans la table `Certificate` (contrainte `@unique` sur le champ `code`) et est généré via `nanoid` ou `cuid` suffixé de l'année

#### Scenario: QR code dans le PDF pointe vers la bonne URL de vérification
- **WHEN** un apprenant scanne le QR code sur son certificat PDF
- **THEN** son navigateur est redirigé vers `https://freelancehigh.com/formations/verification/FH-2026-XXXXXX` où le certificat est affiché comme authentique

#### Scenario: Contenu bilingue du certificat PDF
- **WHEN** le PDF est généré
- **THEN** le titre de la formation apparaît en français ET en anglais sur le même document, conformément aux valeurs `Formation.titleFr` et `Formation.titleEn`

### Requirement: Certificate download and LinkedIn sharing are available from learner dashboard
L'apprenant DOIT pouvoir télécharger le PDF de son certificat depuis le dashboard à `/mes-formations`. Un bouton "Partager sur LinkedIn" DOIT générer l'URL de partage LinkedIn avec les métadonnées pré-remplies. Le lien de téléchargement DOIT être une URL signée Supabase Storage valide pour 24 heures.

#### Scenario: Téléchargement du certificat PDF
- **WHEN** un apprenant clique sur "Télécharger le certificat" depuis son dashboard
- **THEN** une URL signée Supabase Storage (`certificates/[userId]/[formationSlug].pdf`) valide 24 heures est générée et le téléchargement démarre automatiquement

#### Scenario: Partage LinkedIn avec métadonnées pré-remplies
- **WHEN** un apprenant clique sur "Partager sur LinkedIn"
- **THEN** il est redirigé vers `https://www.linkedin.com/profile/add?certId=[code]&certUrl=[verificationUrl]&name=[formationTitle]&organizationName=FreelanceHigh` avec les données du certificat pré-remplies

### Requirement: Certificate notification email is sent upon successful generation
Un email de félicitations DOIT être envoyé à l'apprenant immédiatement après la génération réussie du certificat PDF. L'email DOIT être bilingue (FR et EN dans le même email), inclure le nom de l'apprenant, le titre de la formation, le code du certificat, un lien de téléchargement direct, et un lien vers la page de vérification publique.

#### Scenario: Email de certificat envoyé après génération réussie
- **WHEN** le worker BullMQ termine avec succès la génération du PDF
- **THEN** Resend envoie l'email template `CertificateIssuedEmail` à l'adresse email de l'apprenant dans les 60 secondes suivant la fin du job BullMQ

#### Scenario: Email non renvoyé en cas de re-génération (idempotence)
- **WHEN** le job de génération est retenté après un premier succès partiel (PDF généré mais email non envoyé)
- **THEN** si un `Certificate` avec le même `enrollmentId` existe déjà, seul l'email est renvoyé sans recréer le certificat en DB ni régénérer le PDF
