## ADDED Requirements

### Requirement: Agency finances dashboard SHALL display real financial data from API
Le dashboard finances (`/agence/finances`) MUST afficher 4 metriques calculees depuis l'API `/api/finances/summary` : solde disponible (retraits possibles), en attente (commandes non validees), CA total historique, commission prelevee ce mois. Toutes les valeurs MUST provenir de la DB.

#### Scenario: Metriques financieres depuis API
- **WHEN** un utilisateur agence accede a `/agence/finances`
- **THEN** les 4 metriques affichent des valeurs calculees depuis l'API
- **THEN** un nouvel utilisateur voit toutes les valeurs a 0.00 EUR

### Requirement: Agency finances SHALL display functional revenue chart
Le graphique de revenus MUST etre un BarChart recharts affichant les 12 derniers mois. Les filtres de periode MUST etre fonctionnels. Une comparaison avec la periode precedente MUST etre affichee.

#### Scenario: Graphique revenus avec donnees reelles
- **WHEN** un utilisateur agence a des commandes payees
- **THEN** le graphique affiche les revenus par mois avec des donnees reelles depuis l'API

#### Scenario: Filtres periode
- **WHEN** un utilisateur selectionne un filtre temporel
- **THEN** le graphique se met a jour avec les donnees de la periode selectionnee

### Requirement: Agency finances SHALL support withdrawal requests
Le systeme MUST permettre de demander un retrait avec un montant minimum de 20 EUR. Les methodes de retrait MUST inclure : virement SEPA, PayPal, Wave, Orange Money, MTN Mobile Money. Une confirmation par email MUST etre envoyee via Resend. L'historique des retraits MUST etre sauvegarde en DB.

#### Scenario: Demande de retrait
- **WHEN** un utilisateur demande un retrait de 50 EUR vers PayPal
- **THEN** la demande est creee via l'API `/api/finances/withdrawal`
- **THEN** un email de confirmation est envoye
- **THEN** le retrait apparait dans l'historique avec le statut "en cours"

#### Scenario: Montant minimum
- **WHEN** un utilisateur tente de retirer moins de 20 EUR
- **THEN** un message d'erreur indique que le montant minimum est de 20 EUR

### Requirement: Agency finances SHALL display transaction history with CSV export
L'historique des transactions MUST afficher toutes les transactions reelles : type, montant, commission, montant net, date, statut. Un bouton export CSV MUST telecharger un fichier CSV de toutes les transactions filtrees.

#### Scenario: Historique des transactions
- **WHEN** un utilisateur consulte l'historique des transactions
- **THEN** toutes les transactions reelles sont affichees depuis l'API `/api/finances/transactions`

#### Scenario: Export CSV
- **WHEN** un utilisateur clique sur "Export CSV"
- **THEN** un fichier CSV contenant toutes les transactions est telecharge
