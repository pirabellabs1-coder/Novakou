## ADDED Requirements

### Requirement: Admin SHALL pouvoir configurer les paramètres du système de formations
Une nouvelle page `/admin/configuration` SHALL permettre de modifier les paramètres système : taux de commission par défaut, durée de la fenêtre de remboursement, taille maximale d'upload, nombre de formations gratuites autorisées par instructeur, et activation/désactivation des fonctionnalités.

#### Scenario: Affichage de la configuration
- **WHEN** l'admin accède à `/admin/configuration`
- **THEN** un formulaire affiche les paramètres actuels organisés en sections : "Finances" (commission, remboursement), "Limites" (upload, formations gratuites), "Fonctionnalités" (cohortes, produits, marketing)

#### Scenario: Modification de la commission
- **WHEN** l'admin modifie le taux de commission de 30% à 25% et clique "Enregistrer"
- **THEN** le paramètre est sauvegardé, un audit log est créé, et un toast de confirmation s'affiche

#### Scenario: Validation des paramètres
- **WHEN** l'admin entre une valeur invalide (commission > 100% ou < 0%)
- **THEN** une erreur de validation inline s'affiche et le formulaire ne peut pas être soumis

### Requirement: Les paramètres de configuration SHALL être stockés en base de données
Les paramètres SHALL être stockés dans une table `FormationsConfig` (clé-valeur) plutôt que dans des constantes hardcodées, permettant une modification sans redéploiement.

#### Scenario: Lecture des paramètres
- **WHEN** une API a besoin du taux de commission
- **THEN** elle lit la valeur depuis `FormationsConfig` avec un fallback sur la valeur par défaut si non configurée

#### Scenario: Valeurs par défaut
- **WHEN** aucune configuration n'existe en base
- **THEN** les valeurs par défaut sont utilisées : commission=30%, refundWindow=14j, maxUpload=100MB

### Requirement: Navigation admin SHALL inclure le lien configuration
Le sidebar admin SHALL inclure un nouveau lien "Configuration" en dernière position dans la navigation, avec l'icône `tune`.

#### Scenario: Lien configuration visible
- **WHEN** l'admin est dans l'espace formations admin
- **THEN** le sidebar affiche le lien "Configuration" en dernière position

### Requirement: API configuration SHALL exposer les paramètres
`GET /api/admin/formations/config` SHALL retourner tous les paramètres, et `PUT /api/admin/formations/config` SHALL permettre la mise à jour.

#### Scenario: Lecture API
- **WHEN** un admin authentifié appelle `GET /api/admin/formations/config`
- **THEN** la réponse contient `{ commissionRate, refundWindowDays, maxUploadMb, maxFreeFormations, features: { cohortsEnabled, productsEnabled, marketingEnabled } }`

#### Scenario: Mise à jour API
- **WHEN** un admin authentifié appelle `PUT /api/admin/formations/config` avec `{ commissionRate: 0.25 }`
- **THEN** le paramètre est mis à jour et un audit log est créé
