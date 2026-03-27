## Why

Le profil public agence (`/agences/[slug]`) a une UI existante (1096 lignes) mais son API backend n'a aucune implémentation Prisma — elle ne fonctionne qu'en mode dev avec des données en mémoire. En production, la page affiche des données vides ou échoue. De plus, le design peut être amélioré pour être aussi soigné que le profil freelance (badges dynamiques, stats réelles, team members connectés). Version cible : **MVP**.

## What Changes

### API Prisma — Route manquante
- **`/api/public/agences/[slug]/route.ts`** : Implémenter la branche Prisma complète — AgencyProfile + user + team members + services + reviews + stats agrégées. Actuellement 100 lignes dev-only, doit devenir dual-mode

### UI améliorée — Design premium
- **Hero section** : Logo agence haute qualité avec fallback, cover image avec overlay gradient, badge "Agence Vérifiée" dynamique basé sur le vrai statut `verified`
- **Stats grid** : Connecter aux vraies données (commandes complétées, note moyenne, nombre d'avis, services actifs) depuis l'API
- **Team members** : Afficher les vrais membres depuis la table `TeamMember` avec avatar, rôle, compétences
- **Services section** : Afficher les vrais services agence depuis Prisma avec ventes et notes réelles
- **Reviews section** : Afficher les vrais avis sur les services de l'agence
- **SEO** : Ajouter `generateMetadata()` + JSON-LD `Organization` pour le profil agence

## Capabilities

### New Capabilities
- `agency-public-profile-api`: API Prisma complète pour le profil public agence avec toutes les données nécessaires
- `agency-profile-seo`: Meta tags dynamiques + JSON-LD Organization pour les profils agence

### Modified Capabilities
- `agency-profile-sections`: L'UI du profil doit utiliser les vraies données de l'API au lieu des dev stores

## Impact

### Code affecté
- **API** : `/api/public/agences/[slug]/route.ts` — réécriture complète avec Prisma
- **Frontend** : `/agences/[slug]/page.tsx` — refactoring pour server component wrapper + améliorations UI
- **Prisma** : Pas de nouvelles tables (AgencyProfile, TeamMember, Service, Review existent)

### Impact multi-rôles
- **Visiteur/Client** : Voit le vrai profil agence avec données réelles
- **Agence** : Son profil public reflète ses vraies données
