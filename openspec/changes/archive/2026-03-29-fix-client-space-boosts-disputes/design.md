## Context

L'espace client de FreelanceHigh a été développé mais de nombreux bugs empêchent son utilisation correcte. Les données ne s'affichent pas (dashboard, paiements, litiges), les avis peuvent être laissés sur des commandes en litige, les boosts ne fonctionnent pas, et le diagramme mobile est illisible. Ces bugs sont indépendants les uns des autres — chacun peut être fixé isolément.

## Goals / Non-Goals

**Goals:**
- Fixer tous les bugs de données vides dans l'espace client (dashboard, factures, litiges)
- Corriger la détection du plan pour les boosts (freelance + agence)
- Bloquer les avis sur commandes en litige (API + UI)
- Rendre le diagramme lisible sur mobile
- Ajouter la suspension de projets client
- Préparer le système de crédits client (structure + UI, sans Stripe)
- Intégrer les badges boost dans la liste des services

**Non-Goals:**
- Pas de refonte UI globale — corrections ciblées uniquement
- Pas d'intégration Stripe pour le dépôt de crédits (structure seulement)
- Pas de migration Prisma — les tables existent
- Pas de nouveau template email pour les notifications de suspension

## Decisions

### 1. Fix financeSummary : sync manquant dans le store client

**Choix** : Dans `store/client.ts` → `syncAll()`, stocker le résultat de `financesApi.summary()` dans `state.financeSummary`. Ajouter aussi un `syncFinanceSummary()` dédié appelé par les pages qui en ont besoin.

**Rationale** : Le fetch existe déjà mais le résultat est perdu. C'est un fix d'une ligne dans le store.

### 2. Normalisation des statuts de commande pour les litiges

**Choix** : Dans `syncDisputes()`, filtrer les commandes avec `status.toLowerCase() === "litige"` OU `status === "DISPUTE"` pour gérer les deux modes (dev lowercase, Prisma uppercase).

**Rationale** : Le pattern dual-mode (IS_DEV) crée des incohérences de casing. La normalisation lowercase est le moyen le plus sûr.

### 3. Chart mobile : légende au lieu de labels inline

**Choix** : Sur mobile, désactiver les labels inline du PieChart et afficher uniquement la légende en dessous avec `flexWrap`. Garder les labels inline sur desktop.

**Rationale** : Un PieChart de 180px ne peut pas contenir des labels texte lisibles. La légende séparée est le pattern standard.

### 4. Crédits client : champ dans le store + UI placeholder

**Choix** : Ajouter `credits: number` dans le ClientState, afficher le solde dans la page paiements, et un bouton "Recharger" qui affiche un toast "Bientôt disponible". Pas d'endpoint de dépôt réel.

**Rationale** : L'architecture de paiement (Stripe/CinetPay) n'est pas prête pour le dépôt de crédits au MVP. La structure est mise en place pour V1.

### 5. Suspension de projet : statut "suspendu" via PATCH

**Choix** : Ajouter un bouton "Suspendre/Reprendre" dans la liste des projets. L'action appelle `PATCH /api/projects/[id]` avec `{ status: "suspendu" }` ou `{ status: "ouvert" }`.

**Rationale** : Le champ `status` existe déjà sur le modèle Project. Pas besoin de migration.

### 6. Plan detection pour boost : lire depuis le store

**Choix** : Dans `/dashboard/boost/page.tsx`, importer `currentPlan` depuis `useDashboardStore()`, appeler `canBoost(normalizePlanName(currentPlan), monthlyBoostCount)`. Afficher le blocage SEULEMENT si le plan ne le permet pas.

**Rationale** : La fonction `canBoost()` existe déjà dans `lib/plans.ts`, elle n'est juste jamais appelée.

## Risks / Trade-offs

- **Crédits sans Stripe** : Le bouton "Recharger" est un placeholder. Risque de frustration utilisateur → Mitigation : toast clair "Fonctionnalité bientôt disponible".

- **Normalisation statuts** : Le `toLowerCase()` peut masquer des bugs de casing ailleurs → Mitigation : C'est un pattern déjà utilisé dans le code (voir `normalizePlanName()`).

- **Boosts badge** : Ajouter un fetch supplémentaire pour chaque service peut être lent si beaucoup de services → Mitigation : Fetcher le statut boost en batch dans le sync des services, pas un par un.
