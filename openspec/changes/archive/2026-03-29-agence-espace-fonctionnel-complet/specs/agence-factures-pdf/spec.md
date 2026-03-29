## ADDED Requirements

### Requirement: Agency invoices SHALL be generated automatically for completed orders
Le systeme MUST generer automatiquement une facture pour chaque commande terminee et payee de l'agence. La liste des factures (`/agence/factures`) MUST afficher : numero de facture (auto-incremente FH-2026-XXXX), client, date, montant, statut (payee/en attente). Des filtres MUST permettre de filtrer par statut. Un export CSV de la liste complete MUST etre fonctionnel.

#### Scenario: Liste des factures depuis API
- **WHEN** un utilisateur agence accede a `/agence/factures`
- **THEN** la liste affiche les factures reelles depuis l'API
- **THEN** un nouvel utilisateur voit une liste vide

#### Scenario: Filtres par statut
- **WHEN** un utilisateur filtre par "Payees"
- **THEN** seules les factures payees sont affichees

### Requirement: Agency invoices SHALL contain complete professional information
Chaque facture MUST contenir : en-tete (logo FreelanceHigh, numero facture FH-2026-XXXX, date emission, date echeance), informations agence (nom, adresse, email, SIRET si renseigne), informations client (nom/entreprise, email, pays), detail service (description, forfait commande, options supplementaires, montant HT, TVA si applicable, montant TTC, commission FreelanceHigh, net a recevoir), pied de page (conditions de paiement, mentions legales, "Facture generee par FreelanceHigh").

#### Scenario: Contenu complet de la facture
- **WHEN** un utilisateur previsualise une facture
- **THEN** toutes les sections sont presentes avec les informations reelles depuis la DB

### Requirement: Agency invoices SHALL support PDF download and email sending
Chaque facture MUST avoir 4 actions fonctionnelles : telecharger PDF (genere dynamiquement via @react-pdf/renderer), envoyer par email au client (via Resend), previsualiser, imprimer. La route API `/api/invoices/[id]/pdf` MUST generer un PDF professionnel avec le logo et les couleurs FreelanceHigh.

#### Scenario: Telechargement PDF instantane
- **WHEN** un utilisateur clique "Telecharger PDF" sur une facture
- **THEN** un PDF professionnel est genere et telecharge immediatement

#### Scenario: Envoi par email
- **WHEN** un utilisateur clique "Envoyer par email" sur une facture
- **THEN** un email avec le PDF en piece jointe est envoye au client via Resend

#### Scenario: Previsualisation
- **WHEN** un utilisateur clique "Previsualiser"
- **THEN** la facture s'affiche dans un modal ou une page dediee avec le rendu final
