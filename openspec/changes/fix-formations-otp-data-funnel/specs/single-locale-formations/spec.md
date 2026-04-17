## ADDED Requirements

### Requirement: Formation content SHALL be created in a single language
Le système DOIT permettre à l'instructeur de créer une formation dans une seule langue (sa langue active). Les formulaires NE DOIVENT PAS afficher de champs doubles FR/EN côte à côte.

#### Scenario: Instructeur crée une formation en français
- **WHEN** un instructeur francophone accède au wizard de création de formation
- **THEN** tous les champs (titre, description courte, description, points d'apprentissage, prérequis, public cible) DOIVENT être des champs simples sans label "FR" ou "EN"

#### Scenario: Instructeur anglophone crée une formation
- **WHEN** un instructeur avec locale "en" crée une formation
- **THEN** les labels des champs DOIVENT être en anglais et la formation sera stockée avec `locale: "en"`

### Requirement: Formation categories SHALL have a single name field
Les catégories de formation DOIVENT avoir un seul champ `name` au lieu de `nameFr`/`nameEn`. L'admin gère un nom unique par catégorie.

#### Scenario: Admin crée une catégorie
- **WHEN** l'admin crée une catégorie dans le panneau d'administration
- **THEN** le formulaire DOIT afficher un seul champ "Nom" sans distinction FR/EN

#### Scenario: Catégories affichées dans le formulaire de création
- **WHEN** l'instructeur ouvre le dropdown de catégorie dans le wizard de création
- **THEN** les catégories DOIVENT être affichées avec leur nom unique

### Requirement: Formation sections and lessons SHALL use single title
Les sections et leçons du curriculum DOIVENT avoir un seul champ `title` au lieu de `titleFr`/`titleEn`.

#### Scenario: Instructeur ajoute une section au curriculum
- **WHEN** l'instructeur ajoute une nouvelle section dans l'étape 4 du wizard
- **THEN** un seul champ "Titre de la section" DOIT être affiché

#### Scenario: Instructeur ajoute une leçon
- **WHEN** l'instructeur ajoute une leçon à une section
- **THEN** un seul champ "Titre de la leçon" DOIT être affiché

### Requirement: Quiz questions SHALL use single language
Les questions de quiz DOIVENT avoir un seul champ `text` et des options simples au lieu de paires FR/EN.

#### Scenario: Instructeur crée un quiz
- **WHEN** l'instructeur crée une question de quiz dans une leçon
- **THEN** le formulaire DOIT afficher un seul champ pour la question et un seul champ par option de réponse

### Requirement: Category dropdown SHALL show all seeded categories with "Other" option
Le dropdown de catégorie dans le wizard de création DOIT afficher toutes les catégories seedées ET une option "Autre" pour saisie libre.

#### Scenario: Catégories seedées visibles
- **WHEN** l'instructeur ouvre le dropdown de catégorie
- **THEN** les 12 catégories seedées DOIVENT être visibles avec leur icône

#### Scenario: Instructeur choisit "Autre"
- **WHEN** l'instructeur sélectionne l'option "Autre" dans le dropdown
- **THEN** un champ texte DOIT apparaître pour saisir le nom de sa catégorie personnalisée

### Requirement: Popups and modals SHALL NOT show dual language labels
Tous les popups, modales et dialogues de la section formations NE DOIVENT PAS afficher de labels "Français" et "Anglais" côte à côte.

#### Scenario: Popup de confirmation de publication
- **WHEN** l'instructeur publie une formation
- **THEN** le popup de confirmation DOIT être affiché dans la langue active sans mention "FR / EN"

### Requirement: OTP SHALL be verified before onboarding in main registration
La vérification OTP DOIT se faire immédiatement après la saisie du mot de passe (étape 0), AVANT les étapes d'onboarding (étapes 1-3), pour tous les rôles (Freelance, Client, Agence).

#### Scenario: Inscription Freelance avec OTP avant onboarding
- **WHEN** un freelance remplit email, mot de passe et clique sur "S'inscrire" à l'étape 0
- **THEN** le compte DOIT être créé, un code OTP DOIT être envoyé par email, et l'écran OTP DOIT s'afficher inline dans le wizard AVANT l'étape 1 (Profil)

#### Scenario: Inscription Client avec OTP
- **WHEN** un client soumet l'étape 0
- **THEN** le même flux OTP DOIT s'appliquer avant l'étape 1 (Entreprise)

#### Scenario: Inscription Agence avec OTP
- **WHEN** une agence soumet l'étape 0
- **THEN** le même flux OTP DOIT s'appliquer avant l'étape 1 (Agence)

#### Scenario: OTP invalide
- **WHEN** l'utilisateur saisit un code OTP incorrect
- **THEN** un message d'erreur DOIT s'afficher et l'utilisateur DOIT pouvoir ressaisir ou renvoyer le code

#### Scenario: Renvoi de code OTP
- **WHEN** l'utilisateur clique sur "Renvoyer le code"
- **THEN** un nouveau code DOIT être envoyé et le timer DOIT se réinitialiser

### Requirement: All formation statistics SHALL use real data only
Toutes les statistiques des formations (dashboard instructeur, marketing admin, landing page formations) DOIVENT afficher des données réelles provenant de la base de données. Aucune donnée démo ou hardcodée NE DOIT être visible.

#### Scenario: Nouvel instructeur voit son dashboard
- **WHEN** un instructeur qui vient de s'inscrire accède à son dashboard
- **THEN** tous les compteurs (revenus, apprenants, formations) DOIVENT afficher 0

#### Scenario: Landing page formations affiche les vraies stats
- **WHEN** un visiteur accède à la page `/`
- **THEN** les compteurs (apprenants, formations, instructeurs, satisfaction) DOIVENT refléter les données réelles de la base

#### Scenario: Marketing admin sans données
- **WHEN** l'admin accède au marketing dashboard sans promotions actives
- **THEN** les compteurs DOIVENT afficher 0 et non des valeurs de démonstration

### Requirement: Prisma schema SHALL use single locale columns for formations
Le schéma Prisma DOIT utiliser des colonnes uniques (`title`, `shortDesc`, `description`, etc.) avec une colonne `locale` au lieu des paires `*Fr`/`*En`.

#### Scenario: Migration du schéma
- **WHEN** la migration Prisma est exécutée
- **THEN** les colonnes `titleFr`/`titleEn` DOIVENT être remplacées par `title` + `locale` sur Formation, et les données FR existantes DOIVENT être préservées dans les nouvelles colonnes
