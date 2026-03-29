## ADDED Requirements

### Requirement: L'API register accepte les rôles formations
Le système SHALL accepter un champ optionnel `formationsRole` avec les valeurs `"apprenant"` ou `"instructeur"` dans l'endpoint `/api/auth/register`. Quand `formationsRole` est fourni, le `role` principal MUST être automatiquement défini à `"freelance"` si non spécifié.

#### Scenario: Inscription en tant qu'apprenant formations
- **WHEN** un utilisateur soumet le formulaire d'inscription avec `formationsRole: "apprenant"` et un email/mot de passe valide
- **THEN** le système crée un compte avec `role: "freelance"` et `formationsRole: "apprenant"` et retourne un succès 201

#### Scenario: Inscription en tant qu'instructeur formations
- **WHEN** un utilisateur soumet le formulaire d'inscription avec `formationsRole: "instructeur"` et un email/mot de passe valide
- **THEN** le système crée un compte avec `role: "freelance"` et `formationsRole: "instructeur"` et retourne un succès 201

#### Scenario: Inscription classique sans formationsRole
- **WHEN** un utilisateur soumet le formulaire d'inscription avec `role: "freelance"` sans champ `formationsRole`
- **THEN** le système crée un compte avec `role: "freelance"` et `formationsRole: null` — comportement inchangé

### Requirement: Le JWT contient formationsRole
Le JWT NextAuth SHALL inclure le champ `formationsRole` quand il est défini sur le compte utilisateur. La session côté client MUST exposer `session.user.formationsRole`.

#### Scenario: JWT avec formationsRole apprenant
- **WHEN** un utilisateur avec `formationsRole: "apprenant"` se connecte
- **THEN** le JWT contient `formationsRole: "apprenant"` et `session.user.formationsRole` retourne `"apprenant"`

#### Scenario: JWT sans formationsRole
- **WHEN** un utilisateur sans formationsRole (freelance classique) se connecte
- **THEN** le JWT ne contient pas de `formationsRole` et `session.user.formationsRole` retourne `undefined`

### Requirement: La connexion formations redirige selon le rôle
La page `/formations/connexion` SHALL rediriger l'utilisateur vers l'espace correspondant à son `formationsRole` après connexion réussie.

#### Scenario: Connexion apprenant redirige vers mes-formations
- **WHEN** un apprenant se connecte via `/formations/connexion`
- **THEN** il est redirigé vers `/formations/mes-formations`

#### Scenario: Connexion instructeur redirige vers instructeur/dashboard
- **WHEN** un instructeur se connecte via `/formations/connexion`
- **THEN** il est redirigé vers `/formations/instructeur/dashboard`

#### Scenario: Connexion sans formationsRole redirige vers mes-formations par défaut
- **WHEN** un utilisateur sans `formationsRole` se connecte via `/formations/connexion`
- **THEN** il est redirigé vers `/formations/mes-formations` (espace apprenant par défaut)

### Requirement: Le middleware ne bloque pas les routes formations auth
Le middleware SHALL permettre l'accès aux pages `/formations/connexion` et `/formations/inscription` même si l'utilisateur est déjà authentifié sur la session FreelanceHigh principale.

#### Scenario: Utilisateur connecté accède à la connexion formations
- **WHEN** un utilisateur déjà connecté en tant que freelance visite `/formations/connexion`
- **THEN** la page s'affiche normalement sans redirection vers `/dashboard`

#### Scenario: Utilisateur connecté accède à l'inscription formations
- **WHEN** un utilisateur déjà connecté visite `/formations/inscription`
- **THEN** la page s'affiche normalement sans redirection

### Requirement: L'inscription formations envoie les bons champs à l'API
La page `/formations/inscription` SHALL envoyer `formationsRole` ET un `role` compatible avec le schéma Zod de l'API. Le formulaire MUST permettre de choisir entre apprenant et instructeur.

#### Scenario: Formulaire inscription formations apprenant
- **WHEN** un utilisateur remplit le formulaire d'inscription formations en choisissant "apprenant"
- **THEN** l'API reçoit `{ name, email, password, role: "freelance", formationsRole: "apprenant" }`

#### Scenario: Formulaire inscription formations instructeur
- **WHEN** un utilisateur remplit le formulaire d'inscription formations en choisissant "instructeur"
- **THEN** l'API reçoit `{ name, email, password, role: "freelance", formationsRole: "instructeur" }`

### Requirement: La page de connexion principale ne mentionne pas Afrique
La page `/connexion` SHALL utiliser un texte international sans mention géographique restrictive. Les statistiques hardcodées ("50k+ freelances actifs", "12k+ projets") MUST être retirées ou remplacées par des données dynamiques.

#### Scenario: Page de connexion sans mention Afrique
- **WHEN** un visiteur charge la page `/connexion`
- **THEN** le texte d'accroche dans le panneau gauche ne contient pas le mot "Afrique" et utilise un slogan international

### Requirement: L'inscription principale a une confirmation de mot de passe
La page `/inscription` SHALL inclure un champ "Confirmer le mot de passe" qui MUST correspondre au champ mot de passe principal avant de permettre la soumission.

#### Scenario: Mots de passe correspondants
- **WHEN** un utilisateur saisit le même mot de passe dans les deux champs
- **THEN** le formulaire se soumet normalement

#### Scenario: Mots de passe différents
- **WHEN** un utilisateur saisit des mots de passe différents dans les deux champs
- **THEN** un message d'erreur s'affiche et le formulaire ne se soumet pas
