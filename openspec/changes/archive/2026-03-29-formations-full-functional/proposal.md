## Why

La plateforme Formations standalone est structurellement en place (53 tâches migrées) avec ~45 API routes et 15 modèles Prisma. Cependant, l'audit révèle que : (1) l'espace admin formations n'est pas intégré dans le layout standalone, (2) plusieurs pages utilisent encore des données mock ou des statistiques codées en dur, (3) il n'y a pas de widget d'upload d'image/photo de profil, (4) le design des certificats PDF est basique, (5) les codes promo et offres promotionnelles ne sont pas gérés côté admin, (6) les statistiques ne sont pas liées en temps réel entre les espaces apprenant/instructeur/admin. Il faut rendre la plateforme **100% fonctionnelle de A à Z** sans aucune donnée fictive, avec tous les espaces interconnectés via des APIs qui communiquent en temps réel.

Version cible : **MVP** (intégrée au développement en cours de la plateforme Formations).

## What Changes

- **Admin Formations dans le layout standalone** : Migrer l'espace admin formations (`/admin/*`) dans le layout standalone avec sa propre sidebar, breadcrumbs et navigation — séparé de l'admin FreelanceHigh
- **APIs temps réel** : Connecter toutes les statistiques (page d'accueil, dashboard apprenant, dashboard instructeur, dashboard admin) à des API routes Prisma avec données réelles — supprimer toute donnée mock restante
- **Page d'accueil formations dynamique** : Les compteurs (formations disponibles, apprenants inscrits, instructeurs actifs, avis moyens) doivent provenir d'APIs avec données réelles de la base
- **Upload de photos** : Widget d'upload de photo de profil depuis la galerie (apprenant + instructeur) avec preview, crop basique et stockage Cloudinary/Supabase Storage
- **Certificats PDF professionnels** : Redesign complet du certificat téléchargeable avec mention de la plateforme, logo, nom de l'apprenant, titre de la formation, date, numéro unique, signature, design premium
- **Codes promo et offres** : Interface admin pour créer/gérer des codes promotionnels (pourcentage ou montant fixe, date d'expiration, limite d'usage, formations ciblées) + application côté paiement
- **Statistiques interconnectées** : Les ventes des instructeurs, avis des apprenants, revenus, taux de complétion — tout mis à jour en temps réel via les APIs entre les 3 espaces
- **Suppression de toutes les données demo** : Audit et remplacement de chaque donnée codée en dur par des appels Prisma réels

## Capabilities

### New Capabilities
- `formations-admin-standalone`: Espace admin formations complet dans le layout standalone avec sidebar dédiée, dashboard avec métriques temps réel, gestion des formations/instructeurs/apprenants/avis/revenus
- `formations-realtime-stats`: Statistiques interconnectées entre tous les espaces — page d'accueil dynamique, dashboards avec données Prisma temps réel, graphiques de revenus/inscriptions/complétion
- `formations-photo-upload`: Upload de photo de profil et d'images de formations avec preview, validation, stockage et affichage — apprenants, instructeurs et formations
- `formations-certificate-design`: Certificat PDF professionnel avec design premium, logo plateforme, QR code de vérification, numéro unique, mise en page soignée
- `formations-promo-codes`: Système complet de codes promotionnels — création admin, validation à l'achat, suivi d'utilisation, expiration, limites
- `formations-data-cleanup`: Suppression de toutes les données mock/demo restantes et remplacement par des requêtes Prisma réelles sur toutes les pages

### Modified Capabilities
<!-- Aucune capability existante modifiée au niveau des requirements -->

## Impact

### Schéma Prisma
- Nouvelle table `FormationPromoCode` (code, type, valeur, expiration, limite, formations ciblées)
- Nouvelle table `PromoCodeUsage` (suivi des utilisations par apprenant)
- Ajout de colonnes `profileImageUrl` sur `User` si absente, `certificateNumber` unique sur `Certificate`
- Ajout de `verificationQrCode` sur `Certificate`

### APIs impactées
- `/api/formations/stats` (nouvelle — compteurs page d'accueil)
- `/api/admin/formations/*` (nouvelles — dashboard admin, gestion formations, instructeurs, revenus, promo codes)
- `/api/formations/upload` (nouvelle — upload images)
- `/api/formations/[id]/certificate/pdf` (modification — nouveau design)
- `/api/apprenant/dashboard` (modification — données réelles)
- `/api/instructeur/dashboard` (modification — données réelles)
- `/api/instructeur/statistiques` (modification — graphiques temps réel)

### Code frontend
- ~15 pages existantes à modifier pour remplacer les données mock par des appels API
- Nouveau layout admin formations avec sidebar
- Nouveau composant `ImageUpload` réutilisable
- Nouveau composant `CertificatePDF` avec design premium
- Nouvelles pages admin : dashboard, formations, instructeurs, apprenants, revenus, promo codes, avis

### Dépendances
- `@react-pdf/renderer` ou `jspdf` (déjà installé) pour le certificat PDF
- Supabase Storage ou Cloudinary SDK pour l'upload d'images
- Aucune nouvelle dépendance majeure requise

### Impact sur les rôles
- **Apprenant** : statistiques réelles sur son dashboard, upload photo profil, certificat PDF amélioré, application de codes promo à l'achat
- **Instructeur** : statistiques de ventes réelles, graphiques de revenus temps réel, upload photo profil et images formations
- **Admin Formations** : espace complet dans le layout standalone pour gérer toute la plateforme formations
