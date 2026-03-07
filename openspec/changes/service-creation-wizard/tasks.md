## 1. Schéma Prisma & Base de données

- [x] 1.1 Ajouter/modifier le modèle `Service` dans schema.prisma : champs `language`, `basePrice`, `baseDeliveryDays`, `instructionsRequired`, `instructionsContent` (Json), `description` (Json — format Tiptap), `status` (enum: DRAFT, PENDING, ACTIVE, PAUSED, REJECTED), `draftData` (Json), `userId`, `agencyId`, timestamps
- [x] 1.2 Créer le modèle `ServiceOption` : `id`, `serviceId`, `title`, `description`, `extraPrice`, `extraDays`, `isRecommended`, `sortOrder`, `expressEnabled`, `expressPrice`, `expressDaysReduction`
- [x] 1.3 Créer le modèle `ServiceMedia` : `id`, `serviceId`, `type` (enum: IMAGE, VIDEO), `url`, `isPrimary`, `sortOrder`, `width`, `height`
- [x] 1.4 Créer le modèle `ServiceTag` (relation many-to-many via table pivot `_ServiceToTag`) et le modèle `Tag` : `id`, `name`, `categoryId`
- [x] 1.5 Vérifier/compléter les modèles `Category` et `SubCategory` avec les relations vers `Service`
- [x] 1.6 Exécuter `prisma migrate dev` et vérifier la migration

## 2. Dépendances & Configuration

- [x] 2.1 Installer les dépendances Tiptap : `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-text-align`, `@tiptap/extension-color`, `@tiptap/extension-text-style`, `@tiptap/extension-highlight`, `@tiptap/extension-table`, `@tiptap/extension-table-row`, `@tiptap/extension-table-cell`, `@tiptap/extension-table-header`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/extension-character-count`
- [x] 2.2 Installer les dépendances complémentaires : `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (drag & drop), `react-dropzone` (upload fichiers), `react-easy-crop` (crop images)
- [x] 2.3 Créer les schémas Zod de validation par étape dans `lib/validations/service.ts`

## 3. Store Zustand & Types

- [x] 3.1 Créer les types TypeScript dans `packages/types/` : `ServiceWizardState`, `ServiceOptionDraft`, `ExpressDeliveryConfig`, `UploadedImage`, `ServiceStatus`
- [x] 3.2 Créer le store Zustand `useServiceWizardStore` dans `stores/service-wizard.ts` avec persistence localStorage, toutes les données des 7 étapes, et les actions (setStep, updateField, saveDraft, publish, reset)
- [x] 3.3 Implémenter la logique de sauvegarde automatique : debounce 30s, indicateur de sauvegarde, détection de modifications (isDirty)

## 4. API Routes & Upload

- [x] 4.1 Créer l'API Route `/api/upload/service-image` : validation fichier (type, taille 5MB max), proxy upload vers Cloudinary avec preset, retour URL transformée
- [x] 4.2 Créer l'API Route `/api/services/draft` : sauvegarde/chargement de brouillon en DB (POST pour sauvegarder, GET pour charger)
- [x] 4.3 Créer l'API Route `/api/services/publish` : validation complète (schéma Zod full), vérification limite de services par plan, création du service avec statut PENDING, déclenchement notifications
- [x] 4.4 Créer l'API Route `/api/categories` : GET catégories et sous-catégories, GET tags par catégorie

## 5. Layout & Sidebar du Wizard

- [x] 5.1 Créer le composant `ServiceWizard.tsx` : layout 2 colonnes (sidebar 30% + contenu 70%), prop `role` (freelance | agency), bandeau "Service (brouillon)"
- [x] 5.2 Créer le composant `WizardSidebar.tsx` : liste des 7 étapes avec numéros, titres, indicateurs d'état (vert check / bleu en cours / gris pas fait), section "Besoin d'aide ?" en bas avec conseils contextuels
- [x] 5.3 Implémenter la navigation : boutons "Précédent" et "Enregistrer et suivant", clic sidebar sur étapes complétées, blocage étapes non atteintes
- [x] 5.4 Responsive mobile : sidebar en menu horizontal compact, étapes en accordéon

## 6. Étape 1 — Titre et Catégorie

- [x] 6.1 Créer `StepTitleCategory.tsx` : dropdown langue avec message d'avertissement
- [x] 6.2 Champ titre "Je vais [action]" : préfixe non modifiable, compteur X/100, validation temps réel (trop court, prix détecté, majuscules), affichage des 4 règles
- [x] 6.3 Dropdowns catégorie et sous-catégorie dynamiques : chargement depuis l'API, mise à jour sous-catégories selon catégorie, message d'avertissement non modifiable
- [x] 6.4 Input tags : ajout/suppression, suggestions par catégorie, chips visuels, limite 5 tags max
- [x] 6.5 Validation étape 1 : tous champs obligatoires remplis avant passage étape 2

## 7. Étape 2 — Prix et Description

- [x] 7.1 Créer `StepPricingDescription.tsx` : input prix numérique EUR (min 5, max 5000), dropdown délai de livraison
- [x] 7.2 Calcul de commission temps réel : affichage montant net selon plan (Gratuit 20%, Pro 15%, Business 10%, Agence 8%)
- [x] 7.3 Créer le composant `RichTextEditor.tsx` : wrapper Tiptap avec toutes les extensions configurées, hauteur min 400px, expansion automatique
- [x] 7.4 Créer `EditorToolbar.tsx` : barre d'outils complète — formatage (B/I/U/S), titres (H1-H3), listes (puces/numérotées/tâches), alignement (G/C/D/J), citation, code inline, séparateur, emojis, annuler/rétablir
- [x] 7.5 Créer `ColorPicker.tsx` : couleur de texte et surligneur avec palette prédéfinie + champ hexadécimal
- [x] 7.6 Créer `FontSizePicker.tsx` : dropdown tailles (10/12/14/16/18/20/24/28/32/36/48)
- [x] 7.7 Créer `TableMenu.tsx` : grille de sélection dimensions (max 10x10), ajout/suppression lignes-colonnes, fusion cellules, couleur fond cellules
- [x] 7.8 Bouton insertion image dans l'éditeur (upload ou URL), bouton lien hypertexte, bouton insertion fichier
- [x] 7.9 Onglets "Écrire" / "Prévisualiser" : mode édition et mode lecture seule avec rendu final
- [x] 7.10 Validation étape 2 : prix valide, délai sélectionné, description non vide

## 8. Étape 3 — Options Supplémentaires

- [x] 8.1 Créer `StepExtras.tsx` : liste des options avec titre, description, prix, délai, badge recommandé, boutons modifier/supprimer
- [x] 8.2 Formulaire d'ajout/modification d'option (modal ou inline) avec validation
- [x] 8.3 Badge "RECOMMANDÉ" toggle : un seul badge actif à la fois
- [x] 8.4 Drag & drop pour réorganiser les options avec @dnd-kit
- [x] 8.5 Vérification limite d'options par plan (Gratuit: 3, Pro: 10, Business: illimité) avec message d'upgrade

## 9. Étape 4 — Livraison Express

- [x] 9.1 Créer `StepExpressDelivery.tsx` : tableau avec service de base + chaque option, toggle express par ligne
- [x] 9.2 Configuration par ligne : dropdown réduction de délai, input prix express en EUR
- [x] 9.3 Validation délai express minimum 1 jour (empêcher réduction qui donnerait 0 ou négatif)

## 10. Étape 5 — Consignes de Réalisation

- [x] 10.1 Créer `StepInstructions.tsx` : radio "Consignes requises" / "Pas de consignes nécessaires"
- [x] 10.2 Éditeur rich text simplifié (gras, italique, listes, liens) pour les consignes
- [x] 10.3 Variables dynamiques cliquables ({nom_client}, {service}, {date_livraison}) insérées comme chips
- [x] 10.4 Templates de consignes prédéfinis par catégorie
- [x] 10.5 Prévisualisation du message avec valeurs d'exemple

## 11. Étape 6 — Galerie Médias

- [x] 11.1 Créer `StepMediaGallery.tsx` : zone drag & drop pour image principale avec `react-dropzone`
- [x] 11.2 Créer `ImageCropper.tsx` : crop au ratio 16:9 avec `react-easy-crop`, prévisualisation avant validation
- [x] 11.3 Validation fichier : type (JPEG/PNG/GIF/WebP), taille (max 5MB), messages d'erreur clairs
- [x] 11.4 Zone images supplémentaires : upload multiple (max 5), miniatures avec bouton supprimer, drag & drop pour réordonner
- [x] 11.5 Créer `VideoInput.tsx` : champ URL YouTube/Vimeo avec validation et prévisualisation embed

## 12. Étape 7 — Publication

- [x] 12.1 Créer `StepPublish.tsx` : récapitulatif complet (titre, catégorie, prix, délai, options, image, express, description extrait)
- [x] 12.2 Checklist de validation : éléments requis (check vert) et facultatifs (case vide), liens "Compléter" vers l'étape correspondante
- [x] 12.3 Bouton "Prévisualiser mon service" : ouvre un nouvel onglet avec rendu public du service
- [x] 12.4 Bouton "Sauvegarder en brouillon" : sauvegarde et redirection vers la liste des services
- [x] 12.5 Bouton "Publier mon service" : validation complète, vérification limite services par plan, soumission avec statut PENDING, message de confirmation
- [x] 12.6 Envoi notification email au vendeur après soumission (template React Email)

## 13. Pages & Routes

- [x] 13.1 Créer la page `/dashboard/services/creer/page.tsx` (freelance) : vérification auth + rôle, rendu `<ServiceWizard role="freelance" />`
- [x] 13.2 Créer la page `/agence/services/creer/page.tsx` (agence) : vérification auth + rôle, rendu `<ServiceWizard role="agency" />`
- [x] 13.3 Ajouter les liens "Créer un service" dans les sidebars freelance et agence

## 14. Sauvegarde Automatique & Reprise

- [x] 14.1 Implémenter le hook `useAutoSave` : debounce 30s, sauvegarde DB via API, indicateur visuel "Sauvegardé il y a X"
- [x] 14.2 Sauvegarde localStorage immédiate à chaque modification
- [x] 14.3 Détection de conflit localStorage vs DB au chargement : dialogue "Reprendre les modifications ?"
- [x] 14.4 Alerte navigateur avant quitter si modifications non sauvegardées (`beforeunload`)
- [x] 14.5 Reprise de brouillon depuis la liste des services : chargement des données et positionnement sur la dernière étape complétée

## 15. Tests & Validation Finale

- [ ] 15.1 Tester le flow complet de A à Z : création de service en 7 étapes en tant que freelance
- [ ] 15.2 Tester le flow complet en tant qu'agence
- [ ] 15.3 Tester le responsive : mobile (375px), tablette (768px), desktop (1280px)
- [ ] 15.4 Tester l'éditeur rich text : tableaux, couleurs, taille police, images, liens, emojis
- [ ] 15.5 Tester la sauvegarde automatique : fermeture navigateur, reprise, conflit localStorage/DB
- [ ] 15.6 Tester les limites par plan : options max, services max, affichage messages d'upgrade
- [ ] 15.7 Tester la validation : champs requis, formats invalides, messages d'erreur
