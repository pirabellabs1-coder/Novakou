## 1. Admin Formations — Layout Standalone

- [x] 1.1 Créer le route group `app/formations/(admin)/` avec un layout.tsx contenant une sidebar admin formations (liens: Dashboard, Formations, Instructeurs, Apprenants, Finances, Certificats, Catégories, Codes Promo) + support mobile (overlay hamburger) + breadcrumbs — même design que le layout instructeur
- [x] 1.2 Créer la page `app/formations/(admin)/admin/dashboard/page.tsx` qui appelle `GET /api/admin/formations/stats` et affiche les métriques temps réel (formations totales, apprenants, instructeurs, revenus, avis) avec des cards et graphiques
- [x] 1.3 Migrer la page liste formations admin vers `app/formations/(admin)/admin/formations/page.tsx` — câblée à `GET /api/admin/formations/list`, avec actions approuver/refuser/archiver
- [x] 1.4 Migrer la page instructeurs admin vers `app/formations/(admin)/admin/instructeurs/page.tsx` — câblée à `GET /api/admin/instructeurs/list`, avec actions approuver/suspendre
- [x] 1.5 Migrer la page apprenants admin vers `app/formations/(admin)/admin/apprenants/page.tsx` — câblée à `GET /api/admin/formations/apprenants`
- [x] 1.6 Migrer la page finances admin vers `app/formations/(admin)/admin/finances/page.tsx` — câblée à `GET /api/admin/formations/finances`, avec approbation de retraits
- [x] 1.7 Migrer la page certificats admin vers `app/formations/(admin)/admin/certificats/page.tsx` — câblée à `GET /api/admin/formations/certificats`, avec révocation/réactivation
- [x] 1.8 Migrer la page catégories admin vers `app/formations/(admin)/admin/categories/page.tsx` — CRUD complet sur les catégories de formations
- [x] 1.9 Créer la page `app/formations/(admin)/admin/page.tsx` qui redirige vers `/admin/dashboard`
- [x] 1.10 Ajouter les routes `/admin/*` dans le middleware avec vérification du rôle admin — rediriger les non-admin vers `/connexion`
- [x] 1.11 Ajouter les clés i18n pour la sidebar admin formations dans `formations_nav` (fr.json et en.json)

## 2. Codes Promo — Admin + Paiement

- [x] 2.1 Créer l'API `GET /api/admin/formations/promo-codes` qui retourne la liste de tous les PromoCode avec statistiques d'utilisation
- [x] 2.2 Créer l'API `POST /api/admin/formations/promo-codes` pour créer un nouveau PromoCode (code, discountPct, maxUsage, expiresAt, isActive, formationIds)
- [x] 2.3 Créer l'API `PUT /api/admin/formations/promo-codes/[id]` pour modifier un PromoCode existant
- [x] 2.4 Créer l'API `DELETE /api/admin/formations/promo-codes/[id]` pour supprimer un PromoCode
- [x] 2.5 Créer la page admin `app/formations/(admin)/admin/promo-codes/page.tsx` avec tableau des codes promo, formulaire de création/modification, toggle actif/inactif, filtres par statut
- [x] 2.6 Créer l'API `POST /api/formations/promo/validate` qui vérifie la validité d'un code promo (existe, actif, non expiré, usage < max, formation ciblée) et retourne le prix réduit
- [x] 2.7 Modifier la page de checkout/paiement formations pour ajouter un champ code promo, appeler l'API validate, afficher le prix réduit, et passer le montant réduit à la session Stripe
- [x] 2.8 Modifier le webhook Stripe formations pour incrémenter `usageCount` du PromoCode utilisé après paiement confirmé

## 3. Statistiques Temps Réel — APIs

- [x] 3.1 Créer l'API `GET /api/formations/stats` (publique) qui retourne : nombre de formations actives (count where status=ACTIF), nombre d'apprenants uniques (count distinct userId on Enrollment), nombre d'instructeurs approuvés, note moyenne globale (avg sur FormationReview.rating)
- [x] 3.2 Vérifier et corriger l'API `GET /api/apprenant/dashboard` pour s'assurer qu'elle retourne des données Prisma réelles : inscriptions avec progression, certificats obtenus, heures totales
- [x] 3.3 Vérifier et corriger l'API `GET /api/instructeur/dashboard` pour s'assurer qu'elle retourne des données Prisma réelles : revenus totaux (sum paidAmount), ventes du mois, nombre d'apprenants, note moyenne
- [x] 3.4 Vérifier et corriger l'API `GET /api/instructeur/statistiques` pour les graphiques de revenus mensuels (groupBy mois sur Enrollment.createdAt + sum paidAmount)

## 4. Nettoyage Données Mock — Pages Frontend

- [x] 4.1 Modifier `app/formations/page.tsx` — remplacer le tableau `STATS` hardcodé par un appel à `GET /api/formations/stats` via fetch/useEffect, afficher les compteurs dynamiques avec formatage (1K+, 500+, etc.)
- [x] 4.2 Modifier `app/formations/devenir-instructeur/page.tsx` — remplacer les compteurs hardcodés (500+, 50K+, 70%) par des données de `GET /api/formations/stats`
- [x] 4.3 Vérifier toutes les pages apprenant (dashboard, mes-formations, certificats, favoris, panier) — confirmer que les données proviennent d'APIs Prisma, corriger si besoin
- [x] 4.4 Vérifier toutes les pages instructeur (dashboard, mes-formations, creer, apprenants, revenus, avis, statistiques) — confirmer que les données proviennent d'APIs Prisma, corriger si besoin
- [x] 4.5 Ajouter des états vides (empty states) avec illustrations et CTA sur les dashboards apprenant et instructeur quand il n'y a aucune donnée

## 5. Upload d'Images

- [x] 5.1 Remplacer le champ texte `<input>` URL thumbnail dans `app/formations/(instructeur)/instructeur/creer/page.tsx` par le composant `ImageUpload` existant avec ratio 16:9
- [x] 5.2 Ajouter un widget `ImageUpload` (ratio carré, rounded) sur la page paramètres instructeur pour la photo de profil, câblé à `POST /api/upload/image` et sauvegarde dans le profil utilisateur
- [x] 5.3 Ajouter un widget `ImageUpload` (ratio carré, rounded) sur la page paramètres apprenant pour la photo de profil, câblé à `POST /api/upload/image` et sauvegarde dans le profil utilisateur
- [x] 5.4 Créer ou vérifier que l'API `POST /api/upload/image` valide correctement le type MIME et la taille max (5MB) et retourne une URL exploitable

## 6. Certificat PDF — Redesign Premium

- [x] 6.1 Installer le package `qrcode` (ou `qrcode-generator`) pour générer des QR codes en data URL côté serveur
- [x] 6.2 Refactorer `lib/formations/certificate-generator.ts` avec un nouveau design premium : bordures décoratives améliorées, typographie soignée, sections bien espacées (en-tête FreelanceHigh Formations, titre CERTIFICAT DE RÉUSSITE, nom apprenant en grand, formation, score, date, instructeur, code unique, QR code de vérification)
- [x] 6.3 Consolider la fonction `generateCertificateCode()` — supprimer le doublon dans `prisma-helpers.ts`, garder uniquement la version `FH-XXXX-XXXX-XXXX` dans `certificate-generator.ts`, mettre à jour les imports
- [x] 6.4 Vérifier que la route `GET /api/formations/[id]/certificate` utilise le nouveau générateur et retourne le PDF avec le design premium
- [x] 6.5 Tester le certificat en FR et EN — vérifier que les labels bilingues s'affichent correctement selon la locale

## 7. Liens Navigation + i18n

- [x] 7.1 Ajouter un lien "Admin Formations" dans le FormationsHeader pour les utilisateurs avec rôle admin (visible uniquement pour les admins)
- [x] 7.2 Mettre à jour les clés i18n `formations_nav` dans fr.json et en.json pour : sidebar admin (dashboard, formations, instructeurs, apprenants, finances, certificats, catégories, promo-codes), page promo codes, états vides, messages d'erreur codes promo
- [x] 7.3 Vérifier la cohérence de tous les liens de navigation entre les espaces (apprenant → instructeur via "Devenir instructeur", instructeur → explorer, admin → retour formations)

## 8. Tests et Vérification

- [x] 8.1 Vérifier que le build TypeScript passe sans erreur (`npx tsc --noEmit`)
- [x] 8.2 Tester le flux complet : page d'accueil → explorer → détail formation → paiement avec code promo → dashboard apprenant → certificat PDF
- [x] 8.3 Tester le flux admin : connexion admin → dashboard formations → approuver formation → gérer instructeur → créer code promo → voir finances
- [x] 8.4 Vérifier le responsive (mobile) : sidebar admin en overlay, formulaire code promo, certificat PDF lisible
