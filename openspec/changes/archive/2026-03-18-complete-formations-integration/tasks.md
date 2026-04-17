## 1. Fondations — Schéma Prisma, Config partagée, Seed

- [x] 1.1 Ajouter les tables `AuditLog`, `RefundRequest`, `DiscussionReport`, et `FormationsConfig` au schéma Prisma + colonnes `reportCount` et `status` (locked/deleted) sur `CourseDiscussion` et `CourseDiscussionReply` + exécuter la migration
- [x] 1.2 Créer le fichier `lib/formations/config.ts` avec `FORMATIONS_CONFIG` (commission, refund window, auto-refresh intervals, max upload, etc.) et remplacer toutes les définitions locales de `INSTRUCTOR_COMMISSION` / `PLATFORM_COMMISSION` dans le codebase par des imports depuis ce fichier
- [x] 1.3 Créer la fonction utilitaire `logAuditAction()` dans `lib/formations/audit.ts` qui enregistre une action dans la table `AuditLog` (userId, action, targetType, targetId, metadata, ipAddress)
- [x] 1.4 Créer le script `packages/db/prisma/seed.ts` avec données de test réalistes : 3 instructeurs, 10 formations (variété de statuts), 20 apprenants, 50 inscriptions, 15 certificats, 5 produits numériques, 3 cohortes, 10 avis, 5 catégories
- [x] 1.5 Ajouter les clés de traduction i18n manquantes dans `messages/fr.json` et `messages/en.json` pour toutes les nouvelles pages (admin: marketing, cohorts, discussions, audit-log, configuration; apprenant: discussions, avis, remboursements)

## 2. Suppression DEV_MODE — API Apprenant

- [x] 2.1 Refactoriser `api/apprenant/enrollments/route.ts` — supprimer le bloc DEV_MODE, garder uniquement le chemin Prisma, retourner des valeurs par défaut si la base est vide, ajouter les nouveaux champs `weeklyHours`, `skillRadar`, `recommendations`, `weeklyGoalProgress`
- [x] 2.2 Refactoriser `api/apprenant/certificats/route.ts` et `api/apprenant/certificats/[id]/route.ts` — supprimer DEV_MODE, Prisma uniquement
- [x] 2.3 Refactoriser `api/apprenant/achats/route.ts` — supprimer DEV_MODE, Prisma uniquement
- [x] 2.4 Refactoriser `api/apprenant/profil/route.ts` — supprimer DEV_MODE, Prisma uniquement

## 3. Suppression DEV_MODE — API Admin

- [x] 3.1 Refactoriser `api/admin/formations/stats/route.ts` — supprimer DEV_MODE, ajouter les calculs pour `conversionFunnel`, `revenueWaterfall`, `activityHeatmap`, `categoryRadar`, `topInstructors`, `geoDistribution`
- [x] 3.2 Refactoriser `api/admin/formations/apprenants/route.ts` — supprimer DEV_MODE, Prisma uniquement
- [x] 3.3 Refactoriser `api/admin/formations/certificats/route.ts` — supprimer DEV_MODE, Prisma uniquement
- [x] 3.4 Refactoriser `api/admin/formations/produits/route.ts`, `approve/[id]/route.ts`, `reject/[id]/route.ts` — supprimer DEV_MODE, ajouter `logAuditAction()` sur chaque action
- [x] 3.5 Refactoriser les API admin restantes (`approve/[id]`, `reject/[id]`, `stats`) — supprimer DEV_MODE, ajouter `logAuditAction()`

## 4. Suppression DEV_MODE — API Instructeur et Publiques

- [x] 4.1 Refactoriser `api/instructeur/formations/route.ts` et `api/instructeur/dashboard/route.ts` — supprimer DEV_MODE
- [x] 4.2 Refactoriser `api/instructeur/revenus/route.ts`, `api/instructeur/avis/route.ts`, `api/instructeur/statistiques/route.ts` — supprimer DEV_MODE
- [x] 4.3 Refactoriser `api/formations/route.ts` (publique), `api/formations/stats/route.ts`, `api/formations/[id]/route.ts` — supprimer DEV_MODE, assurer que les stats sont calculées dynamiquement depuis Prisma

## 5. Nouvelles API Admin

- [x] 5.1 Créer `api/admin/formations/marketing/route.ts` (GET) — stats marketing consolidées de tous les instructeurs (promotions actives, codes promo, revenus marketing, taux conversion)
- [x] 5.2 Créer `api/admin/formations/marketing/promotions/route.ts` (GET) — liste paginée des promotions actives avec instructeur, et `PUT` pour désactiver une promotion
- [x] 5.3 Créer `api/admin/formations/cohorts/route.ts` (GET) — liste paginée des cohortes avec formation et instructeur, et `PUT /api/admin/formations/cohorts/[id]/route.ts` pour fermer une cohorte
- [x] 5.4 Créer `api/admin/formations/discussions/route.ts` (GET) — liste des discussions avec signalements, et `PUT /api/admin/formations/discussions/[id]/route.ts` pour lock/delete/restore
- [x] 5.5 Créer `api/admin/formations/audit-log/route.ts` (GET) — journal d'audit paginé avec filtres (action, userId, période)
- [x] 5.6 Créer `api/admin/formations/config/route.ts` (GET/PUT) — lecture et mise à jour des paramètres système depuis la table `FormationsConfig`
- [x] 5.7 Créer `api/admin/formations/refunds/route.ts` (GET) et `api/admin/formations/refunds/[id]/route.ts` (PUT) — liste des demandes de remboursement et traitement (approve/reject)

## 6. Nouvelles API Apprenant

- [x] 6.1 Créer `api/apprenant/discussions/route.ts` (GET) — discussions de l'apprenant avec compteur non lus et statut
- [x] 6.2 Créer `api/apprenant/reviews/route.ts` (GET) et `api/apprenant/reviews/[id]/route.ts` (PUT/DELETE) — historique des avis avec modification (7j) et suppression
- [x] 6.3 Créer `api/apprenant/refunds/route.ts` (GET/POST) — demande et suivi de remboursements avec vérifications d'éligibilité (14j, <30% progression)
- [x] 6.4 Créer `api/apprenant/recommendations/route.ts` (GET) — 4 formations recommandées basées sur les catégories des inscriptions existantes
- [x] 6.5 Créer `api/formations/[id]/discussions/report/route.ts` (POST) — signalement de discussion/réponse par un apprenant ou instructeur

## 7. Dashboard Admin Avancé — Supergraphes

- [x] 7.1 Créer le composant `ActivityHeatmap.tsx` dans `components/formations/` — grille CSS 52×7 avec 5 niveaux d'intensité de couleur (gris → violet)
- [x] 7.2 Créer le composant `RevenueWaterfall.tsx` — graphe waterfall (revenus bruts → commissions → remboursements → net) avec barres positives/négatives colorées
- [x] 7.3 Créer le composant `ConversionFunnelChart.tsx` — funnel 4 étapes (visiteurs → inscriptions → achats → certificats) avec taux de conversion
- [x] 7.4 Créer le composant `AnimatedCounter.tsx` dans `components/formations/` — compteur numérique avec animation de 0 à valeur en 800ms
- [x] 7.5 Redesigner la page `admin/dashboard/page.tsx` avec les supergraphes : funnel de conversion, waterfall revenus, heatmap activité, RadarChart catégories, tableau comparatif instructeurs, distribution géographique, KPIs animés + sélecteur de période

## 8. Nouvelles Pages Admin

- [x] 8.1 Créer la page `admin/marketing/page.tsx` — supervision marketing (KPIs, tableau promotions actives, filtrage par instructeur, bouton désactiver)
- [x] 8.2 Créer la page `admin/cohorts/page.tsx` — liste des cohortes (tableau filtrable par statut, recherche, détails expandables avec participants et progression, bouton fermer)
- [x] 8.3 Créer la page `admin/discussions/page.tsx` — modération des discussions (onglets signalées/toutes, actions verrouiller/supprimer/restaurer, détails signalements)
- [x] 8.4 Créer la page `admin/audit-log/page.tsx` — journal d'audit (timeline chronologique, filtres action/admin/période, pagination "Charger plus")
- [x] 8.5 Créer la page `admin/configuration/page.tsx` — paramètres système (formulaire en sections : Finances, Limites, Fonctionnalités, avec validation inline)
- [x] 8.6 Mettre à jour `admin/finances/page.tsx` — ajouter l'onglet "Remboursements" avec liste des demandes en attente et boutons approuver/refuser
- [x] 8.7 Mettre à jour le layout admin `(admin)/layout.tsx` — ajouter les liens navigation : Marketing, Cohortes, Discussions, Journal d'audit, Configuration

## 9. Dashboard Apprenant Enrichi

- [x] 9.1 Ajouter les graphiques enrichis à `mes-formations/page.tsx` : AreaChart heures/semaine (8 dernières semaines), badge streak animé, RadarChart compétences par catégorie, barre objectifs hebdomadaires circulaire
- [x] 9.2 Ajouter la section "Recommandations" à `mes-formations/page.tsx` avec 4 FormationCards basées sur les catégories favorites de l'apprenant
- [x] 9.3 Ajouter les compteurs animés (AnimatedCounter) aux 4 stat cards du dashboard apprenant

## 10. Nouvelles Pages Apprenant

- [x] 10.1 Créer la page `(apprenant)/mes-discussions/page.tsx` — liste des discussions (filtres toutes/ouvertes/résolues/mes questions, badge non lus, lien vers formation)
- [x] 10.2 Créer la page `(apprenant)/mes-avis/page.tsx` — historique des avis (tableau avec note/commentaire/statut/date, modification inline <7j, suppression avec confirmation)
- [x] 10.3 Ajouter l'onglet "Remboursements" à `(apprenant)/mes-achats/page.tsx` — liste des demandes avec statut, bouton "Demander un remboursement" sur les achats éligibles
- [x] 10.4 Mettre à jour le layout apprenant `(apprenant)/layout.tsx` — ajouter les liens navigation : Discussions, Mes avis

## 11. Connexion Inter-espaces et Auto-refresh

- [x] 11.1 Migrer les hooks React Query apprenant : créer `lib/formations/hooks-apprenant.ts` avec `useApprenantEnrollments()`, `useApprenantCertificats()`, `useApprenantAchats()`, `useApprenantDiscussions()`, `useApprenantReviews()`, `useApprenantRefunds()` — tous avec `refetchInterval`
- [x] 11.2 Créer `lib/formations/hooks-admin.ts` avec `useAdminDashboard()`, `useAdminFormations()`, `useAdminCohorts()`, `useAdminDiscussions()`, `useAdminAuditLog()`, `useAdminMarketing()`, `useAdminRefunds()`, `useAdminConfig()` — dashboards à 30s, listes à 60s
- [x] 11.3 Migrer toutes les pages apprenant existantes de `useState+useEffect+fetch` vers les hooks TanStack Query créés en 11.1
- [x] 11.4 Migrer toutes les pages admin existantes de `useState+useEffect+fetch` vers les hooks TanStack Query créés en 11.2
- [x] 11.5 Connecter la page d'accueil `/page.tsx` aux vraies données API (stats live, formations populaires, formations récentes, catégories avec compteurs) — supprimer toute donnée statique
- [x] 11.6 Vérifier la page explorer `/explorer/page.tsx` — confirmer que les filtres, la pagination, et les résultats utilisent exclusivement les données Prisma et que les compteurs (étudiants, notes, vues) sont à jour

## 12. Vérification et Tests

- [x] 12.1 Vérifier que le build Next.js passe sans erreur TypeScript (`pnpm build --filter=@freelancehigh/web`)
- [x] 12.2 Tester le dashboard admin avancé — vérifier que les 6 graphiques (funnel, waterfall, heatmap, radar, comparaison instructeurs, distribution géo) s'affichent correctement avec des données vides et avec des données du seed
- [x] 12.3 Tester la page admin marketing — vérifier l'affichage des KPIs, le filtrage par instructeur, la désactivation de promotion
- [x] 12.4 Tester la page admin cohortes — vérifier liste, filtrage, recherche, fermeture de cohorte
- [x] 12.5 Tester la page admin discussions — vérifier signalements, verrouillage, suppression, restauration
- [x] 12.6 Tester la page admin audit log — vérifier timeline, filtres, pagination
- [x] 12.7 Tester la page admin configuration — vérifier lecture/écriture des paramètres, validation inline
- [x] 12.8 Tester le dashboard apprenant enrichi — vérifier AreaChart, streak, radar compétences, recommandations, compteurs animés
- [x] 12.9 Tester les pages apprenant discussions et avis — vérifier liste, filtres, modification/suppression avis, navigation vers formation
- [x] 12.10 Tester les remboursements bout-en-bout — vérifier demande apprenant (éligibilité 14j + <30%), traitement admin (approve/reject), mise à jour statut, audit log
- [x] 12.11 Tester l'auto-refresh sur toutes les pages — vérifier que les données se rafraîchissent toutes les 30s (dashboards) et 60s (listes) et s'arrêtent quand l'onglet est inactif
- [x] 12.12 Tester la cohérence des données cross-space — vérifier que le nombre d'étudiants admin = somme des étudiants instructeurs, nombre de formations admin = formations explorer, revenus cohérents entre espaces
- [x] 12.13 Tester responsive sur mobile (375px), tablette (768px) et desktop (1280px) pour toutes les nouvelles pages
- [x] 12.14 Vérifier les traductions FR/EN sur toutes les nouvelles pages et composants
