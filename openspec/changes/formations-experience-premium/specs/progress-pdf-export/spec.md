## ADDED Requirements

### Requirement: Instructor SHALL export student progress as PDF
L'instructeur DOIT pouvoir exporter un rapport PDF de progression des étudiants pour chaque formation, contenant les statistiques globales et le détail par étudiant.

#### Scenario: Export PDF depuis la page statistiques formation
- **WHEN** l'instructeur clique sur "Exporter en PDF" sur la page stats d'une formation
- **THEN** le système génère et télécharge un PDF contenant : titre de la formation, nombre d'étudiants, taux de complétion, revenu net, tableau des étudiants (nom, progression %, score quiz, date inscription, date complétion)

#### Scenario: Formation sans étudiants
- **WHEN** la formation n'a aucun étudiant inscrit
- **THEN** le PDF est généré avec un message "Aucun étudiant inscrit" et les stats à zéro

### Requirement: Student SHALL export own progress report as PDF
L'apprenant DOIT pouvoir exporter son propre rapport de progression au format PDF depuis la page "Mes formations".

#### Scenario: Export PDF de progression personnelle
- **WHEN** l'apprenant clique sur "Télécharger mon rapport" sur une formation
- **THEN** le système génère un PDF contenant : titre de la formation, progression globale, leçons complétées vs total, scores des quiz, date d'inscription, certificat obtenu (oui/non), notes personnelles

### Requirement: System SHALL provide PDF export API endpoints
Le système DOIT exposer deux endpoints d'export PDF qui génèrent les rapports via jsPDF.

#### Scenario: API export instructeur
- **WHEN** GET `/api/instructeur/formations/[id]/export/progress-pdf` est appelé par l'instructeur propriétaire
- **THEN** le système retourne un fichier PDF `application/pdf` avec les données de progression de tous les étudiants

#### Scenario: API export apprenant
- **WHEN** GET `/api/apprenant/enrollments/[id]/export/progress-pdf` est appelé par l'apprenant inscrit
- **THEN** le système retourne un fichier PDF avec les données de progression personnelles de l'apprenant
