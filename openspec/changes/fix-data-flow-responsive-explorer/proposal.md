## Why

Les services publiés par les freelances/agences ne remontent pas dans l'espace admin pour modération, et les projets publiés par les clients n'apparaissent pas sur la page publique `/offres-projets`. La cause racine est un **désalignement des statuts** entre les formulaires de création, les stores en mémoire (dev mode) et les filtres des APIs publiques/admin. En parallèle, l'espace client présente de sérieux problèmes de responsive (boutons coupés, éléments mal positionnés) et la page Explorer a des filtres mal conçus qui ne correspondent pas au menu catégories de la page d'accueil. Version cible : **MVP**.

## What Changes

### Flux services (freelance/agence → admin → marketplace)
- Corriger le statut de création des services : le formulaire sauvegarde `"en_attente"` (lowercase) mais l'API admin et publique filtrent parfois en uppercase `"EN_ATTENTE"` / `"ACTIF"` — **aligner tous les statuts sur les valeurs Prisma enum (UPPERCASE)**
- S'assurer que `/api/admin/services` retourne bien les services `EN_ATTENTE` dans l'onglet modération
- S'assurer que `/api/public/services` retourne les services `ACTIF` après approbation admin
- Vérifier `/api/admin/services/[id]` (approve/refuse) met à jour le statut correctement

### Flux projets clients (client → page publique)
- **BREAKING** : Corriger le statut de création des projets : le formulaire envoie `"actif"` mais le store attend `"ouvert"` et l'API publique filtre par `"ouvert"` — aligner sur un statut unique `"ouvert"` pour les projets publiés
- S'assurer que `/api/public/projects` retourne les projets avec le bon statut

### Responsive espace client
- Corriger le tableau grid-cols-12 du dashboard client qui ne reflow pas sur mobile
- Fixer les boutons qui débordent, se coupent ou se décalent sur mobile/tablette
- Ajuster les paddings et gaps pour les petits écrans

### Page Explorer — filtres
- Refondre la barre de filtres pour qu'elle soit cohérente avec le menu catégories de la page d'accueil
- Corriger le grid 5 colonnes (xl) trop serré — max 4 colonnes
- Ajouter le stacking vertical des filtres sur mobile
- Rendre le toggle vue grille/liste accessible sur mobile

## Capabilities

### New Capabilities
- `service-publish-flow`: Flux complet de publication service (création → modération admin → marketplace publique) avec alignement des statuts entre dev store et Prisma
- `project-publish-flow`: Flux complet de publication projet client (création → affichage public) avec statuts alignés
- `client-responsive`: Corrections responsive de l'espace client (dashboard, formulaires, boutons)
- `explorer-filters`: Refonte des filtres Explorer alignés sur les catégories de la page d'accueil

### Modified Capabilities

## Impact

### APIs affectées
- `POST /api/services` — statut initial aligné sur `EN_ATTENTE`
- `GET /api/admin/services` — filtrage par statut Prisma uppercase
- `PATCH /api/admin/services/[id]` — actions approve/refuse avec statuts uppercase
- `GET /api/public/services` — filtre `ACTIF` cohérent dev/prod
- `POST /api/projects` — statut initial `ouvert`
- `GET /api/public/projects` — filtre `ouvert` cohérent

### Fichiers frontend impactés
- `apps/web/app/client/page.tsx` — responsive dashboard
- `apps/web/app/(public)/explorer/page.tsx` — filtres + grid responsive
- `apps/web/app/client/projets/nouveau/page.tsx` — statut projet
- `apps/web/components/services/wizard/steps/StepPublish.tsx` — statut service
- `apps/web/store/client.ts` — types statut projet
- `apps/web/store/dashboard.ts` — types statut service
- `apps/web/lib/dev/data-store.ts` — statuts dev store

### Impact sur les autres rôles
- **Freelance** : les services publiés apparaîtront enfin en modération admin
- **Agence** : idem (même flux de publication que freelance)
- **Client** : les projets publiés seront visibles par les freelances/agences/visiteurs
- **Admin** : les services en attente apparaîtront dans l'onglet modération

### Schéma Prisma
- Aucune modification du schéma nécessaire — les enums `ServiceStatus` et statuts existent déjà, le problème est dans le code applicatif
