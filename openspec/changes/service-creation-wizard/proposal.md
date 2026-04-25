## Why

Le MVP de FreelanceHigh nécessite un système de création de service complet pour que les freelances et les agences puissent publier leurs offres sur la marketplace. C'est la fonctionnalité centrale de la plateforme : sans services publiés, il n'y a ni commandes, ni revenus, ni marketplace. Le wizard doit être supérieur à ComeUp (5euros.com) avec un éditeur rich text complet, une sauvegarde automatique, et une expérience fluide en 7 étapes progressives.

**Version cible : MVP**

## What Changes

- **Nouveau wizard de création de service en 7 étapes** : titre/catégorie, prix/description, options supplémentaires, livraison express, consignes de réalisation, galerie médias, publication
- **Layout 2 colonnes** avec sidebar de navigation des étapes (gauche 30%) et contenu actif (droite 70%)
- **Éditeur rich text complet** (Tiptap) : gras, italique, titres H1-H3, listes, tableaux, couleurs texte/surligneur, taille de police, alignement, images, liens, emojis, code inline, citations — mots illimités pour tous les plans
- **Système d'options/extras** avec drag & drop, limité par plan d'abonnement (Gratuit: 3, Pro: 10, Business: illimité)
- **Livraison express configurable** par service de base et par option
- **Consignes de réalisation** avec variables dynamiques ({nom_client}, {service}, {date_livraison})
- **Galerie médias** : image principale obligatoire (drag & drop, crop 16:9), 5 images supplémentaires, vidéo YouTube/Vimeo ou upload
- **Sauvegarde automatique** en brouillon toutes les 30 secondes
- **Validation temps réel** avec bordures vertes/rouges et messages d'erreur
- **Page récapitulative** avec checklist avant publication
- **Soumission pour modération admin** avec notifications email + in-app
- **Responsive** : 2 colonnes desktop, accordéon mobile
- **Disponible pour les freelances** (`/dashboard/services/creer`) **et les agences** (`/agence/services/creer`)

## Capabilities

### New Capabilities

- `service-wizard-layout`: Layout 2 colonnes avec sidebar d'étapes, navigation progressive, indicateurs d'état (complété/en cours/pas fait), responsive mobile en accordéon
- `service-step-title-category`: Étape 1 — sélection langue, titre "Je vais [action]" avec validation temps réel (100 chars max), catégorie/sous-catégorie dynamiques, jusqu'à 5 tags
- `service-step-pricing-description`: Étape 2 — prix de départ (5-5000 EUR) avec calcul commission en temps réel selon plan, délai de livraison, éditeur rich text complet (Tiptap) avec tableaux, couleurs, taille police, images, etc.
- `service-step-extras`: Étape 3 — options supplémentaires avec titre, description, prix, délai, badge recommandé, drag & drop réorganisation, limité par plan
- `service-step-express-delivery`: Étape 4 — livraison express configurable pour le service de base et chaque option, avec réduction de délai et prix supplémentaire
- `service-step-instructions`: Étape 5 — consignes de réalisation avec choix requis/non requis, éditeur rich text simplifié, variables dynamiques, templates par catégorie
- `service-step-media-gallery`: Étape 6 — image principale obligatoire (drag & drop, crop 16:9, 5MB max), 5 images supplémentaires, vidéo YouTube/Vimeo ou upload (100MB max)
- `service-step-publish`: Étape 7 — récapitulatif complet, checklist de validation, prévisualisation, sauvegarde brouillon, soumission pour modération
- `service-draft-autosave`: Sauvegarde automatique brouillon toutes les 30s, indicateur de sauvegarde, reprise depuis la liste des services

### Modified Capabilities

_(aucune — pas de specs existantes à modifier)_

## Impact

### Impact sur le schéma Prisma
- Table `Service` : ajout des champs `language`, `base_price`, `base_delivery_days`, `instructions_required`, `instructions_content`, `status` (draft/pending/active/paused/rejected), `draft_data` (JSON pour sauvegarde brouillon)
- Table `ServiceOption` : titre, description, prix supplémentaire, délai supplémentaire, recommandé, ordre, express activé, express prix, express réduction délai
- Table `ServiceMedia` : type (image/video), url, is_primary, ordre, dimensions
- Table `ServiceTag` : relation many-to-many Service ↔ Tag
- Table `Category` et `SubCategory` : catégories et sous-catégories admin

### Impact sur les autres rôles
- **Admin** : file d'attente de modération des services soumis (approuver/rejeter/demander modification)
- **Client** : les services publiés apparaissent dans la marketplace et le feed

### Jobs BullMQ nécessaires
- `service.submitted` : notification email au freelance/agence après soumission
- `service.approved` : notification email + in-app après approbation admin
- `service.rejected` : notification email avec motif de rejet

### Dépendances techniques
- **Tiptap** (éditeur rich text) : `@tiptap/react`, `@tiptap/starter-kit`, extensions tableaux/couleurs/images
- **Cloudinary** : upload images publiques des services
- **react-dropzone** ou équivalent : drag & drop fichiers
- **dnd-kit** : drag & drop pour réordonner options et images
