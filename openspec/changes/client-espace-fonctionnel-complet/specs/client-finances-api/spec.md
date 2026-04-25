## ADDED Requirements

### Requirement: Payments page SHALL display real transaction history
La page `/client/paiements` SHALL charger l'historique des transactions depuis l'API avec filtres par periode et type de transaction.

#### Scenario: Affichage des transactions
- **WHEN** le client accede a `/client/paiements`
- **THEN** les transactions sont chargees depuis `GET /api/finances/transactions` et affichees avec date, montant, type et statut

#### Scenario: Conversion de devise
- **WHEN** le client change la devise selectionnee
- **THEN** tous les montants sont convertis en temps reel selon les taux definis

### Requirement: Invoices page SHALL be a full management page
La page `/client/factures` SHALL etre une page complete (et non un redirect) avec liste des factures, filtres, telechargement PDF et envoi par email.

#### Scenario: Telechargement d'une facture PDF
- **WHEN** le client clique "Telecharger" sur une facture
- **THEN** le PDF est genere via `GET /api/invoices/[id]/pdf` et telecharge

#### Scenario: Envoi de facture par email
- **WHEN** le client clique "Envoyer par email" sur une facture
- **THEN** la facture est envoyee a l'adresse email du client via l'API

#### Scenario: Filtrer les factures par periode
- **WHEN** le client selectionne "3 derniers mois"
- **THEN** seules les factures de cette periode sont affichees

#### Scenario: Export CSV
- **WHEN** le client clique "Exporter CSV"
- **THEN** un fichier CSV contenant l'historique des factures est telecharge
