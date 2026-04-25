## ADDED Requirements

### Requirement: Logging structuré des appels Moneroo
Le système SHALL logger chaque appel à `initPayout()` avec les informations suivantes : montant, devise, méthode de paiement, identifiant du retrait. En cas d'échec, le log MUST inclure le message d'erreur Moneroo complet.

#### Scenario: Log d'un appel payout réussi
- **WHEN** `initPayout()` est appelé et Moneroo accepte l'initiation
- **THEN** un log structuré est émis avec `[moneroo:payout] id=W-xxx amount=5000 currency=XOF method=wave_ci status=initiated`

#### Scenario: Log d'un appel payout échoué
- **WHEN** `initPayout()` est appelé et Moneroo renvoie une erreur
- **THEN** un log structuré est émis avec `[moneroo:payout:error] id=W-xxx amount=5000 currency=XOF method=wave_ci error="insufficient funds"`

### Requirement: Message d'erreur explicite pour l'admin
Quand Moneroo échoue, l'interface admin MUST afficher un message d'erreur qui distingue les causes possibles : (1) float Moneroo insuffisant, (2) numéro de téléphone invalide, (3) erreur réseau/timeout. Le message MUST inclure une recommandation d'action.

#### Scenario: Erreur "insufficient funds"
- **WHEN** Moneroo renvoie une erreur contenant "insufficient" ou "balance"
- **THEN** l'admin voit : "Le solde de votre compte Moneroo est insuffisant pour effectuer ce virement. Rechargez votre compte Moneroo puis relancez."

#### Scenario: Erreur de validation
- **WHEN** Moneroo renvoie une erreur de validation (numéro invalide, etc.)
- **THEN** l'admin voit le message Moneroo original avec une note : "Vérifiez les informations du bénéficiaire."
