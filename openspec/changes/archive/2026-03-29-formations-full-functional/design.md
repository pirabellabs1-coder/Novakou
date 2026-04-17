## Context

La plateforme Formations standalone est structurellement complète avec ~45 API routes Prisma, 15 modèles DB, et ~40 pages frontend. L'audit révèle que 95% utilise déjà des données réelles. Les lacunes restantes :

1. **Admin formations** : 8 pages existent sous `/admin/formations/` mais dans le layout admin FreelanceHigh — pas dans le layout standalone formations
2. **Données mock** : 3 pages ont des stats marketing hardcodées (page d'accueil, devenir-instructeur, et la page creer utilise un champ texte URL au lieu du composant ImageUpload)
3. **Upload d'images** : Le composant `ImageUpload` existe dans `components/ui/image-upload.tsx` et l'API `/api/upload/image` existe — mais ni l'un ni l'autre ne sont utilisés dans le flux formations
4. **Certificat PDF** : Design fonctionnel avec jsPDF mais basique — pas de QR code, pas de logo image, design améliorable
5. **Codes promo** : Le modèle `PromoCode` existe en DB avec tous les champs nécessaires — mais aucune interface admin pour les gérer
6. **Double format de code certificat** : `FH-XXXX-XXXX-XXXX` vs `FH-{year}-{random6}` dans deux fichiers différents

## Goals / Non-Goals

**Goals:**
- Migrer l'admin formations dans le layout standalone avec sa propre sidebar
- Remplacer les 3 pages avec données hardcodées par des appels API temps réel
- Intégrer le composant `ImageUpload` existant dans le wizard de création de formation et les profils
- Créer l'interface admin de gestion des codes promo (CRUD sur le modèle `PromoCode` existant)
- Appliquer les codes promo dans le flux de paiement Stripe Checkout
- Améliorer le design du certificat PDF (meilleure mise en page, QR code de vérification)
- Consolider le format de code certificat en un seul standard
- Ajouter une API `/api/formations/stats` pour la page d'accueil dynamique

**Non-Goals:**
- Pas de refonte du schéma Prisma (les modèles existants couvrent tous les besoins)
- Pas de migration vers Cloudinary pour l'upload (garder le base64/Supabase Storage actuel au MVP)
- Pas de WebSocket/temps réel via Socket.io (les données se rafraîchissent via TanStack Query revalidation)
- Pas de nouvelles dépendances majeures (utiliser jsPDF existant, pas @react-pdf/renderer)
- Pas de refonte des pages admin existantes — juste les migrer dans le nouveau layout

## Decisions

### D1 — Admin formations dans un route group standalone

**Choix** : Créer `app/formations/(admin)/` comme route group avec son propre layout (sidebar admin formations), copier/adapter les 8 pages existantes de `app/admin/formations/`.

**Alternatives considérées** :
- Réutiliser directement les pages de `app/admin/formations/` via un redirect → Impossible car elles héritent du layout admin FreelanceHigh
- Créer un layout conditionnel qui change selon l'URL → Trop complexe, casse le modèle mental Next.js

**Justification** : Les route groups Next.js (`(admin)`) n'affectent pas l'URL. Les pages admin formations seront accessibles à `/admin/*` avec le layout standalone formations + sidebar admin dédiée. Les APIs existantes sous `/api/admin/formations/` restent inchangées.

### D2 — Stats page d'accueil via nouvelle API

**Choix** : Créer `GET /api/formations/stats` qui retourne les compteurs réels (formations actives, apprenants inscrits, instructeurs approuvés, note moyenne) via des requêtes Prisma `count()` et `aggregate()`.

**Alternatives considérées** :
- Server Component avec requête directe → La page d'accueil est "use client" pour les animations
- Cache Redis → Overhead inutile au MVP pour des compteurs simples

**Justification** : Prisma `count()` est rapide sur des tables indexées. TanStack Query côté client avec `staleTime: 60000` évite les re-fetches inutiles.

### D3 — ImageUpload réutilisé tel quel

**Choix** : Utiliser le composant `ImageUpload` existant (`components/ui/image-upload.tsx`) et l'API `/api/upload/image` existante dans le wizard instructeur et les pages de profil. Pas de nouveau composant à créer.

**Alternatives considérées** :
- Créer un composant dédié formations → Duplication inutile, le composant existant est déjà bien fait
- Upload direct vers Cloudinary côté client → Expose la clé API

**Justification** : Le composant gère déjà : sélection fichier, preview, upload vers l'API, gestion d'erreurs. Il suffit de l'importer et de le brancher.

### D4 — Codes promo : CRUD admin + application au checkout

**Choix** : Créer 2 nouvelles API routes admin (`GET/POST /api/admin/formations/promo-codes` et `PUT/DELETE /api/admin/formations/promo-codes/[id]`) + modifier le flux de paiement pour vérifier et appliquer un code promo avant de créer la session Stripe.

**Alternatives considérées** :
- Stripe Coupons natifs → Nécessite que le code soit créé dans Stripe + dans notre DB, double gestion
- Réduction côté client uniquement → Faille de sécurité, le prix doit être vérifié côté serveur

**Justification** : Le modèle `PromoCode` existe déjà avec `discountPct`, `maxUsage`, `usageCount`, `expiresAt`, `isActive`, `formationIds[]`. La logique est : vérifier validité → calculer prix réduit → passer le prix réduit à Stripe `line_items.unit_amount`.

### D5 — Certificat PDF amélioré (jsPDF)

**Choix** : Améliorer le design du certificat dans `certificate-generator.ts` avec jsPDF existant : meilleure typographie, bordure décorative, section QR code (URL de vérification encodée), meilleur espacement, fond subtil.

**Alternatives considérées** :
- @react-pdf/renderer → Plus lourd, nécessite React côté serveur, pas nécessaire pour un design amélioré
- Puppeteer HTML→PDF → Trop lourd pour un certificat, nécessite un headless browser

**Justification** : jsPDF permet tout ce qu'il faut : formes, textes, images (logo en base64), et le package `qrcode` peut générer un QR en data URL injecté dans le PDF.

### D6 — Consolidation du format de code certificat

**Choix** : Standardiser sur le format `FH-XXXX-XXXX-XXXX` (alphanumériques sans caractères ambigus) car il est plus lisible et plus résistant aux erreurs de saisie.

**Justification** : Le format `FH-{year}-{random6}` dans `prisma-helpers.ts` est moins unique (6 chars vs 12) et inclut l'année de manière redondante (déjà dans `issuedAt`).

## Risks / Trade-offs

- **[Upload base64 en DB]** → L'upload actuel stocke les images en base64 data URL dans la DB. Acceptable au MVP mais à migrer vers Cloudinary/Supabase Storage avant la V1. Mitigation : le composant ImageUpload a déjà l'interface pour recevoir une URL — la migration sera transparente.

- **[Stats page d'accueil non cachées]** → Les compteurs sont recalculés à chaque requête. Mitigation : `staleTime: 60000` côté TanStack Query + les requêtes Prisma `count()` sont rapides (< 50ms) sur des tables avec index.

- **[QR code certificat]** → Nécessite le package `qrcode` (ou similaire). Mitigation : package léger (~30KB), bien maintenu, utilisé par millions de projets.

- **[Admin formations accessible sans vérification admin]** → Le middleware doit protéger `/admin/*`. Mitigation : ajouter la route dans le middleware existant avec vérification du rôle admin.

## Open Questions

- Aucune question bloquante — tous les modèles DB, APIs, et composants nécessaires existent déjà. L'implémentation est principalement de l'intégration et du câblage.
