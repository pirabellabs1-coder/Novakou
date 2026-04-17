## ADDED Requirements

### Requirement: Header navigation adapts to user role
The FormationsHeader SHALL display different menu items based on the authenticated user's role (apprenant, instructeur, admin, or unauthenticated).

#### Scenario: Unauthenticated user sees default navigation
- **WHEN** user is not logged in
- **THEN** the header displays "Devenir instructeur" link and "Connexion"/"Inscription" buttons

#### Scenario: Apprenant sees learner navigation
- **WHEN** user is logged in with role "apprenant" (no instructeur profile)
- **THEN** the header displays "Mes formations" → `/mes-formations`, "Panier", and hides "Devenir instructeur"

#### Scenario: Instructeur sees dashboard link
- **WHEN** user is logged in and has an instructeur profile (role instructeur OR has instructeurProfileId)
- **THEN** the header displays "Mon tableau de bord" → `/instructeur` instead of "Mes formations", hides "Devenir instructeur", and shows "Panier"

#### Scenario: Admin sees admin button plus standard navigation
- **WHEN** user is logged in with role "admin"
- **THEN** the header displays the Admin button, "Mon tableau de bord" if also instructeur, otherwise "Mes formations", and hides "Devenir instructeur"

### Requirement: Mobile menu mirrors desktop role logic
The mobile hamburger menu SHALL apply the same role-based link filtering as the desktop navigation.

#### Scenario: Mobile menu for instructeur
- **WHEN** an instructeur opens the mobile menu
- **THEN** the menu shows "Mon tableau de bord" instead of "Mes formations" and omits "Devenir instructeur"
