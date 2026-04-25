## Why

L'espace admin de la marketplace FreelanceHigh dispose d'une interface UI complète (19 pages, 54 routes API, store Zustand avec 40+ actions), mais **quasiment tout fonctionne en mémoire** via des dev stores (`data-store.ts`, `dev-store.ts`, `orderStore`, `serviceStore`, etc.). Les données ne persistent pas entre les redémarrages du serveur, les modifications admin (notifications, maintenance, commissions, KYC) ne se propagent pas aux espaces freelance/client/agence, et les statistiques affichent des données fictives non liées à la vraie activité. En résumé : l'admin voit une interface qui "a l'air de marcher" mais rien ne fonctionne réellement.

Ce changement est critique car l'espace admin est le centre nerveux de la plateforme — sans lui, impossible de modérer, de gérer les paiements, ou d'assurer la confiance des utilisateurs. **Version cible : MVP.**

## What Changes

### Persistence des données admin
- Remplacer tous les dev stores en mémoire par des requêtes Prisma vers Supabase Postgres
- Les routes API `/api/admin/*` liront et écriront dans la vraie base de données
- Configuration plateforme (maintenance, devises, commissions) persistée en DB au lieu d'in-memory

### Notifications et emails fonctionnels
- L'envoi de notifications admin vers les utilisateurs déclenche réellement des emails via Resend
- Les notifications in-app sont stockées en DB et visibles dans les espaces utilisateurs (freelance, client, agence)
- Templates React Email utilisés pour chaque type de notification admin

### Configuration plateforme persistée
- Mode maintenance : persiste en DB, vérifié par middleware Next.js sur chaque requête
- Commissions par plan : modifiables en admin, appliquées immédiatement aux nouvelles transactions
- Devises et méthodes de paiement : configuration persistée

### Statistiques connectées aux vraies données
- Dashboard admin : métriques calculées depuis les vraies tables Prisma (users, orders, services, transactions)
- Analytics : graphiques basés sur les données réelles (inscriptions, revenus, conversions)
- Finances : transactions réelles de la plateforme, pas des données fictives

### Communication inter-espaces
- Actions admin (suspension utilisateur, approbation service, verdict litige) se reflètent immédiatement dans les espaces concernés
- KYC : changement de niveau visible dans le JWT de l'utilisateur et ses permissions
- Modération services : statut du service mis à jour dans le dashboard freelance

## Capabilities

### New Capabilities
- `admin-data-persistence`: Remplacement des dev stores par des requêtes Prisma pour toutes les routes API admin — lecture et écriture vers Supabase Postgres
- `admin-notifications-system`: Système de notifications admin fonctionnel — envoi d'emails via Resend, stockage des notifications in-app en DB, visibilité dans les espaces utilisateurs
- `admin-config-persistence`: Persistance de la configuration plateforme (maintenance, commissions, devises, méthodes de paiement) en base de données avec vérification par middleware
- `admin-realtime-stats`: Statistiques et analytics admin basées sur les données réelles Prisma — dashboard, graphiques de revenus, métriques KPI

### Modified Capabilities
<!-- Pas de specs existantes modifiées — les specs existantes concernent l'espace instructeur/messaging, pas l'admin marketplace -->

## Impact

### Code impacté
- **54 routes API** dans `apps/web/app/api/admin/` — toutes doivent migrer des dev stores vers Prisma
- **Store Zustand** `apps/web/store/admin.ts` — adaptations mineures pour gérer les réponses Prisma
- **Dev stores** `apps/web/lib/dev/data-store.ts`, `dev-store.ts` — dépréciés pour l'admin (conservés pour les autres espaces en dev)
- **Middleware Next.js** — ajout de la vérification du mode maintenance

### Schéma Prisma
- Nouvelle table `platform_config` (clé-valeur pour la configuration globale)
- Nouvelle table `admin_notifications` (notifications envoyées par l'admin aux utilisateurs)
- Nouvelle table `user_notifications` (notifications in-app par utilisateur)
- Colonnes potentielles ajoutées aux tables existantes (`users`, `services`, `orders`) si nécessaire

### Templates email
- Templates React Email pour : notification admin broadcast, alerte maintenance, changement KYC, modération service

### Impact sur les autres rôles
- **Freelance** : voit les notifications admin, service approuvé/refusé se reflète en temps réel
- **Client** : reçoit les notifications admin, statut commandes cohérent avec l'admin
- **Agence** : mêmes bénéfices que freelance (notifications, modération services)
- **Tous** : mode maintenance bloque l'accès, changement de commission appliqué aux futures transactions

### Dépendances externes
- Resend (email) — déjà configuré, besoin d'activer les envois réels
- Supabase Postgres — schéma Prisma existant, ajout de tables
- Pas de job BullMQ nécessaire au MVP (les emails sont envoyés synchroniquement via Resend, les jobs async viendront en V1)
- Pas de handler Socket.io nécessaire (Supabase Realtime suffira pour les mises à jour live du dashboard)
