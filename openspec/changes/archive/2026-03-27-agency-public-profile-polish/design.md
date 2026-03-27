## Context

Le profil public agence (`/agences/[slug]`) est une page "use client" de 1096 lignes. L'UI est fonctionnelle en dev mode mais l'API (`/api/public/agences/[slug]`) n'a que 100 lignes sans Prisma. Le profil freelance (`/freelances/[username]`) est le modèle de référence avec API Prisma complète (266 lignes).

**Modèles Prisma disponibles :**
- `AgencyProfile` : id, userId, agencyName, logo, sector, size, description, website, siret, verified, country, settings, teamMembers (JSON legacy)
- `TeamMember` : id, agencyId, userId, role, joinedAt + relation vers User
- `Service` : relation `agency` via agencyId
- `Review` : sur les services, pas directement sur l'agence
- `Order` : relation `agency` via agencyId

## Goals / Non-Goals

**Goals:**
- API Prisma retourne toutes les données du profil agence (profil, team, services, reviews, stats)
- L'UI utilise les données réelles au lieu des dev stores
- SEO avec `generateMetadata()` et JSON-LD Organization
- Design soigné et cohérent avec le profil freelance

**Non-Goals:**
- Nouveau design from scratch (l'UI existante est bonne, on l'améliore)
- Page portfolio agence séparée (les réalisations sont dans le profil)
- Système de messagerie dans le profil (existe déjà)

## Decisions

### 1. API retourne un objet unifié

**Choix :** L'API retourne un seul objet `agency` avec toutes les sous-sections : profile, stats, team, services, reviews. Le frontend n'a besoin que d'un seul fetch.

**Structure réponse :**
```json
{
  "agency": {
    "id", "agencyName", "logo", "sector", "size", "description", "website", "verified", "country",
    "stats": { "completedOrders", "avgRating", "totalReviews", "activeServices", "teamSize" },
    "team": [{ "id", "name", "avatar", "role", "skills" }],
    "services": [{ "id", "slug", "title", "basePrice", "rating", "ratingCount", "orderCount", "image" }],
    "reviews": [{ "id", "author", "rating", "comment", "createdAt", "reply" }]
  }
}
```

### 2. Reviews agrégées depuis les services agence

**Choix :** Les reviews affichées sur le profil agence sont les reviews des services de l'agence. On agrège toutes les reviews de tous les services liés à l'agencyId.

**Rationale :** Pas de modèle `Review` directement sur `AgencyProfile`. Les clients évaluent les services, pas l'agence elle-même.

### 3. Server component wrapper pour SEO

**Choix :** Même pattern que la page service : renommer le client component, créer un server page qui exporte `generateMetadata()` et rend le client + JSON-LD.

### 4. Stats calculées par agrégats Prisma

**Choix :** `completedOrders` = count orders avec agencyId + status TERMINE. `avgRating` = moyenne des ratings des services agence. `totalReviews` = count reviews sur les services agence. `activeServices` = count services avec agencyId + status ACTIF.

## Risks / Trade-offs

**[Reviews agrégées = N+1 potential]** → On fetch les reviews en une seule query avec `where: { service: { agencyId } }`. Pas de N+1.

**[Team members sans profil User]** → Un team member peut ne pas avoir de profil freelancer. On affiche quand même avec les données du User (name, avatar).
