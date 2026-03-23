## ADDED Requirements

### Requirement: Les services actifs DOIVENT être visibles dans la marketplace
Le système SHALL retourner tous les services avec le status `ACTIF` lorsque la marketplace publique est consultée. La requête Prisma sur `/api/public/services` MUST utiliser les noms de champs corrects du schéma (`sortOrder` au lieu de `order` pour `ServiceMedia`).

#### Scenario: Consultation de la marketplace services
- **WHEN** un utilisateur (connecté ou non) accède à `/explorer`
- **THEN** le système affiche tous les services avec `status: "ACTIF"` incluant titre, prix, image principale, note, et nom du freelance

#### Scenario: Consultation du détail d'un service
- **WHEN** un utilisateur accède à `/services/[slug]`
- **THEN** le système retourne le service complet avec ses médias triés par `sortOrder` ASC, ses packages, FAQ, extras, et le profil du freelance — sans erreur Prisma

#### Scenario: Service en attente non visible
- **WHEN** un freelance crée un service (status `EN_ATTENTE`)
- **THEN** ce service n'apparaît PAS dans la marketplace publique mais apparaît dans son dashboard avec le statut "En attente"

### Requirement: Les projets ouverts DOIVENT être visibles dans l'explorateur de projets
Le système SHALL retourner tous les projets avec le status `ouvert` lorsque l'explorateur de projets publics est consulté via `/api/public/projects`.

#### Scenario: Consultation de la marketplace projets
- **WHEN** un utilisateur accède à `/offres-projets`
- **THEN** le système affiche tous les projets avec `status: "ouvert"` incluant titre, budget (min/max), deadline, compétences requises, et nombre de candidatures

#### Scenario: Projet fermé non visible
- **WHEN** un client marque un projet comme "pourvu" ou "fermé"
- **THEN** ce projet n'apparaît plus dans la marketplace publique

### Requirement: Le budget des projets MUST être affiché correctement
Le mapping entre les champs `budgetMin`/`budgetMax` de la base de données et l'affichage frontend MUST être cohérent. L'API SHALL retourner `budgetMin` et `budgetMax` comme champs séparés, et le frontend MUST les mapper correctement.

#### Scenario: Affichage du budget dans la liste des projets
- **WHEN** un projet est affiché dans la marketplace ou dans le dashboard client
- **THEN** le budget affiche les valeurs réelles `budgetMin` et `budgetMax` (pas €0 - €0)

#### Scenario: Création de projet avec budget
- **WHEN** un client crée un projet avec un budget min de 500€ et max de 2000€
- **THEN** les valeurs sont stockées dans `budgetMin: 500` et `budgetMax: 2000` et affichées correctement partout
