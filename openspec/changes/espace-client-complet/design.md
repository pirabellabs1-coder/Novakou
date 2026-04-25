## Context

L'espace Client existe déjà dans `apps/web/app/client/` avec 10 pages fonctionnelles et un sidebar (`ClientSidebar.tsx`). Cependant, l'implémentation actuelle ne correspond pas aux maquettes Stitch de référence :
- Les couleurs utilisent le violet `#6C2BD9` au lieu du vert `#19e642` des maquettes
- Le layout ne correspond pas (la maquette utilise un sidebar fixe dark avec header sticky)
- Les composants UI ne reproduisent pas les designs spécifiques des maquettes (cards, tables, chat, wizard)

**Maquettes de référence identifiées :**
| Page | Maquette |
|---|---|
| Dashboard | `tableau_de_bord_client/` |
| Projets/Nouveau | `client_project_posting_wizard/` |
| Commandes | `suivi_de_commande_et_livraison_de_fichiers/` |
| Freelances | `explorateur_d_offres_de_projets/` |
| Favoris | `services_et_freelances_favoris/` |
| Messages | `messagerie_temps_r_el_int_gr_e_1/` |
| Paiements | `m_thodes_de_paiement_et_portefeuille/` + `interface_de_paiement_et_facturation_multi_devises/` |
| Paramètres | `param_tres_profil_et_compte/` |

**État actuel :** Toutes les pages existent avec des données de démo, des formulaires fonctionnels et une navigation. La refonte est principalement visuelle + structurelle.

## Goals / Non-Goals

**Goals :**
- Reproduire fidèlement les 10 maquettes de l'espace client (couleurs, layout, composants, interactions)
- Rendre chaque page 100% fonctionnelle avec des données de démo réalistes en EUR
- Conserver le français partout
- Assurer le responsive (mobile, tablette, desktop)
- Maintenir les patterns existants (Zustand toast, `"use client"`, demo data)

**Non-Goals :**
- Intégration backend/API (pas de tRPC, pas de Supabase — MVP données de démo)
- Mode clair (les maquettes sont toutes en mode dark)
- Internationalisation multi-langues (FR uniquement pour le MVP)
- Tests E2E automatisés (vérification manuelle via Playwright skill)
- Modification du schéma Prisma

## Decisions

### 1. Thème colorimétrique : suivre les maquettes exactement

**Choix :** Utiliser les couleurs des maquettes (`#19e642` primary green, `#112114` background dark) dans l'espace client, même si elles diffèrent de la charte CLAUDE.md (`#6C2BD9` violet).

**Rationale :** CLAUDE.md stipule "En cas d'ambiguïté entre la maquette et une spec textuelle, la maquette a la priorité". Le user a explicitement demandé "Respecte EXACTEMENT les couleurs". Les maquettes utilisent majoritairement `#19e642` (bright green) comme primaire.

**Alternative rejetée :** Adapter les maquettes aux couleurs CLAUDE.md — rejeté car contradictoire avec la directive utilisateur.

**Couleurs unifiées :**
- Primary : `#19e642` (bright green — majorité des maquettes)
- Background dark : `#112114`
- Background light : `#f6f8f6`
- Surface dark : `#1a2f1e` (cards)
- Border dark : `#2a3f2e`
- Les maquettes avec des variantes (`#0e7c66` teal pour le wizard, `#0e7c24` forest green pour la messagerie) seront harmonisées vers `#19e642` pour la cohérence, sauf si un accent spécifique est visuellement nécessaire.

### 2. Architecture des fichiers : refonte in-place

**Choix :** Réécrire les fichiers `page.tsx` existants plutôt que créer de nouveaux fichiers.

**Rationale :** Les routes sont déjà correctes (`/client/dashboard`, `/client/projets`, etc.). Créer de nouveaux fichiers causerait de la duplication. Le code existant sert de squelette pour la structure des données de démo.

**Structure des fichiers :**
```
apps/web/app/client/
├── layout.tsx              # Refonte : sidebar + header + contenu
├── page.tsx                # Refonte : dashboard maquette
├── commandes/page.tsx      # Refonte : suivi commandes + timeline + chat
├── explorer/page.tsx       # Renommé freelances → explorer (route existante)
├── favoris/page.tsx        # Refonte : grille favoris
├── messages/page.tsx       # Refonte : messagerie 3 panneaux
├── paiements/page.tsx      # Nouveau fichier (remplace factures)
├── parametres/page.tsx     # Refonte : paramètres avec sidebar tabs
├── profil/page.tsx         # Refonte : profil entreprise
├── projets/page.tsx        # Refonte : liste projets
└── projets/nouveau/page.tsx # Refonte : wizard 4 étapes

components/client/
├── ClientSidebar.tsx       # Refonte : sidebar dark green
├── ClientHeader.tsx        # Nouveau : header sticky
└── (composants spécifiques par page si nécessaire)
```

### 3. Données de démo : extension du pattern existant

**Choix :** Étendre les données de démo existantes dans chaque `page.tsx` directement (pattern actuel) plutôt que centraliser dans `lib/demo-data.ts`.

**Rationale :** Le code existant définit déjà les données de démo inline dans chaque page. Centraliser nécessiterait un refactoring supplémentaire sans bénéfice immédiat pour le MVP. Les montants seront en EUR par défaut.

### 4. Font Manrope : chargement via Google Fonts

**Choix :** Ajouter la police Manrope via `next/font/google` dans le layout client.

**Rationale :** Toutes les maquettes utilisent Manrope. Next.js optimise automatiquement les Google Fonts (self-hosting, preload).

### 5. Icônes Material Symbols : CDN existant

**Choix :** Conserver l'import CDN Material Symbols Outlined déjà présent dans le projet.

**Rationale :** Le projet utilise déjà `<span className="material-symbols-outlined">` partout. Pas besoin de changer.

### 6. Routes client : adaptation

**Choix :**
- `/client` (dashboard) → page.tsx racine (existant)
- `/client/paiements` → nouveau fichier (la maquette combine portefeuille + méthodes de paiement, remplace `/client/factures`)
- `/client/freelances` → utilise le fichier existant `/client/explorer/page.tsx` mais redirigé/renommé
- Les autres routes restent identiques

**Rationale :** Les maquettes montrent "Paiements" et non "Factures" dans la navigation. Le contenu est plus riche (portefeuille + méthodes + transactions).

## Risks / Trade-offs

| Risque | Mitigation |
|---|---|
| Incohérence couleurs entre espace client (vert) et reste du site (violet) | Scope limité à l'espace client ; les autres espaces seront refaits séparément avec leurs propres maquettes |
| Les maquettes sont en dark mode uniquement | Pas de mode clair pour le MVP — cohérent avec la directive "pas de mode sombre pour le MVP" inversée ici car les maquettes sont dark |
| Responsive non visible dans les maquettes (desktop uniquement) | Appliquer les patterns responsive Tailwind standards (grille adaptive, sidebar mobile overlay) |
| Données de démo inline peuvent diverger entre pages | Acceptable pour le MVP — sera remplacé par l'API tRPC en V1 |
| Font Manrope peut différer de la police du reste du site | Appliquée uniquement dans le layout client via className, n'affecte pas les autres espaces |
