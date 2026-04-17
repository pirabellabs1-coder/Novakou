## Context

Le module Formations dispose d'une architecture complète : cart API, Stripe checkout, enrollment, lesson player avec gating, favorites localStorage+server, dashboard avec charts Recharts, et stats API Prisma. Cependant, plusieurs flux sont cassés ou mal connectés :

1. **Navigation** : `FormationsHeader.tsx` affiche toujours "Devenir instructeur" et "Mes formations" sans distinction de rôle
2. **Leçons gratuites** : Le player redirige systématiquement les non-inscrits, même pour les leçons `isFree: true`
3. **Favoris** : Fonctionne en localStorage mais pas de modèle Prisma, l'API `/api/apprenant/favoris` échoue silencieusement
4. **Reçus** : Aucun reçu PDF n'est généré après achat
5. **Stats dashboard** : L'API `/api/apprenant/enrollments` calcule des stats réelles mais certains calculs sont fragiles (streak basé sur LessonProgress qui peut être vide, weeklyHours divisé par 7 fixe)
6. **Profil instructeur** : Le lien pointe correctement vers `/instructeurs/[id]` mais la page peut ne pas trouver les données si l'API ne retourne pas le bon format

Stack existante : Next.js 14 App Router, Prisma 5, Stripe, next-auth, localStorage pour favoris.

## Goals / Non-Goals

**Goals:**
- Navigation adaptée au rôle (apprenant, instructeur, admin)
- Accès aux leçons gratuites/preview sans enrollment
- Persistance des favoris en base de données (FormationFavorite)
- Génération de reçu PDF après achat
- Stats dashboard fiables avec données réelles
- Page instructeur fonctionnelle depuis le lien "Voir le profil"
- Descriptions produits avec images inline via Tiptap

**Non-Goals:**
- Refonte complète de l'espace instructeur (sera traité séparément)
- Système de paiement Mobile Money (déjà prévu V1)
- Notifications push
- Système d'abonnement/plans

## Decisions

### D1: Navigation rôle-dépendante dans FormationsHeader
**Choix** : Lire `session.user.role` et `session.user.instructeurProfileId` pour conditionner les liens du menu.
- Instructeur connecté → masquer "Devenir instructeur", afficher "Tableau de bord" → `/instructeur`
- Apprenant connecté → garder "Mes formations" → `/mes-formations`
- Non connecté → garder "Devenir instructeur"
**Raison** : Minimal, pas de nouvelle API, utilise les données de session existantes.

### D2: Leçons gratuites accessibles sans enrollment
**Choix** : Modifier le player (`apprendre/[id]/page.tsx`) pour accepter un mode "preview" quand l'utilisateur n'est pas inscrit mais la leçon est `isFree: true`. Ajouter un endpoint léger `GET /api/formations/[id]/free-lesson/[lessonId]` qui retourne le contenu de la leçon si `isFree === true`, sans vérifier l'enrollment.
**Alternative rejetée** : Permettre l'enrollment automatique gratuit → trop intrusif, pollue les stats.
**Raison** : L'aperçu doit rester léger. On ne crée pas d'enrollment, on donne juste accès au contenu de la leçon.

### D3: FormationFavorite en Prisma
**Choix** : Ajouter un modèle `FormationFavorite` avec `userId + formationId` (unique constraint). L'API `/api/apprenant/favoris` existante sera modifiée pour utiliser Prisma au lieu de fail silently. Le localStorage reste en fallback pour les non-connectés.
**Raison** : Persiste les favoris cross-device et permet des analytics.

### D4: Reçus PDF
**Choix** : Utiliser `@react-pdf/renderer` (déjà dans le workspace pour les certificats) pour générer un reçu PDF simple après checkout. Stocker le lien dans une nouvelle table `PurchaseReceipt` ou directement comme champ sur `Enrollment.receiptUrl`. Endpoint `GET /api/apprenant/receipts/[enrollmentId]`.
**Alternative rejetée** : Envoyer le reçu par email uniquement → l'utilisateur doit pouvoir le re-télécharger.
**Raison** : Réutilise l'infra PDF existante.

### D5: Stats dashboard — corrections ciblées
**Choix** : Corriger les calculs dans `/api/apprenant/enrollments` :
- Streak : fallback à 0 si pas de LessonProgress au lieu de NaN
- WeeklyHours : basé sur les vrais jours de la semaine courante, pas division par 7
- SkillRadar : grouper par catégorie de formation (pas par niveau)
**Raison** : L'API existe et fonctionne, juste des corrections de calcul.

### D6: Profil instructeur — vérifier le flux complet
**Choix** : Vérifier que l'API `/api/formations/instructeurs/[id]` retourne le bon format et que la page `/instructeurs/[id]/page.tsx` le consomme correctement. Corriger si nécessaire.
**Raison** : Le lien existe déjà, juste s'assurer qu'il fonctionne.

## Risks / Trade-offs

- **Migration Prisma pour FormationFavorite** → Risque faible, table nouvelle sans impact sur l'existant. Mitigation : migration additive.
- **Leçons gratuites sans enrollment** → Risque de fuite de contenu si mal implémenté. Mitigation : vérifier `isFree` côté serveur, pas côté client.
- **PDF reçu** → Performance si généré à la volée. Mitigation : générer au moment du checkout et stocker, pas à chaque téléchargement.
- **Session.user.role manquant** → Si la session next-auth ne contient pas le rôle/instructeurProfileId. Mitigation : vérifier le callback JWT et enrichir si nécessaire.
