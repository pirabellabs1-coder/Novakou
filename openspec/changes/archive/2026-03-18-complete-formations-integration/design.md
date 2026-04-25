## Context

L'écosystème formations de FreelanceHigh comporte trois espaces (Apprenant, Instructeur, Admin) développés de manière isolée. L'espace Instructeur a reçu des fonctionnalités avancées (marketing, produits numériques, promotions, statistiques détaillées, funnels) qui ne sont pas supervisées côté Admin ni consommées côté Apprenant. Les API formations utilisent `DEV_MODE` avec des données mock au lieu de requêtes Prisma réelles. Il n'y a pas de rafraîchissement automatique des données. Les graphiques admin sont basiques (Recharts simples) sans visualisations avancées.

**État actuel :**
- Admin : 9 pages, dashboard basique avec BarChart/LineChart/PieChart, pas de supervision marketing
- Apprenant : 13 pages, pas de dashboard graphique enrichi, pas de discussions centralisées, pas de remboursements
- Instructeur : 30+ pages, marketing complet, produits numériques, statistiques avancées
- APIs : ~50% des routes retournent des données mock en DEV_MODE
- Données : pas de polling/refetch automatique, `INSTRUCTOR_COMMISSION` hardcodée en multiple endroits

## Goals / Non-Goals

**Goals :**
- Créer 6 nouvelles pages admin avec graphiques avancés (funnels, heatmaps, waterfall, radar, comparaisons)
- Créer 4 nouvelles pages apprenant (discussions, avis, remboursements, notifications)
- Enrichir le dashboard apprenant avec graphiques de progression et recommandations
- Supprimer toutes les données DEV_MODE hardcodées — toutes les API interrogent Prisma
- Implémenter le auto-refresh via `refetchInterval` TanStack Query (30s dashboards, 60s listes)
- Connecter la page d'accueil formations et l'explorer aux vraies données live
- Centraliser la constante de commission dans un fichier de config partagé
- Ajouter 3 nouvelles tables Prisma (AuditLog, RefundRequest, DiscussionReport)
- Assurer que tous les compteurs/stats se mettent à jour automatiquement

**Non-Goals :**
- Pas de refonte UI complète des pages existantes (on enrichit, on ne reconstruit pas)
- Pas de recherche sémantique IA (prévu V3)
- Pas de notifications push navigateur (prévu V4)
- Pas de WebSocket pour les mises à jour temps réel (le polling TanStack Query suffit au MVP)
- Pas de système de recommandations IA (on utilise des recommandations basées sur les catégories favorites)
- Pas de modification du flux de paiement existant
- Pas d'ajout de nouveaux rôles utilisateur

## Decisions

### 1. Polling TanStack Query vs Supabase Realtime vs Socket.io

**Choix : Polling TanStack Query avec `refetchInterval`**

- **Alternative 1 — Supabase Realtime** : nécessite des subscriptions Postgres, plus complexe à mettre en place, surcharge pour des pages qui n'ont pas besoin de millisecondes de latence
- **Alternative 2 — Socket.io** : déjà utilisé pour le chat, mais ajouter des événements pour chaque stat/compteur créerait une complexité de maintenance disproportionnée
- **Rationale** : le polling à 30s pour les dashboards et 60s pour les listes offre un bon compromis entre fraîcheur des données et charge serveur. TanStack Query gère déjà le cache et la déduplication des requêtes. Pattern existant dans le codebase (certaines pages ont déjà `setInterval` de 60s).

### 2. Graphiques avancés — Recharts étendu vs Nivo vs D3 direct

**Choix : Recharts étendu (déjà installé)**

- **Alternative 1 — Nivo** : plus beau par défaut mais ajoute ~200KB et une nouvelle dépendance
- **Alternative 2 — D3 direct** : maximum de flexibilité mais complexité de maintenance élevée
- **Rationale** : Recharts supporte ComposedChart, RadarChart, FunnelChart, et les custom shapes. Déjà utilisé partout dans le codebase. Les graphiques manquants (heatmap, waterfall) seront construits avec des composants custom basés sur des grilles CSS + couleurs Tailwind, ce qui évite une nouvelle dépendance.

### 3. Suppression DEV_MODE — Base seed vs données dynamiques pures

**Choix : Suppression des branches DEV_MODE + script de seed Prisma**

- **Alternative** : garder DEV_MODE mais le rendre optionnel via variable d'environnement
- **Rationale** : le code DEV_MODE crée de la dette technique (chaque nouvelle feature doit maintenir deux chemins). Un script `prisma/seed.ts` avec des données réalistes est plus maintenable et teste le vrai chemin de code. Les développeurs lancent `prisma db seed` une fois pour avoir des données de test.

### 4. Journal d'audit — Table dédiée vs Prisma middleware

**Choix : Table `AuditLog` + fonction utilitaire `logAuditAction()`**

- **Alternative** : Prisma middleware qui intercepte toutes les mutations
- **Rationale** : un middleware global loguerait trop de choses (y compris les mises à jour de progression de leçons). Une fonction explicite appelée dans les API admin offre un contrôle précis sur ce qui est audité. Structure : `{ userId, action, targetType, targetId, metadata (JSON), ipAddress, createdAt }`.

### 5. Heatmap d'activité — SVG custom vs librairie tierce

**Choix : Composant custom `ActivityHeatmap` en grille CSS**

- **Rationale** : une grille 7×52 (jours × semaines) avec des cellules colorées en Tailwind est triviale à construire. Pas besoin d'une librairie pour ça. Le composant reçoit un tableau `{ date: string, count: number }[]` et rend une grille avec 5 niveaux d'intensité de couleur.

### 6. Architecture des nouvelles API admin

**Choix : Route handlers Next.js (pattern existant)**

Toutes les nouvelles API admin suivent le pattern existant :
```
/api/admin/formations/<feature>/route.ts
```

Chaque route :
1. Vérifie `session.user.role === "admin"` via `getServerSession(authOptions)`
2. Parse les query params avec Zod
3. Exécute la requête Prisma
4. Appelle `logAuditAction()` si c'est une action de modification
5. Retourne `NextResponse.json()`

### 7. Commission centralisée

**Choix : Fichier `lib/formations/config.ts` exportant les constantes**

```ts
export const FORMATIONS_CONFIG = {
  INSTRUCTOR_COMMISSION: 0.70,
  PLATFORM_COMMISSION: 0.30,
  REFUND_WINDOW_DAYS: 14,
  AUTO_REFRESH_DASHBOARD_MS: 30_000,
  AUTO_REFRESH_LIST_MS: 60_000,
  MAX_UPLOAD_SIZE_MB: 100,
} as const;
```

Toutes les API et composants importent depuis ce fichier au lieu de redéfinir les constantes localement.

## Risks / Trade-offs

**[Polling toutes les 30s sur les dashboards]** → Charge serveur accrue si beaucoup d'admins connectés simultanément.
- **Mitigation** : TanStack Query déduplique les requêtes identiques. Le polling ne se déclenche que quand l'onglet est actif (`refetchOnWindowFocus`). On peut ajuster l'intervalle si la charge devient un problème.

**[Suppression DEV_MODE sans seed DB]** → Les développeurs sans base de données ne pourront pas tester.
- **Mitigation** : script `prisma/seed.ts` créé en parallèle. Documentation dans le README.

**[Beaucoup de nouvelles pages et API en un seul changement]** → Risque de régressions sur les pages existantes.
- **Mitigation** : chaque tâche est indépendante et testable isolément. Les modifications de pages existantes sont minimales (ajout de `refetchInterval`, suppression de branches DEV_MODE).

**[Heatmap et waterfall custom sans librairie]** → Maintenance de composants custom.
- **Mitigation** : composants simples (~100 lignes chacun), bien typés, réutilisables. Pas de logique complexe.

**[3 nouvelles tables Prisma]** → Migration DB nécessaire.
- **Mitigation** : tables indépendantes sans foreign keys critiques sur les tables existantes. Migration additive uniquement (pas de modification de colonnes existantes).
