## ADDED Requirements

### Requirement: User model SHALL include personal info fields for KYC verification
Le modele Prisma `User` MUST inclure les champs `firstName` (String?), `lastName` (String?), `city` (String?), `address` (String?), `dateOfBirth` (DateTime?) pour que l'API `/api/kyc` PATCH puisse sauvegarder les informations personnelles.

#### Scenario: KYC personal info saved successfully
- **WHEN** un freelance soumet ses informations personnelles via PATCH `/api/kyc` avec firstName, lastName, city, address, dateOfBirth
- **THEN** les champs sont sauvegardes via `prisma.user.update()` sans erreur serveur

#### Scenario: KYC personal info loaded on page visit
- **WHEN** un freelance visite `/dashboard/kyc`
- **THEN** GET `/api/kyc` retourne les informations personnelles existantes depuis la table User via Prisma
