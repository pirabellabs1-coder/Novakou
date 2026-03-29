## Context

L'espace Agence est l'un des 4 espaces principaux de FreelanceHigh. Les pages existantes dans `app/agence/` sont des squelettes fonctionnels mais ne correspondent pas aux maquettes Stitch en termes de couleurs, layout et richesse fonctionnelle. L'espace Client (`app/client/`) a été récemment refait et sert de référence pour les patterns de code.

**Maquettes Stitch disponibles :**
- `tableau_de_bord_agence_performance/` — Dashboard avec KPI, graphique CA, statut équipe, projets
- `gestion_d_quipe_agence/` — Gestion d'équipe avec tableau, rôles, charge de travail
- `tableau_kanban_gestion_de_projets_agence/` — Vue Kanban des projets avec colonnes drag-and-drop
- `vue_calendrier_des_projets_agence/` — Vue calendrier des projets

**Couleurs extraites des maquettes :**
- Primary : `#14b835` (vert agence) / `#19e642` (variante plus claire)
- Background dark : `#112114`
- Neutral dark : `#1a2f1e`
- Border dark : `#2a3f2e`
- Background light : `#f6f8f6`

## Goals / Non-Goals

**Goals :**
- Refondre les 13 pages de l'espace Agence pour correspondre exactement aux maquettes Stitch
- Chaque élément interactif fonctionne (boutons, formulaires, filtres, onglets, modals)
- Données de démonstration réalistes en EUR, tout en français
- Layout responsive (mobile hamburger + desktop sidebar)
- Thème vert agence via CSS variables (même pattern que l'espace Client)

**Non-Goals :**
- Pas d'appels API réels (données de démo en constantes TypeScript)
- Pas de persistance des données (état local React uniquement)
- Pas de drag-and-drop réel pour le Kanban (colonnes visuelles statiques avec boutons de déplacement)
- Pas de vue Calendrier complète (la vue Kanban + Liste suffisent pour le MVP)
- Pas de modifications au schéma Prisma

## Decisions

### 1. Thème CSS Variables (identique au pattern Client)
**Choix :** Override des CSS custom properties dans le layout agence.
**Rationale :** Le même pattern fonctionne pour l'espace Client. Permet un thème distinct sans duplication de code Tailwind.
```typescript
const AGENCE_CSS_VARS = {
  "--color-primary": "20 184 53",     // #14b835
  "--color-bg-dark": "17 33 20",      // #112114
  "--color-neutral-dark": "26 47 30", // #1a2f1e
  "--color-border-dark": "42 63 46",  // #2a3f2e
  "--color-bg-light": "246 248 246",  // #f6f8f6
};
```

### 2. Composants partagés Agence
**Choix :** 2 composants dans `components/agence/` : `AgenceSidebar.tsx` (refonte) + `AgenceHeader.tsx` (nouveau).
**Rationale :** Le header est identique au pattern Client (recherche, notifications, profil). La sidebar garde la même structure mais avec les nav items agence.
**Alternative rejetée :** Un seul composant layout monolithique — trop rigide pour le responsive.

### 3. Données de démonstration
**Choix :** Constantes TypeScript en haut de chaque fichier page.
**Rationale :** Identique au pattern Client. Les types sont inline car aucune API n'existe encore. Migration vers TanStack Query triviale quand l'API sera prête.

### 4. Vue Kanban simplifiée
**Choix :** Colonnes statiques avec boutons d'action pour déplacer les cartes (pas de drag-and-drop natif).
**Rationale :** Le drag-and-drop nécessite `@dnd-kit/core` ou `react-beautiful-dnd` — overkill pour le MVP. Les boutons "Déplacer vers..." suffisent. Le HTML/CSS reste identique à la maquette.

### 5. Navigation sidebar — 14 items
**Choix :** 10 items principaux + 4 items secondaires (bottom section).
```
Principal : Dashboard, Équipe, Clients, Projets, Services, Commandes, Finances, Sous-traitance, Analytics, Ressources
Secondaire : Messages, Aide, Profil Agence, Paramètres
```

## Risks / Trade-offs

- **[Pas de persistance]** → Les données se réinitialisent au rechargement. Acceptable pour le MVP. Migration vers API triviale.
- **[Kanban sans drag-and-drop]** → UX légèrement inférieure. Peut être ajouté en V1 avec `@dnd-kit/core` sans refonte.
- **[13 pages à réécrire]** → Volume important. Mitigation : suivre les patterns Client existants, paralléliser les pages indépendantes.
- **[Maquettes incomplètes]** → Seules 4 maquettes Stitch existent (dashboard, équipe, projets kanban, projets calendrier). Les autres pages (finances, analytics, parametres, etc.) seront construites en suivant le design system vert + les patterns des maquettes disponibles + le PRD.
