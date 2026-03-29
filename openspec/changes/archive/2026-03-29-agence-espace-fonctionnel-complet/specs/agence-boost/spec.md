## ADDED Requirements

### Requirement: Agency boost page SHALL offer 3 boost options identical to freelance
La page boost (`/agence/boost` ou `/agence/services/boost`) MUST offrir 3 options de boost : Standard (9,99 EUR / 3 jours), Premium (24,99 EUR / 7 jours), Ultime (79,99 EUR / 30 jours). Le paiement MUST se faire via Stripe. Apres paiement, le service MUST etre flag "boosted" en DB et l'algorithme de feed MUST lui donner la priorite.

#### Scenario: Selection et paiement d'un boost
- **WHEN** un utilisateur selectionne un service et un niveau de boost et paie via Stripe
- **THEN** le boost est active immediatement via l'API `/api/services/[id]/boost`
- **THEN** un badge "Sponsorise" apparait sur le service dans le feed

#### Scenario: Compteur de boost actif
- **WHEN** un service a un boost actif
- **THEN** un compteur affiche "Boost actif encore X jours"

### Requirement: Agency boost page SHALL display boost statistics
La page MUST afficher les statistiques de chaque boost : vues generees, clics generes, commandes depuis le boost, ROI calcule (revenus generes / cout du boost). L'historique de tous les boosts passes MUST etre affiche.

#### Scenario: Statistiques de boost
- **WHEN** un utilisateur consulte les statistiques d'un boost
- **THEN** les metriques (vues, clics, commandes, ROI) sont affichees depuis l'API

#### Scenario: Historique des boosts
- **WHEN** un utilisateur consulte l'historique
- **THEN** tous les boosts passes sont listes avec leurs dates, cout, et performance
