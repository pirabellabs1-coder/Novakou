## 1. API Prisma — Profil public agence

- [x] 1.1 Réécrire `/api/public/agences/[slug]/route.ts` avec implémentation Prisma complète : query `AgencyProfile` par slug (chercher via `agencyName` slug-ifié ou `id`), inclure `user`, team members via `TeamMember` model joiné avec `User` (name, avatar, freelancerProfile pour skills), services actifs (6 max, avec rating/orderCount), reviews agrégées depuis les services agence (10 max, avec author name/avatar/country). Calculer stats : completedOrders (count orders avec agencyId + status TERMINE), avgRating (moyenne ratings services), totalReviews, activeServices, teamSize
- [x] 1.2 Conserver le fallback dev store existant dans une branche `if (IS_DEV && !USE_PRISMA_FOR_DATA)` — garder le mode dual

## 2. SEO — generateMetadata + JSON-LD

- [x] 2.1 Restructurer `/agences/[slug]/page.tsx` : déplacer le client component vers `AgencyProfileClient.tsx`, créer un server page wrapper qui exporte `generateMetadata()` avec titre, description, og:image depuis Prisma
- [x] 2.2 Ajouter JSON-LD `Organization` dans le server component : @type Organization, name, description, url, logo, aggregateRating (si reviews > 0), sector

## 3. UI Polish — Améliorations visuelles

- [x] 3.1 Hero section : utiliser `<img>` pour le logo agence au lieu d'initiales quand l'URL est disponible, ajouter un gradient overlay sur le cover, badge "Agence Verifiee" vert dynamique basé sur `agency.verified`, afficher le pays avec drapeau
- [x] 3.2 Stats grid : connecter les 4 cards aux vraies données de l'API (`completedOrders`, `avgRating`, `totalReviews`, `activeServices`) — remplacer toute valeur hardcodée
- [x] 3.3 Team members : afficher les vrais membres depuis l'API, utiliser avatar `<img>` avec fallback initiales, afficher les 3 premières compétences depuis freelancerProfile, lien cliquable vers `/freelances/[username]` si le membre a un profil public
- [x] 3.4 Services section : afficher les vrais services de l'API avec image, titre, prix, rating (étoiles), orderCount (ventes), catégorie — même design que les cards explorer
- [x] 3.5 Reviews section : afficher les vraies reviews depuis l'API avec avatar auteur, nom, pays, note étoiles, commentaire, date, réponse si présente

## 4. Vérification

- [x] 4.1 Vérifier que la page charge correctement avec des données Prisma réelles
- [x] 4.2 Vérifier que generateMetadata retourne les bons meta tags et que le JSON-LD est présent dans le HTML
