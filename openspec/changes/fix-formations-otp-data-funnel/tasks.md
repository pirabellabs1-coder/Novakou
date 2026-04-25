## 1. Migration Prisma — Suppression du bilingue

- [x] 1.1 Modifier `schema.prisma` : remplacer `titleFr`/`titleEn` par `title` sur Formation, ajouter `locale String @default("fr")`, remplacer `shortDescFr`/`shortDescEn` par `shortDesc`, `descriptionFr`/`descriptionEn` par `description`, `learnPointsFr`/`learnPointsEn` par `learnPoints String[]`, `requirementsFr`/`requirementsEn` par `requirements String[]`, `targetAudienceFr`/`targetAudienceEn` par `targetAudience`
- [x] 1.2 Modifier `schema.prisma` : remplacer `nameFr`/`nameEn` par `name` sur FormationCategory
- [x] 1.3 Modifier `schema.prisma` : remplacer `titleFr`/`titleEn` par `title` sur FormationSection et FormationLesson
- [x] 1.4 Ajouter le modèle `SalesFunnel` dans `schema.prisma` (id, formationId, instructorId, blocks Json, published Boolean, slug String @unique, createdAt, updatedAt)
- [ ] 1.5 Générer et appliquer la migration Prisma (`pnpm --filter=db migrate:dev`)
- [x] 1.6 Mettre à jour `seed-formations.ts` : utiliser `name` au lieu de `nameFr`/`nameEn` pour les catégories

## 2. APIs — Mise à jour des endpoints formations

- [x] 2.1 Mettre à jour `POST /api/instructeur/formations` : accepter `title`, `shortDesc`, `description`, `locale` au lieu des paires Fr/En
- [x] 2.2 Mettre à jour `PUT /api/instructeur/formations/[id]` : même changement
- [x] 2.3 Mettre à jour `GET /api/formations/categories` : retourner `name` au lieu de `nameFr`/`nameEn`
- [x] 2.4 Mettre à jour `GET /api/formations` et `GET /api/formations/[slug]` : retourner les champs uniques
- [x] 2.5 Mettre à jour les API admin des catégories pour utiliser `name` unique
- [x] 2.6 Auditer et nettoyer `/api/formations/stats` : s'assurer que les données viennent de Prisma, pas du dev-store
- [x] 2.7 Auditer et nettoyer `/api/admin/formations/marketing` : idem, données réelles uniquement
- [x] 2.8 Vérifier `/api/public/stats` : cohérence des données formations

## 3. Frontend — Formulaires de création formation (wizard)

- [x] 3.1 Modifier l'étape 1 du wizard (`creer/page.tsx`) : remplacer les champs doubles (titleFr/titleEn, descFr/descEn, shortDescFr/shortDescEn) par des champs simples
- [x] 3.2 Modifier l'étape 2 du wizard : remplacer les learning points `{ fr, en }` par des chaînes simples, idem pour prerequisites
- [x] 3.3 Modifier l'étape 4 du wizard : sections et leçons avec un seul champ `title` au lieu de titleFr/titleEn
- [x] 3.4 Modifier les quiz : un seul champ `text` pour les questions, options simples
- [x] 3.5 Ajouter l'option "Autre" dans le dropdown de catégorie avec champ texte libre
- [x] 3.6 Mettre à jour le `buildPayload()` pour envoyer les champs uniques + locale
- [x] 3.7 Mettre à jour les types/interfaces du composant (supprimer LearningPoint { fr, en }, etc.)

## 4. Frontend — Admin catégories et marketing

- [x] 4.1 Modifier le formulaire admin de catégories (`admin/categories/page.tsx`) : un seul champ "Nom" au lieu de nameFr/nameEn
- [x] 4.2 Vérifier le marketing dashboard : s'assurer que les stats affichent 0 et pas des valeurs démo
- [x] 4.3 Supprimer tout label "Français" / "Anglais" dans les popups et modales de la section formations

## 5. Frontend — Flux OTP inscription FreelanceHigh

- [x] 5.1 Modifier `inscription/page.tsx` : après soumission du step 0, appeler `POST /api/auth/register` immédiatement (avant les étapes d'onboarding)
- [x] 5.2 Ajouter un écran OTP inline dans le wizard entre step 0 et step 1 (6 digits, timer 10min, bouton resend)
- [x] 5.3 Après vérification OTP réussie, permettre la progression vers step 1 (profil/entreprise/agence)
- [x] 5.4 Adapter le flow pour les 3 rôles (Freelance, Client, Agence) : même séquence OTP
- [x] 5.5 Gérer les cas d'erreur : OTP invalide, expiration, renvoi de code

## 6. Frontend — Données réelles et landing page formations

- [x] 6.1 Vérifier la landing page formations (`formations/page.tsx`) : tous les compteurs doivent utiliser les données API réelles
- [x] 6.2 S'assurer que les formations, apprenants, instructeurs affichent 0 si pas de données
- [x] 6.3 Vérifier le dashboard instructeur : pas de données demo dans `useInstructorDashboard()`
- [x] 6.4 Vérifier la page d'accueil FreelanceHigh (`(public)/page.tsx`) : données cohérentes depuis les APIs

## 7. Tunnel de vente — Modèle et API

- [x] 7.1 Créer l'API `POST /api/instructeur/sales-funnel` : créer un tunnel de vente pour une formation
- [x] 7.2 Créer l'API `PUT /api/instructeur/sales-funnel/[id]` : sauvegarder les blocs
- [x] 7.3 Créer l'API `GET /api/instructeur/sales-funnel/[formationId]` : récupérer le tunnel d'une formation
- [x] 7.4 Créer l'API `GET /api/formations/vente/[slug]` : page publique du tunnel de vente

## 8. Tunnel de vente — Frontend builder

- [x] 8.1 Créer la page `/(instructeur)/instructeur/tunnel-de-vente/page.tsx` : liste des formations avec bouton "Créer un tunnel"
- [x] 8.2 Créer le composant `SalesFunnelBuilder` avec @dnd-kit : éditeur de blocs drag-and-drop
- [x] 8.3 Implémenter les blocs : Hero (titre, sous-titre, image, CTA)
- [x] 8.4 Implémenter les blocs : Text (éditeur rich text TipTap)
- [x] 8.5 Implémenter les blocs : Image (upload/URL, options de taille)
- [x] 8.6 Implémenter les blocs : Video (embed YouTube/Vimeo)
- [x] 8.7 Implémenter les blocs : Columns (2-3 colonnes éditables)
- [x] 8.8 Implémenter les blocs : Pricing (prix auto depuis la formation)
- [x] 8.9 Implémenter les blocs : Testimonials (nom, photo, texte, note)
- [x] 8.10 Implémenter les blocs : FAQ (accordion question/réponse)
- [x] 8.11 Implémenter les blocs : CTA (bouton d'action configurable)
- [x] 8.12 Ajouter la palette de sélection de blocs et le bouton "Ajouter un bloc"
- [x] 8.13 Implémenter la sauvegarde automatique et le bouton "Publier"
- [x] 8.14 Implémenter la prévisualisation

## 9. Tunnel de vente — Page publique

- [x] 9.1 Créer la page `/vente/[slug]/page.tsx` : rendu public des blocs du tunnel
- [x] 9.2 Implémenter le rendu de chaque type de bloc en lecture seule
- [x] 9.3 Connecter le bouton d'achat : redirection vers le checkout ou l'inscription

## 10. Navigation et intégration

- [x] 10.1 Ajouter le lien "Tunnel de vente" dans la navigation sidebar de l'espace instructeur
- [ ] 10.2 Vérifier que le build complet passe sans erreur TypeScript (`pnpm build`)
- [ ] 10.3 Tester le flux complet : inscription OTP → création formation → tunnel de vente → achat
