## ADDED Requirements

### Requirement: Aucune donnée démo hardcodée dans le dashboard freelance
Les pages du dashboard freelance SHALL charger les données via des appels API. Les tableaux `DEMO_*` MUST être supprimés et remplacés par des états vides quand il n'y a pas de données.

#### Scenario: Page paiements sans données
- **WHEN** un freelance accède à `/dashboard/paiements` et n'a aucune méthode de paiement ni historique
- **THEN** la page affiche un état vide "Aucune méthode de paiement" et "Aucune transaction" sans données démo

#### Scenario: Page factures sans données
- **WHEN** un freelance accède à `/dashboard/factures` et n'a aucune facture
- **THEN** la page affiche un état vide "Aucune facture" sans données démo

#### Scenario: Page litiges sans données
- **WHEN** un freelance accède à `/dashboard/litiges` et n'a aucun litige
- **THEN** la page affiche un état vide "Aucun litige" sans données démo

#### Scenario: Page propositions sans données
- **WHEN** un freelance accède à `/dashboard/propositions` et n'a aucune proposition
- **THEN** la page affiche un état vide "Aucune proposition" et "Aucun projet" sans données démo

#### Scenario: Page portefeuille web3 sans données
- **WHEN** un freelance accède à `/dashboard/portefeuille-web3` et n'a aucune transaction
- **THEN** la page affiche un état vide "Aucune transaction" sans données démo

#### Scenario: Page sécurité sans données
- **WHEN** un freelance accède à `/dashboard/securite` et n'a aucune session ni historique
- **THEN** la page affiche un état vide pour les sessions et l'historique sans données démo

### Requirement: Aucune donnée démo hardcodée dans l'espace client
Les pages de l'espace client SHALL charger les données via des appels API. Les tableaux hardcodés MUST être supprimés.

#### Scenario: Page paiements client sans données
- **WHEN** un client accède à `/client/paiements` et n'a aucune méthode de paiement sauvegardée
- **THEN** la page affiche un état vide "Aucune méthode de paiement" sans données hardcodées

### Requirement: Les pages affichent des états vides élégants
Chaque page vidée de ses données démo SHALL afficher un composant d'état vide avec un message explicatif et éventuellement un CTA.

#### Scenario: État vide avec message
- **WHEN** une page dashboard charge sans données
- **THEN** un message centré s'affiche avec une icône, un texte explicatif et un bouton d'action si pertinent
