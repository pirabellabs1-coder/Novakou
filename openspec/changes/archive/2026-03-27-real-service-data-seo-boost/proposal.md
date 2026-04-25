## Why

Les cards de services (explorer + landing) affichent des données factices (faux nombres de ventes, avis absents) au lieu des vraies données Prisma. Les fonctionnalités SEO, boost et propositions existent en API mais ne sont pas connectées au frontend : le SEO ne met pas à jour les meta tags réels, le boost n'a pas d'UI fonctionnelle pour choisir/payer/suivre, et les propositions envoyées sur les projets clients ne s'affichent pas avec leur statut. Les commissions sur ventes ne remontent pas correctement vers l'espace admin. Ces lacunes empêchent la plateforme de fonctionner comme un vrai marketplace — version cible **MVP/V1**.

## What Changes

### Cards de services (explorer + landing + accueil)
- Connecter les cards aux vraies données Prisma : `orderCount`, `rating`, `ratingCount`, `views` réels du service
- Afficher les avis (nombre + note moyenne) sur chaque card
- Afficher le nombre réel de ventes sur chaque card
- Supprimer toutes les données hardcodées/factices des stores dev pour ces champs
- Même logique pour les cards dans l'espace agence

### Cards profil vendeur
- Afficher les vraies stats du vendeur : nombre total de ventes, note moyenne, nombre d'avis
- Badge vérifié basé sur le vrai `kycLevel`
- Taux de complétion réel des commandes

### Propositions (offres sur projets clients)
- Page `/dashboard/candidatures` : afficher les propositions envoyées avec statuts (PENDING, VIEWED, ACCEPTED, REJECTED, EXPIRED)
- API : ajouter endpoints PATCH pour accepter/rejeter une proposition
- Notification au freelance quand le statut change
- Affichage côté client des propositions reçues avec actions

### SEO des services
- UI fonctionnelle dans le wizard service pour éditer `metaTitle`, `metaDescription`, `tags`
- Score SEO calculé et affiché en temps réel
- Les meta tags Next.js (`generateMetadata`) utilisent les vrais champs SEO du service
- Page `/services/[slug]` : OG tags, Schema.org JSON-LD depuis les données Prisma

### Boost de services
- UI complète : sélectionner un service, choisir la durée, voir le calcul automatique (impressions estimées, coût)
- Page dédiée `/dashboard/services/boost/[id]` : stats du boost actif (impressions, clics, contacts, commandes, conversion)
- Tracking réel : incrémenter `BoostDailyStat` quand un service boosté est vu/cliqué
- Même fonctionnalité dans l'espace agence

### Commissions et admin wallet
- À chaque vente : créer `AdminTransaction` avec la commission (20% plan gratuit, 15% Pro, etc.)
- Dashboard admin : afficher les fonds reçus, commissions par période, ventilation par type
- Les commissions d'abonnement et de boost s'ajoutent aussi au wallet admin

## Capabilities

### New Capabilities
- `real-service-cards`: Connexion des cards de services aux vraies données Prisma (ventes, avis, stats) sur toutes les pages (explorer, landing, agence)
- `service-seo-functional`: SEO fonctionnel de bout en bout — édition UI, meta tags Next.js, OG tags, Schema.org JSON-LD
- `service-boost-ui`: UI complète du boost — sélection, paiement, page stats dédiée avec tracking réel des impressions/clics/conversions
- `propositions-status-flow`: Flux complet des propositions — affichage avec statuts, acceptation/rejet, notifications

### Modified Capabilities
- `marketplace-data-flow`: Les cards marketplace doivent afficher les vraies données au lieu des données factices
- `order-creation-flow`: À chaque vente, créer la transaction admin avec commission calculée selon le plan du freelance

## Impact

### Code affecté
- **Frontend** : `explorer/page.tsx`, `PopularServicesSection.tsx`, `dashboard/services/`, `dashboard/candidatures/`, `agence/services/`, composants cards partagés
- **API routes** : `/api/public/services`, `/api/public/top-services`, `/api/propositions`, `/api/services/[id]/boost`, `/api/services/[id]/seo`, `/api/admin/wallet`
- **Prisma** : Pas de nouvelles tables (tout existe déjà), mais vérifier que les relations `_count` sont bien utilisées dans les queries
- **Next.js Metadata** : `app/(public)/services/[slug]/page.tsx` — `generateMetadata()` à implémenter/corriger

### Impact multi-rôles
- **Freelance** : voit ses vraies stats, gère SEO et boost, suit ses propositions
- **Client** : voit les vraies ventes/avis sur les cards, gère les propositions reçues
- **Agence** : mêmes fonctionnalités que freelance pour ses services
- **Admin** : reçoit les commissions dans son wallet, visibilité sur les transactions

### Dépendances
- Aucun nouveau job BullMQ requis (le tracking est synchrone via API)
- Aucun nouveau template email requis (notifications existantes suffisent)
- Pas de migration Prisma (les modèles existent déjà)
