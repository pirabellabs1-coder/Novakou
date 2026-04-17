## Context

La plateforme formations FreelanceHigh est fonctionnellement complète (~40 pages, 25+ API routes, schéma Prisma, certificats PDF, Stripe Checkout). Cependant, elle est actuellement intégrée dans les layouts FreelanceHigh existants — l'utilisateur voit la navbar FreelanceHigh (Services, Projets, Dashboard, etc.) même quand il navigue dans les formations.

**État actuel :**
- Les routes formations sont réparties dans 4 route groups Next.js : `(public)/formations/`, `(apprenant)/formations/`, `(instructeur)/formations/instructeur/`, `(paiement)/formations/`
- Chaque route group utilise le layout de son parent (qui inclut la navbar FreelanceHigh)
- Pas de pages de connexion/inscription dédiées aux formations
- Pas de navigation propre au contexte formations

**Besoin :** La plateforme formations doit être visuellement autonome — un univers séparé avec ses propres menus, son propre header, et ses propres pages d'authentification.

## Goals / Non-Goals

**Goals:**
- Créer un layout formations autonome qui remplace complètement la navbar FreelanceHigh quand l'utilisateur est dans `/*`
- Fournir un header public formations avec des menus spécifiques (Accueil, Explorer, Catégories, Devenir Instructeur)
- Fournir des pages de connexion et inscription dédiées formations (`/connexion`, `/inscription`)
- Créer une sidebar/header apprenant avec les menus propres à l'apprenant
- Créer une sidebar/header instructeur avec les menus propres à l'instructeur
- Garder un lien "← Retour à FreelanceHigh" pour naviguer entre les deux plateformes
- Réutiliser la charte graphique FreelanceHigh (violet `#6C2BD9`, bleu `#0EA5E9`, vert `#10B981`, composants shadcn/ui, Tailwind CSS)

**Non-Goals:**
- Pas de modification du schéma Prisma
- Pas de modification des API routes existantes
- Pas de nouveau système d'authentification (on réutilise Supabase Auth)
- Pas de modification de l'espace admin formations (il reste dans `/admin/formations/*`)
- Pas de changement de la logique métier (paiements, certificats, quiz, etc.)

## Decisions

### 1. Route `/` comme racine autonome (pas de route group)

**Choix :** Utiliser `app/formations/` comme dossier de routes classique Next.js avec son propre `layout.tsx` racine, au lieu des route groups actuels `(public)/formations/`, `(apprenant)/formations/`, etc.

**Alternatives considérées :**
- *Route group `(formations)/`* : aurait nécessité un préfixe URL différent ou une réécriture middleware complexe
- *Sous-domaine `formations.freelancehigh.com`* : plus complexe (CORS, cookies cross-domain, déploiement séparé) pour peu de bénéfice au MVP

**Raison :** Un dossier `app/formations/` crée naturellement la hiérarchie `/*` avec un layout isolé. Le layout racine formations remplace celui de FreelanceHigh. Les sous-routes utilisent des route groups internes pour les rôles.

### 2. Structure de routes interne

```
app/formations/
├── layout.tsx              ← Layout racine formations (header public)
├── page.tsx                ← Landing formations
├── connexion/page.tsx      ← Login formations
├── inscription/page.tsx    ← Register formations
├── explorer/page.tsx       ← Marketplace
├── [slug]/page.tsx         ← Détail formation
├── categories/             ← Catégories
├── instructeurs/[id]/      ← Profil instructeur public
├── devenir-instructeur/    ← Page candidature
├── verification/[code]/    ← Vérification certificat
├── (apprenant)/            ← Route group apprenant (layout avec sidebar)
│   ├── layout.tsx          ← Sidebar apprenant
│   ├── mes-formations/
│   ├── apprendre/[id]/
│   ├── certificats/
│   ├── favoris/
│   ├── panier/
│   └── parametres/
├── (instructeur)/          ← Route group instructeur (layout avec sidebar)
│   ├── layout.tsx          ← Sidebar instructeur
│   ├── dashboard/
│   ├── mes-formations/
│   ├── creer/
│   ├── [id]/modifier/
│   ├── [id]/statistiques/
│   ├── apprenants/
│   ├── revenus/
│   ├── avis/
│   ├── statistiques/
│   └── parametres/
└── (paiement)/             ← Route group paiement (layout minimal)
    ├── paiement/
    ├── succes/
    └── echec/
```

**Raison :** Les route groups `(apprenant)` et `(instructeur)` permettent d'avoir des layouts différents (sidebar apprenant vs sidebar instructeur) sans affecter les URLs. Le layout racine `formations/layout.tsx` fournit le header commun à toutes les pages formations.

### 3. Auth formations : même Supabase Auth, pages séparées

**Choix :** Créer des pages `/connexion` et `/inscription` qui utilisent Supabase Auth en backend mais ont une UI dédiée formations (header formations, pas de navbar FreelanceHigh).

**Alternatives considérées :**
- *Réutiliser les pages `/connexion` et `/inscription` existantes* : l'utilisateur verrait la navbar FreelanceHigh, cassant l'immersion
- *Auth provider séparé* : overkill, même DB, mêmes utilisateurs

**Raison :** Un utilisateur existant FreelanceHigh peut se connecter sur les formations avec le même compte. Le formulaire d'inscription formations demande en plus le choix du rôle (Apprenant / Instructeur). Côté backend, c'est le même Supabase Auth — on ajoute juste un claim `formations_role` au profil.

### 4. Header formations avec 3 variantes

**Choix :** Un composant `FormationsHeader` avec 3 variantes selon le contexte :
- **Public** : logo "FreelanceHigh Formations" + menus (Accueil, Explorer, Catégories, Devenir Instructeur) + boutons Connexion/Inscription + sélecteur langue/devise
- **Apprenant** : logo + menus apprenant (Mes Formations, Certificats, Favoris, Panier) + avatar/profil
- **Instructeur** : logo + menus instructeur (Dashboard, Mes Formations, Apprenants, Revenus) + avatar/profil

**Raison :** Un seul composant avec des variantes évite la duplication tout en permettant une navigation distincte par rôle.

### 5. Sidebar pour les espaces authentifiés

**Choix :** Sidebar latérale gauche fixe pour les espaces apprenant et instructeur, avec le header formations en haut.

**Alternatives considérées :**
- *Header-only navigation* : les menus apprenant/instructeur sont trop nombreux pour tenir dans un header seul
- *Bottom navigation mobile* : incompatible avec le nombre d'items, réservé pour la PWA (V4)

**Raison :** La sidebar offre une navigation claire et extensible, cohérente avec les espaces FreelanceHigh existants (admin, dashboard). Sur mobile, la sidebar se transforme en menu hamburger.

### 6. Migration des pages existantes

**Choix :** Déplacer les pages existantes des route groups actuels vers la nouvelle structure `app/formations/`. Le code des pages ne change pas — seul l'emplacement et le layout parent changent.

**Raison :** Les pages sont déjà fonctionnelles. Seule la couche layout/navigation doit changer.

## Risks / Trade-offs

**[Routes dupliquées pendant la migration]** → Renommer les anciens route groups avant de créer les nouveaux pour éviter des conflits de routes. Migration en une seule étape.

**[SEO — changement d'URLs]** → Les URLs `/*` restent identiques. Seuls les layouts changent. Pas d'impact SEO.

**[Sessions partagées]** → Un utilisateur connecté sur FreelanceHigh est aussi connecté sur les formations (même cookie Supabase). C'est souhaitable — pas besoin de double login. Le layout détecte le contexte automatiquement.

**[Complexité middleware]** → Le middleware Next.js doit gérer les routes `/connexion` et `/inscription` comme des routes publiques, et les routes `(apprenant)/*` et `(instructeur)/*` comme protégées. Risque faible — même pattern que le middleware existant.
