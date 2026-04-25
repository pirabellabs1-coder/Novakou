## Context

FreelanceHigh est une plateforme marketplace freelance avec 180+ routes API, 70+ modèles Prisma, et des interfaces complètes. L'audit révèle que les flux de données sont cassés : erreurs Prisma silencieuses, endpoints manquants, mauvais mapping de données dans les stores Zustand, et FK manquantes dans le schéma.

**État actuel :**
- Les services sont créés en status `EN_ATTENTE` et passent à `ACTIF` après approbation admin, mais la page détail d'un service crash (erreur Prisma `sortOrder` vs `order`)
- Les projets sont créés et visibles dans la marketplace, mais les candidatures ne remontent pas côté client (mauvais endpoint)
- Les offres personnalisées n'ont pas de lien `clientId` vers l'utilisateur client — impossible pour un client de les recevoir
- Les stores Zustand persistent des données stale via localStorage et ne resynchronisent pas toujours

**Contraintes :**
- Le code utilise un dual-mode `IS_DEV` / `USE_PRISMA_FOR_DATA` — corrections nécessaires dans les deux branches
- Aucune nouvelle dépendance npm ne doit être ajoutée
- Migration Prisma requise (ajout `clientId` sur `Offer`)
- Les corrections doivent être rétrocompatibles avec les données seed existantes

## Goals / Non-Goals

**Goals:**
- Rendre les 3 flux principaux fonctionnels de bout en bout (service→commande, projet→candidature→commande, offre→commande)
- Corriger toutes les erreurs Prisma silencieuses identifiées dans l'audit
- Garantir que les dashboards freelance et client affichent des données réelles et fraîches
- Fournir des données seed complètes pour tester tous les flux

**Non-Goals:**
- Intégration Stripe réelle (les commandes sont créées sans paiement effectif — MVP acceptable)
- Refactoring du dual-mode IS_DEV (on corrige dans les deux branches)
- Migration vers TanStack Query pour remplacer les stores Zustand (architecture existante conservée)
- Ajout de nouvelles fonctionnalités UI (on corrige l'existant)
- Support des formations et produits numériques (hors scope marketplace core)

## Decisions

### 1. Ajout de `clientId` sur le modèle `Offer` (migration Prisma)

**Choix :** Ajouter une colonne `clientId` (FK vers User, optionnelle) sur la table `Offer`.

**Raison :** Actuellement, les offres stockent `clientName` et `clientEmail` comme strings — impossible de les associer à un utilisateur authentifié. Le `clientId` permet au client de voir les offres reçues depuis son dashboard.

**Alternative rejetée :** Rechercher par `clientEmail` → fragile (email peut changer, pas d'index, pas de FK).

**Migration :** `ALTER TABLE "Offer" ADD COLUMN "clientId" TEXT REFERENCES "User"("id")`. Colonne nullable pour ne pas casser les offres existantes. L'API POST offres résoudra le `clientId` à partir du `clientEmail` si un utilisateur existe.

### 2. Endpoint bids séparé plutôt que filtre sur candidatures

**Choix :** Créer `GET /api/projects/[id]/bids` comme endpoint dédié.

**Raison :** L'endpoint `/api/candidatures` est conçu pour le freelance (ses propres candidatures). Le client a besoin de voir les candidatures reçues sur un projet spécifique avec les profils freelance enrichis. Un endpoint séparé est plus clair et évite de surcharger la logique d'un endpoint existant.

**Alternative rejetée :** Ajouter un param `?role=client` sur `/api/candidatures` → complexifie la route, mélange deux use cases différents.

### 3. Correction in-place du status case mismatch

**Choix :** Normaliser les comparaisons de status en utilisant `.toUpperCase()` dans les filtres frontend uniquement.

**Raison :** Le schéma Prisma utilise des enums uppercase (`ACTIF`, `EN_ATTENTE`). Le mode dev utilise des strings lowercase. Plutôt que de modifier toutes les données dev, on normalise au moment de la comparaison dans les stores.

### 4. Acceptation candidature/offre → création automatique de commande

**Choix :** L'acceptation d'une candidature (`POST /api/candidatures/[id]/accept`) ou d'une offre (`POST /api/offres/[id]/accept`) crée automatiquement une `Order` avec les détails dérivés.

**Raison :** C'est le flux métier naturel : accepter = engager = créer la commande. L'escrow est initialisé à `HELD` comme pour les commandes directes.

### 5. Seed enrichi via le même endpoint admin

**Choix :** Enrichir l'endpoint `POST /api/admin/seed-marketplace` existant avec des candidatures, offres et commandes de démonstration.

**Alternative rejetée :** Créer un script `pnpm seed` séparé → plus complexe à maintenir, l'endpoint admin est déjà fonctionnel et protégé.

## Risks / Trade-offs

- **[Migration Prisma `clientId` nullable]** → Les offres existantes sans `clientId` resteront orphelines. Mitigation : le seed les met à jour, et la résolution par email est tentée à la création.
- **[Dual-mode maintenance]** → Chaque correction doit être faite dans la branche `IS_DEV` et la branche Prisma. Mitigation : les corrections sont simples (fix field names, add endpoints) et testables indépendamment.
- **[Store Zustand persist stale data]** → Après correction, les utilisateurs avec des données stale en localStorage verront un flash avant le sync API. Mitigation : acceptable pour le MVP, pas de refactoring du persist.
- **[Pas de paiement réel dans les commandes]** → Les commandes sont créées avec `escrowStatus: HELD` sans charge Stripe. Mitigation : comportement documenté et accepté pour le MVP.

## Migration Plan

1. **Prisma migration** : Ajouter `clientId` sur `Offer` → `prisma migrate dev`
2. **API fixes** : Déployer les corrections d'endpoints (ordre : fix critiques d'abord, puis nouveaux endpoints)
3. **Frontend fixes** : Déployer les corrections stores + pages (pas de breaking change)
4. **Seed** : Exécuter le seed enrichi pour tester les flux complets
5. **Rollback** : La migration est additive (colonne nullable) — rollback = supprimer la colonne. Les endpoints sont des ajouts, pas des modifications breaking.
