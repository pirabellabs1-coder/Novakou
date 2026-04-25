## Why

Les plans d'abonnement actuels (Gratuit 12%, Pro 1€/vente, Business 1€/vente, Agence 1€/vente) sont fonctionnels mais **non différenciants** face à la concurrence (Fiverr 20%, Upwork 10-15%, ComeUp 20%). Le modèle manque d'identité de marque et de progression claire entre les paliers.

Nous remplaçons les 4 plans par un modèle **"Élévation"** avec des noms thématiques (Découverte → Ascension → Sommet → Empire), une commission dégressive spectaculaire (12% → 5% → 1€ fixe → **0%**), et des features clairement progressives à chaque palier. Le plan Empire fusionne freelance premium + agence.

**Version cible : MVP** (remplacement immédiat des plans existants)

## What Changes

- **BREAKING** : Renommage des 4 plans : `GRATUIT` → `DECOUVERTE`, `PRO` → `ASCENSION`, `BUSINESS` → `SOMMET`, `AGENCE` → `EMPIRE`
- **BREAKING** : Nouveaux prix : 0€ / 15€ / 29,99€ / 65€ (au lieu de 0€ / 15€ / 45€ / 99€)
- **BREAKING** : Nouveau modèle de commission : 12% / 5% / 1€ fixe par vente / 0%
- Nouvelles limites par plan : services (5/15/∞/∞), candidatures (10/30/∞/∞), boosts (0/3/10/20), certif IA (0/1/∞/∞), scénarios (0/3/10/∞)
- Réduction annuelle 25% affichée sur la page tarifs
- Page `/tarifs` entièrement refondue avec thème "Élévation"
- Pages `/dashboard/abonnement` et `/agence/abonnement` mises à jour
- Pages de paiement mises à jour avec nouveaux noms et prix
- `lib/plans.ts` refondu avec les nouvelles règles
- Enum Prisma `UserPlan` mis à jour
- Stripe Price IDs à reconfigurer (nouvelles variables d'env)
- API `/api/subscription` mise à jour
- Toutes les références aux anciens noms de plans (Gratuit/Pro/Business/Agence) remplacées

## Capabilities

### New Capabilities
- `pricing-plans-elevation`: Nouveau système de plans d'abonnement avec 4 paliers thématiques (Découverte/Ascension/Sommet/Empire), commission dégressive, et features progressives clairement différenciées

### Modified Capabilities
- `role-normalization`: Les noms de plans dans le JWT et les stores doivent refléter les nouveaux noms (decouverte/ascension/sommet/empire)

## Impact

### Code impacté
- `apps/web/lib/plans.ts` — Refonte complète des PLAN_RULES et fonctions de calcul
- `apps/web/app/(public)/tarifs/page.tsx` — Nouvelle page avec thème Élévation
- `apps/web/app/dashboard/abonnement/page.tsx` — Nouveaux plans freelance
- `apps/web/app/dashboard/abonnement/paiement/page.tsx` — Nouveaux prix/noms
- `apps/web/app/agence/abonnement/page.tsx` — Fusionné dans Empire
- `apps/web/app/agence/abonnement/paiement/page.tsx` — Nouveaux prix/noms
- `apps/web/app/api/subscription/route.ts` — Nouveaux plan IDs
- `apps/web/lib/auth/config.ts` — JWT claim `subscription_tier` avec nouveaux noms
- `apps/web/store/dashboard.ts` — Plan names
- `apps/web/store/admin.ts` — Plan display
- `apps/web/messages/fr.json` + `en.json` — Traductions plans
- `apps/web/lib/demo-data.ts` — DEMO_PLANS mis à jour
- `apps/web/lib/stripe/connect.ts` — Commission hardcodée 20% → utiliser `calculateCommissionEur()`

### Prisma
- Enum `UserPlan` : `GRATUIT` → `DECOUVERTE`, `PRO` → `ASCENSION`, `BUSINESS` → `SOMMET`, `AGENCE` → `EMPIRE`
- Migration de données pour les utilisateurs existants

### Variables d'environnement
- `STRIPE_PRICE_ASCENSION` (remplace `STRIPE_PRICE_PRO`)
- `STRIPE_PRICE_SOMMET` (remplace `STRIPE_PRICE_BUSINESS`)
- `STRIPE_PRICE_EMPIRE` (remplace `STRIPE_PRICE_AGENCE`)

### Impact multi-rôles
- Freelance : voit Découverte/Ascension/Sommet/Empire dans son abonnement
- Agence : plan Empire inclut gestion d'équipe (pas de plan séparé "Agence")
- Client : non impacté directement (pas d'abonnement client)
- Admin : voit les nouveaux noms de plans dans le dashboard utilisateurs
