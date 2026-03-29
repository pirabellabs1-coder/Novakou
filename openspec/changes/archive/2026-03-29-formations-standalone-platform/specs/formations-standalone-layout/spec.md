## ADDED Requirements

### Requirement: Layout formations autonome isolé de FreelanceHigh
Le système DOIT fournir un layout racine `app/formations/layout.tsx` qui remplace complètement le layout FreelanceHigh. Quand un utilisateur navigue sur `/formations/*`, il NE DOIT voir aucun élément de navigation FreelanceHigh (navbar, footer, sidebar FreelanceHigh).

#### Scenario: Utilisateur clique sur "Formations" dans le menu FreelanceHigh
- **WHEN** un utilisateur clique sur le lien "Formations" dans la navbar FreelanceHigh
- **THEN** il est redirigé vers `/formations` et voit uniquement le header formations avec les menus spécifiques formations — aucun menu FreelanceHigh n'est visible

#### Scenario: Navigation directe vers une URL formations
- **WHEN** un utilisateur accède directement à `/formations/explorer`
- **THEN** la page s'affiche avec le layout formations autonome (header formations + footer formations), sans aucun élément FreelanceHigh

### Requirement: Header formations public avec menus spécifiques
Le layout formations public DOIT afficher un header avec : logo "FreelanceHigh Formations" (ou icône GraduationCap + texte), liens de navigation (Accueil, Explorer, Catégories, Devenir Instructeur), sélecteur de langue (FR/EN), sélecteur de devise, et boutons Connexion/Inscription si non connecté.

#### Scenario: Visiteur non connecté voit le header public formations
- **WHEN** un visiteur non connecté accède à `/formations`
- **THEN** le header affiche : logo formations, menus (Accueil, Explorer, Catégories, Devenir Instructeur), sélecteur langue, boutons "Connexion" et "Inscription"

#### Scenario: Utilisateur connecté comme apprenant voit son avatar
- **WHEN** un apprenant connecté accède à `/formations`
- **THEN** le header affiche : logo formations, menus publics, avatar/nom de l'utilisateur avec dropdown (Mes Formations, Certificats, Paramètres, Déconnexion)

### Requirement: Lien retour vers FreelanceHigh
Le header formations DOIT contenir un lien discret "← Retour à FreelanceHigh" ou une icône avec tooltip permettant de retourner sur la plateforme FreelanceHigh principale.

#### Scenario: Utilisateur veut retourner à FreelanceHigh
- **WHEN** un utilisateur clique sur "← Retour à FreelanceHigh" dans le header formations
- **THEN** il est redirigé vers la page d'accueil de FreelanceHigh `/` avec la navbar FreelanceHigh habituelle

### Requirement: Footer formations dédié
Le layout formations DOIT avoir son propre footer avec des liens spécifiques aux formations (Aide, FAQ Formations, Devenir Instructeur, CGU, Contact) et les mêmes couleurs que FreelanceHigh.

#### Scenario: Footer formations visible sur toutes les pages formations publiques
- **WHEN** un utilisateur est sur une page publique formations (`/formations`, `/formations/explorer`, etc.)
- **THEN** le footer formations s'affiche avec les liens spécifiques formations et la charte graphique FreelanceHigh

### Requirement: Charte graphique identique à FreelanceHigh
Le layout formations DOIT utiliser exactement les mêmes couleurs (violet `#6C2BD9`, bleu `#0EA5E9`, vert `#10B981`), la même typographie, et les mêmes composants shadcn/ui que la plateforme FreelanceHigh principale.

#### Scenario: Cohérence visuelle entre FreelanceHigh et Formations
- **WHEN** un utilisateur passe de FreelanceHigh à la plateforme formations
- **THEN** les couleurs, polices, boutons, cards et composants UI sont visuellement identiques — seule la navigation change

### Requirement: Responsive mobile du layout formations
Le layout formations DOIT être responsive avec un menu hamburger sur mobile qui affiche les menus formations (pas les menus FreelanceHigh).

#### Scenario: Utilisateur sur mobile ouvre le menu hamburger formations
- **WHEN** un utilisateur sur mobile (< 768px) clique sur le menu hamburger sur `/formations`
- **THEN** un menu mobile s'ouvre avec uniquement les liens formations (Accueil, Explorer, Catégories, Devenir Instructeur, Connexion/Inscription)
