## ADDED Requirements

### Requirement: Team invite SHALL show success feedback and new member in list
Apres l'invitation d'un collaborateur, la page MUST afficher un toast de confirmation et le nouveau membre MUST apparaitre dans la liste avec le statut "En attente".

#### Scenario: Invite success with toast and list update
- **WHEN** l'admin invite un collaborateur avec email, nom et role
- **THEN** un toast vert affiche "Invitation envoyee a [nom]" ET le membre apparait dans la liste avec statut "En attente"

#### Scenario: Invite with email sending status
- **WHEN** l'admin invite un collaborateur et l'email est envoye
- **THEN** l'API retourne `{ success: true, emailSent: true }` et le toast inclut "Email d'invitation envoye"

#### Scenario: Invite with email failure
- **WHEN** l'admin invite un collaborateur mais l'email echoue
- **THEN** le membre est quand meme ajoute avec statut "En attente" ET un toast orange affiche "Membre ajoute — email non envoye"

### Requirement: Team invite email SHALL be awaited not fire-and-forget
L'API POST `/api/admin/team` MUST attendre (await) l'envoi de l'email d'invitation et retourner le statut d'envoi dans la reponse.

#### Scenario: Email awaited before response
- **WHEN** l'API traite une invitation
- **THEN** l'envoi de l'email est await avant de retourner la reponse, et `emailSent: true/false` est inclus
