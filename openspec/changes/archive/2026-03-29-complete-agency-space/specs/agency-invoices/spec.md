## ADDED Requirements

### Requirement: L'agence DOIT voir la liste de ses factures
Le systeme SHALL afficher a `/agence/factures` la liste des factures avec numero, date, client, montant, statut (payee/en attente/en retard) et bouton de telechargement PDF.

#### Scenario: Affichage de la liste des factures
- **WHEN** l'utilisateur navigue vers `/agence/factures`
- **THEN** le systeme affiche la liste des factures triees par date decroissante avec filtres par statut

#### Scenario: Filtrage par statut
- **WHEN** l'utilisateur selectionne le filtre "En attente"
- **THEN** seules les factures en attente de paiement sont affichees

### Requirement: L'agence DOIT pouvoir telecharger une facture en PDF
Le systeme SHALL permettre le telechargement d'une facture au format PDF.

#### Scenario: Telechargement PDF
- **WHEN** l'utilisateur clique sur le bouton de telechargement d'une facture
- **THEN** un toast "Facture telechargee" s'affiche (simulation demo)

### Requirement: L'agence DOIT voir le CA par membre
Le systeme SHALL afficher une section recapitulative du chiffre d'affaires avec ventilation par membre de l'equipe.

#### Scenario: Affichage du CA par membre
- **WHEN** l'utilisateur consulte la page factures
- **THEN** un encart resume affiche le CA total, le nombre de factures, et la contribution de chaque membre

### Requirement: L'agence DOIT pouvoir exporter un rapport de depenses
Le systeme SHALL proposer un bouton d'export du rapport financier.

#### Scenario: Export du rapport
- **WHEN** l'utilisateur clique sur "Exporter le rapport"
- **THEN** un toast "Rapport exporte" s'affiche (simulation demo)
