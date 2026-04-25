## ADDED Requirements

### Requirement: Le mode vacances est visible sur le profil public
La page `/freelances/[username]` SHALL afficher un badge ou une bannière "En vacances" quand le freelance a activé le mode vacances.

#### Scenario: Freelance en mode vacances
- **WHEN** un visiteur consulte le profil public d'un freelance qui a `vacationMode: true`
- **THEN** un badge "En vacances" est affiché de manière visible près du nom ou du statut de disponibilité

#### Scenario: Freelance pas en mode vacances
- **WHEN** un visiteur consulte le profil public d'un freelance qui a `vacationMode: false`
- **THEN** aucun badge vacances n'est affiché

### Requirement: Le mode vacances est persisté via API
L'activation/désactivation du mode vacances SHALL être persistée via un appel API `PATCH /api/profile` et non uniquement dans le store Zustand local.

#### Scenario: Activation du mode vacances
- **WHEN** un freelance active le mode vacances depuis son dashboard
- **THEN** un appel `PATCH /api/profile` est envoyé avec `vacationMode: true` et le profil public reflète immédiatement le changement

#### Scenario: Désactivation du mode vacances
- **WHEN** un freelance désactive le mode vacances depuis son dashboard
- **THEN** un appel `PATCH /api/profile` est envoyé avec `vacationMode: false` et le badge disparaît du profil public
