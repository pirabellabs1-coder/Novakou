## Context

La page d'accueil (`apps/web/app/(formations)/page.tsx`) est un fichier unique de ~810 lignes contenant toutes les sections. Actuellement, le rythme visuel est plat : 11 sections sur fond `#f6fbf2` (surface) ou blanc, 2 sections sur fond pastel (`bg-emerald-50`, `bg-amber-50`), et 1 seule section sur fond `#006e2f` (le CTA final).

La palette Novakou est déjà définie dans le fichier via l'objet `COLORS` avec `primary: "#006e2f"`, `accent: "#22c55e"`, et des surfaces vertes douces. Le design utilise la typographie Satoshi et les Material Symbols Outlined pour les icônes.

### Ordre actuel des sections
1. Hero (fond surface)
2. Dashboard Preview (fond surface)
3. Comment ça marche — 3 étapes (fond surface)
4. Features Grid — 18 cards (fond surface)
5. Outils Avancés — 8 cards (fond surface)
6. IA Feature — chatbot demo (`bg-emerald-50`)
7. Payment Feature — "Vendez localement" (`bg-amber-50`)
8. Best-Sellers (fond surface)
9. Simulateur de Revenus (composant)
10. Testimonials (fond surface)
11. Pricing (fond surface)
12. Écosystème — 2 cards (fond surface)
13. FAQ (fond surface)
14. Final CTA (`#006e2f`)

## Goals / Non-Goals

**Goals:**
- Créer un rythme visuel alternant fond clair / `#006e2f` / blanc pour éviter la monotonie
- Redesigner la section Paiements avec fond `#006e2f` et texte blanc
- Supprimer la section Écosystème (redondante avec la section Paiements redesignée)
- Fusionner les 2 sections features (18 + 8 cards) en une seule section de 8 features marquantes
- Ajouter une bannière stats immersive sur fond `#006e2f`

**Non-Goals:**
- Modifier les composants importés (`RevenueSimulator`, `BestSellers`, `PublicStatsBadge`)
- Toucher au layout/navbar/footer
- Changer la palette de couleurs Novakou existante
- Ajouter de nouvelles dépendances npm

## Decisions

### 1. Rythme visuel — alternance de 3 types de fond

**Choix :** 3 types de fonds en alternance : surface clair (`#f6fbf2`), blanc, et `#006e2f` (primary dark).

**Nouvel ordre des sections :**
1. Hero → fond surface
2. Dashboard Preview → fond surface
3. **STATS BANNER (NOUVEAU)** → fond `#006e2f` pleine largeur
4. Comment ça marche → fond blanc
5. **Features fusionnées (8 cards)** → fond surface
6. IA Feature → fond `#006e2f` (remplace `bg-emerald-50`)
7. **Paiements redesigné** → fond `#006e2f` (remplace `bg-amber-50`)
8. Best-Sellers → fond surface
9. Simulateur → composant existant
10. Testimonials → fond blanc
11. Pricing → fond surface
12. FAQ → fond blanc
13. Final CTA → fond `#006e2f`

**Rythme résultant :** surface → surface → **VERT** → blanc → surface → **VERT** → **VERT** → surface → (composant) → blanc → surface → blanc → **VERT**

Les sections 6 et 7 sur fond vert dos à dos créent un bloc immersif "la puissance de Novakou" avant le retour aux best-sellers.

**Alternative rejetée :** Mettre un fond vert sur les testimonials aussi — trop de vert consécutif, fatigue visuelle.

### 2. Section Paiements — redesign sur fond sombre

**Choix :** Fond `#006e2f`, cards avec `background: rgba(255,255,255,0.08)` et `border: 1px solid rgba(255,255,255,0.15)`. Textes en blanc, sous-textes en `#a7f3d0`. Nouveau titre : "Encaissez partout en Afrique" au lieu de "Vendez localement sans friction".

Les mockups checkout et retrait restent mais avec un traitement glassmorphism léger sur fond sombre.

**Alternative rejetée :** Fond gradient `#006e2f → #004d21` — trop de sophistication, risque de lenteur sur les mobiles africains.

### 3. Fusion des Features — 8 cards essentielles

**Choix :** Garder les 8 features les plus différenciantes parmi les 26 (18 + 8) actuelles :
1. Boutique en ligne (`storefront`)
2. Paiements locaux (`account_balance_wallet`)
3. Assistant IA (`auto_awesome`)
4. Tunnels de vente (`account_tree`)
5. Hébergement vidéo (`ondemand_video`)
6. Certificats (`workspace_premium`)
7. Automatisations (`workflow`)
8. 100% Mobile (`devices`)

Format : grille 2×4 sur desktop, 1 colonne sur mobile. Chaque card garde le style actuel (icône + titre + description).

**Alternative rejetée :** Garder la grille 18 + les 8 outils nommés — trop dense, l'utilisateur ne lit pas 26 cards.

### 4. Stats Banner — métriques sur fond vert

**Choix :** Section pleine largeur sur fond `#006e2f` avec 4 métriques horizontales : nombre de créateurs, pays couverts, ventes réalisées, commission unique. Design avec gros chiffres blancs et labels en `#a7f3d0`.

Pas de composant séparé — inline dans le fichier page.tsx comme les autres sections.

### 5. Section IA — fond vert au lieu d'emerald-50

**Choix :** Passer le fond de `bg-emerald-50` à `#006e2f` avec texte blanc. La card chatbot reste blanche pour le contraste. Les check_circle passent de vert à blanc.

## Risks / Trade-offs

- **Risque : trop de vert** → Mitigation : les cards blanches à l'intérieur des sections vertes créent du contraste. Maximum 2 sections vertes consécutives.
- **Risque : lisibilité texte blanc sur vert** → Mitigation : le ratio de contraste `#006e2f` / `#ffffff` est 7.8:1 (WCAG AAA). Les sous-textes utilisent `#a7f3d0` (ratio 5.2:1, WCAG AA).
- **Risque : suppression de features utiles** → Mitigation : les 18 features restent accessibles via la page `/tarifs` (lien "Voir toutes les fonctionnalités" conservé).
