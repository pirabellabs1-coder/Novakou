## Context

Le système de badges est éclaté à travers 6+ fichiers avec 3 formats différents (UPPERCASE, Title Case, accents). Chaque API recalcule les badges avec sa propre logique locale. Le profil public freelance a son propre `BADGE_CONFIG` différent de `BadgeDisplay.tsx`. Les données dev (comptes, commandes, reviews) s'accumulent et polluent la plateforme. Le profil public affiche "Commandes complétées" 3 fois.

## Goals / Non-Goals

**Goals:**
- Une seule fonction `computeBadges()` dans `lib/badges.ts` utilisée par TOUTES les APIs
- Un seul format de badge : Title Case sans accents (`"Verifie"`, `"Top Rated"`, `"Elite"`, `"Rising Talent"`, `"Pro"`, `"Agence"`)
- Un seul composant `BadgeDisplay` utilisé sur les cards ET le profil public
- Critères de badges clairs et documentés (basés sur le PRD)
- Reset complet des données dev (fichiers JSON + Prisma si applicable)
- Supprimer la duplication "Commandes complétées" dans le sidebar profil

**Non-Goals:**
- Changer le schéma Prisma (les champs nécessaires existent déjà)
- Ajouter de nouveaux types de badges (scope MVP)
- Modifier le système KYC lui-même
- Toucher à l'espace Formation (prochaine étape)

## Decisions

### 1. Fonction centralisée `computeBadges()`
**Choix** : Créer/consolider `lib/badges.ts` avec une seule fonction exportée.
**Pourquoi** : Élimine les 6+ copies de logique badge dispersées dans les APIs. Un seul endroit à maintenir.
**Alternative rejetée** : Stocker les badges en DB — ajoute de la complexité de sync pour un gain minime au MVP.

**Critères d'attribution (du PRD) :**
```
Rising Talent : compte < 90 jours, ≥1 commande, rating ≥4.0
Top Rated     : rating ≥4.0, ≥3 commandes complétées
Elite         : rating ≥4.5, ≥10 commandes complétées
Verifie       : KYC ≥ 3
Pro           : plan = "PRO"
Business      : plan = "BUSINESS"
Agence        : rôle agence OU plan "AGENCE"
```
Un freelance peut avoir plusieurs badges (ex: "Elite" + "Verifie" + "Pro"). L'affichage est limité par `maxDisplay` dans le composant.

### 2. Format standardisé Title Case sans accents
**Choix** : `"Verifie"` au lieu de `"Vérifié"`, `"Top Rated"` au lieu de `"TOP RATED"`.
**Pourquoi** : Évite les problèmes d'encodage, simplifie les comparaisons, et `BADGE_CONFIG` dans `BadgeDisplay.tsx` utilise déjà ce format en interne.

### 3. Nettoyage BadgeDisplay.tsx
**Choix** : Supprimer les entrées dupliquées du `BADGE_CONFIG` (les variantes UPPERCASE et accentuées).
**Pourquoi** : Le code source est la seule source de vérité une fois `computeBadges()` standardisé.

### 4. Profil public — même composant BadgeDisplay
**Choix** : Remplacer le `BADGE_CONFIG` local dans `freelances/[username]/page.tsx` par le composant `BadgeDisplay` partagé.
**Pourquoi** : Garantit la cohérence visuelle card ↔ profil.

### 5. Reset données via suppression fichiers JSON + route admin
**Choix** : Supprimer les fichiers JSON du dev-store + créer une route `POST /api/admin/reset-data` pour Prisma.
**Pourquoi** : Le dev-store persiste ses données dans `apps/web/lib/dev/*.json`. Les supprimer force la régénération des défauts vides. La route admin permet aussi de nettoyer Prisma.

### 6. Sidebar profil — retirer "Commandes complétées"
**Choix** : Supprimer le bloc `work_history` / "Commandes complétées" du sidebar (lignes ~547-552), garder uniquement dans les stats circulaires.
**Pourquoi** : Information répétée 3 fois sur la même page. La section stats circulaires est plus visible et suffisante.

## Risks / Trade-offs

- **Badge visuellement différent après standardisation** → Mitigé : `BadgeDisplay` affiche déjà les mêmes icônes/couleurs pour toutes les variantes, donc pas de changement visuel.
- **Reset données supprime le travail de test** → Voulu : c'est l'objectif. Les seed data dans `getDefaultServices()` restent comme point de départ si IS_DEV.
- **Rising Talent dépend de `createdAt`** → OK car le champ existe sur User en Prisma et dans le dev-store.
