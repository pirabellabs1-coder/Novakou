## Context

L'espace admin FreelanceHigh possède 19 pages, 54 routes API, et un store Zustand avec 40+ actions. Le schéma Prisma définit 50+ modèles incluant `User`, `Order`, `Service`, `Payment`, `Dispute`, `Review`, `AuditLog`, `KycRequest`, `BlogPost`, `Category`.

**État actuel :**
- Chaque route API utilise un pattern `IS_DEV` qui switch entre dev stores (JSON files) et Prisma
- **Dashboard, Users, Services** : ont déjà des implémentations Prisma partielles côté prod
- **Finances, Notifications, KYC endpoints, Disputes, Blog, Audit** : dev-only (pas d'implémentation Prisma)
- **Config plateforme** : objet en mémoire qui se réinitialise au redémarrage du serveur
- Le store Zustand admin (`store/admin.ts`) fonctionne correctement côté frontend — il suffit que les APIs renvoient les bonnes données

**Contrainte :** Le MVP utilise une approche pragmatique. Les dev stores JSON ne sont pas le problème principal — ils persistent sur disque. Le vrai problème est que certaines routes n'ont pas d'implémentation Prisma, que la config ne persiste pas, et que les actions admin ne se propagent pas aux espaces utilisateurs.

## Goals / Non-Goals

**Goals :**
- Toutes les routes API admin ont une implémentation Prisma fonctionnelle (pas seulement les dev stores)
- La config plateforme (maintenance, commissions, devises) persiste en DB
- Les notifications admin créent de vrais emails via Resend et des notifications in-app en DB
- Les statistiques du dashboard, des finances et des analytics utilisent des requêtes Prisma agrégées sur les données réelles
- Les actions admin (suspend, ban, approve service, resolve dispute, approve KYC) se reflètent en DB et sont visibles dans les espaces freelance/client/agence
- Le mode maintenance bloque l'accès via le middleware Next.js

**Non-Goals :**
- Remplacer les dev stores — ils restent comme fallback en développement local sans DB
- Implémenter Socket.io ou Supabase Realtime pour les mises à jour temps réel (V2)
- Ajouter des jobs BullMQ pour les emails (envoi synchrone via Resend au MVP)
- Refactoring du frontend admin — l'UI et le store Zustand restent tels quels
- Notifications push navigateur (V4)
- SMS via Twilio pour les notifications admin (V2)

## Decisions

### 1. Table `platform_config` pour la persistance de la configuration

**Choix :** Table clé-valeur simple avec colonne JSONB pour les valeurs complexes.

```prisma
model PlatformConfig {
  key       String   @id
  value     Json
  updatedAt DateTime @updatedAt
  updatedBy String?
}
```

**Rationale :** Une table key-value est plus flexible qu'un modèle rigide pour la config plateforme (maintenance_mode, commissions, currencies, etc.). Les valeurs sont typées côté application via TypeScript.

**Alternative rejetée :** Fichier `.env` ou variables d'environnement — impossible à modifier dynamiquement depuis l'admin UI.

### 2. Table `user_notification` pour les notifications in-app

**Choix :** Nouvelle table pour stocker les notifications envoyées par l'admin aux utilisateurs.

```prisma
model UserNotification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String
  message   String
  type      String   // 'info', 'warning', 'success', 'error'
  channel   String   // 'in_app', 'email', 'sms'
  read      Boolean  @default(false)
  metadata  Json?
  createdAt DateTime @default(now())
}
```

**Rationale :** Le modèle `Notification` n'existe pas encore dans le schéma Prisma. Les notifications in-app doivent être stockées par utilisateur pour que chaque espace puisse les afficher.

**Alternative rejetée :** Stocker dans `AuditLog` — l'audit log est pour les actions admin, pas les notifications utilisateur.

### 3. Migration incrémentale des routes API (pas de big bang)

**Choix :** Migrer les routes une par une, en gardant le pattern `IS_DEV` existant. Pour chaque route, compléter le branch `else` (production) avec les requêtes Prisma.

**Rationale :** L'architecture dual-layer (dev/prod) est déjà en place. Il suffit de remplir les implémentations manquantes côté prod. Pas de refactoring structurel nécessaire.

**Ordre de migration :**
1. Config (persistance critique — mode maintenance)
2. Dashboard (stats réelles)
3. Finances (transactions réelles)
4. Notifications (envoi email + stockage in-app)
5. KYC, Disputes, Blog, Audit (compléter les endpoints manquants)
6. Services et Users (déjà partiellement Prisma — compléter les actions)

### 4. Emails admin via Resend synchrone (pas BullMQ)

**Choix :** Appeler `resend.emails.send()` directement dans les routes API admin, sans job queue.

**Rationale :** Au MVP, le volume d'emails admin est faible (quelques notifications par jour). La latence de Resend (~200ms) est acceptable dans une action admin. BullMQ introduirait une complexité inutile à ce stade.

**Migration V1 :** Quand le volume augmente, migrer vers BullMQ pour les envois en masse.

### 5. Middleware maintenance mode dans Next.js

**Choix :** Le middleware Next.js vérifie la clé `maintenance_mode` dans `platform_config` à chaque requête. Cache Redis ou cache mémoire de 60 secondes pour éviter une requête DB par page.

**Rationale :** Le middleware Next.js s'exécute avant le rendu de chaque page. C'est l'endroit naturel pour bloquer l'accès en mode maintenance.

**Fallback :** Si la DB est inaccessible, le mode maintenance n'est pas activé (fail-open pour ne pas bloquer le site par erreur).

### 6. Statistiques par agrégation Prisma (pas de table de cache)

**Choix :** Calculer les stats du dashboard en temps réel via des requêtes Prisma `count()`, `aggregate()`, `groupBy()`.

**Rationale :** Au MVP avec <500 utilisateurs, les agrégations Postgres sont instantanées (<50ms). Pas besoin de tables de cache ou de matérialized views.

**Migration V2 :** Si les performances dégradent, ajouter des matérialized views ou un cache Redis de 5 minutes.

## Risks / Trade-offs

- **[Latence config DB]** → Le middleware maintenance vérifie la DB à chaque requête. Mitigation : cache mémoire de 60 secondes. Pire cas : 60 secondes de délai pour activer/désactiver la maintenance.

- **[Emails synchrones]** → Si Resend est down, l'action admin échoue. Mitigation : try/catch avec log d'erreur — l'action admin (suspension, KYC) réussit quand même, seul l'email échoue. Retry manuel possible.

- **[Migration progressive]** → Pendant la migration, certaines routes seront sur Prisma et d'autres encore en dev store. Mitigation : order strict de migration. Dashboard en premier car c'est la page d'accueil admin.

- **[Pas de rollback automatique pour les actions admin]** → Une suspension utilisateur est immédiate et irréversible (sauf réactivation manuelle). Mitigation : confirmation côté UI (déjà en place dans le frontend), audit log de chaque action.

## Migration Plan

1. **Étape 1 — Schéma DB** : Ajouter `PlatformConfig` et `UserNotification` au schema Prisma + migration
2. **Étape 2 — Config** : Implémenter GET/PATCH `/api/admin/config` avec Prisma + middleware maintenance
3. **Étape 3 — Dashboard** : Compléter les agrégations Prisma pour toutes les métriques
4. **Étape 4 — Finances** : Implémenter GET `/api/admin/finances` avec Prisma (Payment, Order)
5. **Étape 5 — Notifications** : POST `/api/admin/notifications/send` → Resend + UserNotification en DB
6. **Étape 6 — Endpoints manquants** : KYC, Disputes, Blog, Audit → compléter les branches Prisma
7. **Étape 7 — Propagation inter-espaces** : Vérifier que les actions admin (suspend, approve, KYC) se reflètent via les requêtes existantes des autres espaces

**Rollback :** En cas de problème, les dev stores restent fonctionnels. Revenir à `IS_DEV = true` pour chaque route problématique.

## Open Questions

- Faut-il un endpoint API dédié pour que les espaces freelance/client/agence récupèrent leurs notifications in-app, ou est-ce que les pages existantes suffisent avec une requête Prisma dans les server components ?
- Quel est le format exact des emails admin broadcast ? Faut-il créer un nouveau template React Email ou réutiliser un existant ?
