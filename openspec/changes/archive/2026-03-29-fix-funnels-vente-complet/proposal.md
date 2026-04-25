## Why

Les tunnels de vente (funnels) de l'espace instructeur sont actuellement inutilisables en production. Le wizard de création existe et la page publique `/f/[slug]` rend les étapes, mais **aucun paiement réel n'est intégré**, les produits de l'instructeur ne sont pas chargés dynamiquement, le tracking "purchase" est déclenché sans vrai achat (fausse les stats), et le bug d'activation au POST empêche tout funnel d'être activé à la création. Les instructeurs ne peuvent pas utiliser cette fonctionnalité pour vendre.

**Version cible : MVP formations (phase actuelle)**

## What Changes

### Corrections critiques
- **Bug `isActive` ignoré au POST** : le handler POST force `isActive: false` même quand le wizard envoie `isActive: true` → le funnel "activé" reste inactif
- **Produits hardcodés (MOCK_PRODUCTS)** : remplacer la liste statique du wizard par un fetch des vraies formations et produits de l'instructeur via API
- **Checkout factice** : intégrer Stripe Checkout dans l'étape CHECKOUT pour un vrai paiement
- **Event "purchase" prématuré** : ne tracker "purchase" qu'après confirmation de paiement Stripe (via webhook ou redirect success)

### Nouvelles fonctionnalités
- **Page analytiques par funnel** : visualisation step-by-step des vues, clics, conversions, drop-off rate (la route API `/api/marketing/funnels/[id]/events` existe déjà)
- **Duplication de funnel** : bouton + route API POST `/api/marketing/funnels/[id]/duplicate`
- **Support locale FR/EN** dans le renderer public (utiliser `headlineEn`/`descriptionEn`/`ctaTextEn` si locale = en)
- **SEO dynamique** sur la page publique : `generateMetadata` avec titre, description, OG tags

### Corrections de qualité
- ~35 accents français manquants sur 4 fichiers (funnels list, wizard, renderer, API)
- Trust signals et bullets dynamiques (pas hardcodés) dans le renderer public
- Validation par étape dans le wizard (headline et CTA requis, produit requis sur PRODUCT/UPSELL/DOWNSELL)
- Imports morts nettoyés (`GripVertical`, `BarChart` inline)

## Capabilities

### New Capabilities
- `funnel-checkout-stripe`: Intégration Stripe Checkout dans les étapes CHECKOUT des funnels — création de session Stripe, redirection, webhook de confirmation, mise à jour des stats
- `funnel-analytics-dashboard`: Page de visualisation des analytiques step-by-step par funnel avec graphiques de conversion, drop-off, revenus par étape
- `funnel-wizard-improvements`: Corrections du wizard de création — chargement produits réels, validation per-step, bug isActive, duplication

### Modified Capabilities
*(aucune spec existante ne couvre les funnels)*

## Impact

### Code affecté
- `apps/web/app/formations/(instructeur)/instructeur/marketing/funnels/` — liste + wizard + nouvelle page analytiques
- `apps/web/app/formations/f/[slug]/page.tsx` — renderer public (checkout Stripe, locale, SEO)
- `apps/web/app/api/marketing/funnels/route.ts` — fix POST isActive, ajout duplicate
- `apps/web/app/api/marketing/funnels/[id]/events/route.ts` — déjà existant, consommé par la nouvelle page analytiques
- `apps/web/lib/formations/hooks.ts` — nouveaux hooks `useInstructorFunnelAnalytics`, `useFunnelDuplicate`

### APIs et dépendances
- **Stripe Checkout** : nécessaire pour les paiements dans les funnels (STRIPE_SECRET_KEY déjà configuré)
- **Nouveau endpoint** : `POST /api/marketing/funnels/[id]/duplicate`
- **Nouveau endpoint** : `POST /api/marketing/funnels/checkout` — création de session Stripe pour un achat funnel
- **Webhook Stripe** : extension du handler existant `/api/webhooks/stripe` pour traiter les événements `checkout.session.completed` liés aux funnels

### Schéma Prisma
- Pas de nouvelle table requise — le modèle `SalesFunnel`, `SalesFunnelStep`, et `SalesFunnelEvent` existent déjà
- Ajout potentiel d'un champ `stripeSessionId` sur `SalesFunnelEvent` pour lier l'événement au paiement

### Impact sur les autres rôles
- **Apprenants** : après paiement via funnel, ils sont automatiquement inscrits à la formation/produit acheté
- **Admin** : les transactions funnel apparaissent dans le dashboard financier existant
