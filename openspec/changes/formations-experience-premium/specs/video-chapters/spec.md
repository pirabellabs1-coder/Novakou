## ADDED Requirements

### Requirement: Instructor SHALL define chapters for video lessons
L'instructeur DOIT pouvoir définir des marqueurs de chapitres (titre + timestamp en secondes) pour chaque leçon de type VIDEO dans le wizard de création.

#### Scenario: Ajout de chapitres
- **WHEN** l'instructeur édite une leçon de type VIDEO dans le wizard
- **THEN** il voit une section "Chapitres" avec un formulaire pour ajouter des entrées (titre du chapitre + timestamp mm:ss)

#### Scenario: Chapitres masqués pour les non-vidéo
- **WHEN** le type de la leçon est PDF, TEXTE, AUDIO ou QUIZ
- **THEN** la section "Chapitres" n'est pas affichée

#### Scenario: Validation du timestamp
- **WHEN** l'instructeur entre un timestamp supérieur à la durée de la leçon
- **THEN** le système affiche un avertissement visuel (pas bloquant car la durée peut être approximative)

### Requirement: Player SHALL display chapter navigation
Le player de cours DOIT afficher la liste des chapitres d'une leçon vidéo et permettre la navigation par clic.

#### Scenario: Affichage des chapitres dans le player
- **WHEN** l'apprenant ouvre une leçon vidéo qui a des chapitres définis
- **THEN** une liste de chapitres s'affiche sous la vidéo avec titre et timestamp formaté (mm:ss)

#### Scenario: Navigation par chapitre
- **WHEN** l'apprenant clique sur un chapitre dans la liste
- **THEN** la vidéo saute au timestamp du chapitre

#### Scenario: Chapitre actif mis en surbrillance
- **WHEN** la vidéo joue et le timestamp courant correspond à un chapitre
- **THEN** le chapitre actif est visuellement mis en surbrillance dans la liste

### Requirement: System SHALL store chapters as JSON on Lesson model
Le modèle Lesson DOIT avoir un champ `chapters Json?` stockant un tableau de `{ title: string, timestamp: number }`.

#### Scenario: Sauvegarde des chapitres
- **WHEN** l'instructeur sauvegarde une leçon avec des chapitres
- **THEN** les chapitres sont sérialisés en JSON et stockés dans le champ `chapters` de la leçon
