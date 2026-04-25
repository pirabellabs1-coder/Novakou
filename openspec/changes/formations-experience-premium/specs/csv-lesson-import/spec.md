## ADDED Requirements

### Requirement: Instructor SHALL import curriculum via CSV file
L'instructeur DOIT pouvoir importer un curriculum complet (sections + leçons) via un fichier CSV dans le wizard de création.

#### Scenario: Import CSV réussi
- **WHEN** l'instructeur sélectionne un fichier CSV valide avec le format `sectionTitle,lessonTitle,lessonType,duration,videoUrl,pdfUrl,audioUrl,isFree`
- **THEN** le système affiche un aperçu des sections et leçons détectées avant confirmation

#### Scenario: Confirmation et création
- **WHEN** l'instructeur confirme l'import après aperçu
- **THEN** les sections et leçons sont créées en base de données avec les bons ordres, chaque changement de sectionTitle créant une nouvelle section

#### Scenario: Fichier CSV invalide
- **WHEN** le fichier CSV contient des erreurs (type de leçon invalide, durée non numérique, colonnes manquantes)
- **THEN** le système affiche les erreurs ligne par ligne et ne crée rien tant que les erreurs ne sont pas corrigées

#### Scenario: CSV avec sections existantes
- **WHEN** la formation a déjà des sections/leçons
- **THEN** les nouvelles sections/leçons du CSV sont ajoutées après les existantes (pas de remplacement)

### Requirement: System SHALL provide CSV import API endpoint
Le système DOIT exposer un endpoint `POST /api/instructeur/formations/[id]/import-csv` qui accepte un fichier CSV et crée le curriculum.

#### Scenario: API import CSV
- **WHEN** un fichier CSV est envoyé en multipart/form-data
- **THEN** le système parse le CSV avec papaparse, valide chaque ligne, crée les sections et leçons dans une transaction Prisma, et retourne le nombre de sections/leçons créées

#### Scenario: Vérification d'autorisation
- **WHEN** un non-propriétaire de la formation appelle l'endpoint
- **THEN** le système retourne une erreur 403

### Requirement: System SHALL provide CSV template download
Le système DOIT permettre le téléchargement d'un fichier CSV modèle vide avec les en-têtes corrects.

#### Scenario: Téléchargement du modèle
- **WHEN** l'instructeur clique sur "Télécharger le modèle CSV"
- **THEN** un fichier CSV est téléchargé avec les colonnes : sectionTitle, lessonTitle, lessonType, duration, videoUrl, pdfUrl, audioUrl, isFree et une ligne d'exemple
