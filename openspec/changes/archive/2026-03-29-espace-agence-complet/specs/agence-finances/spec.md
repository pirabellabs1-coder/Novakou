## ADDED Requirements

### Requirement: Vue financière complète
La page finances SHALL afficher : CA global avec graphique mensuel, solde disponible, en attente, total gagné. Un toggle devise SHALL permettre de basculer entre EUR, FCFA, USD.

#### Scenario: Affichage financier
- **WHEN** l'utilisateur accède à `/agence/finances`
- **THEN** les KPI financiers et le graphique CA mensuel sont affichés

### Requirement: Revenus par membre
Un onglet SHALL montrer la contribution de chaque membre au CA avec : nom, CA généré, commandes complétées, commission.

#### Scenario: Affichage revenus par membre
- **WHEN** l'utilisateur clique sur l'onglet "Par membre"
- **THEN** un tableau des revenus par membre est affiché

### Requirement: Factures et historique
Un onglet SHALL lister toutes les factures avec téléchargement PDF et filtres par date/statut.

#### Scenario: Téléchargement de facture
- **WHEN** l'utilisateur clique sur "Télécharger" sur une facture
- **THEN** un toast de confirmation est affiché (simulation)

### Requirement: Demande de retrait
Un bouton SHALL permettre de demander un retrait avec choix de la méthode (virement SEPA, Mobile Money, PayPal).

#### Scenario: Demande de retrait
- **WHEN** l'utilisateur soumet une demande de retrait
- **THEN** un toast de succès est affiché
