### Requirement: Orders from service purchases
Quand un client commande un forfait de service actif, le systeme DOIT creer une commande complete avec `status: EN_ATTENTE`, `escrowStatus: HELD`, `packageType`, montant, records `Payment` et `Conversation`. De plus, le systeme DOIT calculer la commission de la plateforme selon le plan du freelance/agence et creer un `AdminTransaction`.

La commission est calculee comme suit :
- Plan Gratuit : 20% du montant
- Plan Pro : 15% du montant
- Plan Business : 10% du montant
- Plan Agence : 8% du montant

Les champs `platformFee` et `freelancerPayout` DOIVENT etre calcules et stockes sur la commande.

#### Scenario: Order creates AdminTransaction with commission
- **WHEN** a client orders a 100 EUR service from a freelancer on the Free plan
- **THEN** the system SHALL create:
  1. An `Order` with `platformFee: 20` and `freelancerPayout: 80`
  2. An `Escrow` with `amount: 100` and `status: HELD`
  3. An `AdminTransaction` with `type: SERVICE_FEE`, `amount: 20`, `status: PENDING`
  4. The `AdminWallet.totalFeesHeld` SHALL increase by 20

#### Scenario: Commission varies by freelancer plan
- **WHEN** a client orders a 200 EUR service from a Pro freelancer (15% commission)
- **THEN** the `platformFee` SHALL be 30, `freelancerPayout` SHALL be 170, and the `AdminTransaction.amount` SHALL be 30

#### Scenario: Commission on escrow release
- **WHEN** a client validates the delivery and escrow is released
- **THEN** the `AdminTransaction.status` SHALL change from `PENDING` to `CONFIRMED`, and `AdminWallet.totalFeesReleased` SHALL increase by the commission amount

### Requirement: Orders from project bid acceptance
Quand un client accepte un `ProjectBid`, le systeme DOIT auto-creer une commande avec le montant propose, `status: EN_ATTENTE`, `escrowStatus: HELD`. Le bid passe a `acceptee`, le projet a `pourvu`. La commission DOIT etre calculee selon le plan du freelance et un `AdminTransaction` cree.

#### Scenario: Bid acceptance creates order with commission
- **WHEN** a client accepts a bid of 500 EUR from a Business freelancer (10% commission)
- **THEN** the system SHALL create an order with `platformFee: 50`, `freelancerPayout: 450`, and an `AdminTransaction` with `amount: 50`, `status: PENDING`

### Requirement: Orders from custom offer acceptance
Quand un client accepte une `Offer`, le systeme DOIT auto-creer une commande avec le montant de l'offre, `status: EN_ATTENTE`, `escrowStatus: HELD`. L'offre passe a `ACCEPTE`. La commission DOIT etre calculee et un `AdminTransaction` cree.

#### Scenario: Offer acceptance creates order with commission
- **WHEN** a client accepts an offer of 150 EUR from an Agency freelancer (8% commission)
- **THEN** the system SHALL create an order with `platformFee: 12`, `freelancerPayout: 138`, and an `AdminTransaction` with `amount: 12`, `status: PENDING`

### Requirement: Orders from proposition acceptance
Quand un client accepte une `Proposition`, le systeme DOIT auto-creer une commande avec le montant de la proposition, en suivant le meme flux que les autres sources de commande.

#### Scenario: Proposition acceptance creates order
- **WHEN** a client accepts a proposition of 300 EUR from a freelancer on the Free plan
- **THEN** the system SHALL create an order with `platformFee: 60`, `freelancerPayout: 240`, `escrowStatus: HELD`, and an `AdminTransaction` with `amount: 60`, `status: PENDING`
