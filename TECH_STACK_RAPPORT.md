# FreelanceHigh — Rapport Comparatif Tech Stack
## Document de Décision Technique · Février 2026

**Préparé pour :** Lissanon Gildas, CEO & Fondateur
**Contexte :** Marketplace freelance francophone internationale, 4 rôles (Freelance, Client, Agence, Admin), roadmap MVP → V4 sur 20 mois
**Statut projet :** Phase zéro (61 maquettes HTML, aucun code existant)

> **Note de scope :** FreelanceHigh est une plateforme **internationale**. Le français est la langue de lancement car le marché cible initial est la francophonie mondiale (France, Afrique francophone, Belgique, Suisse, Canada francophone, Maghreb). La plateforme évoluera progressivement vers l'anglais (V1), l'arabe RTL, l'espagnol et le portugais (V2+).

---

## Méthodologie

Chaque option est notée sur **1–5** selon cinq dimensions :

| Dimension | Description |
|---|---|
| **DX** | Facilité d'utilisation, documentation, vitesse d'onboarding |
| **Scalabilité** | Capacité à croître de 0 → 100K+ utilisateurs sans réécriture majeure |
| **CDN Global** | Présence de nœuds CDN sur tous les continents (Europe, Amérique, Asie, Afrique) |
| **Coût MVP** | Coût total pour 0–1000 utilisateurs/mois (USD/mois approx.) |
| **Complexité** | Charge opérationnelle, maintenance (plus haut = plus simple) |

---

## 1. Framework Frontend

### Tableau comparatif

| Critère | Next.js 14 (App Router) | Remix | Nuxt 3 | SvelteKit |
|---|---|---|---|---|
| **DX** | 4/5 | 4/5 | 4/5 | 5/5 |
| **Écosystème / Librairies** | 5/5 | 3/5 | 4/5 | 3/5 |
| **Scalabilité** | 5/5 | 4/5 | 4/5 | 4/5 |
| **CDN Global** | 5/5 (Vercel edge mondial) | 3/5 | 3/5 | 3/5 |
| **Complexité** | 3/5 (App Router) | 4/5 | 4/5 | 5/5 |
| **SSR / SSG / ISR** | Tous les trois | SSR + streaming | Tous les trois | SSR + prerender |
| **Écosystème React** | Complet | Complet | Vue | Non (Svelte) |
| **SEO** | Excellent (Metadata API) | Excellent | Excellent | Bon |
| **PWA** | Via next-pwa | Manuel | @vite-pwa/nuxt | Intégré |
| **i18n** | next-intl (excellent) | Remix-i18next | @nuxtjs/i18n | Intégré |
| **RTL (arabe)** | Tailwind `rtl:` classes | Manuel | Manuel | Manuel |
| **Recrutement** | Fort (mondial) | Moyen | Moyen | Faible |

**Résumé :**
- **Next.js** : Meilleur écosystème React mondial, React Server Components réduit le bundle JS pour mobile 3G/4G, Vercel Edge Network couvre tous les continents (y compris Johannesburg), meilleur support shadcn/ui, communauté la plus large internationalement
- **Remix** : Bon DX, mais écosystème plus petit, moins de nœuds CDN
- **Nuxt 3** : Excellent pour Vue, mais shadcn/ui est React-exclusif, pool de talents React dominant mondialement
- **SvelteKit** : Meilleure performance runtime, mais niche, difficile à recruter, qualité de génération IA plus faible

### ✅ Gagnant : **Next.js 14 (App Router)**

Le PRD impose shadcn/ui (React exclusif). Vercel possède un réseau Edge mondial (Europe, Amérique, Asie, Australie, Johannesburg). La communauté React/Next.js est la plus large mondialement. Les RSC réduisent significativement le payload JS pour les utilisateurs mobiles sur 3G/4G. `next-intl` gère nativement le multilingue avec support RTL.

---

## 2. Architecture Backend

### Tableau comparatif

| Critère | Next.js API Routes | Express/Fastify (séparé) | tRPC | Hono (edge) |
|---|---|---|---|---|
| **DX** | 5/5 | 3/5 | 5/5 | 4/5 |
| **Type safety** | Manuel | Manuel | 5/5 end-to-end | 4/5 |
| **Scalabilité** | 3/5 (cold starts) | 5/5 | 4/5 | 5/5 (edge) |
| **WebSocket** | Limité | Natif | Via ws adapter | Limité |
| **Long-running tasks** | Non supporté | Complet | Non supporté | Non supporté |
| **Upload de fichiers** | 4.5MB limite | Standard | Difficile | Limité |
| **Déploiement** | Vercel natif | Tout serveur | Vercel/Railway | Cloudflare Workers |

**Contexte critique :** La plateforme nécessite du WebSocket (messagerie temps réel), des uploads de fichiers KYC, de la génération PDF, du traitement de webhooks de paiement, et une file de jobs pour emails et retraits — des charges de travail incompatibles avec les fonctions serverless à timeout 10–30 secondes.

**Next.js API Routes** créent des problèmes : cold starts, limite 4.5MB/10MB pour les uploads, pas de WebSocket natif, pricing Vercel excessif à l'échelle.

### ✅ Gagnant : **Fastify (backend séparé) + tRPC par-dessus Fastify**

Architecture recommandée : **monorepo** avec Next.js frontend + Fastify backend déployés indépendamment. tRPC est layéré sur Fastify pour la type-safety end-to-end. Fastify est 2–3x plus rapide qu'Express, TypeScript natif, excellent plugin ecosystem.

---

## 3. BaaS / Couche Base de Données

### Tableau comparatif

| Critère | Supabase | Firebase | Appwrite | Postgres custom |
|---|---|---|---|---|
| **DX** | 5/5 | 4/5 | 4/5 | 2/5 |
| **Postgres natif** | 5/5 | 0/5 (NoSQL) | 4/5 | 5/5 |
| **Realtime** | 5/5 (natif) | 5/5 (natif) | 4/5 | Manuel |
| **Auth intégrée** | 5/5 | 5/5 | 4/5 | Non |
| **Row-level security** | 5/5 | Firestore rules | 4/5 | 5/5 |
| **Vendor lock-in** | Moyen (mais Postgres) | Élevé (NoSQL) | Faible (open source) | Aucun |
| **Coût MVP** | $0 (free tier) | $0 | $0 (self-host) | $10–30/mois |
| **Coût V2** | $25–100/mois | $50–300/mois | Hébergement | $30–80/mois |

**Point clé :** Le modèle NoSQL de Firebase est éliminatoire — le système de portefeuille (multi-devises, escrow, commissions, hiérarchies agence) nécessite des transactions relationnelles ACID que Firestore ne peut pas fournir proprement. Supabase et Appwrite utilisent Postgres, le bon choix.

### ✅ Gagnant : **Supabase**

Free tier généreux (500MB DB, 50K MAU auth, 1GB stockage). Postgres garantit la portabilité des données si migration future nécessaire. Supabase Realtime complète Socket.io pour les broadcasts DB. RLS critique pour une marketplace multi-rôles. Supabase CLI permet le développement local complet (auth, storage, realtime).

Région recommandée : `eu-central-1` (Frankfurt) — centre géographique de la francophonie mondiale (accessible depuis l'Europe de l'Ouest, l'Afrique du Nord, l'Afrique subsaharienne).

---

## 4. ORM / Couche de Requête

### Tableau comparatif

| Critère | Prisma | Drizzle ORM | Kysely | SQL direct (pg) |
|---|---|---|---|---|
| **DX** | 5/5 | 4/5 | 3/5 | 2/5 |
| **Type safety** | 4/5 (généré) | 5/5 (schema-as-types) | 5/5 | 2/5 |
| **Performance** | 3/5 (risque N+1) | 5/5 (couche fine) | 5/5 | 5/5 |
| **Migrations** | 5/5 (prisma migrate) | 4/5 (drizzle-kit) | Manuel | Manuel |
| **Lisibilité schéma** | 5/5 | 4/5 | N/A | N/A |
| **Requêtes complexes** | 3/5 | 5/5 (SQL-like) | 5/5 | 5/5 |
| **Maturité** | Très mature | Rapidement maturant | Mature | N/A |

### ✅ Gagnant : **Prisma (MVP)** avec note pragmatique

`schema.prisma` = source unique de vérité pour 50+ tables. Prisma Migrate gère les migrations complexes en sécurité (critique pour une plateforme financière). Meilleur support IA code generation. **Note :** Pour les requêtes analytics admin et reporting financier complexes, utiliser `prisma.$queryRaw` avec SQL typé plutôt que le client Prisma.

---

## 5. Authentification

### Tableau comparatif

| Critère | NextAuth.js / Auth.js | Clerk | Supabase Auth | Lucia Auth |
|---|---|---|---|---|
| **DX** | 3/5 | 5/5 | 4/5 | 3/5 |
| **OAuth social** | 5/5 | 5/5 | 5/5 | Manuel |
| **2FA** | Via plugins | Natif | Natif (TOTP) | Manuel |
| **Multi-rôles** | Manuel | Natif | Manuel | Manuel |
| **Coût MVP** | Gratuit | Gratuit (<10K MAU) | Gratuit (Supabase) | Gratuit |
| **Coût 10K MAU** | Gratuit | ~$25/mois | ~$25/mois (Supabase) | Gratuit |
| **Coût 100K MAU** | Gratuit | ~$200+/mois | ~$100/mois | Gratuit |
| **Impersonation** | Manuel | Enterprise uniquement | Possible (service-role JWT) | Manuel |
| **Lock-in** | Aucun | Élevé | Moyen | Aucun |

**Contexte critique :** KYC 4 niveaux progressifs, comptes multi-rôles, impersonation admin, metadata de session personnalisée (niveau KYC, tier abonnement, rôle), audit logging. Clerk devient très coûteux à 50K MAU (~$100–200/mois) et les profils utilisateur vivent dans leur base, pas la vôtre.

### ✅ Gagnant : **Supabase Auth**

Déjà sur Supabase, élimine un vendor. JWT custom claims portent `role`, `kyc_level`, `subscription_tier` — le middleware peut filtrer l'accès sans requête DB supplémentaire. RLS policies référencent `auth.uid()` directement. TOTP intégré (Google Authenticator compatible). SMS 2FA via Twilio natif dans Supabase.

---

## 6. Temps Réel

### Tableau comparatif

| Critère | Socket.io | Supabase Realtime | Ably | Pusher |
|---|---|---|---|---|
| **Hébergement** | Auto-géré | Géré (Supabase) | Entièrement géré | Entièrement géré |
| **DX** | 4/5 | 4/5 | 4/5 | 5/5 |
| **Scalabilité** | 4/5 (Redis adapter) | 3/5 (limites Supabase) | 5/5 | 4/5 |
| **CDN Global** | 3/5 (région serveur) | 3/5 (région EU) | 5/5 (PoPs mondiaux) | 4/5 |
| **Coût MVP** | Gratuit (auto-hébergé) | Gratuit (Supabase tier) | Gratuit (6M msgs/mois) | Gratuit (200 conns) |
| **Broadcasts DB** | Manuel (pg_notify) | Natif (CDC Postgres) | Manuel | Manuel |
| **Présence** | Manuel | Natif | Natif | Natif |
| **Historique messages** | Manuel (Redis/DB) | Limité | Oui (payant) | Non |

**Use cases distincts :**
1. Chat (Socket.io excellent) — historique persistant, typing indicators, pièces jointes
2. Mises à jour statut commande (Supabase Realtime excellent) — CDC Postgres natif
3. Dashboard admin métriques live (Supabase Realtime)
4. Présence "en ligne" dans le chat (Socket.io)

### ✅ Gagnant : **Socket.io (chat) + Supabase Realtime (broadcasts DB)**

Approche hybride : exploite les forces de chaque outil sans coût supplémentaire. Socket.io hébergé sur le backend Fastify. Redis (déjà nécessaire pour le cache) sert d'adaptateur Socket.io pour la montée en charge horizontale.

---

## 7. Recherche

### Tableau comparatif

| Critère | Algolia | Meilisearch (auto-hébergé) | Typesense | Postgres FTS |
|---|---|---|---|---|
| **DX** | 5/5 | 4/5 | 4/5 | 3/5 |
| **Qualité recherche** | 5/5 | 4/5 | 4/5 | 3/5 |
| **Tolérance fautes** | 5/5 | 5/5 | 5/5 | Limitée |
| **Coût MVP** | $0 (10K records, 10K ops) | ~$10–15/mois (VPS) | Gratuit (self-hosted) | $0 (Postgres inclus) |
| **Coût 100K records** | ~$100–500/mois | ~$20–50/mois | ~$20–50/mois | $0 |
| **Recherche sémantique V3** | Via AI add-on ($$$) | Via intégration modèle | Via embeddings | Via pgvector |
| **Maintenance** | Aucune | Moyenne | Moyenne | Faible |

**Algolia** à l'échelle est extrêmement coûteux ($200–500/mois pour 100K records avec trafic actif).

**Postgres FTS** est sous-estimé pour le MVP. Avec `pg_trgm` et `tsvector`, Postgres gère excellemment 50K–100K records. Les dimensions de filtrage (prix, compétences, pays, disponibilité, note) sont déjà dans Postgres — pas besoin de synchroniser vers un index externe.

### ✅ Gagnant : **Postgres FTS (MVP) → Meilisearch à V1/V2 → pgvector (V3)**

- **MVP–V1 :** `pg_trgm` + `tsvector` + colonnes `search_vector` générées + index GIN. Coût $0, gère 10K–100K records. Support natif du français (dictionnaire `french` pour les stopwords et la racinisation).
- **V2 :** Meilisearch sur Railway (~$15/mois). Sync depuis Postgres via webhooks/triggers. Meilisearch supporte nativement le multilingue.
- **V3 :** `pgvector` sur Supabase. Embeddings OpenAI pour recherche sémantique hybride (Meilisearch full-text + pgvector similarité).

---

## 8. Stockage Médias

### Tableau comparatif

| Critère | Cloudinary | Uploadthing | Supabase Storage | AWS S3 + CloudFront |
|---|---|---|---|---|
| **DX** | 5/5 | 5/5 | 4/5 | 2/5 |
| **Optimisation images** | 5/5 (transforms URL) | Limité | Basique | Via Lambda@Edge |
| **Fichiers privés / KYC** | 4/5 | 3/5 | 5/5 (buckets privés + RLS) | 5/5 |
| **URLs signées** | 5/5 | 3/5 | 5/5 | 5/5 |
| **Coût MVP** | Gratuit (25 crédits/mois) | Gratuit (<2GB) | Gratuit (1GB Supabase) | ~$5–10/mois |
| **Coût V2** | $89/mois (Plus) | $10/mois | $25/mois (Supabase Pro) | $20–50/mois |

**Sensibilité KYC :** Les documents d'identité doivent être dans des buckets privés avec accès contrôlé et audit logging. Supabase Storage avec RLS gère cela nativement.

### ✅ Gagnant : **Supabase Storage (privé) + Cloudinary (images publiques)**

Stratégie hybride :
- **Supabase Storage** : Documents KYC, fichiers agence, livrables de commandes, tout contenu nécessitant contrôle d'accès
- **Cloudinary** (free tier → pay-as-you-go) : Images de service, photos portfolio, avatars — contenu public nécessitant optimisation on-the-fly (`/c_fill,w_400,h_300,q_auto,f_auto/`)

---

## 9. Email

### Tableau comparatif

| Critère | Resend | SendGrid | Postmark | AWS SES |
|---|---|---|---|---|
| **DX** | 5/5 | 3/5 | 4/5 | 2/5 |
| **Support React Email** | 5/5 (conçu pour) | 3/5 | 3/5 | 2/5 |
| **Délivrabilité** | 4/5 | 4/5 | 5/5 | 3/5 |
| **Coût MVP** | Gratuit (3K/mois) | Gratuit (100/jour) | $15/mois (10K) | ~$1/10K emails |
| **Coût 100K emails/mois** | $20/mois | $80/mois | $79/mois | ~$10/mois |
| **Qualité API** | 5/5 | 3/5 | 4/5 | 3/5 |

**Avantage clé :** Les 23 templates d'email du PRD peuvent être construits en composants React — même système de composants que le frontend. DX massif pour un fondateur solo.

### ✅ Gagnant : **Resend + React Email**

API propre (`resend.emails.send({...})`). Free tier suffisant pour MVP. $20/mois Pro couvre 50K emails/mois jusqu'à V2. Si délivrabilité vers certains providers internationaux problématique, ajouter Postmark comme secondaire pour emails critiques (confirmation paiement, alertes sécurité).

---

## 10. Hébergement / Déploiement

### Tableau comparatif

| Critère | Vercel + Railway | Render | Fly.io | Coolify (self-hosted) | AWS |
|---|---|---|---|---|---|
| **DX** | 5/5 | 4/5 | 4/5 | 3/5 | 2/5 |
| **Optimisation Next.js** | 5/5 (natif) | 3/5 | 3/5 | 3/5 | 3/5 |
| **CDN Global** | 5/5 (Vercel edge mondial) | 2/5 | 3/5 | 3/5 | 5/5 |
| **Coût MVP** | $20–40/mois | $14–25/mois | $10–20/mois | $15–30/mois | $50–150/mois |
| **Coût V2** | $50–150/mois | $35–80/mois | $40–100/mois | $30–60/mois | $150–500/mois |
| **Support WebSocket** | Vercel: Non, Railway: Oui | Oui | Oui | Oui | Oui |
| **Zero-config deploy** | 5/5 | 4/5 | 3/5 | 2/5 | 1/5 |
| **Complexité** | Faible | Faible | Moyenne | Élevée | Très élevée |

**Contrainte critique :** Les fonctions serverless Vercel ne supportent pas les connexions WebSocket persistantes. Railway, Render et Fly.io supportent tous les processus long-running avec WebSocket.

### ✅ Gagnant : **Vercel (frontend) + Railway (backend)**

- **Vercel** : Optimal pour Next.js (Image Optimization, Edge Functions, ISR). Réseau Edge mondial avec nœuds en Europe, Amérique, Asie et Johannesburg. Déploiements preview automatiques sur chaque PR.
- **Railway** : Backend Fastify + Socket.io + BullMQ. Build nixpacks sans configuration. Pricing usage-based. Même région EU que Supabase pour latence interne minimale.

---

## 11. Gestion d'État

### ✅ Gagnant : **Zustand (état client) + TanStack Query v5 (état serveur)**

Ce sont des outils complémentaires, non concurrents :
- **Zustand** : Devise sélectionnée, langue active, état UI modales, étape wizard commande, préférence thème (~1KB bundle)
- **TanStack Query** : Tout ce qui vient de l'API — services, commandes, messages, profils, transactions

Redux = sur-ingénierie. Context API = problèmes de performance à l'échelle. TanStack Query v5 avec rafraîchissement background automatique garde le dashboard à jour sans Socket.io pour les vues lecture intensive.

---

## 12. Internationalisation

### ✅ Gagnant : **next-intl**

Architecture i18n en phases :
- **MVP** : `fr` uniquement
- **V1 (M4–6)** : `fr` + `en`
- **V2+ (M7–10)** : `ar` (support RTL), `es`, `pt` (francophonie élargie — Brésil, Angola, Mozambique)

Points techniques critiques :
- Tailwind CSS classes `rtl:` pour le support arabe dès le design initial
- `dir="rtl"` conditionnel sur `<html>` selon la locale active
- Contenu de recherche (`tsvector`) indexé par langue (`to_tsvector('french', ...)` vs `'english'` vs `'arabic'`)
- Emails multilingues via React Email avec locale passée en props

---

## 13. Paiements (Scope International)

### Tableau comparatif

| Critère | Stripe + CinetPay | Flutterwave | Paystack + Stripe | Fapshi |
|---|---|---|---|---|
| **Paiements EUR/USD carte** | 5/5 (Stripe) | 4/5 | 4/5 | 2/5 |
| **Mobile Money (Orange/Wave/MTN)** | CinetPay: 4/5 | 5/5 | 4/5 | 4/5 |
| **Escrow/marketplace** | Stripe Connect: 5/5 | 3/5 (basique) | Limité | Non |
| **Billing abonnements** | 5/5 (Stripe Billing) | 3/5 | 3/5 | Non |
| **Europe / Amérique du Nord** | 5/5 | 2/5 | 2/5 | Non |
| **Diaspora francophone (France/BE/CH/CA)** | 5/5 (Stripe SEPA) | 2/5 | 2/5 | Non |
| **Afrique francophone (17 pays)** | CinetPay: 4/5 | 5/5 | 4/5 | Non |
| **Qualité API / Webhooks** | 5/5 + 4/5 | 4/5 | 4/5 | 3/5 |
| **USDC/USDT V4** | Via Stripe Crypto | Non | Non | Non |

**CinetPay** est le gateway dominant spécifiquement pour l'Afrique francophone (17 pays). **Stripe** couvre l'intégralité de l'Europe, de l'Amérique du Nord, et de l'Asie — indispensable pour la diaspora francophone et les clients internationaux.

### ✅ Gagnant : **Stripe Connect + CinetPay (MVP) → Ajouter Flutterwave (V1)**

**Architecture paiements internationale :**
- **Couche 1 (Stripe Connect)** : Cartes Visa/Mastercard mondiales, SEPA (France, Belgique, Suisse), PayPal, Apple Pay, Google Pay, Stripe Billing pour abonnements, Stripe Connect Express pour payouts freelances (KYC compliance intégrée), futur USDC/USDT via Stripe Crypto (V4)
- **Couche 2 (CinetPay)** : Orange Money SN/CI/CM, Wave SN/CI, MTN MoMo CI/CM, Moov Money — 17 pays africains francophones
- **Couche 3 (Flutterwave, V1)** : Expansion Nigeria, Ghana, Kenya, Rwanda + WeChat Pay / Alipay Asie + fallback si CinetPay downtime

**Flux escrow :** Client paie → fonds bloqués Stripe Connect → commande complétée → fonds transférés compte Stripe Connect freelance → retrait via Stripe payouts (international) ou CinetPay withdrawal API (Mobile Money). Pour paiements Mobile Money via CinetPay, logique escrow implémentée en DB (`wallet_transactions.escrow_status`).

---

## Stack Technique Recommandé Final

### Tableau complet MVP

```
COUCHE                  TECHNOLOGIE                         JUSTIFICATION
─────────────────────────────────────────────────────────────────────────
Frontend                Next.js 14 (App Router)             DX, RSC, Vercel CDN mondial
Composants UI           shadcn/ui + Radix UI                Accessible, personnalisable
Styles                  Tailwind CSS                        Utility-first, RTL natif (rtl:)
État client             Zustand                             Minimal, TypeScript natif
État serveur            TanStack Query v5                   Standard industrie async state
i18n                    next-intl                           FR → EN → AR/ES/PT progressif
─────────────────────────────────────────────────────────────────────────
Backend                 Fastify (Node.js 20+)               Rapide, TypeScript natif
Type Safety API         tRPC v11 (sur Fastify)              Type safety end-to-end
Temps réel chat         Socket.io (sur Fastify)             WebSocket battle-tested
Jobs background         BullMQ + Redis                      Queue fiable (emails, PDFs)
─────────────────────────────────────────────────────────────────────────
Base de données         Supabase (Postgres 15+)             Relationnel, RLS, realtime
ORM                     Prisma 5                            Meilleur DX schéma, migrations
Cache                   Redis (Upstash ou Railway)          Sessions, cache, BullMQ
Temps réel DB           Supabase Realtime                   Broadcasts changements DB
─────────────────────────────────────────────────────────────────────────
Auth                    Supabase Auth                       Intégré DB, OAuth, JWT custom
2FA                     Supabase TOTP                       Compatible Google Authenticator
─────────────────────────────────────────────────────────────────────────
Recherche MVP           Postgres FTS (pg_trgm)              Coût zéro, multilingue natif
Recherche V2+           Meilisearch (Railway)               Auto-hébergé, $15/mois
Recherche sémantique V3 pgvector + OpenAI                   Dans Postgres existant
─────────────────────────────────────────────────────────────────────────
Médias publics          Cloudinary (free → PAYG)            Optimisation image, transforms
Médias privés           Supabase Storage                    KYC docs, livrables, RLS
PDF                     React PDF (server-side)             Factures, contrats
─────────────────────────────────────────────────────────────────────────
Email                   Resend + React Email                DX moderne, templates React
SMS transactionnel      Twilio (ou Africa's Talking)        Codes 2FA, notifications mobile
Push notifications      Web Push API (service worker)       PWA push, gratuit
─────────────────────────────────────────────────────────────────────────
Paiements intl          Stripe Connect                      Escrow marketplace, abonnements
Paiements Afrique       CinetPay                            Orange Money, Wave, MTN MoMo
Paiements V1            Flutterwave                         Afrique élargie + fallback
─────────────────────────────────────────────────────────────────────────
IA                      OpenAI API (GPT-4o)                 Génération contrats, certifs
Embeddings              text-embedding-3-small              Vecteurs recherche sémantique
─────────────────────────────────────────────────────────────────────────
Hébergement frontend    Vercel Pro                          Edge CDN mondial, Next.js natif
Hébergement backend     Railway                             Fastify + Socket.io + BullMQ
Hébergement DB          Supabase Cloud (eu-central-1)       Postgres + Auth + Storage
Cache Redis             Upstash (serverless) ou Railway     BullMQ + cache sessions
─────────────────────────────────────────────────────────────────────────
Monitoring              Sentry (frontend + backend)         Tracking erreurs, performance
Analytics               PostHog (cloud ou self-hosted)      Analytics produit, funnels
─────────────────────────────────────────────────────────────────────────
Blockchain V4           Ethereum / Base L2                  Contrat escrow smart contract
Web3 V4                 viem + wagmi                        Librairie EVM moderne
─────────────────────────────────────────────────────────────────────────
i18n                    next-intl                           FR, EN, AR (support RTL)
SEO                     Next.js Metadata API                Sitemap, Schema.org, OG tags
CI/CD                   GitHub Actions                      Lint, test, pipeline deploy
Monorepo                pnpm workspaces + Turborepo         apps/web, apps/api, packages/*
```

---

## Écarts par rapport au Stack Proposé dans le PRD

| PRD Proposé | Changement Recommandé | Raison |
|---|---|---|
| Express/Fastify (les deux mentionnés) | **Fastify uniquement** | Fastify strictement meilleur — plus rapide, meilleur TypeScript, meilleurs plugins |
| NextAuth.js | **Supabase Auth** | Déjà sur Supabase ; NextAuth.js dupliquerait l'infrastructure auth |
| Algolia | **Postgres FTS (MVP) → Meilisearch (V2)** | Algolia $200–500/mois à l'échelle ; Meilisearch auto-hébergé $15/mois qualité similaire |
| Vercel + Railway | **Confirmé** | Choix correct, maintenu |
| Cloudinary uniquement | **Cloudinary (public) + Supabase Storage (privé)** | Documents KYC ne doivent pas être dans Cloudinary (pas de RLS) |
| Redis | **Upstash Redis (serverless) pour MVP** | Free tier généreux, pricing serverless ; migrer vers Railway Redis si BullMQ nécessite haut throughput |
| Ethereum mainnet | **Base L2 (Ethereum L2) pour V4** | Frais gas Ethereum mainnet rendent les micro-transactions ($5–50) économiquement non viables ; Base L2 a des frais de $0.01, EVM compatible |

---

## Estimation des Coûts

### MVP (0–500 utilisateurs actifs, ~50 commandes/mois)

| Service | Plan | Coût/mois (USD) |
|---|---|---|
| Vercel | Hobby (gratuit) ou Pro | $0–20 |
| Railway (Fastify + BullMQ) | Usage-based | $5–15 |
| Supabase | Free tier (500MB DB, 50K auth MAU) | $0 |
| Redis (Upstash) | Free tier (10K commandes/jour) | $0 |
| Cloudinary | Free tier (25 crédits) | $0 |
| Resend | Free tier (3K/mois) | $0 |
| Stripe | Pas de frais mensuels (2.9% + $0.30/trans.) | $0 base |
| CinetPay | Pas de frais mensuels (% par transaction) | $0 base |
| OpenAI API | Pay-per-use (minimal au MVP) | $5–20 |
| Twilio (SMS) | Pay-per-use | $5–10 |
| Sentry | Free tier | $0 |
| PostHog | Free tier (1M events/mois) | $0 |
| Domaine | .com annuel | ~$1.5 |
| **Total MVP** | | **~$20–70/mois** |

### V1/V2 (1K–10K utilisateurs, 500+ commandes/mois)

| Service | Coût/mois (USD) |
|---|---|
| Vercel Pro | $20 |
| Railway Hobby/Pro | $20–40 |
| Supabase Pro | $25 |
| Redis Upstash | $5–15 |
| Meilisearch (Railway) | $10–15 |
| Cloudinary Plus | $15–89 |
| Resend Pro | $20 |
| OpenAI API | $30–100 |
| Twilio volume | $20–50 |
| Sentry Team | $26 |
| **Total V2** | **~$200–420/mois** |

---

## Structure Monorepo

```
freelancehigh/
├── apps/
│   ├── web/                    # Next.js 14 App Router
│   │   └── app/
│   │       ├── (public)/       # Landing, marketplace, blog
│   │       ├── (auth)/         # Inscription, connexion, onboarding
│   │       ├── dashboard/      # Espace Freelance
│   │       ├── client/         # Espace Client
│   │       ├── agence/         # Espace Agence
│   │       └── admin/          # Espace Admin
│   └── api/                    # Fastify backend
│       └── src/
│           ├── routes/         # Routers tRPC
│           ├── socket/         # Handlers Socket.io
│           ├── workers/        # Processeurs jobs BullMQ
│           ├── services/       # Logique métier
│           └── lib/            # Stripe, CinetPay, Resend, etc.
├── packages/
│   ├── db/                     # Schéma Prisma + client généré
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── types/                  # Types TypeScript partagés
│   ├── ui/                     # Composants shadcn/ui partagés
│   └── config/                 # Configs ESLint, TypeScript partagées
├── package.json                # Racine workspace pnpm
├── turbo.json                  # Config Turborepo
└── .github/workflows/          # Pipelines CI/CD
```

---

## Registre des Risques

| Risque | Sévérité | Mitigation |
|---|---|---|
| **Limites free tier Supabase atteintes rapidement** | Moyen | Monitorer le dashboard ; upgrade Pro ($25/mois) si approche des limites. Données Postgres portables. |
| **Instabilité API CinetPay** | Élevé | Retry logic via BullMQ ; Flutterwave comme fallback pour routes Mobile Money critiques |
| **Spike pricing Vercel à l'échelle** | Moyen | Next.js fonctionne sur n'importe quel host Node.js. Chemin migration : déployer Next.js sur Railway si Vercel devient coûteux |
| **Dépassement coût API OpenAI (V3)** | Moyen | Rate-limiter les appels IA par tier utilisateur ; cacher résultats embeddings dans pgvector ; utiliser `gpt-4o-mini` pour certifications, `gpt-4o` uniquement pour génération contrats |
| **Stripe Connect non disponible dans certains pays africains** | Élevé | Stripe Connect Express disponible dans la majorité des pays EU pour la diaspora. Pour freelances physiquement en Afrique, CinetPay payouts vers Mobile Money comme méthode de retrait principale |
| **Conformité RGPD + réglementations locales** | Moyen | Région EU Supabase est RGPD-conforme. Documenter la base légale du traitement. Prévoir CCPA (USA) et LGPD (Brésil) en V2+. |
| **Complexité App Router ralentissant le MVP** | Moyen | Utiliser le modèle mental Pages Router dans App Router si possible ; éviter les Server Components au MVP ; adopter progressivement en V2+ |
| **Mise à l'échelle Socket.io au-delà d'un seul serveur** | Faible (MVP) | Configurer l'adaptateur Redis Socket.io dès le jour 1 (même si une seule instance initialement) |
| **Bugs smart contract escrow Ethereum (V4)** | Élevé | Audit professionnel du contrat avant lancement ; utiliser les librairies auditées OpenZeppelin ; limiter le montant par transaction escrow initialement |
| **Support RTL arabe mal implémenté** | Moyen | Utiliser les classes Tailwind `rtl:` dès le composant initial ; tester sous `dir="rtl"` avant V2 ; prévoir budget design pour révision UX arabe |

---

## Chemins d'Upgrade par Version

| Version | Changement infrastructure |
|---|---|
| **V1 (M4–6)** | Ajouter Meilisearch sur Railway · Upgrade Supabase Pro · Ajouter Flutterwave · Supabase Realtime pour statuts commandes live · Lancer locale `en` |
| **V2 (M7–10)** | Déplacer Socket.io vers service Railway dédié si trafic WebSocket élevé · Ajouter PostHog Cloud · Locale `ar` (RTL) + `es` · Stripe WeChat Pay / Alipay |
| **V3 (M11–15)** | Activer `pgvector` sur Supabase · Pipeline embeddings OpenAI via BullMQ · Locale `pt` · Évaluer Neon si limites connexions Supabase atteintes |
| **V4 (M16–20)** | Évaluer Fly.io si factures Vercel significatives · Déployer contrat escrow sur Base L2 (OpenZeppelin) · PWA Workbox pour service worker · API publique via Railway ou Kong API gateway |

---

## Verdict Final

Le stack proposé dans le PRD est **correct à 85%**. Les 5 corrections clés :

1. **Remplacer NextAuth.js par Supabase Auth** — élimine l'infrastructure auth dupliquée
2. **Remplacer Algolia par Postgres FTS → Meilisearch** — économise $200–500/mois à l'échelle
3. **Diviser le stockage médias** entre Cloudinary (images publiques) et Supabase Storage (fichiers privés) — nécessaire pour la sécurité des documents KYC
4. **Ajouter tRPC sur Fastify** — type safety end-to-end élimine toute une classe d'erreurs runtime
5. **Utiliser Base L2 au lieu d'Ethereum mainnet** pour V4 — frais de transaction 1000x inférieurs

Le stack recommandé est orienté vers : **TypeScript partout**, **une seule base de données relationnelle** (Postgres/Supabase), **services managés** pour réduire la charge opérationnelle d'un fondateur solo, **scope international dès l'architecture** (CDN mondial, i18n progressif, Stripe pour la diaspora + CinetPay pour l'Afrique francophone), et **chemins d'upgrade explicites** à chaque jalon de version.

---

*© 2026 FreelanceHigh. Rapport préparé avec Claude Code.*
