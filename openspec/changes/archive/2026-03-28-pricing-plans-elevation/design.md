## Context

FreelanceHigh a actuellement 4 plans (Gratuit/Pro/Business/Agence) définis dans `lib/plans.ts` avec une logique de commission mixte (12% pour Gratuit, 1€ fixe pour les plans payants). Les plans sont référencés dans ~15 fichiers (pages tarifs, abonnement, paiement, API subscription, stores, traductions, demo-data, Stripe connect).

L'enum Prisma `UserPlan` (GRATUIT/PRO/BUSINESS/AGENCE) est stocké sur chaque User. Le JWT contient `plan` en lowercase via `lib/auth/config.ts`.

## Goals / Non-Goals

**Goals:**
- Remplacer les 4 plans par Découverte (0€, 12%) / Ascension (15€, 5%) / Sommet (29,99€, 1€ fixe) / Empire (65€, 0%)
- Mettre à jour TOUTES les références dans le code (plans.ts, pages, API, stores, traductions, demo-data)
- Page `/tarifs` refondue avec progression visuelle claire entre paliers
- Empire = plan unifié freelance premium + agence (équipe + CRM)
- Commission Stripe Connect dynamique (utiliser `calculateCommissionEur()` au lieu du hardcoded 20%)

**Non-Goals:**
- Pas de migration Prisma enum (on garde les anciens noms DB en mappant : GRATUIT→découverte, PRO→ascension, BUSINESS→sommet, AGENCE→empire)
- Pas de changement de la logique d'escrow ou de wallet
- Pas de nouveau template email pour changement de plan
- Pas de regional pricing (FCFA vs EUR) — sera V1

## Decisions

### 1. Pas de migration d'enum Prisma — mapping dans `normalizePlanName()`

**Choix :** Garder l'enum DB `UserPlan { GRATUIT PRO BUSINESS AGENCE }` inchangé et mapper dans le code applicatif.

**Rationale :** Une migration d'enum Prisma sur une table User existante est risquée (données financières). Le mapping est simple : `GRATUIT`→`decouverte`, `PRO`→`ascension`, `BUSINESS`→`sommet`, `AGENCE`→`empire`.

**Alternative rejetée :** Migrer l'enum → risque de perte de données, downtime.

### 2. Commission hybride : pourcentage vs fixe

**Choix :**
- Découverte : 12% (pourcentage)
- Ascension : 5% (pourcentage)
- Sommet : 1€ fixe par vente (fixe en centimes = 100)
- Empire : 0% / 0€ (zéro)

**Rationale :** La progression 12% → 5% → 1€ → 0% crée un message marketing clair. Le 1€ fixe est le "sweet spot" : pour une vente de 100€, c'est 1% ; pour 500€, c'est 0.2%.

### 3. Source unique de vérité : `lib/plans.ts`

**Choix :** `PLAN_RULES` dans `lib/plans.ts` est LA source de vérité. Toutes les pages (tarifs, abonnement, paiement) importent depuis ce fichier. Plus de constantes PLANS locales dans chaque page.

**Rationale :** Actuellement il y a 4 définitions différentes (plans.ts, tarifs page, abonnement page, paiement page) avec des incohérences. Une source unique élimine les divergences.

### 4. Stripe Connect : commission dynamique

**Choix :** Remplacer le hardcoded `Math.round(amount * 0.20)` dans `lib/stripe/connect.ts` par `calculateCommissionEur(vendorPlan, amountEur) * 100`.

**Rationale :** Actuellement tous les freelances paient 20% à Stripe, même les plans payants. C'est un bug critique car les plans payants promettent des commissions réduites.

### 5. Réduction annuelle : 25%

**Choix :** Prix annuel = prix mensuel × 12 × 0.75 (25% de réduction).
- Ascension : 15€ × 12 × 0.75 = 135€/an (11,25€/mo)
- Sommet : 29,99€ × 12 × 0.75 = 269,91€/an (22,49€/mo)
- Empire : 65€ × 12 × 0.75 = 585€/an (48,75€/mo)

### 6. Noms d'affichage vs identifiants techniques

**Choix :**
- Affichage : "Découverte", "Ascension", "Sommet", "Empire"
- ID technique / JWT : "decouverte", "ascension", "sommet", "empire"
- DB Prisma : GRATUIT, PRO, BUSINESS, AGENCE (inchangé)
- Stripe env vars : STRIPE_PRICE_ASCENSION, STRIPE_PRICE_SOMMET, STRIPE_PRICE_EMPIRE

## Risks / Trade-offs

- **Incohérence temporaire** : Les tokens JWT existants contiennent les anciens noms ("gratuit", "pro", etc.). → `normalizePlanName()` gère le mapping bidirectionnel (ancien → nouveau, nouveau → ancien).
- **Commission 0% sur Empire** : Risque de freelances à très haut volume qui ne génèrent aucun revenu pour la plateforme. → Le prix d'abonnement de 65€/mo compense. Un freelance doit générer > 542€/mo de ventes pour que Empire soit plus avantageux que Découverte à 12%.
- **Stripe application_fee = 0 pour Empire** : Stripe autorise `application_fee_amount: 0` sur les PaymentIntents. Pas de problème technique.

## Open Questions

- Faut-il un plan "Starter" entre Découverte et Ascension pour les marchés africains (prix réduit en FCFA) ? → Reporté à V1.
