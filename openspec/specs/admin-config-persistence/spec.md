## ADDED Requirements

### Requirement: Platform configuration SHALL be persisted in database
La configuration de la plateforme (mode maintenance, commissions, devises, méthodes de paiement, plans d'abonnement, règles de modération, langues) MUST être stockée dans une table `PlatformConfig` (clé-valeur avec JSONB) dans Supabase Postgres via Prisma.

#### Scenario: Config survives server restart
- **WHEN** l'admin modifie les commissions et redémarre le serveur
- **THEN** les commissions modifiées sont toujours actives après le redémarrage

#### Scenario: Config is loaded from database on first request
- **WHEN** le serveur démarre et un admin accède à la page configuration
- **THEN** la configuration est chargée depuis `prisma.platformConfig.findMany()` et non depuis un objet en mémoire

#### Scenario: Config updates are written to database
- **WHEN** l'admin modifie une valeur de configuration via PATCH `/api/admin/config`
- **THEN** `prisma.platformConfig.upsert()` est appelé pour chaque clé modifiée avec la nouvelle valeur

### Requirement: Maintenance mode SHALL block access to the platform via Next.js middleware
Lorsque le mode maintenance est activé dans la configuration admin, le middleware Next.js MUST rediriger toutes les requêtes non-admin vers une page de maintenance. Les routes admin restent accessibles.

#### Scenario: Maintenance mode blocks public pages
- **WHEN** le mode maintenance est activé et un visiteur accède à `/explorer`
- **THEN** il est redirigé vers `/maintenance` avec un message personnalisé

#### Scenario: Maintenance mode blocks user dashboards
- **WHEN** le mode maintenance est activé et un freelance accède à `/dashboard`
- **THEN** il est redirigé vers `/maintenance`

#### Scenario: Admin pages remain accessible during maintenance
- **WHEN** le mode maintenance est activé et un admin accède à `/admin`
- **THEN** la page admin se charge normalement

#### Scenario: Maintenance mode is cached for performance
- **WHEN** le middleware vérifie le mode maintenance
- **THEN** la valeur est lue depuis un cache mémoire de 60 secondes maximum, pas depuis la DB à chaque requête

#### Scenario: Disabling maintenance mode restores access within 60 seconds
- **WHEN** l'admin désactive le mode maintenance
- **THEN** le cache expire dans un maximum de 60 secondes et les visiteurs peuvent à nouveau accéder au site

### Requirement: Commission rates SHALL be configurable per subscription plan
L'admin MUST pouvoir modifier les taux de commission pour chaque plan d'abonnement (Gratuit 20%, Pro 15%, Business 10%, Agence 8%). Les modifications sont persistées en DB et appliquées aux nouvelles transactions.

#### Scenario: Admin changes Pro plan commission
- **WHEN** l'admin change la commission du plan Pro de 15% à 12%
- **THEN** la valeur est persistée en DB et les prochaines transactions de freelances Pro utilisent 12%

#### Scenario: Commission change does not affect existing transactions
- **WHEN** l'admin change une commission
- **THEN** les transactions déjà effectuées conservent leur taux de commission d'origine (pas de rétroactivité)

### Requirement: Currency and payment method configuration SHALL persist
L'admin MUST pouvoir activer/désactiver des devises et des méthodes de paiement. Ces configurations sont persistées en DB.

#### Scenario: Admin disables USD currency
- **WHEN** l'admin désactive USD dans la configuration des devises
- **THEN** USD n'apparaît plus dans le sélecteur de devise côté public après rafraîchissement

#### Scenario: Admin disables a payment method
- **WHEN** l'admin désactive Orange Money dans les méthodes de paiement
- **THEN** Orange Money n'apparaît plus comme option de paiement lors d'une commande

### Requirement: Default configuration values SHALL be seeded on first access
Si la table `PlatformConfig` est vide (premier démarrage ou DB vide), le système MUST insérer les valeurs par défaut définies dans le code (maintenance désactivé, commissions standard, toutes devises actives).

#### Scenario: First access seeds default config
- **WHEN** un admin accède à la page configuration pour la première fois sur une DB vide
- **THEN** les valeurs par défaut sont insérées en DB et affichées dans l'interface
