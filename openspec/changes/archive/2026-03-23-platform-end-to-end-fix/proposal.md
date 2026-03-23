## Why

La plateforme FreelanceHigh a toutes les interfaces et APIs en place, mais les flux de données sont cassés de bout en bout : les services publiés n'apparaissent pas dans la marketplace, les projets sont invisibles, les commandes ne se créent pas correctement, les propositions/candidatures ne remontent pas aux clients, et les dashboards affichent des données vides ou périmées. L'audit révèle 9 bugs critiques (erreurs Prisma, mauvais endpoints, mapping de données incorrect, FK manquantes) qui empêchent toute utilisation réelle de la plateforme. Cette correction est urgente car elle bloque le MVP.

**Version cible : MVP**

## What Changes

### Corrections Prisma / Base de données
- Corriger le champ `ServiceMedia.order` → `ServiceMedia.sortOrder` dans la requête `/api/public/services/[slug]` (crash 500 en production)
- Ajouter un champ `clientId` (FK vers User) sur le modèle `Offer` pour permettre aux clients de recevoir/consulter les offres qui leur sont adressées
- Supprimer ou corriger le modèle orphelin `Bid` (pas de relation FK avec `Project`) — utiliser `ProjectBid` partout
- Corriger le mapping `budgetMin`/`budgetMax` ↔ `budget { min, max }` entre l'API projects et le client store

### Corrections APIs
- Créer `GET /api/projects/[id]/bids` — endpoint pour qu'un client voie les candidatures reçues sur son projet
- Corriger `GET /api/candidatures` pour supporter le filtre `?projectId=` côté serveur
- Corriger `GET /api/offres` pour supporter le filtre par `clientId` (offres reçues par un client)
- Ajouter `POST /api/offres/[id]/accept` — acceptation d'une offre → création automatique d'une commande
- Corriger `POST /api/candidatures/[id]/accept` — acceptation d'une candidature → création automatique d'une commande

### Corrections Frontend / Stores
- Corriger `clientStore.syncProposals()` : utiliser l'API candidatures/bids au lieu de l'API offres
- Corriger le mapping budget dans `clientStore.syncAll()` (budgetMin/budgetMax → budget.min/max)
- Ajouter un appel `syncFromApi()` dans la page `/dashboard/services` pour garantir des données fraîches
- Corriger le status case mismatch entre DEV mode (lowercase) et Prisma mode (uppercase) dans les filtres dashboard
- Connecter la page `/client/projets/[id]` aux vraies candidatures via la nouvelle API bids
- Connecter la page `/client/propositions` aux vraies offres reçues (via clientId)

### Seed data & testabilité
- Enrichir le seed marketplace avec des données de test complètes : candidatures, offres, commandes en cours
- Rendre le seed exécutable via `pnpm seed` en plus de l'endpoint API admin

### Flows end-to-end validés
- **Flow 1** : Freelance crée service → visible marketplace → client commande → commande visible des deux côtés
- **Flow 2** : Client crée projet → visible marketplace → freelance postule → client voit/accepte → commande créée
- **Flow 3** : Freelance envoie offre → client reçoit → accepte → commande créée

**Impact sur les rôles :**
- **Freelance** : services visibles, commandes reçues, candidatures trackées, offres envoyées fonctionnelles
- **Client** : marketplace fonctionnelle, projets avec candidatures visibles, offres recevables, commandes créées
- **Admin** : seed data pour tester, toutes les commandes visibles dans le dashboard admin

**Impact schéma Prisma :** Ajout de `clientId` sur `Offer`, nettoyage modèle `Bid`

## Capabilities

### New Capabilities
- `marketplace-data-flow`: Correction de la visibilité des services et projets dans la marketplace publique (requêtes Prisma, mapping données, filtres)
- `order-creation-flow`: Flux complet de création de commandes depuis service, candidature acceptée, et offre acceptée
- `candidature-flow`: Flux candidatures freelance → projet client avec endpoint de consultation et d'acceptation côté client
- `offer-flow`: Flux offres personnalisées freelance → client avec FK clientId, réception et acceptation
- `dashboard-sync`: Synchronisation correcte des données dans les stores Zustand (freelance + client) avec les APIs
- `seed-data`: Données de démonstration complètes pour tester tous les flux de la plateforme

### Modified Capabilities
<!-- Aucune capability existante modifiée — il s'agit de corrections et connexions de code existant -->

## Impact

**Code impacté :**
- `packages/db/prisma/schema.prisma` — modèle Offer (ajout clientId), nettoyage Bid
- `apps/web/app/api/public/services/[slug]/route.ts` — fix sortOrder
- `apps/web/app/api/candidatures/route.ts` — support filtre projectId
- `apps/web/app/api/offres/route.ts` — support filtre clientId
- `apps/web/app/api/projects/[id]/bids/route.ts` — nouveau endpoint
- `apps/web/app/api/offres/[id]/accept/route.ts` — nouveau endpoint
- `apps/web/store/client.ts` — corrections syncProposals, syncAll budget mapping
- `apps/web/store/dashboard.ts` — corrections sync, status case
- `apps/web/app/dashboard/services/page.tsx` — ajout sync
- `apps/web/app/client/projets/[id]/page.tsx` — connexion bids API
- `apps/web/app/client/propositions/page.tsx` — connexion offres reçues
- `apps/web/app/api/admin/seed-marketplace/route.ts` — enrichissement seed

**Dépendances :** Aucune nouvelle dépendance npm
**Migration Prisma :** Oui — ajout colonne `clientId` sur `Offer`
