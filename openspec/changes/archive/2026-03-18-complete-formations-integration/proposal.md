## Why

Les trois espaces formations (Apprenant, Instructeur, Admin) ont été développés de manière relativement isolée. L'espace Instructeur a reçu de nombreuses fonctionnalités avancées (marketing complet, produits numériques, statistiques détaillées, promotions, funnels) qui n'ont pas encore d'équivalent côté Admin pour la supervision ni côté Apprenant pour la consommation. Les API utilisent encore des données hardcodées en DEV_MODE au lieu de requêtes dynamiques réelles. Les statistiques admin manquent de graphiques avancés (funnels de conversion, heatmaps, graphes de tendances). Les données ne se mettent pas à jour automatiquement — il n'y a pas de polling/refetch. L'intégration entre les espaces (explorer, page d'accueil formations, statistiques croisées) est incomplète.

## What Changes

### Espace Admin — Ajouts manquants
- **Dashboard avancé avec supergraphes** : funnels de conversion, graphes de rétention par cohorte, heatmap d'activité hebdomadaire, graphe waterfall des revenus, distribution géographique des apprenants, progression des inscriptions en temps réel
- **Supervision marketing** : page admin pour voir toutes les activités marketing des instructeurs (affiliés, campagnes, promotions actives, pixels, funnels)
- **Analytics produits numériques** : vue admin des ventes de produits, top produits, revenus par type
- **Gestion des cohortes** : liste admin de toutes les cohortes avec statuts, participants, taux de complétion
- **Modération des discussions** : page admin pour modérer les discussions de cours (signalements, suppression, verrouillage)
- **Journal d'audit** : historique de toutes les actions admin (approbations, rejets, révocations, suspensions)
- **Configuration formations** : page de paramètres système (commission par défaut, durée escrow, limites uploads, etc.)
- **Comparaison instructeurs** : tableau de performance comparative des instructeurs (revenus, notes, taux de complétion)

### Espace Apprenant — Ajouts manquants
- **Dashboard enrichi** : graphiques de progression personnels (heures d'apprentissage par semaine, streak visuel, radar de compétences par catégorie, objectifs hebdomadaires)
- **Page discussions** : accès centralisé à toutes les discussions de cours auxquelles l'apprenant participe
- **Historique des avis** : page pour voir et gérer les avis laissés sur les formations
- **Recommandations** : section de formations recommandées basée sur les inscriptions et catégories favorites
- **Demande de remboursement** : interface pour demander un remboursement avec suivi du statut
- **Notifications center** : page dédiée aux notifications (inscriptions, certificats, réponses discussions, promotions)

### Connexion inter-espaces
- **Suppression de toutes les données hardcodées DEV_MODE** dans les API formations — toutes les requêtes passent par Prisma, avec seed DB pour le développement
- **Auto-refresh des données** : polling TanStack Query (30s pour dashboards, 60s pour listes) sur toutes les pages dynamiques
- **Page d'accueil formations** connectée aux vraies données (stats live, formations populaires, dernières formations publiées)
- **Explorer** reflète les formations actives en temps réel avec stats de vente et notes à jour
- **Statistiques croisées** : les stats admin incluent les données instructeurs et apprenants consolidées
- **Commission centralisée** : constante `INSTRUCTOR_COMMISSION` extraite dans un fichier de config partagé

### Graphiques et visualisations admin
- **Recharts avancé** : AreaChart avec gradients, ComposedChart (bars+lignes), RadarChart pour les compétences, FunnelChart pour les conversions
- **Animations** : transitions fluides sur les changements de période, compteurs animés sur les KPIs
- **Export** : boutons d'export CSV/PDF sur tous les graphiques et tableaux

## Capabilities

### New Capabilities
- `admin-advanced-dashboard`: Dashboard admin avec supergraphes (funnels, heatmaps, waterfall, rétention, distribution géo, comparaison instructeurs)
- `admin-marketing-oversight`: Supervision admin des activités marketing de tous les instructeurs
- `admin-cohort-management`: Gestion administrative des cohortes (liste, stats, modération)
- `admin-discussion-moderation`: Modération des discussions de cours par l'admin
- `admin-audit-log`: Journal d'audit complet des actions administratives
- `admin-formations-config`: Page de configuration système des paramètres formations
- `apprenant-enhanced-dashboard`: Dashboard apprenant enrichi avec graphiques de progression et recommandations
- `apprenant-discussions-center`: Page centralisée des discussions de cours pour l'apprenant
- `apprenant-reviews-history`: Historique et gestion des avis laissés par l'apprenant
- `apprenant-refund-requests`: Interface de demande et suivi de remboursements
- `cross-space-data-integration`: Suppression des données hardcodées, auto-refresh, stats croisées, commission centralisée
- `formations-realtime-stats`: Statistiques temps réel connectées entre la page d'accueil, l'explorer et les dashboards

### Modified Capabilities
_(Aucune spec existante n'est modifiée au niveau des requirements)_

## Impact

### Version cible : MVP (immédiate)

### Impact sur les rôles
- **Admin** : 6 nouvelles pages, 8+ nouvelles API routes, dashboard entièrement redessiné
- **Apprenant** : 4 nouvelles pages, 5+ nouvelles API routes, dashboard enrichi
- **Instructeur** : pas de nouvelle page, mais les données de marketing/produits deviennent visibles par l'admin
- **Public** : page d'accueil et explorer connectés aux vraies données

### Schéma Prisma
- Nouvelle table `AuditLog` (userId, action, targetType, targetId, metadata, createdAt)
- Nouvelle table `RefundRequest` (userId, enrollmentId, reason, status, adminNote, createdAt, resolvedAt)
- Nouvelle table `ApprenantNotification` (userId, type, title, message, isRead, relatedId, createdAt)
- Ajout colonne `reportCount` sur `CourseDiscussion` et `CourseDiscussionReply`
- Ajout table `DiscussionReport` (userId, discussionId, reason, createdAt)

### APIs affectées
- Toutes les API `/api/admin/formations/*` — suppression DEV_MODE, ajout vraies requêtes
- Toutes les API `/api/apprenant/*` — suppression DEV_MODE, ajout vraies requêtes
- Toutes les API `/api/formations/*` (publiques) — suppression DEV_MODE
- Nouvelles API admin : `/api/admin/formations/marketing`, `/api/admin/formations/cohorts`, `/api/admin/formations/discussions`, `/api/admin/formations/audit-log`, `/api/admin/formations/config`
- Nouvelles API apprenant : `/api/apprenant/discussions`, `/api/apprenant/reviews`, `/api/apprenant/refunds`, `/api/apprenant/notifications`, `/api/apprenant/recommendations`

### Dépendances
- `recharts` (déjà installé) — utilisation étendue avec FunnelChart, RadarChart, ComposedChart
- Aucune nouvelle dépendance externe requise

### Jobs BullMQ
- Aucun nouveau job requis (les notifications utilisent les patterns existants)

### Templates Email
- Email de confirmation de remboursement (apprenant)
- Email de notification de remboursement traité (admin → apprenant)

### Socket.io
- Aucun nouveau handler requis (les données se rafraîchissent via polling TanStack Query)
