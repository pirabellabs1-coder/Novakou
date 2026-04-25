## ADDED Requirements

### Requirement: Libération automatique des fonds sur échec Moneroo
Quand `initPayout()` lève une exception lors de l'approbation admin d'un retrait, le système SHALL mettre le retrait en statut `REFUSE` avec le message d'erreur dans `refusedReason`. Le solde disponible du vendeur MUST être automatiquement recalculé pour exclure ce retrait refusé.

#### Scenario: Moneroo renvoie "insufficient funds"
- **WHEN** l'admin approuve un retrait et que Moneroo renvoie une erreur "insufficient funds"
- **THEN** le retrait passe en statut `REFUSE`, le `refusedReason` contient le message Moneroo, et le solde du vendeur redevient disponible

#### Scenario: Moneroo timeout ou erreur réseau
- **WHEN** l'admin approuve un retrait et que l'appel Moneroo échoue par timeout
- **THEN** le retrait passe en statut `REFUSE` avec le message d'erreur, les fonds sont débloqués

### Requirement: Bouton Relancer dans l'interface admin
L'interface admin des retraits SHALL afficher un bouton "Relancer" sur les retraits en statut `REFUSE` qui ont un `errorMessage`. Ce bouton MUST remettre le retrait en `EN_ATTENTE` et relancer l'appel `initPayout()` via l'API.

#### Scenario: Admin relance un retrait échoué
- **WHEN** l'admin clique "Relancer" sur un retrait refusé
- **THEN** le retrait repasse en `EN_ATTENTE`, l'appel Moneroo est relancé, et en cas de succès le status passe selon le webhook

#### Scenario: Limite de relances atteinte
- **WHEN** un retrait a déjà été relancé 3 fois
- **THEN** le bouton "Relancer" est désactivé et un message indique "Contactez le support Moneroo"

### Requirement: Bouton Refuser manuellement dans l'interface admin
L'interface admin SHALL afficher un bouton "Refuser" sur les retraits en statut `EN_ATTENTE` pour permettre à l'admin de refuser un retrait sans appeler Moneroo, en libérant les fonds du vendeur.

#### Scenario: Admin refuse manuellement un retrait
- **WHEN** l'admin clique "Refuser" sur un retrait en attente
- **THEN** le retrait passe en statut `REFUSE`, le solde du vendeur est débloqué, et un motif de refus est enregistré
