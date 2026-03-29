## ADDED Requirements

### Requirement: L'agence DOIT voir ses favoris organises
Le systeme SHALL afficher a `/agence/favoris` les freelances, services et agences favoris organises en onglets.

#### Scenario: Affichage des favoris par onglet
- **WHEN** l'utilisateur navigue vers `/agence/favoris`
- **THEN** les favoris sont affiches dans l'onglet "Freelances" par defaut avec possibilite de basculer vers "Services" ou "Agences"

#### Scenario: Onglet vide
- **WHEN** un onglet n'a aucun favori
- **THEN** un message "Aucun favori" est affiche avec une suggestion d'exploration

### Requirement: L'agence DOIT pouvoir retirer un favori
Le systeme SHALL permettre de retirer un element des favoris via un bouton sur chaque carte.

#### Scenario: Retrait d'un favori
- **WHEN** l'utilisateur clique sur le bouton "Retirer des favoris" sur une carte
- **THEN** l'element disparait de la liste et un toast "Retire des favoris" s'affiche

### Requirement: L'agence DOIT pouvoir contacter un freelance favori
Le systeme SHALL afficher un bouton "Contacter" sur chaque carte de freelance favori.

#### Scenario: Contact d'un freelance favori
- **WHEN** l'utilisateur clique sur "Contacter" sur un freelance
- **THEN** un toast "Redirection vers la messagerie" s'affiche (simulation demo)
