## ADDED Requirements

### Requirement: L'agence DOIT voir la liste de ses litiges
Le systeme SHALL afficher a `/agence/litiges` la liste des litiges avec statut (ouvert/en cours/resolu), commande concernee, montant en jeu et date d'ouverture.

#### Scenario: Affichage des litiges
- **WHEN** l'utilisateur navigue vers `/agence/litiges`
- **THEN** la liste des litiges est affichee avec filtres par statut

#### Scenario: Aucun litige
- **WHEN** l'agence n'a aucun litige
- **THEN** un message "Aucun litige" est affiche avec une icone

### Requirement: L'agence DOIT voir le detail d'un litige
Le systeme SHALL afficher le detail d'un litige avec la timeline des echanges, les pieces jointes, le verdict (si rendu) et les actions disponibles.

#### Scenario: Consultation du detail
- **WHEN** l'utilisateur clique sur un litige dans la liste
- **THEN** le detail s'affiche avec la timeline chronologique des messages et pieces jointes

### Requirement: L'agence DOIT pouvoir repondre a un litige
Le systeme SHALL permettre a l'agence d'envoyer une reponse avec message et pieces jointes dans le cadre d'un litige.

#### Scenario: Envoi d'une reponse
- **WHEN** l'utilisateur redige une reponse et clique sur "Envoyer"
- **THEN** la reponse est ajoutee a la timeline et un toast de confirmation s'affiche
