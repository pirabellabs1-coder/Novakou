## Context

Les tunnels de vente (funnels) sont un outil marketing de l'espace instructeur permettant de créer des parcours de conversion optimisés pour vendre des formations et produits numériques. L'infrastructure existe déjà : wizard de création (7 types d'étapes), page publique de rendu, API CRUD avec mock data en DEV_MODE, et tracking d'événements. Cependant, le système est inutilisable en production car aucun paiement réel n'est intégré, les produits de l'instructeur ne sont pas chargés dynamiquement, et plusieurs bugs critiques empêchent l'activation des funnels.

**État actuel :**
- 4 fichiers principaux : liste (`funnels/page.tsx`), wizard (`funnels/creer/page.tsx`), renderer public (`f/[slug]/page.tsx`), API (`api/marketing/funnels/route.ts`)
- Route d'events analytics existante mais jamais consommée par le frontend
- ~35 accents français manquants
- Bug : POST ignore `isActive`, produits hardcodés, checkout factice

## Goals / Non-Goals

**Goals:**
- Rendre le checkout fonctionnel avec Stripe Checkout pour les paiements réels
- Charger dynamiquement les formations et produits de l'instructeur dans le wizard
- Corriger le bug d'activation au POST (isActive ignoré)
- Créer une page d'analytiques par funnel exploitant la route API existante
- Ajouter la duplication de funnels
- Corriger tous les accents et améliorer la validation du wizard
- Supporter le contenu FR/EN dans le renderer public

**Non-Goals:**
- Intégration CinetPay/Mobile Money dans les funnels (V1+)
- A/B testing entre variantes de funnels (V3)
- Drag-and-drop des étapes (les boutons haut/bas suffisent pour le MVP)
- Auto-save / brouillon localStorage (amélioration future)
- Intégration PostHog pour les analytics funnels (on utilise notre propre tracking)

## Decisions

### 1. Stripe Checkout (mode hébergé) plutôt que Stripe Elements (embarqué)

**Choix :** Utiliser `stripe.checkout.sessions.create()` avec redirect vers Stripe, pas un formulaire de paiement embarqué.

**Raison :** Stripe Checkout hébergé gère automatiquement 3D Secure, les méthodes de paiement locales, et la conformité PCI. Cela évite de gérer un formulaire sensible côté client. L'expérience utilisateur est un redirect → paiement → redirect retour avec `?session_id=`.

**Alternative rejetée :** Stripe Elements (embarqué) offrirait une meilleure UX sans redirect, mais nécessite la gestion PCI et augmente la complexité. Non justifié pour le MVP.

### 2. Tracking "purchase" uniquement via webhook Stripe

**Choix :** L'événement "purchase" dans `SalesFunnelEvent` ne sera tracké que quand le webhook Stripe confirme `checkout.session.completed`. Le clic sur le CTA de l'étape CHECKOUT tracke un "click", pas un "purchase".

**Raison :** Les stats actuelles sont faussées car "purchase" est déclenché au clic sans paiement. Les conversions doivent refléter de vrais achats.

### 3. Route checkout dédiée aux funnels

**Choix :** `POST /api/marketing/funnels/checkout` — endpoint dédié qui crée une session Stripe et enregistre les items du funnel (formations + produits acceptés via upsell/downsell).

**Raison :** Séparer du checkout formations standard (`/api/formations/checkout`) car le funnel peut contenir un mix de formations + produits numériques dans une seule session. Le `metadata` de la session Stripe contient `funnelId`, `stepIndex`, `visitorId` pour le tracking post-paiement.

### 4. Page analytiques intégrée à la liste (pas de route séparée)

**Choix :** Ajouter un panel/drawer d'analytiques qui s'ouvre au clic sur un funnel dans la liste, plutôt qu'une page séparée `/funnels/[id]/analytiques`.

**Raison :** L'instructeur veut voir rapidement les stats sans quitter la liste. Un drawer/panel latéral avec les graphiques step-by-step est plus efficace qu'une navigation aller-retour. La route API `GET /api/marketing/funnels/[id]/events` est déjà prête.

**Alternative rejetée :** Page séparée — trop de navigation pour une consultation rapide.

### 5. Duplication côté serveur

**Choix :** `POST /api/marketing/funnels/[id]/duplicate` — le serveur copie le funnel avec un nouveau slug et `isActive: false`.

**Raison :** Évite de transférer toutes les étapes côté client puis re-POST. Le serveur connaît déjà toute la structure.

### 6. Produits dynamiques via les API existantes

**Choix :** Le wizard chargera les formations via `GET /api/instructeur/formations` et les produits via `GET /api/instructeur/produits` (qui ont désormais un DEV_MODE). Pas de nouvelle route.

**Raison :** Ces routes existent et retournent les données nécessaires (id, titre, prix). Il suffit de les appeler dans le wizard au lieu d'utiliser `MOCK_PRODUCTS`.

## Risks / Trade-offs

- **[Stripe redirect interrompt le flow funnel]** → Au retour de Stripe, l'utilisateur est sur une page de succès du funnel. Le state client (items acceptés) est perdu. → **Mitigation** : Stocker les items acceptés dans les `metadata` de la session Stripe, et les afficher dans la page de succès via `session_id`.

- **[Webhook Stripe peut être retardé]** → Le tracking "purchase" dépend du webhook. → **Mitigation** : Vérifier aussi côté client via `stripe.checkout.sessions.retrieve(session_id)` au chargement de la page de succès.

- **[Événements dupliqués sur reload]** → Un visiteur qui recharge une étape génère un nouveau "view". → **Mitigation** : Accepté pour le MVP. Déduplier par `visitorId + stepIndex + timeWindow` serait idéal mais complexe.

- **[Performance liste funnels avec panel analytiques]** → Le GET events est potentiellement lourd. → **Mitigation** : Chargement lazy (fetch uniquement quand le panel s'ouvre), staleTime 60s.
