## ADDED Requirements

### Requirement: L'admin DOIT pouvoir créer des codes promotionnels
L'interface admin formations DOIT inclure une page de gestion des codes promo permettant de créer de nouveaux codes avec : nom du code, pourcentage de réduction, nombre maximum d'utilisations, date d'expiration, formations ciblées (optionnel), et statut actif/inactif.

#### Scenario: Création d'un code promo
- **WHEN** l'admin remplit le formulaire de création de code promo et soumet
- **THEN** le système DOIT appeler `POST /api/admin/formations/promo-codes` avec les données du formulaire et le code DOIT apparaître dans la liste des codes promo

#### Scenario: Code promo avec formations ciblées
- **WHEN** l'admin crée un code promo et sélectionne des formations spécifiques
- **THEN** le code DOIT être valide uniquement pour les formations sélectionnées (stockées dans `formationIds[]`)

### Requirement: L'admin DOIT pouvoir modifier et désactiver des codes promo
L'admin DOIT pouvoir modifier les paramètres d'un code promo existant (réduction, expiration, limite d'usage, formations ciblées) et le désactiver/réactiver.

#### Scenario: Désactivation d'un code promo
- **WHEN** l'admin clique sur "Désactiver" un code promo
- **THEN** le système DOIT appeler `PUT /api/admin/formations/promo-codes/[id]` avec `isActive: false` et le code ne DOIT plus être accepté lors du paiement

#### Scenario: Modification de la date d'expiration
- **WHEN** l'admin modifie la date d'expiration d'un code promo
- **THEN** le système DOIT mettre à jour `expiresAt` dans la base de données et les validations futures DOIVENT utiliser la nouvelle date

### Requirement: L'admin DOIT voir les statistiques d'utilisation des codes promo
La page admin codes promo DOIT afficher pour chaque code : nombre d'utilisations, limite d'utilisation, pourcentage de réduction, date d'expiration, statut, montant total de réductions accordées.

#### Scenario: Affichage des statistiques d'utilisation
- **WHEN** l'admin consulte la liste des codes promo
- **THEN** chaque code DOIT afficher `usageCount / maxUsage` utilisations, le pourcentage de réduction, et l'état (actif/expiré/épuisé)

### Requirement: L'apprenant DOIT pouvoir appliquer un code promo à l'achat
La page de paiement/checkout DOIT inclure un champ pour saisir un code promo. Le système DOIT vérifier la validité du code et appliquer la réduction avant de créer la session Stripe.

#### Scenario: Application d'un code promo valide
- **WHEN** un apprenant saisit un code promo valide sur la page de paiement
- **THEN** le système DOIT appeler `POST /api/formations/promo/validate` avec le code et l'ID de formation, afficher le prix réduit, et créer la session Stripe avec le montant réduit

#### Scenario: Code promo invalide ou expiré
- **WHEN** un apprenant saisit un code promo invalide, expiré, ou ayant atteint sa limite d'utilisation
- **THEN** le système DOIT afficher un message d'erreur clair et le prix DOIT rester inchangé

#### Scenario: Code promo non applicable à la formation
- **WHEN** un apprenant saisit un code promo qui a des `formationIds` ciblés mais la formation actuelle n'en fait pas partie
- **THEN** le système DOIT afficher "Ce code promo n'est pas valable pour cette formation"

### Requirement: L'utilisation des codes promo DOIT être comptabilisée
Chaque utilisation réussie d'un code promo DOIT incrémenter le compteur `usageCount` du code et être tracée dans la base de données.

#### Scenario: Incrémentation du compteur après achat
- **WHEN** un apprenant finalise un achat avec un code promo
- **THEN** le `usageCount` du code DOIT être incrémenté de 1 dans le webhook Stripe de confirmation de paiement
