## 1. Base de données — Schéma Prisma et migrations

- [x] 1.1 Ajouter les 5 enums formations dans `packages/db/schema.prisma` : `Level`, `LessonType`, `QuestionType`, `FormationStatus`, `InstructeurStatus`
- [x] 1.2 Ajouter le modèle `FormationCategory` dans `schema.prisma` (id, nameFr, nameEn, slug unique, icon, color, order)
- [x] 1.3 Ajouter le modèle `InstructeurProfile` dans `schema.prisma` avec relation `User` et enum `InstructeurStatus`
- [x] 1.4 Ajouter les modèles `Formation`, `Section`, `Lesson` dans `schema.prisma` avec leurs relations et champs bilingues (titleFr/titleEn)
- [x] 1.5 Ajouter les modèles `Quiz`, `Question` dans `schema.prisma` avec relation `Lesson`
- [x] 1.6 Ajouter les modèles `Enrollment`, `LessonProgress` dans `schema.prisma` avec contrainte `@@unique([userId, formationId])` sur `Enrollment`
- [x] 1.7 Ajouter les modèles `Certificate`, `FormationReview` dans `schema.prisma`
- [x] 1.8 Ajouter les modèles `CartItem`, `PromoCode` dans `schema.prisma`
- [x] 1.9 Ajouter les buckets Supabase Storage dans la migration : `formation-videos`, `formation-pdfs`, `certificates` (privés, RLS) → SQL prêt dans `packages/db/prisma/sql/003_supabase_storage_buckets.sql`
- [x] 1.10 Exécuter `pnpm --filter=db migrate:dev --name "add-formations-platform"` et vérifier que la migration est valide
- [x] 1.11 Exécuter `pnpm --filter=db generate` pour régénérer le client Prisma
- [x] 1.12 Créer les policies RLS Supabase dans la migration SQL : lecture publique des formations ACTIF, write sécurisé par `auth.uid()` → SQL prêt dans `packages/db/prisma/sql/002_formation_rls_policies.sql`
- [x] 1.13 Créer l'index GIN `search_vector` sur la table `Formation` pour Postgres FTS bilingue (FR + EN) → SQL prêt dans `packages/db/prisma/sql/001_formation_search_vector.sql`
- [x] 1.14 Écrire le script de seed `packages/db/seed/formations-categories.ts` pour insérer les 12 catégories avec `upsert`
- [x] 1.15 Exécuter le seed et vérifier les 12 catégories en Prisma Studio

## 2. Types TypeScript partagés

- [x] 2.1 Créer `packages/types/formations.ts` avec les types TypeScript correspondant aux modèles Prisma formations
- [x] 2.2 Créer les types `FormationWithInstructor`, `FormationDetail`, `EnrollmentWithProgress`, `CertificatePublic` dans `packages/types/formations.ts`
- [x] 2.3 Créer les types de filtres de marketplace `FormationsFilters`, `FormationsSort` dans `packages/types/formations.ts`

## 3. Backend — Routes API Next.js formations (publiques)

- [x] 3.1 Créer `GET /api/formations` avec filtres/tri/pagination, `GET /api/formations/[id]`, `GET /api/formations/categories`
- [x] 3.2 Implémenter la recherche textuelle dans `GET /api/formations` avec filtres par catégorie, niveau, prix, durée, note
- [x] 3.3 Créer `GET /api/formations/[id]` retournant la formation complète (sections, leçons, instructeur, avis)
- [x] 3.4 Créer `GET /api/formations/certificats/verify/[code]` pour vérification publique des certificats
- [x] 3.5 Créer `GET /api/formations/instructeurs/[id]` pour les profils publics instructeurs

## 4. Backend — Routes API apprenant (protégées)

- [x] 4.1 Créer `GET/PUT /api/formations/[id]/progress` pour la progression des leçons
- [x] 4.2 Créer `GET/POST/DELETE /api/formations/cart` et `POST /api/formations/cart/promo`
- [x] 4.3 Créer `POST /api/formations/checkout` qui crée une session Stripe Checkout
- [x] 4.4 Créer `POST /api/webhooks/stripe` pour `checkout.session.completed` → créer `Enrollment`, vider le panier, emails
- [x] 4.5 Implémenter `POST /api/formations/[id]/refund` pour demande de remboursement
- [x] 4.6 Logique de vérification complétion + auto-génération certificat dans quiz submit
- [x] 4.7 Créer `GET/POST/DELETE /api/apprenant/notes` pour les notes personnelles horodatées

## 5. Backend — Routes API instructeur (protégées)

- [x] 5.1 Middleware vérification `InstructeurProfile.status === 'APPROUVE'` dans les routes instructeur
- [x] 5.2 Créer `POST /api/instructeur/candidature` + email confirmation (statut EN_ATTENTE)
- [x] 5.3 Créer `GET/POST /api/instructeur/formations` et `GET/PUT/DELETE /api/instructeur/formations/[id]`
- [x] 5.4 Gestion curriculum dans `PUT /api/instructeur/formations/[id]` : sections, lessons, réorganisation
- [x] 5.5 Quiz creator intégré dans la création/modification de leçons QUIZ
- [x] 5.6 Créer `GET /api/instructeur/dashboard` avec stats CA net 70%, apprenants, note
- [x] 5.7 Créer `GET /api/instructeur/revenus` et `POST /api/instructeur/withdraw`
- [x] 5.8 Créer `GET /api/instructeur/apprenants`, `GET /api/instructeur/avis`

## 6. Backend — Routes API admin formations (protégées)

- [x] 6.1 Middleware `role === 'admin'` sur toutes les routes admin formations
- [x] 6.2 Créer `POST /api/admin/formations/approve/[id]` et `reject/[id]` avec emails
- [x] 6.3 Créer `POST /api/admin/instructeurs/approve/[id]` et `reject/[id]` avec emails
- [x] 6.4 Créer `GET /api/admin/formations/certificats` et `POST /api/admin/formations/certificats/revoke/[id]`
- [x] 6.5 Implémenter `POST /api/admin/formations/refund/[id]` avec `stripe.refunds.create`
- [x] 6.6 Créer `GET/POST /api/admin/formations/categories` et `PUT/DELETE /api/admin/formations/categories/[id]`
- [x] 6.7 Créer `GET /api/admin/formations/stats` et `GET /api/admin/formations/finances`

## 7. Backend — Workers BullMQ / génération PDF

- [x] 7.1 ~~Installer `@react-pdf/renderer`~~ → Utilise `jsPDF` (déjà installé) pour la génération de certificats PDF dans `apps/web/lib/formations/certificate-generator.ts`
- [x] 7.2 Implémenter le template PDF du certificat (bilingue FR+EN, bordures décoratives, signature, URL de vérification) → `generateCertificatePDF()` dans `certificate-generator.ts`
- [x] 7.3 Stockage PDF en base64 dans `Certificate.pdfUrl` (interim) + endpoint download `GET /api/formations/[id]/certificate` → migration vers Supabase Storage quand les buckets seront créés (SQL prêt dans `003_supabase_storage_buckets.sql`)
- [x] 7.4 Emails formations créés dans `apps/web/lib/email/formations.ts` (sans BullMQ, envoi direct Resend)
- [x] 7.5 Génération certificat intégrée dans le flux quiz submit (`/api/formations/[id]/quiz/submit`) — auto-génération à 100% de progression

## 8. Templates email formations

- [x] 8.1 `sendEnrollmentConfirmedEmail` — apprenant + instructeur, prop `locale` FR/EN
- [x] 8.2 `sendCertificateIssuedEmail` — lien téléchargement PDF et URL vérification
- [x] 8.3 `sendInstructorApplicationEmail` — confirmation de candidature reçue
- [x] 8.4 `sendInstructorApprovedEmail` et `sendInstructorRejectedEmail`
- [x] 8.5 `sendFormationApprovedEmail` et `sendFormationRejectedEmail`
- [x] 8.6 `sendWithdrawalRequestEmail` et `sendNewStudentNotificationEmail`

## 9. i18n — Fichiers de traduction

- [x] 9.1 Créer `apps/web/messages/fr/formations.json` avec toutes les chaînes de la section publique et marketplace
- [x] 9.2 Créer `apps/web/messages/en/formations.json` avec les traductions anglaises correspondantes
- [x] 9.3 Créer `apps/web/messages/fr/apprenant.json` avec les chaînes de l'espace apprenant
- [x] 9.4 Créer `apps/web/messages/en/apprenant.json` avec les traductions anglaises
- [x] 9.5 Créer `apps/web/messages/fr/instructeur.json` avec les chaînes de l'espace instructeur
- [x] 9.6 Créer `apps/web/messages/en/instructeur.json` avec les traductions anglaises
- [x] 9.7 Créer `apps/web/messages/fr/formations-admin.json` et `apps/web/messages/en/formations-admin.json`

## 10. Navbar — Ajout du lien "Formations"

- [x] 10.1 Modifier le composant navbar pour ajouter le lien "Formations / Trainings" entre "Services" et "À Propos"
- [x] 10.2 Ajouter le badge coloré `#6C2BD9` et l'icône GraduationCap (Lucide) sur le lien navbar
- [x] 10.3 Implémenter le feature flag `NEXT_PUBLIC_FORMATIONS_ENABLED` pour masquer/afficher le lien
- [x] 10.4 Mettre à jour les navbars des espaces freelance, client et agence

## 11. Pages publiques formations — Frontend

- [x] 11.1 Créer le route group `(public)/formations/` avec son `layout.tsx`
- [x] 11.2 Créer la landing page `/page.tsx` : hero bilingue, stats, catégories, formations vedettes, comment ça marche, témoignages, CTA instructeur
- [x] 11.3 Créer la marketplace `/explorer/page.tsx` avec sidebar filtres, grille responsive et tri
- [x] 11.4 Implémenter la recherche avec debounce 300ms dans la marketplace
- [x] 11.5 Créer la page détail formation `/[slug]/page.tsx` avec layout 2 colonnes, onglets, card achat sticky
- [x] 11.6 Métadonnées SEO dynamiques Next.js pour les pages formation
- [x] 11.7 Créer les pages catégories `/categories/page.tsx` et `[slug]/page.tsx`
- [x] 11.8 Créer la page profil instructeur `/instructeurs/[id]/page.tsx`
- [x] 11.9 Créer la page de vérification de certificat `/verification/[code]/page.tsx`
- [x] 11.10 Créer la page "Devenir instructeur" avec formulaire de candidature complet

## 12. Espace apprenant — Frontend

- [x] 12.1 Créer le route group `(apprenant)/formations/` avec `layout.tsx` et middleware de protection
- [x] 12.2 Créer le dashboard apprenant `/mes-formations/page.tsx` avec stats, onglets (en cours / complétées / favoris)
- [x] 12.3 Créer le lecteur de cours `/apprendre/[id]/page.tsx` layout plein écran (75% + 25% sidebar)
- [x] 12.4 Lecteur vidéo HTML5 custom avec contrôles, reprise automatique, sauvegarde progression à 90%
- [x] 12.5 Visionneuse PDF dans le lecteur (zoom, navigation pages, téléchargement conditionnel)
- [x] 12.6 Panel notes personnelles horodatées (sauvegarde automatique)
- [x] 12.7 Créer la page quiz `/apprendre/[id]/quiz/page.tsx` avec 4 types de questions, timer, résultat immédiat
- [x] 12.8 Créer les pages certificats `/certificats/page.tsx` et `[id]/page.tsx` avec partage LinkedIn
- [x] 12.9 Créer le panier `/panier/page.tsx` avec code promo et checkout Stripe
- [x] 12.10 Créer les pages paiement `/succes/page.tsx` et `/echec/page.tsx`

## 13. Espace instructeur — Frontend

- [x] 13.1 Créer le route group `(instructeur)/formations/instructeur/` avec `layout.tsx` et vérification statut APPROUVE
- [x] 13.2 Créer le dashboard instructeur avec cards stats et graphiques recharts
- [x] 13.3 Créer la liste des formations instructeur avec actions (modifier, dupliquer, archiver, supprimer)
- [x] 13.4 Créer le wizard de création en 5 étapes avec sauvegarde automatique en brouillon
- [x] 13.5 Étape 1 : informations de base bilingues (titre FR/EN, description, catégorie, niveau, durée)
- [x] 13.6 Étape 2 : médias (URL image, vidéo prévisualisation, points d'apprentissage bilingues, prérequis)
- [x] 13.7 Étape 3 : prix et certificat (input EUR, toggle gratuit, score minimum)
- [x] 13.8 Étape 4 : curriculum (sections, leçons par type vidéo/PDF/texte/audio/quiz)
- [x] 13.9 Étape 5 : publication (checklist, brouillon / soumettre pour modération)
- [ ] 13.10 Upload multipart vidéos vers Supabase Storage (max 2GB, barre de progression) — dépend de la création des buckets (1.9)
- [x] 13.11 Créer la page revenus instructeur avec CA, demande de retrait, export CSV
- [x] 13.12 Créer la page apprenants instructeur avec liste, progression, export CSV
- [x] 13.13 Créer la page avis instructeur avec réponse aux avis
- [x] 13.14 Créer la page statistiques instructeur avec graphiques recharts interactifs

## 14. Espace admin formations — Frontend

- [x] 14.1 Ajouter la section "Formations" dans le menu admin avec les 7 sous-liens
- [x] 14.2 Ajouter les 4 KPIs formations sur le dashboard admin global
- [x] 14.3 Créer `admin/formations/dashboard/page.tsx` avec métriques et graphiques recharts
- [x] 14.4 Créer `admin/formations/liste/page.tsx` avec tableau, filtres, actions de modération
- [x] 14.5 Créer `admin/formations/instructeurs/page.tsx` avec file de candidatures et instructeurs actifs
- [x] 14.6 Créer `admin/formations/apprenants/page.tsx` avec liste des apprenants
- [x] 14.7 Créer `admin/formations/finances/page.tsx` avec CA, commissions, retraits à traiter
- [x] 14.8 Créer `admin/formations/certificats/page.tsx` avec liste, recherche, révocation
- [x] 14.9 Créer `admin/formations/categories/page.tsx` avec CRUD complet

## 15. Sitemap et SEO

- [x] 15.1 Créer `apps/web/app/sitemap.ts` incluant les formations ACTIF, catégories et instructeurs avec ISR 60s
- [x] 15.2 Les formations ARCHIVE/BROUILLON sont exclues du sitemap (filtre `status: "ACTIF"`)

## 16. Tests de validation bout-en-bout

- [ ] 16.1 TEST 1 : Visiteur accède à `/` et voit la landing page en français
- [ ] 16.2 TEST 2 : Switch FR → EN fonctionne sur toutes les pages `/`
- [ ] 16.3 TEST 3 : Acheter une formation via Stripe (mode test) → accès immédiat au lecteur
- [ ] 16.4 TEST 4 : Progression d'une leçon vidéo sauvegardée à 90% de visionnage
- [ ] 16.5 TEST 5 : Quiz réussi (score >= passingScore) → leçon marquée complétée
- [ ] 16.6 TEST 6 : Formation 100% complétée + quiz réussi → certificat PDF généré automatiquement
- [ ] 16.7 TEST 7 : Email apprenant reçu avec lien du certificat (Resend)
- [ ] 16.8 TEST 8 : Instructeur soumet une formation → visible dans la file admin
- [ ] 16.9 TEST 9 : Admin approuve la formation → visible dans la marketplace publique
- [ ] 16.10 TEST 10 : Revenus instructeur mis à jour après achat d'un apprenant (70% net)
- [ ] 16.11 TEST 11 : Page de vérification publique `/verification/[code]` affiche le certificat
- [ ] 16.12 TEST 12 : Demande de retrait instructeur créée et visible dans l'admin
- [ ] 16.13 TEST 13 : Webhook Stripe idempotent (double déclenchement → 1 seul enrollment créé)
- [ ] 16.14 TEST 14 : Feature flag `NEXT_PUBLIC_FORMATIONS_ENABLED=false` masque le lien navbar
