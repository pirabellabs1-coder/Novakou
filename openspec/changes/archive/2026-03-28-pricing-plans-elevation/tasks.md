# Tasks — pricing-plans-elevation

## Phase 1 : Source de vérité (lib/plans.ts)

- [x] **Task 1 : Refondre PLAN_RULES dans `lib/plans.ts`** — Remplacer les 4 plans (GRATUIT/PRO/BUSINESS/AGENCE) par les nouveaux (DECOUVERTE/ASCENSION/SOMMET/EMPIRE) avec les nouvelles valeurs : Découverte (12%, 5 services, 10 candidatures, 0 boost, 0 certif, 0 scénario), Ascension (5%, 15 services, 30 candidatures, 3 boosts, 1 certif, 3 scénarios), Sommet (1€ fixe, ∞ services, ∞ candidatures, 10 boosts, ∞ certif, 10 scénarios, productivité), Empire (0€ fixe, ∞ tout, 20 boosts, ∞ scénarios, productivité, 25 membres, CRM, 100GB). Ajouter prix mensuel/annuel dans PLAN_RULES. Ajouter `teamLimit`, `crmAccess`, `cloudStorageGB`, `apiAccess`, `supportLevel`. Mettre à jour `normalizePlanName()` pour mapper ancien→nouveau (GRATUIT→DECOUVERTE, PRO→ASCENSION, BUSINESS→SOMMET, AGENCE→EMPIRE, et aliases lowercase). Mettre à jour `getCommissionLabel()` pour Empire (retourner "0%" au lieu de "0 EUR/vente").

- [x] **Task 2 : Ajouter les exports de pricing et feature lists** — Ajouter dans `lib/plans.ts` : `PLAN_PRICING` (prix mensuel, prix annuel, réduction 25%), `PLAN_FEATURES` (liste de features string[] par plan pour les pages UI), `PLAN_DISPLAY_NAMES` (noms d'affichage : Découverte, Ascension, Sommet, Empire), `PLAN_ORDER` (tableau ordonné des IDs). Exporter un type `PlanId` = "decouverte" | "ascension" | "sommet" | "empire" pour usage côté client.

## Phase 2 : JWT et auth

- [x] **Task 3 : Mettre à jour le JWT callback dans `lib/auth/config.ts`** — Dans le jwt callback, après le `.toLowerCase()` existant sur le plan, ajouter un mapping vers les nouveaux noms : si plan === "gratuit" → "decouverte", si plan === "pro" → "ascension", etc. Utiliser une map simple. Le `session` callback doit aussi propager le nouveau nom.

## Phase 3 : API

- [x] **Task 4 : Mettre à jour `/api/subscription/route.ts`** — Changer les plan IDs valides de ["pro", "business", "agence"] à ["ascension", "sommet", "empire"]. Ajouter un mapping legacy (si "pro" reçu → traiter comme "ascension"). Utiliser les nouvelles env vars : STRIPE_PRICE_ASCENSION, STRIPE_PRICE_SOMMET, STRIPE_PRICE_EMPIRE (avec fallback sur les anciennes STRIPE_PRICE_PRO, etc.).

- [x] **Task 5 : Corriger la commission hardcodée dans `lib/stripe/connect.ts`** — Dans `createPaymentIntent()`, remplacer `Math.round(amount * 0.20)` par un calcul dynamique basé sur le plan du vendeur. Ajouter un paramètre `vendorPlan` à la fonction et utiliser `calculateCommission(normalizePlanName(vendorPlan), amount)`. Pour Empire, `application_fee_amount` sera 0.

- [x] **Task 6 : Mettre à jour la commission dans `/api/orders/route.ts`** — Vérifier que la route orders utilise bien `calculateCommissionEur()` avec le plan normalisé du vendeur. S'assurer que les transactions créées reflètent les nouveaux taux.

## Phase 4 : Pages frontend

- [x] **Task 7 : Refondre la page `/tarifs` (public)** — Refaire entièrement la page tarifs avec le thème "Élévation" : 4 cards responsives (1 col mobile, 2 tablet, 4 desktop), toggle mensuel/annuel (25% discount), plan Sommet marqué "Populaire", chaque card montre : nom, prix, commission en gros, liste de features avec checkmarks, CTA. Ajouter une section "Comparaison complète" en tableau sous les cards. Ajouter FAQ (5 questions min). Importer tout depuis `lib/plans.ts` (pas de constantes locales). Utiliser `useCurrencyStore().format()` pour les prix.

- [x] **Task 8 : Mettre à jour `/dashboard/abonnement/page.tsx`** — Remplacer les constantes PLANS locales par des imports de `lib/plans.ts`. Afficher les 4 plans avec nouveaux noms/prix/features. Marquer le plan actuel. Mettre à jour le flow d'upgrade vers les nouveaux plan IDs.

- [x] **Task 9 : Mettre à jour `/dashboard/abonnement/paiement/page.tsx`** — Remplacer l'objet PLANS local par des imports. Mettre à jour les plan IDs (ascension, sommet, empire). Nouveaux prix et noms d'affichage.

- [x] **Task 10 : Mettre à jour `/agence/abonnement/page.tsx`** — Remplacer les 4 plans locaux par les imports. Empire = plan agence avec features équipe/CRM/cloud mises en avant. Les plans inférieurs montrent les features agence verrouillées avec CTA "Passer à Empire". Mettre à jour la table de comparaison.

- [x] **Task 11 : Mettre à jour `/agence/abonnement/paiement/page.tsx`** — Mêmes changements que Task 9 mais côté agence.

## Phase 5 : Stores et traductions

- [x] **Task 12 : Mettre à jour les stores (dashboard, admin)** — Dans `store/dashboard.ts` : mettre à jour les types/interfaces plan → nouveaux noms. Dans `store/admin.ts` : mettre à jour l'affichage des plans utilisateurs dans les listes admin.

- [x] **Task 13 : Mettre à jour `lib/demo-data.ts`** — Remplacer DEMO_PLANS avec les 4 nouveaux plans (Découverte, Ascension, Sommet, Empire) avec les bons prix, commissions et features.

- [x] **Task 14 : Mettre à jour les traductions `messages/fr.json` et `en.json`** — Remplacer toutes les clés `plan_free`, `plan_pro`, `plan_business`, `plan_agency` par `plan_decouverte`, `plan_ascension`, `plan_sommet`, `plan_empire`. Mettre à jour les descriptions, features, et FAQ.

## Phase 6 : Nettoyage

- [x] **Task 15 : Rechercher et remplacer toutes les références restantes** — grep global pour "Gratuit", "Pro", "Business", "Agence" dans le contexte des plans (pas des rôles utilisateur !). Remplacer par les nouveaux noms. Fichiers à vérifier : composants sidebar, navbar, profil, admin dashboard, landing page, etc.
