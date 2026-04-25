## Context

La plateforme FreelanceHigh a un module formations avec des formulaires qui forcent la saisie bilingue (FR/EN) sur chaque champ, un flux d'inscription qui déclenche l'OTP trop tard (après l'onboarding complet), des données démo visibles en production, et aucun tunnel de vente pour les formations.

**État actuel :**
- Schéma Prisma avec colonnes `titleFr`/`titleEn`, `descriptionFr`/`descriptionEn` sur Formation, FormationSection, FormationLesson, FormationCategory
- Inscription principale (`/inscription`) : 4 étapes (Compte → Profil → Compétences → Finalisation), OTP envoyé seulement après l'étape finale
- Inscription formations (`/inscription`) : OTP correct (envoyé juste après soumission du formulaire)
- Marketing dashboard : fetch API réel mais peut afficher des données de dev-store en mode IS_DEV
- Catégories : 12 catégories seedées dans `seed-formations.ts`, fetchées via API dans le formulaire de création
- Pas de tunnel de vente existant

## Goals / Non-Goals

**Goals :**
- Simplifier la création de contenu formations en supprimant le bilingue forcé
- Déplacer la vérification OTP avant l'onboarding dans le flux d'inscription FreelanceHigh
- Éliminer toute donnée démo/hardcodée visible par les utilisateurs réels
- Créer un builder de tunnel de vente basique pour les instructeurs
- Rendre les catégories visibles et ajouter l'option "Autre"
- Connecter les compteurs de la landing formations aux vraies données Prisma

**Non-Goals :**
- Traduction automatique du contenu (sera en V2+)
- Builder de pages avancé type Webflow (on reste sur un builder de blocs simples)
- Refonte complète du schéma formations (on simplifie juste les colonnes bilingues)
- Support multi-langue complet sur toute la plateforme (next-intl gère déjà l'UI)

## Decisions

### 1. Schéma Prisma — Colonnes uniques + `locale`

**Choix :** Remplacer les paires `titleFr`/`titleEn` par un seul champ `title` + une colonne `locale` (String, défaut "fr") sur le modèle Formation.

**Alternatives considérées :**
- **JSON multilingue** (`title: { fr: "...", en: "..." }`) → rejeté car complexifie les requêtes Postgres FTS et empêche l'indexation
- **Table de traductions séparée** → trop complexe pour le MVP, sera pertinent en V2 si besoin de traduction contributive

**Modèles impactés :**
```
Formation: titleFr/titleEn → title, shortDescFr/shortDescEn → shortDesc, etc. + ajout locale String @default("fr")
FormationCategory: nameFr/nameEn → name
FormationSection: titleFr/titleEn → title
FormationLesson: titleFr/titleEn → title
```

**Migration :** Créer une migration Prisma qui :
1. Ajoute les nouvelles colonnes (`title`, `shortDesc`, `description`, `locale`, etc.)
2. Copie les données FR existantes dans les nouvelles colonnes
3. Supprime les anciennes colonnes `*Fr`/`*En`

### 2. Flux OTP — Inscription avant onboarding

**Choix :** Modifier le flux de `/inscription` pour :
- Step 0 : Saisie email/mot de passe + choix du rôle → soumettre → créer le compte → envoyer OTP
- Step 0.5 (nouveau) : Écran de vérification OTP inline (pas de redirection)
- Steps 1-3 : Onboarding profil (comme avant)

**Alternatives considérées :**
- **Rediriger vers `/verifier-email`** → rejeté car casse le flux wizard et force l'utilisateur à revenir
- **Garder l'OTP à la fin** → rejeté car c'est le problème signalé par l'utilisateur

**Implémentation :**
- Après soumission du step 0, appel `POST /api/auth/register` qui crée le user avec `emailVerified: null`
- L'API renvoie `{ requiresVerification: true }`
- Le wizard affiche un écran OTP inline (6 digits) avec timer et bouton resend
- Après vérification OTP réussie (`PUT /api/auth/verify-email`), le wizard passe au step 1

### 3. Tunnel de vente — Builder de blocs

**Choix :** Un builder de blocs JSON stocké en DB, avec un éditeur drag-and-drop côté frontend.

**Architecture :**
```
Nouveau modèle Prisma : SalesFunnel
- id, formationId (relation), instructorId
- blocks: Json (tableau de blocs typés)
- published: Boolean
- slug: String @unique

Types de blocs :
- HERO : titre, sous-titre, image de fond, bouton CTA
- TEXT : contenu texte riche (TipTap)
- IMAGE : URL image, alt, taille
- VIDEO : URL vidéo embed
- COLUMNS : 2-3 colonnes avec contenu
- PRICING : affichage du/des prix de la formation
- TESTIMONIALS : liste de témoignages
- FAQ : questions/réponses accordion
- CTA : bouton d'action avec lien
```

**Alternatives considérées :**
- **Page builder complet type GrapesJS** → trop lourd pour le MVP, complexité d'intégration élevée
- **Templates prédéfinis seulement** → trop limité, l'utilisateur veut personnaliser

**Frontend :** Composant `SalesFunnelBuilder` dans `/(instructeur)/instructeur/tunnel-de-vente/` utilisant `@dnd-kit` (déjà installé pour le curriculum).

### 4. Données réelles — Suppression des données démo

**Choix :** Auditer et nettoyer tous les endpoints API des formations pour :
- Ne jamais retourner de données hardcodées en production
- Retourner des compteurs à 0 quand il n'y a pas de données
- Supprimer les références au dev-store dans les API de stats formations

**Points d'audit :**
- `/api/formations/stats` — doit requêter Prisma même en mode dev
- `/api/admin/formations/marketing` — idem
- `/api/public/stats` — déjà correct mais vérifier la cohérence
- Landing formations `page.tsx` — vérifier que les fallbacks affichent 0 et pas des valeurs fictives

### 5. Catégories — Visibilité et option "Autre"

**Choix :**
- Simplifier `FormationCategory` : un seul champ `name` (plus de `nameFr`/`nameEn`)
- S'assurer que le seed fonctionne et que l'API `/api/formations/categories` retourne les catégories
- Ajouter un bouton "Autre" dans le dropdown qui ouvre un champ texte pour saisir un nom personnalisé
- Les catégories personnalisées sont stockées directement dans `Formation.customCategory` (String optionnel) quand `categoryId` est null

## Risks / Trade-offs

| Risque | Mitigation |
|---|---|
| Migration Prisma avec perte de données EN existantes | Les données EN seront perdues — acceptable car aucune formation de production n'existe encore |
| Le tunnel de vente MVP sera basique vs Systeme.io | Itérer en V1/V2 avec plus de blocs et de personnalisation |
| L'OTP inline pourrait échouer silencieusement | Ajouter un bouton "Renvoyer le code" et un lien "Modifier l'email" |
| Catégories personnalisées non modérées | L'admin peut les voir dans son dashboard et les normaliser |

## Migration Plan

1. **Phase 1 — Schéma Prisma** : Migration des colonnes bilingues → colonnes uniques
2. **Phase 2 — Seed** : Mettre à jour `seed-formations.ts` pour les nouvelles colonnes
3. **Phase 3 — APIs** : Mettre à jour tous les endpoints pour utiliser les nouvelles colonnes
4. **Phase 4 — Frontend** : Modifier les formulaires, supprimer les champs doubles
5. **Phase 5 — OTP** : Modifier le flux d'inscription `/inscription`
6. **Phase 6 — Tunnel de vente** : Nouveau modèle + builder + pages
7. **Phase 7 — Nettoyage données** : Audit et suppression des données démo

**Rollback :** Chaque phase est indépendante. En cas de problème, revert de la migration Prisma avec les colonnes d'origine.

## Open Questions

- Faut-il conserver les données EN existantes dans un champ de backup temporaire pendant la migration ? (Probablement non car aucune donnée de production)
- Le tunnel de vente doit-il supporter un domaine personnalisé pour l'URL de la page de vente ? (Probablement V2)
