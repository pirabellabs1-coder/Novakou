## ADDED Requirements

### Requirement: Payments page SHALL display wallet balance and payment methods
La page `/client/paiements` SHALL combiner les maquettes `m_thodes_de_paiement_et_portefeuille` et `interface_de_paiement_et_facturation_multi_devises`. En haut : 3 cards (Solde Portefeuille: 686€ avec +5.2%, Méthodes Actives: 3, card CTA "Ajouter un moyen" en fond vert plein).

#### Scenario: Affichage des cards de solde
- **WHEN** l'utilisateur accède à `/client/paiements`
- **THEN** les 3 cards s'affichent avec le solde en EUR, le nombre de méthodes actives, et le CTA d'ajout

### Requirement: Payments SHALL list cards and bank accounts
La section "Cartes et Comptes" SHALL afficher les méthodes de paiement enregistrées : Visa Card ····4242 (badge "PAR DÉFAUT", bouton supprimer), Ecobank CI ····8812 (Compte courant, Vérifié, bouton supprimer).

#### Scenario: Affichage des cartes
- **WHEN** la section cartes se charge
- **THEN** les 2 cartes s'affichent avec numéros masqués, badges et boutons d'action

#### Scenario: Suppression d'une carte
- **WHEN** l'utilisateur clique sur l'icône supprimer d'une carte
- **THEN** un modal de confirmation s'affiche avant la suppression

### Requirement: Payments SHALL list Mobile Money methods
La section "Mobile Money" SHALL afficher en grille 2 colonnes : Orange Money (+225 07····90, bordure gauche orange `#FF7900`) et Wave CI (+225 05····12, bordure gauche bleue `#1da1f2`). Chaque méthode a un bouton menu (3 points).

#### Scenario: Affichage Mobile Money
- **WHEN** la section Mobile Money se charge
- **THEN** les 2 méthodes s'affichent avec leurs couleurs d'accent respectives (orange, bleu)

### Requirement: Payments SHALL show quick actions panel
Le panneau "Actions rapides" SHALL contenir 3 boutons avec icônes et chevron : "Lier un compte bancaire", "Recharger le solde", "Effectuer un virement". Un encart "SÉCURITÉ GARANTIE" affiche la description AES-256 et les logos partenaires (PayPal, Mastercard, Stripe) en grayscale avec hover couleur.

#### Scenario: Clic sur action rapide
- **WHEN** l'utilisateur clique sur "Recharger le solde"
- **THEN** un formulaire ou modal de rechargement s'ouvre

### Requirement: Payments SHALL display recent transactions table
La table "Activités récentes" SHALL afficher : colonnes Date, Méthode, Type, Montant. Les montants positifs en vert (+25 000 FCFA → affiché en EUR), les négatifs en rouge (-12 500 FCFA → affiché en EUR). Un lien "Voir tout le rapport" permet d'accéder à l'historique complet.

#### Scenario: Affichage des transactions
- **WHEN** la table se charge
- **THEN** 2 transactions s'affichent : rechargement Orange Money (+38,11€ en vert), achat Visa (-19,05€ en rouge)

### Requirement: Payment interface SHALL support multi-currency toggle
L'interface de paiement (accessible depuis une commande) SHALL afficher un toggle devise (FCFA, EUR, USD), les taux de change actuels, et le résumé de commande avec sous-total, frais de service 3%, TVA, et total avec équivalent dans l'autre devise.

#### Scenario: Changement de devise
- **WHEN** l'utilisateur clique sur "EUR" dans le toggle
- **THEN** tous les montants se mettent à jour en EUR et les taux de change s'affichent
