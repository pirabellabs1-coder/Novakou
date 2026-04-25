## ADDED Requirements

### Requirement: Page de connexion dédiée formations
Le système DOIT fournir une page de connexion à `/connexion` avec le layout formations (header formations, pas de navbar FreelanceHigh). Le formulaire DOIT utiliser Supabase Auth pour l'authentification (email + mot de passe, OAuth Google/LinkedIn).

#### Scenario: Apprenant se connecte via la page formations
- **WHEN** un utilisateur accède à `/connexion` et saisit ses identifiants
- **THEN** il est authentifié via Supabase Auth et redirigé vers `/mes-formations` s'il est apprenant, ou `/instructeur/dashboard` s'il est instructeur

#### Scenario: Page de connexion formations affiche le layout formations
- **WHEN** un utilisateur accède à `/connexion`
- **THEN** il voit le header formations (logo + menus formations), le formulaire de connexion, et aucun élément de la navbar FreelanceHigh

#### Scenario: Utilisateur déjà connecté sur FreelanceHigh accède aux formations
- **WHEN** un utilisateur déjà connecté sur FreelanceHigh clique sur "Formations"
- **THEN** il est automatiquement reconnu comme connecté sur les formations (même session Supabase) et voit les menus appropriés selon son rôle formations

### Requirement: Page d'inscription dédiée formations
Le système DOIT fournir une page d'inscription à `/inscription` avec le layout formations. Le formulaire DOIT demander : email, mot de passe, nom complet, et choix du rôle (Apprenant ou Instructeur).

#### Scenario: Nouvel utilisateur s'inscrit comme apprenant
- **WHEN** un visiteur accède à `/inscription`, remplit le formulaire et choisit "Apprenant"
- **THEN** un compte Supabase est créé, un email de vérification OTP est envoyé, et après vérification l'utilisateur est redirigé vers `/mes-formations`

#### Scenario: Nouvel utilisateur s'inscrit comme instructeur
- **WHEN** un visiteur accède à `/inscription`, remplit le formulaire et choisit "Instructeur"
- **THEN** un compte Supabase est créé avec le rôle instructeur, un email de vérification OTP est envoyé, et après vérification l'utilisateur est redirigé vers `/devenir-instructeur` pour soumettre sa candidature

#### Scenario: Utilisateur FreelanceHigh existant accède à l'inscription formations
- **WHEN** un utilisateur déjà inscrit sur FreelanceHigh accède à `/inscription`
- **THEN** le système détecte la session existante et propose de lier son compte aux formations en choisissant un rôle formations (Apprenant/Instructeur), sans créer de nouveau compte

### Requirement: Redirection post-auth vers le bon espace formations
Après connexion ou inscription, le système DOIT rediriger l'utilisateur vers son espace formations approprié selon son rôle formations, pas vers un espace FreelanceHigh.

#### Scenario: Redirection apprenant après connexion
- **WHEN** un apprenant se connecte via `/connexion`
- **THEN** il est redirigé vers `/mes-formations`

#### Scenario: Redirection instructeur après connexion
- **WHEN** un instructeur se connecte via `/connexion`
- **THEN** il est redirigé vers `/instructeur/dashboard`

### Requirement: Protection des routes formations authentifiées
Le middleware Next.js DOIT protéger les routes `(apprenant)/*` et `(instructeur)/*` sous `/`. Un utilisateur non connecté qui tente d'accéder à ces routes DOIT être redirigé vers `/connexion`.

#### Scenario: Visiteur non connecté tente d'accéder à l'espace apprenant
- **WHEN** un visiteur non connecté accède à `/mes-formations`
- **THEN** il est redirigé vers `/connexion` avec un paramètre `redirect` pour revenir après connexion

#### Scenario: Apprenant tente d'accéder à l'espace instructeur
- **WHEN** un apprenant connecté accède à `/instructeur/dashboard`
- **THEN** il est redirigé vers `/mes-formations` avec un message d'erreur indiquant qu'il n'a pas les permissions
