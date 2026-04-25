## Why

Le systeme de tracking FreelanceHigh a une bonne architecture de base (types, buffering, sessions, caching) mais est inutilisable en production :
- Les seuls evenements trackes sont `page_view`, `session_start`, `session_end` — aucun tracking d'entite (service vu, formation vue, profil vu)
- Le temps passe par page n'est PAS mesure
- Les conversions ne sont PAS trackees (`order_placed` jamais appele)
- Les `pageViews` sont gonfles (incrementes a chaque heartbeat 30s au lieu de chaque navigation)
- L'API stats existe mais n'est JAMAIS appelee par le dashboard admin
- Aucune deduplication des evenements
- Donnees en fichiers JSON (perdues au redemarrage serveur)
- Pas d'authentification sur les endpoints tracking

**Le dashboard admin affiche des stats vides ou fausses car il n'utilise pas les donnees de tracking.**

**Version cible : MVP.**

## What Changes

### Corriger les bugs existants
- Fixer le bug `pageViews` gonfle dans le heartbeat (ne plus incrementer pageViews sur heartbeat)
- Ajouter deduplication des evenements (event ID unique verifie cote serveur)

### Ajouter le tracking du temps passe par page
- Mesurer `duration` en secondes sur chaque page avant de naviguer
- Calculer le temps moyen par page, par service, par formation

### Ajouter le tracking des entites
- `service_viewed` sur `/services/[slug]` avec `entityId`
- `formation_viewed` sur `/[slug]` avec `entityId`
- `profile_viewed` sur `/freelances/[username]` avec `entityId`
- `order_placed` lors de la creation d'une commande (CONVERSION)

### Connecter le tracking au dashboard admin
- Admin analytics page utilise `/api/tracking/stats` pour les metriques trafic
- Dashboard freelance affiche : vues du service, temps moyen, taux de conversion

### Calculs business
- `conversion_rate = (order_placed / service_viewed) * 100` par service
- `avg_time_on_page` par chemin et par entite
- Top services par vues, par conversion, par temps passe

## Capabilities

### New Capabilities
- `tracking-page-duration`: Mesure du temps passe par page avec envoi au serveur
- `tracking-entity-views`: Tracking automatique des vues service/formation/profil avec entityId
- `tracking-conversions`: Tracking des conversions (order_placed) lie aux service_viewed
- `tracking-dashboard-integration`: Connexion des donnees tracking au dashboard admin et freelance
- `tracking-bugfixes`: Correction pageViews gonfle, deduplication, validation

### Modified Capabilities

## Impact

### Code impacte
- `lib/tracking/tracker.ts` — ajout duration, correction pageViews
- `lib/tracking/usePageTracker.ts` — tracking entites + duration
- `lib/tracking/tracking-store.ts` — calculs conversion_rate, avg_time
- `lib/tracking/types.ts` — ajout champ duration
- `app/api/tracking/sessions/route.ts` — fix pageViews bug
- `app/api/tracking/event/route.ts` — deduplication
- `app/api/tracking/stats/route.ts` — nouveaux calculs business
- `app/admin/analytics/page.tsx` — connecter au tracking
- `components/tracking/TrackingProvider.tsx` — tracking entites
- Pages entites (`services/[slug]`, `freelances/[username]`, `formations/*`)

### Impact sur les autres roles
- **Admin** : voit les vraies metriques trafic dans analytics
- **Freelance** : voit les vues de ses services, temps moyen, taux de conversion
- **Client** : ses visites sont trackees pour le funnel de conversion
