# Tâches — Tunnels de vente fonctionnels

## Tâche 1 : Corriger le bug isActive et les accents dans l'API funnels

**Fichiers :** `apps/web/app/api/marketing/funnels/route.ts`

- [x] Dans le handler POST, remplacer `isActive: false` en dur par `isActive: body.isActive ?? false` pour respecter le choix de l'instructeur
- [x] Corriger les accents dans les messages d'erreur : "trouve" → "trouvé", "caracteres" → "caractères", "etapes" → "étapes", "etape" → "étape"
- [x] Vérifier que le PUT, DELETE, et GET fonctionnent correctement

**Spec :** `funnel-wizard-improvements` — "Le POST SHALL respecter le champ isActive"

---

## Tâche 2 : Corriger tous les accents français dans les 3 fichiers frontend funnels

**Fichiers :**
- `apps/web/app/formations/(instructeur)/instructeur/marketing/funnels/page.tsx` (~7 occurrences)
- `apps/web/app/formations/(instructeur)/instructeur/marketing/funnels/creer/page.tsx` (~16 occurrences)
- `apps/web/app/formations/f/[slug]/page.tsx` (~14 occurrences)

- [x] Corriger chaque accent manquant identifié dans l'audit (voir liste détaillée dans les specs)
- [x] Supprimer l'import mort `GripVertical` du wizard
- [x] Supprimer la fonction `BarChart` inline inutile du wizard (utiliser `BarChart2` de lucide-react si nécessaire)

**Spec :** `funnel-wizard-improvements` — "Tous les textes français SHALL avoir les accents corrects" + "Les imports morts SHALL être supprimés"

---

## Tâche 3 : Charger les formations et produits réels dans le wizard

**Fichiers :** `apps/web/app/formations/(instructeur)/instructeur/marketing/funnels/creer/page.tsx`

- [x] Supprimer la constante `MOCK_PRODUCTS` hardcodée
- [x] Ajouter un `useEffect` ou hook pour fetcher `GET /api/instructeur/formations` et `GET /api/instructeur/produits` au chargement du wizard
- [x] Fusionner les résultats dans une liste unifiée `{ id, title, price, type: "formation" | "product" }` pour le select de produit dans les StepCards
- [x] Afficher un état vide dans le select si l'instructeur n'a ni formations ni produits, avec un lien vers la création
- [x] Mettre à jour le `linkedProductPrice` automatiquement quand un produit est sélectionné

**Spec :** `funnel-wizard-improvements` — "Le wizard SHALL charger les formations et produits réels"

---

## Tâche 4 : Ajouter la validation per-step dans le wizard

**Fichiers :** `apps/web/app/formations/(instructeur)/instructeur/marketing/funnels/creer/page.tsx`

- [x] Avant de passer de l'étape 1 (construction) à l'étape 2 (aperçu), vérifier pour chaque step :
  - `headlineFr` non vide
  - `ctaTextFr` non vide
  - Pour PRODUCT/UPSELL/DOWNSELL : `linkedProductId` non vide
- [x] Afficher les erreurs de validation inline sous chaque champ concerné
- [x] Empêcher la navigation "Suivant" tant que la validation échoue

**Spec :** `funnel-wizard-improvements` — "Le wizard SHALL valider le contenu de chaque étape"

---

## Tâche 5 : Créer l'endpoint POST /api/marketing/funnels/checkout

**Fichiers :** `apps/web/app/api/marketing/funnels/checkout/route.ts` (nouveau)

- [x] Créer le fichier de route
- [x] Accepter dans le body : `funnelId`, `acceptedItems` (array de `{ productId, title, price, discountPct }`), `visitorId`
- [x] Vérifier que le funnel existe et est actif
- [x] En DEV_MODE : retourner un `sessionId` fictif et une URL de redirect vers `/formations/f/[slug]?success=true&session_id=dev_xxx`, enregistrer l'événement "purchase"
- [x] En production : créer une session `stripe.checkout.sessions.create()` avec les line_items, `success_url`, `cancel_url`, et les metadata

**Spec :** `funnel-checkout-stripe` — "L'endpoint POST /api/marketing/funnels/checkout SHALL être créé" + "Le mode DEV SHALL simuler le checkout"

---

## Tâche 6 : Intégrer le checkout Stripe dans le renderer public

**Fichiers :** `apps/web/app/formations/f/[slug]/page.tsx`

- [x] Modifier `ConfirmationStep` : au clic sur "Confirmer et payer", appeler `POST /api/marketing/funnels/checkout` avec les items acceptés
- [x] Rediriger le visiteur vers l'URL Stripe retournée
- [x] Supprimer le tracking "purchase" prématuré des clics CTA sur PRODUCT/UPSELL/DOWNSELL (ne tracker que "click")
- [x] Ajouter une gestion de l'état `?success=true&session_id=XXX` : afficher la page de succès (ThankYouStep modifié) avec les items achetés
- [x] Ajouter une gestion de l'état `?canceled=true` : retourner à l'étape de confirmation

**Spec :** `funnel-checkout-stripe` — "Le système SHALL créer une session Stripe Checkout" + "Le système SHALL afficher une page de succès"

---

## Tâche 7 : Supporter la locale FR/EN dans le renderer public

**Fichiers :** `apps/web/app/formations/f/[slug]/page.tsx`

- [x] Importer `useLocale` de `next-intl`
- [x] Créer un helper `t(fr: string, en: string)` qui retourne le texte selon la locale
- [x] Pour chaque step component, utiliser `headlineEn || headlineFr`, `descriptionEn || descriptionFr`, `ctaTextEn || ctaTextFr` quand locale = "en"
- [x] Mettre les trust signals et textes statiques en bilingue

**Spec :** `funnel-wizard-improvements` — "Le renderer public SHALL supporter la locale FR/EN"

---

## Tâche 8 : Ajouter les métadonnées SEO dynamiques

**Fichiers :** `apps/web/app/formations/f/[slug]/page.tsx`

- [x] Titre dynamique via `document.title` (useEffect après chargement du funnel)
- [x] Basé sur le `headlineFr` de la première étape, fallback "Tunnel de vente - FreelanceHigh"
- [x] Si le funnel n'existe pas ou est inactif, titre "Funnel non disponible"

**Spec :** `funnel-wizard-improvements` — "La page publique SHALL avoir des métadonnées SEO dynamiques"

---

## Tâche 9 : Ajouter le panel analytiques par funnel

**Fichiers :**
- `apps/web/app/formations/(instructeur)/instructeur/marketing/funnels/page.tsx`
- `apps/web/lib/formations/hooks.ts`

- [x] Créer le hook `useInstructorFunnelAnalytics(funnelId: string)` dans `hooks.ts` qui fetch `GET /api/marketing/funnels/{funnelId}/events`
- [x] Ajouter un bouton "Analytiques" (icône BarChart2) sur chaque funnel dans la liste
- [x] Créer un composant `FunnelAnalyticsPanel` (drawer/panel latéral) avec :
  - Graphique en barres (recharts) : vues/clics/achats par étape
  - Taux de drop-off entre chaque étape (barres décroissantes type entonnoir)
  - KPI : taux de conversion global, revenu total, visiteurs uniques
  - Timeline des 10 derniers événements
- [x] Lazy-load les données au clic (ne pas fetch tant que le panel n'est pas ouvert)
- [x] Skeleton loading pendant le chargement

**Spec :** `funnel-analytics-dashboard` — toutes les requirements

---

## Tâche 10 : Ajouter la duplication de funnels

**Fichiers :**
- `apps/web/app/api/marketing/funnels/[id]/duplicate/route.ts` (nouveau)
- `apps/web/app/formations/(instructeur)/instructeur/marketing/funnels/page.tsx`

- [x] Créer la route `POST /api/marketing/funnels/[id]/duplicate` qui :
  - Copie le funnel avec un nom suffixé " (copie)"
  - Copie toutes les étapes
  - Génère un nouveau slug
  - Met `isActive: false` et remet les stats à zéro
  - En DEV_MODE : copie dans `devFunnels`
- [x] Ajouter un bouton "Dupliquer" (icône Copy) dans la liste des funnels
- [x] Invalider le cache TanStack Query après duplication

**Spec :** `funnel-wizard-improvements` — "L'instructeur SHALL pouvoir dupliquer un funnel"

---

## Tâche 11 : Rendre les trust signals et bullets dynamiques dans le renderer

**Fichiers :** `apps/web/app/formations/f/[slug]/page.tsx`

- [x] Les trust signals et textes statiques ont été rendus bilingues via le helper `l()` (FR/EN)
- [x] Les "prochaines étapes" de `ThankYouStep` sont adaptées au type de produit acheté
- [x] Les bullets sont maintenant bilingues avec fallback FR

*Note : les trust signals restent avec des valeurs par défaut car les données de la formation liée ne sont pas accessibles dans le renderer public sans fetch supplémentaire. Amélioration future.*
