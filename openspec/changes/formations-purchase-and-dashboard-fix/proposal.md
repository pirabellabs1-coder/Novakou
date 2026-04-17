## Why

Le module Formations a une architecture complète (achat, panier, checkout Stripe, favoris, player, stats dashboard) mais plusieurs flux critiques sont cassés ou mal connectés en production. L'apprenant ne peut pas acheter de formation ni accéder aux leçons gratuites, le menu de navigation ne s'adapte pas au rôle, les stats du dashboard ne fonctionnent pas correctement, et les produits numériques manquent d'éditeur riche pour les descriptions.

## What Changes

### Navigation & Rôles
- **Corriger le menu FormationsHeader** : masquer "Devenir instructeur" pour les utilisateurs connectés avec un profil instructeur ; afficher "Mon tableau de bord" → `/instructeur` au lieu de "Mes formations" → `/mes-formations` pour les instructeurs
- **Adapter le menu mobile** avec la même logique de rôle

### Achat & Enrollment
- **Corriger le flux d'achat formations** : vérifier que le checkout Stripe/gratuit fonctionne end-to-end (cart → checkout → enrollment → accès)
- **Permettre la lecture des leçons marquées `isFree`** sans enrollment (preview de la formation)
- **Générer un reçu de paiement PDF** après chaque achat (formation + produit numérique)
- **Ajouter le modèle `FormationFavorite` dans Prisma** pour persister les favoris côté serveur

### Dashboard Apprenant
- **Corriger l'API `/api/apprenant/enrollments`** : s'assurer que les stats (streak, heures, progression, compétences, objectif hebdomadaire) sont calculées correctement depuis les vraies données Prisma
- **Corriger le lien "Voir le profil" de l'instructeur** sur la page détail : vérifier que `/instructeurs/[id]` fonctionne et ne redirige pas vers le dashboard

### Produits Numériques
- **Améliorer l'éditeur de description des produits** : supporter les images inline, mise en forme riche (Tiptap editor) dans la page de création/édition de produit

## Capabilities

### New Capabilities
- `payment-receipts`: Génération et téléchargement de reçus PDF après achat (formation + produit numérique)
- `free-lesson-preview`: Accès aux leçons marquées `isFree` sans enrollment, comme aperçu de la formation

### Modified Capabilities
- `role-based-navigation`: Adapter le header formations selon le rôle (apprenant vs instructeur vs admin)
- `formation-favorites-persistence`: Persister les favoris formations en base de données via modèle Prisma
- `learner-dashboard-stats`: Corriger les calculs de stats du dashboard apprenant (streak, heures, radar, objectif)
- `product-rich-description`: Éditeur riche Tiptap avec images inline pour les descriptions de produits numériques

## Impact

### Fichiers principaux modifiés
- `apps/web/components/formations/FormationsHeader.tsx` — logique de menu rôle-dépendant
- `apps/web/app/formations/(apprenant)/apprendre/[id]/page.tsx` — accès leçons gratuites
- `apps/web/app/formations/[slug]/page.tsx` — flux achat + lien instructeur
- `apps/web/app/api/apprenant/enrollments/route.ts` — calcul stats dashboard
- `apps/web/app/api/formations/checkout/route.ts` — génération reçu post-paiement
- `packages/db/prisma/schema.prisma` — modèle FormationFavorite

### APIs impactées
- `GET /api/apprenant/enrollments` — stats enrichies
- `POST /api/formations/checkout` — retourner lien reçu
- `GET/POST/DELETE /api/apprenant/favoris` — persistance DB
- Nouveau: `GET /api/apprenant/receipts/[id]` — télécharger reçu PDF

### Dépendances
- Aucune nouvelle dépendance npm (Tiptap et les composants PDF existent déjà)
- Migration Prisma pour `FormationFavorite`
