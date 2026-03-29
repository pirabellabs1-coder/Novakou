## Context

Le systeme de tracking existe avec une bonne base : Tracker singleton, buffering (5s/20 events), sendBeacon, sessions avec heartbeat 30s, API stats, caching 60s. Mais seuls `page_view`/`session_start`/`session_end` sont trackes. Le temps passe, les entites, les conversions ne sont pas mesures. Le dashboard admin n'utilise pas les donnees tracking.

## Goals / Non-Goals

**Goals:**
- Mesurer le temps passe par page (duration en secondes)
- Tracker les vues d'entites (service, formation, profil) avec entityId
- Tracker les conversions (order_placed lie au service_viewed)
- Fixer le bug pageViews (heartbeat ne doit pas incrementer)
- Ajouter deduplication server-side
- Connecter les stats tracking au dashboard admin
- Calculer conversion_rate et avg_time_on_page pour chaque service

**Non-Goals:**
- Migrer le stockage JSON vers Prisma/DB (V1 — MVP garde le JSON)
- Scroll depth tracking
- Heatmaps
- AB testing
- Fraud detection avance

## Decisions

### 1. Duration calculee cote client, envoyee dans l'event

Le tracker mesure le temps passe sur la page courante. Quand l'utilisateur navigue, un event `page_view` est envoye avec `metadata.duration` en secondes pour la page PRECEDENTE. Le calcul utilise `performance.now()` pour la precision.

### 2. Tracking entites via useEntityTracker hook

Au lieu de modifier chaque page entite, on cree un hook `useEntityTracker(entityType, entityId)` qui envoie automatiquement un event `service_viewed`/`formation_viewed`/`profile_viewed` une seule fois par session par entite. Les pages entites l'appellent avec leur type et ID.

### 3. Conversion tracking via une fonction utilitaire

`trackConversion(type, entityId, metadata)` est appelee depuis les API de commande/inscription. Pas besoin de modifier le tracker client — le serveur cree l'event directement dans le store.

### 4. Dashboard admin connecte via /api/tracking/stats

La page admin/analytics appelle `/api/tracking/stats` en complement des donnees existantes. Les sections "Trafic", "Pages populaires", "Appareils" sont ajoutees.

### 5. Deduplication par event ID cote serveur

Le serveur maintient un Set des 10 000 derniers event IDs. Si un event avec le meme ID arrive, il est ignore. Nettoyage automatique quand le Set depasse 10 000.

## Risks / Trade-offs

- **[Performance client]** → Le calcul de duration utilise `performance.now()` — impact negligeable (<0.01ms)
- **[Volume events]** → Les entity views ajoutent ~30% d'events en plus. Le buffer de 20 events et le flush de 5s absorbent sans probleme.
- **[Deduplication in-memory]** → Le Set de 10K IDs se reinitialise au redemarrage serveur. Acceptable pour le MVP.
