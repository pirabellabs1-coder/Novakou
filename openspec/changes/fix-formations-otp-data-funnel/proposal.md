## Why

L'expérience utilisateur de la plateforme FreelanceHigh souffre de plusieurs problèmes critiques qui nuisent à l'adoption et à la crédibilité :

1. **UX bilingue forcée dans les formations** — Tous les formulaires (création de formation, catégories, popups) forcent la saisie en Français ET Anglais simultanément, ce qui complique l'expérience des instructeurs. Un utilisateur devrait saisir dans sa langue, pas être obligé de remplir deux champs.
2. **Données démo/hardcodées visibles aux vrais utilisateurs** — Le marketing, les statistiques (19 apprenants, formations, etc.) affichent des données fictives ou de démonstration. Chaque utilisateur doit commencer à zéro et voir ses propres données réelles évoluer.
3. **Tunnel de vente inexistant** — Aucun builder de tunnel de vente n'existe. Les achats doivent passer par un vrai tunnel configurable (type Systeme.io) avec drag-and-drop, colonnes, images, etc.
4. **Flux OTP mal positionné à l'inscription** — L'OTP est envoyé seulement APRÈS les 4 étapes d'onboarding au lieu d'être vérifié immédiatement après la saisie email/mot de passe (avant l'étape 2).
5. **Données non connectées sur la page d'accueil freelance** — Les compteurs (apprenants inscrits, etc.) ne remontent pas les vraies données de la base.
6. **Catégories de formation manquantes** — Le formulaire de création de formation demande de choisir une catégorie mais la liste est vide ou non visible, et il manque une option "Autre" personnalisable.

## What Changes

### Formations — Suppression du bilingue forcé
- **Remplacer tous les champs doubles (titleFr/titleEn, descFr/descEn, etc.)** par des champs uniques dans la langue de l'utilisateur
- Adapter le schéma Prisma : remplacer les paires de colonnes `Fr`/`En` par un champ unique + colonne `locale` sur la formation
- Mettre à jour les formulaires de création, les catégories admin, les popups, les quiz, les learning points et les prérequis
- L'affichage public utilisera la langue du visiteur avec fallback sur la langue originale

### Marketing & Statistiques — Données réelles uniquement
- Supprimer toutes les données démo/hardcodées dans les dashboards instructeur et marketing
- S'assurer que chaque utilisateur voit ses propres métriques (commençant à 0)
- Connecter les compteurs de la page d'accueil aux vraies APIs avec données Prisma
- Vérifier les API endpoints `/api/formations/stats`, `/api/admin/formations/marketing` pour retourner des données réelles

### Tunnel de vente — Nouveau builder
- Créer un constructeur de page de vente type Systeme.io dans l'espace instructeur
- Permettre d'ajouter des blocs : texte, images, vidéos, colonnes, boutons CTA, témoignages, pricing, FAQ
- Drag-and-drop pour réorganiser les blocs
- Chaque formation aura sa page de vente personnalisable
- Les achats passeront par ce tunnel

### Flux OTP — Repositionnement avant onboarding
- Déplacer la vérification OTP juste après la saisie email/mot de passe (step 0)
- L'inscription crée le compte → envoie l'OTP → l'utilisateur vérifie → puis accède aux étapes d'onboarding (étapes 1-3)
- Applicable à tous les rôles : Freelance, Client, Agence

### Page d'accueil — Connexion données réelles
- Connecter les compteurs de la landing page formations aux vraies données (apprenants, formations, instructeurs)
- S'assurer que `/api/public/stats` et `/api/formations/stats` retournent des données cohérentes depuis Prisma

### Catégories de formation — Visibilité et option Autre
- S'assurer que les 12 catégories seedées apparaissent bien dans le dropdown de création de formation
- Ajouter une option "Autre" permettant à l'instructeur de saisir un nom de catégorie personnalisé
- Simplifier les catégories pour n'avoir qu'un seul champ nom (plus de nameFr/nameEn)

## Capabilities

### New Capabilities
- `sales-funnel-builder`: Constructeur de tunnel de vente drag-and-drop pour les instructeurs, avec blocs éditables (texte, images, colonnes, CTA, pricing)
- `single-locale-formations`: Suppression du bilingue forcé dans les formations — chaque contenu est créé dans une seule langue avec détection automatique

### Modified Capabilities
- (Aucun spec existant directement impacté — les specs existantes concernent d'autres domaines)

## Impact

### Version cible
- **MVP** — Ces corrections sont critiques pour la crédibilité et l'utilisabilité de la plateforme au lancement.

### Impact sur le schéma Prisma
- **Formation** : remplacer `titleFr`/`titleEn` par `title` + `locale`, idem pour `shortDesc`, `description`, `learnPoints`, `requirements`, `targetAudience`
- **FormationCategory** : remplacer `nameFr`/`nameEn` par `name`
- **FormationSection** : remplacer `titleFr`/`titleEn` par `title`
- **FormationLesson** : remplacer `titleFr`/`titleEn` par `title`
- **Nouveau modèle `SalesFunnelPage`** avec blocs JSON pour le tunnel de vente

### Impact sur les autres rôles
- **Instructeur** : formulaires simplifiés, nouveau tunnel de vente
- **Apprenant** : voit les formations dans la langue originale (avec traduction future possible)
- **Admin** : catégories simplifiées, marketing avec vraies données
- **Freelance/Client/Agence** : nouveau flux OTP avant onboarding

### APIs impactées
- `POST /api/instructeur/formations` — payload simplifié (plus de paires Fr/En)
- `GET /api/formations/categories` — retourne un seul nom par catégorie
- `POST /api/auth/register` — déclenche OTP immédiatement, ne crée pas la session avant vérification
- Nouveaux endpoints pour le tunnel de vente (`/api/instructeur/sales-funnel/...`)

### Pas de job BullMQ ni handler Socket.io nécessaire pour ce changement.
### Template email existant (OTP) déjà en place — aucun nouveau template requis.
