## Context

FreelanceHigh n'a actuellement aucun système de création de service. Les freelances et agences ne peuvent pas encore publier d'offres sur la marketplace. Ce wizard est la fonctionnalité centrale du MVP : sans services, pas de commandes, pas de revenus.

Le système doit supporter deux types de vendeurs (freelances et agences) avec une expérience identique mais des routes distinctes. L'architecture actuelle utilise Next.js 14 App Router, Prisma pour la DB, Zustand pour l'état UI, et Cloudinary pour les images publiques.

Le modèle existant `Service` dans le schéma Prisma est minimal et devra être enrichi significativement.

## Goals / Non-Goals

**Goals:**
- Wizard de création de service en 7 étapes avec navigation progressive et validation temps réel
- Éditeur rich text complet (tableaux, couleurs, taille police, images, emojis) via Tiptap
- Sauvegarde automatique brouillon toutes les 30 secondes
- Upload d'images avec drag & drop, crop 16:9, prévisualisation
- Système d'options/extras configurable et limité par plan d'abonnement
- Livraison express configurable par service et par option
- Page récap avec checklist et soumission pour modération admin
- Responsive : 2 colonnes desktop, accordéon mobile
- Code partagé entre les routes freelance et agence (composants communs)

**Non-Goals:**
- Suggestion IA de catégorie (reporté à V3 — nécessite OpenAI)
- Éditeur de création d'image intégré (canvas) — trop complexe pour le MVP, un simple upload suffit
- Upload vidéo direct (100MB) — au MVP, uniquement URLs YouTube/Vimeo. L'upload direct sera ajouté en V1
- Modération automatique par IA — la modération admin manuelle est suffisante au MVP
- Système de forfaits Basique/Standard/Premium (modèle ComeUp/Fiverr) — le wizard utilise un prix de base + options supplémentaires, ce qui est plus flexible

## Decisions

### 1. Éditeur rich text : Tiptap

**Choix :** Tiptap (basé sur ProseMirror)
**Alternatives considérées :**
- **Slate.js** : API instable entre versions, documentation fragmentée, plus bas niveau
- **Quill** : Moins extensible, pas de support natif tableaux, architecture monolithique
- **TinyMCE / CKEditor** : Licences commerciales coûteuses pour les fonctionnalités avancées

**Rationale :** Tiptap offre un écosystème d'extensions modulaire (tableaux, couleurs, images), une API React-friendly, est open-source (MIT pour le core), et supporte le rendu collaboratif si nécessaire en V3. Le contenu est stocké en JSON (pas en HTML brut), ce qui permet un rendu sécurisé côté serveur.

**Extensions Tiptap nécessaires :**
- `@tiptap/starter-kit` : gras, italique, titres, listes, code, citations
- `@tiptap/extension-underline` : souligné
- `@tiptap/extension-text-align` : alignement
- `@tiptap/extension-color` + `@tiptap/extension-text-style` : couleur texte
- `@tiptap/extension-highlight` : surligneur
- `@tiptap/extension-table` + `table-row` + `table-cell` + `table-header` : tableaux
- `@tiptap/extension-image` : images inline
- `@tiptap/extension-link` : liens hypertexte
- `@tiptap/extension-placeholder` : placeholder
- `@tiptap/extension-character-count` : compteur de caractères
- Extension custom `font-size` : taille de police (pas d'extension officielle, simple à implémenter via TextStyle)

### 2. Gestion d'état du wizard : Zustand

**Choix :** Store Zustand dédié `useServiceWizardStore`
**Alternatives considérées :**
- **React Hook Form seul** : Adapté aux formulaires simples, mais le wizard a 7 étapes avec des données inter-dépendantes et une sauvegarde automatique
- **URL state (searchParams)** : Trop fragile pour des données complexes (JSON description, fichiers uploadés)
- **Context API** : Suffisant mais pas de persistence facile, pas de middleware

**Rationale :** Zustand permet de persister le brouillon dans localStorage entre les sessions, d'exposer un state global pour la sauvegarde automatique, et de découpler l'état du wizard des composants individuels. Chaque étape lit/écrit dans le même store.

**Structure du store :**
```typescript
interface ServiceWizardState {
  // Métadonnées
  currentStep: number
  serviceId: string | null  // null si nouveau, ID si édition
  lastSavedAt: Date | null
  isDirty: boolean

  // Étape 1
  language: string
  title: string
  categoryId: string
  subCategoryId: string
  tags: string[]

  // Étape 2
  basePrice: number
  baseDeliveryDays: number
  description: JSONContent  // Format Tiptap JSON

  // Étape 3
  options: ServiceOptionDraft[]

  // Étape 4
  expressDelivery: ExpressDeliveryConfig

  // Étape 5
  instructionsRequired: boolean
  instructionsContent: JSONContent | null

  // Étape 6
  mainImage: UploadedImage | null
  additionalImages: UploadedImage[]
  videoUrl: string

  // Actions
  setStep: (step: number) => void
  updateField: <K extends keyof ServiceWizardState>(key: K, value: ServiceWizardState[K]) => void
  saveDraft: () => Promise<void>
  publish: () => Promise<void>
  reset: () => void
}
```

### 3. Upload d'images : Cloudinary via API Route Next.js

**Choix :** Upload côté client vers une API Route Next.js qui proxy vers Cloudinary
**Alternatives considérées :**
- **Upload direct Cloudinary (unsigned)** : Expose le cloud name et le preset, risque d'abus
- **Supabase Storage** : Réservé aux fichiers privés (KYC, livrables), pas optimisé pour les images publiques

**Rationale :** L'API Route sert de proxy sécurisé : elle valide le fichier (type, taille, dimensions), uploade vers Cloudinary avec le bon preset, et retourne l'URL transformée. Les clés Cloudinary restent côté serveur.

### 4. Sauvegarde brouillon : localStorage + DB

**Choix :** Double sauvegarde — localStorage immédiat + DB toutes les 30 secondes
**Rationale :**
- **localStorage** : sauvegarde instantanée à chaque changement, reprise immédiate même hors ligne
- **DB (table Service avec status='draft')** : sauvegarde durable, accessible depuis n'importe quel appareil, sert de source de vérité

Flux : changement → localStorage immédiat → debounce 30s → API save draft → DB. Au chargement, comparer les timestamps localStorage vs DB et prendre le plus récent.

### 5. Architecture des routes : composants partagés

**Choix :** Composants wizard dans `components/services/wizard/`, pages thin dans chaque route
**Structure :**
```
apps/web/
├── app/dashboard/services/creer/page.tsx     # Freelance — importe ServiceWizard
├── app/agence/services/creer/page.tsx        # Agence — importe ServiceWizard
├── components/services/wizard/
│   ├── ServiceWizard.tsx                     # Composant principal (layout 2 colonnes)
│   ├── WizardSidebar.tsx                     # Sidebar avec étapes
│   ├── steps/
│   │   ├── StepTitleCategory.tsx
│   │   ├── StepPricingDescription.tsx
│   │   ├── StepExtras.tsx
│   │   ├── StepExpressDelivery.tsx
│   │   ├── StepInstructions.tsx
│   │   ├── StepMediaGallery.tsx
│   │   └── StepPublish.tsx
│   ├── editor/
│   │   ├── RichTextEditor.tsx                # Wrapper Tiptap
│   │   ├── EditorToolbar.tsx                 # Barre d'outils
│   │   ├── TableMenu.tsx                     # Menu contextuel tableaux
│   │   ├── ColorPicker.tsx                   # Sélecteur couleur
│   │   └── FontSizePicker.tsx                # Sélecteur taille police
│   └── media/
│       ├── ImageUploader.tsx                 # Zone drag & drop
│       ├── ImageCropper.tsx                  # Crop 16:9
│       └── VideoInput.tsx                    # URL ou upload vidéo
```

Les pages `page.tsx` ne font que vérifier l'auth + le rôle et rendre `<ServiceWizard role="freelance" />` ou `<ServiceWizard role="agency" />`.

### 6. Validation : Zod schemas par étape

**Choix :** Un schéma Zod par étape, composés en un schéma complet pour la publication
**Rationale :** Permet une validation indépendante à chaque étape (l'utilisateur peut passer à l'étape suivante dès que l'étape courante est valide) tout en ayant une validation complète avant publication.

```typescript
const step1Schema = z.object({
  language: z.string().min(1),
  title: z.string().min(10).max(100),
  categoryId: z.string().uuid(),
  subCategoryId: z.string().uuid(),
  tags: z.array(z.string()).min(1).max(5),
})

const fullServiceSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  // ...
```

### 7. Stockage description : JSON Tiptap en DB

**Choix :** Stocker le contenu Tiptap en format JSON natif dans une colonne `Json` Prisma
**Alternatives considérées :**
- **HTML** : Risque XSS si rendu avec `dangerouslySetInnerHTML`, plus difficile à transformer
- **Markdown** : Perd les tableaux complexes, couleurs, tailles de police

**Rationale :** Le JSON Tiptap est le format le plus fidèle, sécurisé par défaut (pas d'injection HTML), et permet un rendu identique côté serveur avec `generateHTML()`. La taille du JSON est comparable au HTML pour des descriptions de services (quelques KB).

## Risks / Trade-offs

**[Taille du bundle Tiptap]** → Les extensions Tiptap ajoutent ~80-120KB gzipped au bundle. Mitigation : lazy loading du composant éditeur (`dynamic(() => import(...), { ssr: false })`), l'éditeur n'est chargé que sur la page de création de service.

**[Perte de brouillon si localStorage nettoyé]** → L'utilisateur perd son brouillon local. Mitigation : la sauvegarde DB toutes les 30s est la source de vérité. Au chargement, on vérifie d'abord la DB, puis le localStorage comme fallback rapide.

**[Upload Cloudinary en mode proxy]** → Ajoute de la latence (client → API Route → Cloudinary au lieu de client → Cloudinary direct). Mitigation : acceptable pour des images de 5MB max. Si la latence devient un problème, on peut passer à un upload signé direct avec un token éphémère.

**[Complexité du store Zustand avec 7 étapes]** → Le store peut devenir volumineux. Mitigation : utiliser des slices Zustand si le store dépasse 200 lignes, avec un slice par groupe d'étapes.

**[Limites d'options par plan non vérifiées côté serveur]** → Un utilisateur technique pourrait contourner les limites frontend. Mitigation : valider côté serveur dans la route tRPC `service.create` / `service.update` en vérifiant le `subscription_tier` du JWT.

## Open Questions

1. **Crop d'image côté client ou serveur ?** — Recommandation : côté client avec une lib légère (`react-image-crop` ou `react-easy-crop`), puis upload de l'image croppée. Évite de stocker l'image originale + la version croppée.

2. **Format des consignes avec variables** — Les variables `{nom_client}` etc. seront-elles interpolées au moment de la commande par le frontend ou le backend ? Recommandation : backend, dans le worker BullMQ qui gère la création de commande.
