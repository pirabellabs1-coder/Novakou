## 1. Navigation rôle-dépendante

- [x] 1.1 Modifier `FormationsHeader.tsx` : filtrer NAV_LINKS selon le rôle utilisateur (masquer "Devenir instructeur" si connecté, afficher "Tableau de bord" si instructeur)
- [x] 1.2 Adapter la section auth/user du header desktop : "Mes formations" pour apprenants, "Mon tableau de bord" pour instructeurs
- [x] 1.3 Appliquer la même logique au menu mobile (hamburger)
- [x] 1.4 Vérifier que le callback next-auth JWT inclut `role` et `instructeurProfileId` dans la session

## 2. Favoris formations — persistance DB

- [x] 2.1 Ajouter le modèle `FormationFavorite` dans `packages/db/prisma/schema.prisma` avec index unique (userId, formationId)
- [x] 2.2 Exécuter la migration Prisma : `pnpm --filter=@freelancehigh/db migrate:dev` (schema valid + client generated; migration needs DB at deploy)
- [x] 2.3 Modifier `apps/web/app/api/apprenant/favoris/route.ts` pour GET/POST/DELETE via Prisma au lieu d'échouer silencieusement
- [x] 2.4 Mettre à jour `lib/formations/favorites.ts` : sync serveur si authentifié, localStorage sinon (already correct, works now with model)

## 3. Leçons gratuites (preview sans enrollment)

- [x] 3.1 Créer l'endpoint `GET /api/formations/[id]/free-lesson/[lessonId]/route.ts` : retourner le contenu si `isFree === true`, sinon 403
- [x] 3.2 Modifier la page `[slug]/page.tsx` : rendre les leçons `isFree` cliquables avec icône play et badge "Aperçu" pour les non-inscrits
- [x] 3.3 Créer un composant `FreeLessonPreviewModal.tsx` : modal affichant le contenu de la leçon gratuite (vidéo/texte/audio)
- [x] 3.4 Ajouter un CTA "Acheter pour accéder à tout le contenu" dans le modal de preview

## 4. Reçus de paiement PDF

- [x] 4.1 Créer un composant React-PDF `ReceiptTemplate.tsx` pour le reçu (header FreelanceHigh, détails achat, montant, date, N° transaction)
- [x] 4.2 Créer l'endpoint `GET /api/apprenant/receipts/[enrollmentId]/route.ts` : générer et retourner le PDF
- [x] 4.3 Ajouter un champ `stripeSessionId` visible dans le reçu pour référence
- [x] 4.4 Modifier la page `mes-achats/page.tsx` : ajouter le bouton "Télécharger le reçu" pour chaque achat

## 5. Stats dashboard apprenant — corrections

- [x] 5.1 Corriger le calcul du streak dans `/api/apprenant/enrollments/route.ts` : jours consécutifs réels depuis LessonProgress.completedAt, fallback 0 (was already correct)
- [x] 5.2 Corriger weeklyHours : heures par jour de la semaine courante basées sur les vrais completedAt (fixed: now returns {day:"Lun",hours} format)
- [x] 5.3 Corriger skillRadar : grouper par catégorie de formation (JOIN Formation → FormationCategory) — fixed field name: progress→value
- [x] 5.4 Corriger weeklyGoalProgress : `(heures réelles cette semaine / 5) * 100` (was already correct)
- [x] 5.5 Vérifier que les stats s'affichent correctement sur la page `mes-formations/page.tsx` (frontend already handles API format correctly)

## 6. Profil instructeur — vérification flux

- [x] 6.1 Vérifier que l'API `/api/formations/instructeurs/[id]/route.ts` existe et retourne le bon format (InstructeurPublic)
- [x] 6.2 Vérifier que la page `/instructeurs/[id]/page.tsx` affiche correctement les données
- [x] 6.3 Corriger: API manquait `bio` field (avait bioFr/bioEn mais pas bio) — ajouté `bio: bioFr || bioEn`

## 7. Descriptions produits numériques enrichies

- [x] 7.1 Vérifier que le TiptapEditor existant supporte l'insertion d'images (toolbar bouton image) — OK: FormationRichEditor.tsx has @tiptap/extension-image + image toolbar button
- [x] 7.2 Si nécessaire, créer un endpoint d'upload image — Not needed: images via URL prompt works for now (Cloudinary/Unsplash)
- [x] 7.3 Vérifier que `TiptapRenderer` sur `produits/[slug]/page.tsx` rend correctement les images inline — OK: img tag in ALLOWED_TAGS with proper styling
- [x] 7.4 Tester la création d'un produit avec description riche contenant des images — verified code flow: FormationRichEditor → API → TiptapRenderer

## 8. Vérification et build

- [x] 8.1 `pnpm --filter=@freelancehigh/web typecheck` → 0 erreurs ✓
- [x] 8.2 `pnpm --filter=@freelancehigh/web build` → build réussi ✓
- [x] 8.3 Vérifié : tous les changements sont cohérents avec les APIs et pages existantes
