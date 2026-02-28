# FreelanceHigh — Architecture Technique
> Document de référence · Février 2026 · Fondateur : Lissanon Gildas

**Plateforme internationale de freelancing**, francophone en premier, avec roadmap d'expansion linguistique progressive. 4 rôles : Freelance, Client, Agence, Admin. Roadmap MVP → V4 sur 20 mois.

---

## Principes directeurs

- **TypeScript partout** — frontend, backend, schéma DB, types partagés
- **Une seule base relationnelle** — Postgres/Supabase, pas de NoSQL
- **Services managés** — réduire la charge opérationnelle d'un fondateur solo
- **Chemins d'upgrade explicites** — chaque choix MVP a une migration définie
- **i18n dès le jour 1** — architecture multilingue même si seul `fr` est actif au MVP

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
│           └── lib/            # Stripe, CinetPay, Resend, OpenAI…
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

**Gestionnaire de packages :** `pnpm workspaces`
**Build orchestration :** `Turborepo`

---

## Frontend

| Outil | Choix | Notes |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | SSR + SSG + ISR, React Server Components |
| Composants UI | **shadcn/ui + Radix UI** | Accessible, non-opinionated, personnalisable |
| Styles | **Tailwind CSS** | Classes `rtl:` pour support arabe natif |
| État client | **Zustand** | Devise, langue, modales, wizards (~1KB) |
| État serveur | **TanStack Query v5** | Cache, refetch background, optimistic updates |
| i18n | **next-intl** | Routing par locale, RSC-compatible |
| PWA | **next-pwa** | Service worker, installation écran d'accueil (V4) |
| SEO | **Next.js Metadata API** | Sitemap dynamique, Schema.org, OG tags |

**Séparation des responsabilités état :**
- Zustand → état purement UI (devise choisie, langue active, étape wizard, thème)
- TanStack Query → tout ce qui vient de l'API (services, commandes, profils, transactions)

---

## Backend

| Outil | Choix | Notes |
|---|---|---|
| Runtime | **Node.js 20+** | LTS stable |
| Framework HTTP | **Fastify** | 2–3x plus rapide qu'Express, TypeScript natif |
| API type-safe | **tRPC v11** (sur Fastify) | Type safety end-to-end sans génération de code |
| WebSocket | **Socket.io** (sur Fastify) | Chat temps réel, présence, typing indicators |
| Queue de jobs | **BullMQ** | Emails, PDFs, retraits, webhooks paiement |
| Cache / BullMQ broker | **Redis** | Upstash (MVP) → Railway Redis (V2+) |

**Pourquoi Fastify séparé et non Next.js API Routes :**
Le projet nécessite des WebSockets persistants (chat), des uploads KYC illimités, de la génération PDF, et des jobs longs (retraits, emails). Ces cas d'usage sont incompatibles avec les fonctions serverless Vercel (timeout 10–30s, limite upload 4.5MB, pas de WebSocket natif).

**Adaptateur Redis Socket.io** configuré dès le jour 1 pour permettre la montée en charge horizontale sans refactoring.

---

## Base de Données

**Supabase (Postgres 15+)** — région `eu-central-1` (Frankfurt)

| Composant Supabase | Usage |
|---|---|
| **Postgres** | Base principale, toutes les données métier |
| **Row Level Security (RLS)** | Contrôle d'accès par rôle au niveau DB |
| **Supabase Auth** | Authentification (voir section Auth) |
| **Supabase Storage** | Fichiers privés (voir section Stockage) |
| **Supabase Realtime** | Broadcasts changements DB (statuts commandes, dashboard admin) |

**ORM : Prisma 5**
- `schema.prisma` = source unique de vérité pour 50+ tables
- `prisma migrate` pour les migrations (critique sur une plateforme financière)
- `prisma.$queryRaw` pour les requêtes analytics complexes et le reporting financier

**Cache : Redis (Upstash)**
- Sessions utilisateurs
- Rate limiting
- Broker BullMQ
- Résultats de recherche fréquents

> Région Frankfurt choisie pour minimiser la latence vers l'Europe de l'Ouest, l'Afrique du Nord et l'Afrique subsaharienne — centre géographique de la francophonie mondiale.

---

## Authentification

**Supabase Auth** — intégré au même projet Supabase, élimine un vendor dédié.

| Fonctionnalité | Implémentation |
|---|---|
| Email + mot de passe | Natif Supabase |
| OAuth social | Google, Facebook, LinkedIn, Apple (natif) |
| Vérification email | OTP natif |
| 2FA TOTP | Natif Supabase (Google Authenticator compatible) |
| 2FA SMS | Twilio via Supabase |
| JWT custom claims | `role`, `kyc_level`, `subscription_tier` |
| Impersonation admin | Service-role JWT (support utilisateur) |
| RLS | `auth.uid()` référencé directement dans les policies |

**KYC progressif — 4 niveaux :**
- **Niveau 1** : Email vérifié → accès de base
- **Niveau 2** : Téléphone vérifié → envoyer des offres, commander
- **Niveau 3** : Pièce d'identité → retirer des fonds, publier des services
- **Niveau 4** : Vérification professionnelle → badge Elite, limites relevées

Les claims JWT `kyc_level` et `role` permettent au middleware Next.js de filtrer l'accès sans requête DB supplémentaire à chaque requête.

---

## Temps Réel — Architecture Hybride

Deux outils complémentaires avec des rôles distincts :

### Socket.io (chat & présence)
Hébergé sur le serveur Fastify (Railway).

| Use case | Détail |
|---|---|
| Messagerie temps réel | Typing indicators, read receipts, pièces jointes |
| Présence utilisateur | Statut "en ligne" dans les conversations |
| Canaux agence | Messagerie interne par projet |

### Supabase Realtime (broadcasts DB)
Change Data Capture natif sur Postgres.

| Use case | Détail |
|---|---|
| Statuts commandes | Mise à jour live dans le dashboard client/freelance |
| Métriques admin | Dashboard admin en temps réel |
| Notifications in-app | Nouveaux messages, nouvelles commandes |

---

## Recherche — Roadmap par Version

La stratégie évolue en 3 phases pour éviter une dépendance coûteuse dès le MVP.

### MVP–V1 : Postgres Full-Text Search
Extensions : `pg_trgm` + `tsvector` + index GIN
Coût : $0 (inclus dans Supabase)

```sql
-- Colonne générée sur la table services
ALTER TABLE services ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('french', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED;

CREATE INDEX services_search_idx ON services USING GIN(search_vector);
```

Gère 10K–100K records sans infrastructure supplémentaire. Les filtres (prix, compétences, pays, note) sont déjà en Postgres — pas de synchronisation externe.

### V2 : Meilisearch (Railway, ~$15/mois)
Sync depuis Postgres via BullMQ workers. Tolérance aux fautes de frappe, support multilingue natif.

### V3 : pgvector + OpenAI (recherche sémantique)
Extension `pgvector` activée sur Supabase. Pipeline d'embeddings via BullMQ + `text-embedding-3-small`. Recherche hybride : Meilisearch full-text + pgvector similarité vectorielle.

---

## Stockage Médias — Stratégie Hybride

Deux outils avec des périmètres clairement séparés selon la sensibilité des données.

### Supabase Storage (fichiers privés)
Buckets privés avec RLS. Accès via URLs signées à durée limitée.

| Contenu | Bucket |
|---|---|
| Documents KYC (CNI, passeport) | `kyc-documents` (privé) |
| Livrables de commandes | `order-deliveries` (privé) |
| Ressources agence | `agency-resources` (privé) |
| Contrats signés | `contracts` (privé) |

### Cloudinary (images publiques)
Optimisation on-the-fly via URL transforms. Free tier → pay-as-you-go.

| Contenu | Transform exemple |
|---|---|
| Avatars | `/c_fill,w_200,h_200,r_max,q_auto,f_auto/` |
| Images de services | `/c_fill,w_800,h_600,q_auto,f_auto/` |
| Photos portfolio | `/c_limit,w_1200,q_auto,f_auto/` |

**Règle :** Tout document nécessitant un contrôle d'accès ou un audit trail → Supabase Storage. Tout contenu public nécessitant de l'optimisation image → Cloudinary.

---

## Email, SMS et Push

### Email transactionnel : Resend + React Email
Templates construits en composants React — même système que le frontend.

```ts
// Usage type
await resend.emails.send({
  from: 'FreelanceHigh <no-reply@freelancehigh.com>',
  to: user.email,
  subject: 'Votre commande a été acceptée',
  react: <OrderConfirmedEmail order={order} locale={user.locale} />,
})
```

23 templates email définis dans le PRD, tous construits comme composants React Email dans `packages/ui/emails/`.

### SMS transactionnel : Twilio
Codes 2FA, alertes de sécurité, notifications critiques mobiles. Africa's Talking en fallback pour les marchés africains avec couverture Twilio limitée.

### Push notifications : Web Push API
Via service worker (PWA). Gratuit, natif navigateur. Activé à V4 avec Workbox.

---

## Paiements — Architecture Internationale

Trois couches complémentaires selon la géographie et le cas d'usage.

### Couche 1 — Stripe Connect (international)
- Cartes Visa / Mastercard mondiales
- SEPA (France, Belgique, Suisse, Allemagne)
- PayPal, Apple Pay, Google Pay
- **Stripe Connect Express** : payouts vers freelances, KYC embarqué
- **Stripe Billing** : abonnements Pro/Business/Agence avec toggle mensuel/annuel
- Stripe Crypto (V4) : USDC/USDT

### Couche 2 — CinetPay (Afrique francophone, MVP)
17 pays couverts : Orange Money SN/CI/CM, Wave SN/CI, MTN MoMo CI/CM, Moov Money.

### Couche 3 — Flutterwave (Afrique élargie, V1)
Nigeria, Ghana, Kenya, Rwanda. Fallback CinetPay si downtime. WeChat Pay / Alipay pour l'Asie.

### Flux Escrow
```
Client paie
  → Fonds bloqués (Stripe Connect hold OU wallet_transactions.escrow_status = 'held')
  → Commande livrée + validée
  → Fonds libérés dans le wallet freelance
  → Retrait : Stripe payouts (international) OU CinetPay withdrawal API (Mobile Money)

En cas de litige :
  → escrow_status = 'disputed'
  → Fonds gelés jusqu'à verdict admin
```

Pour les paiements Mobile Money (CinetPay), l'escrow est géré en base de données via la table `wallet_transactions` car CinetPay ne propose pas de hold natif.

---

## Intelligence Artificielle (V3)

| Usage | Modèle | Déclencheur |
|---|---|---|
| Génération de contrats | `gpt-4o` | À la création de commande |
| Certifications de compétences | `gpt-4o-mini` | Tests surveillés |
| Recommandations freelances | `gpt-4o-mini` | Recherche client |
| Optimisation SEO services | `gpt-4o-mini` | Wizard création service |
| Embeddings recherche sémantique | `text-embedding-3-small` | Pipeline BullMQ |

**Contrôle des coûts :** Rate-limiting par tier utilisateur. Résultats d'embeddings mis en cache dans `pgvector`. `gpt-4o` uniquement pour les cas d'usage justifiant le coût (contrats légaux).

---

## Internationalisation

**Librairie :** `next-intl`

### Roadmap locales

| Version | Locales actives |
|---|---|
| MVP | `fr` |
| V1 (M4–6) | `fr`, `en` |
| V2 (M7–10) | `fr`, `en`, `ar` (RTL) |
| V2+ | `fr`, `en`, `ar`, `es`, `pt` |

### Implémentation RTL (arabe)
```tsx
// app/layout.tsx
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>

// Composant avec support RTL
<div className="ml-4 rtl:mr-4 rtl:ml-0">
```

Les classes Tailwind `rtl:` doivent être utilisées dès les premiers composants, pas ajoutées après coup.

### Recherche multilingue
```sql
-- Indexation selon la langue du contenu
to_tsvector('french', title)   -- services en FR
to_tsvector('english', title)  -- services en EN
to_tsvector('arabic', title)   -- services en AR
```

### Emails multilingues
React Email reçoit la locale en prop et sélectionne le contenu via `next-intl` messages.

---

## Monitoring & Observabilité

| Outil | Périmètre | Plan |
|---|---|---|
| **Sentry** | Erreurs frontend + backend, performance, traces | Free tier (MVP) → Team ($26/mois, V2) |
| **PostHog** | Analytics produit, funnels, cohortes de rétention | Free tier 1M events/mois (MVP) → Cloud (V2) |

Sentry est intégré dans `apps/web` (Next.js) et `apps/api` (Fastify) via leurs SDK respectifs.

---

## Hébergement & Déploiement

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│  UTILISATEUR (navigateur / mobile)                      │
└──────────────┬──────────────────────────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────────────────────────┐
│  VERCEL (Edge Network mondial)                          │
│  Next.js 14 — apps/web                                  │
│  CDN : EU, US, APAC, Johannesburg                       │
└──────────────┬──────────────────────────────────────────┘
               │ tRPC + REST + WebSocket
┌──────────────▼──────────────────────────────────────────┐
│  RAILWAY (EU West)                                      │
│  Fastify + tRPC + Socket.io + BullMQ — apps/api         │
└──────┬───────────────┬──────────────────────────────────┘
       │               │
┌──────▼──────┐ ┌──────▼──────────────────────────────────┐
│  UPSTASH    │ │  SUPABASE (eu-central-1)                 │
│  Redis      │ │  Postgres · Auth · Storage · Realtime    │
└─────────────┘ └─────────────────────────────────────────┘
```

### Vercel (frontend)
- Déploiements preview automatiques sur chaque PR
- Edge Functions pour le middleware d'auth (vérification JWT)
- Image Optimization natif Next.js
- ISR pour les pages marketplace (revalidation 60s)

### Railway (backend)
- Build nixpacks sans Dockerfile
- Pricing usage-based (pas de frais fixes élevés au MVP)
- Même région EU que Supabase → latence interne minimale
- Variables d'environnement gérées dans le dashboard Railway

### CI/CD — GitHub Actions
```yaml
# Pipeline par PR
- Lint (ESLint + TypeScript check)
- Tests unitaires
- Build Turborepo (apps/web + apps/api)
- Deploy preview Vercel + Railway staging

# Pipeline main/production
- Prisma migrate deploy
- Deploy Vercel production
- Deploy Railway production
```

---

## Estimation des Coûts

### MVP (0–500 utilisateurs actifs)

| Service | Plan | USD/mois |
|---|---|---|
| Vercel | Hobby | $0 |
| Railway | Usage-based | $5–15 |
| Supabase | Free tier | $0 |
| Upstash Redis | Free tier | $0 |
| Cloudinary | Free tier | $0 |
| Resend | Free tier | $0 |
| Stripe | 2.9% + $0.30/trans. | $0 fixe |
| CinetPay | % par transaction | $0 fixe |
| OpenAI API | Pay-per-use | $5–20 |
| Twilio SMS | Pay-per-use | $5–10 |
| Sentry | Free tier | $0 |
| PostHog | Free tier | $0 |
| **Total** | | **$15–45/mois** |

### V2 (1K–10K utilisateurs actifs)

| Service | USD/mois |
|---|---|
| Vercel Pro | $20 |
| Railway | $20–40 |
| Supabase Pro | $25 |
| Upstash Redis | $5–15 |
| Meilisearch (Railway) | $10–15 |
| Cloudinary | $15–89 |
| Resend Pro | $20 |
| OpenAI API | $30–100 |
| Twilio | $20–50 |
| Sentry Team | $26 |
| **Total** | **$190–400/mois** |

---

## Roadmap Infrastructure par Version

| Version | Durée | Changements infrastructure |
|---|---|---|
| **MVP** | M1–3 | Stack de base. Vercel Hobby + Railway + Supabase Free. Stripe + CinetPay. Postgres FTS. |
| **V1** | M4–6 | Meilisearch sur Railway. Supabase Pro. Flutterwave. Locale `en`. Supabase Realtime pour statuts commandes live. |
| **V2** | M7–10 | Socket.io sur service Railway dédié si trafic élevé. PostHog Cloud. Locale `ar` (RTL) + `es`. Stripe WeChat Pay / Alipay. |
| **V3** | M11–15 | `pgvector` activé sur Supabase. Pipeline embeddings OpenAI via BullMQ. Locale `pt`. Évaluer Neon si limites connexions Supabase atteintes. |
| **V4** | M16–20 | Escrow smart contract sur Base L2 (OpenZeppelin). PWA Workbox. API publique (Kong ou Railway). Évaluer Fly.io si coûts Vercel excessifs. |

---

## Risques & Mitigations Principaux

| Risque | Sévérité | Mitigation |
|---|---|---|
| Instabilité CinetPay | Élevée | Retry via BullMQ + Flutterwave en fallback (V1) |
| Stripe Connect indisponible pour freelances basés en Afrique | Élevée | CinetPay payouts Mobile Money comme méthode principale de retrait pour ces pays |
| Dépassement coût OpenAI (V3) | Moyenne | Rate-limit par tier ; `gpt-4o-mini` par défaut, `gpt-4o` uniquement pour contrats |
| Spike coût Vercel à grande échelle | Moyenne | Next.js portable sur Railway si nécessaire, sans réécriture |
| Limites free tier Supabase | Moyenne | Upgrade Pro ($25/mois) à ~40K MAU ou 400MB DB |
| RTL arabe mal implémenté | Moyenne | Classes `rtl:` Tailwind dès le composant initial ; tester `dir="rtl"` avant V2 |
| Socket.io non scalable > 1 serveur | Faible (MVP) | Adaptateur Redis configuré dès le jour 1 |
| Bugs contrat escrow blockchain (V4) | Élevée | Audit OpenZeppelin avant déploiement ; limites par transaction ; Base L2 seulement |

---

*© 2026 FreelanceHigh — Document maintenu par le fondateur.*
