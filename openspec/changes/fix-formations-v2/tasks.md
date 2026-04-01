# Tasks — fix-formations-v2

## Phase 1 : Fix routes API (ensureUserInDb)

- [x] 1.1 — Ajouter `ensureUserInDb` a `apps/web/app/api/formations/quiz/[quizId]/route.ts` (GET) apres le check session
- [x] 1.2 — Ajouter `ensureUserInDb` a `apps/web/app/api/formations/[id]/quiz/submit/route.ts` (POST) apres le check session
- [x] 1.3 — Ajouter `ensureUserInDb` a `apps/web/app/api/apprenant/refunds/route.ts` (GET + POST) apres chaque check session
- [x] 1.4 — Ajouter `ensureUserInDb` a `apps/web/app/api/formations/[id]/refund/route.ts` si present, apres le check session

## Phase 2 : Fix profil instructeur

- [x] 2.1 — Dans `apps/web/app/formations/instructeurs/[id]/page.tsx`, corriger le fetch pour verifier `r.ok` avant `.json()`. Si !r.ok, setInstructeur(null) et setLoading(false). Ajouter console.error pour les erreurs reseau.

## Phase 3 : Prevention double role inscription

- [x] 3.1 — Dans `apps/web/app/api/auth/register/route.ts`, mode DEV : quand un utilisateur existant a un `formationsRole` different du `formationsRole` demande, retourner 409 avec message explicatif au lieu de mettre a jour silencieusement
- [x] 3.2 — Dans `apps/web/app/api/auth/register/route.ts`, mode PROD : meme logique de rejet pour les utilisateurs Prisma avec formationsRole existant different

## Phase 4 : Amelioration seed data quiz

- [x] 4.1 — Verifier dans `packages/db/prisma/seed.ts` que les quiz sont bien crees avec des questions pour chaque formation ayant des lecons QUIZ. Si les quiz/questions manquent ou sont insuffisants, enrichir le QUIZ_BANK avec au moins 6 questions realistes par formation
- [x] 4.2 — S'assurer que les enrollments seedes ont des LessonProgress realistes (certaines lecons completees, quiz scores varies) pour que le dashboard affiche des donnees coherentes
- [x] 4.3 — Verifier la coherence cross-espace : les studentsCount des formations doivent correspondre au nombre d'enrollments, les revenus instructeur doivent correspondre aux paidAmount des enrollments

## Phase 5 : Amelioration design pages formations

- [x] 5.1 — Ameliorer `apps/web/app/formations/[slug]/page.tsx` : cards avec shadow-lg et rounded-2xl coherents, meilleurs gradients, hover transitions fluides, espacement uniforme gap-6, typographie plus lisible
- [x] 5.2 — Ameliorer `apps/web/app/formations/(apprenant)/mes-formations/page.tsx` : stats cards avec gradients de couleur, animated counters plus fluides, progress bars ameliorees, charts avec meilleur styling
- [x] 5.3 — Ameliorer `apps/web/app/formations/(apprenant)/panier/page.tsx` : layout plus propre, items de panier avec meilleure presentation, bouton checkout plus visible, espacement coherent
- [x] 5.4 — Ameliorer `apps/web/app/formations/instructeurs/[id]/page.tsx` : hero section avec gradient background, avatar plus grand, stats cards plus visuelles, tabs mieux stylises

## Phase 6 : Validation

- [x] 6.1 — Verifier que TypeScript compile sans erreur (`pnpm --filter=@freelancehigh/web exec tsc --noEmit` ou equivalent)
- [x] 6.2 — Tester manuellement : connexion → formation detail → acheter → quiz → certificat → profil instructeur → demande remboursement
