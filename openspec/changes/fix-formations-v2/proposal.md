## Why

Le module formations a plusieurs bugs critiques et lacunes UX qui empechent le parcours apprenant/instructeur de fonctionner correctement :
- Les quiz des formations achetees affichent une erreur 404 (pas de quiz seedes en DB pour les formations)
- La demande de remboursement ne fonctionne pas (route API manque `ensureUserInDb` en DEV_MODE)
- Le profil public instructeur redirige vers le dashboard au lieu d'afficher le profil (erreur de gestion 404 silencieuse)
- Un meme email peut s'inscrire comme instructeur ET apprenant simultanement (pas de prevention)
- Les donnees affichees dans le dashboard apprenant (formations en cours, completees, certifications, heures) ne sont pas realistes ni liees aux actions reelles
- Le design global du module formations manque de polish et de coherence professionnelle

**Version cible : MVP**

## What Changes

- **Fix quiz 404** : Corriger le seed pour creer des quiz + questions pour chaque formation avec contenu realiste ; ajouter `ensureUserInDb` aux routes quiz
- **Fix remboursement** : Ajouter `ensureUserInDb` aux routes de remboursement ; verifier que le bouton de demande est accessible depuis mes-achats
- **Fix profil instructeur** : Corriger la gestion d'erreur sur la page instructeur pour verifier `r.ok` avant parse JSON ; afficher un fallback propre
- **Prevention double inscription** : Rejeter l'inscription si un compte avec le meme email existe deja avec un role formations different (instructeur ne peut pas etre apprenant et vice versa)
- **Donnees realistes** : Ameliorer le seed pour generer des enrollments, quiz completions, et certificats coherents et lies entre apprenants, instructeurs et admin
- **Amelioration design** : Rendre les pages formations plus professionnelles avec meilleur espacement, typographie, animations subtiles, et coherence visuelle (cards, boutons, navigation)

## Capabilities

### New Capabilities
- `quiz-completion-flow`: Flux complet quiz → score → certificat avec seed data realiste et routes fonctionnelles
- `formations-design-polish`: Ameliorations UX/UI sur les pages cles du module formations (detail, panier, mes-formations, instructeur)
- `dual-role-prevention`: Prevention d'inscription double role (instructeur/apprenant) avec meme email

### Modified Capabilities
- `cart-purchase-flow`: Ajout ensureUserInDb aux routes de remboursement ; correction flow refund
- `learner-dashboard-stats`: Donnees realistes liees aux actions reelles de l'apprenant

## Impact

**Impact sur les roles :**
- **Apprenant** : quiz fonctionnels, remboursement accessible, dashboard avec donnees reelles, design ameliore
- **Instructeur** : profil public accessible, stats liees aux vrais enrollments/ventes
- **Admin** : donnees coherentes dans le dashboard (formations vendues, revenus, remboursements)

**Code affecte :**
- `packages/db/prisma/seed.ts` — quiz data + enrollments realistes
- `apps/web/app/api/formations/quiz/` — ensureUserInDb
- `apps/web/app/api/apprenant/refunds/` — ensureUserInDb
- `apps/web/app/api/auth/register/route.ts` — dual role prevention
- `apps/web/app/formations/instructeurs/[id]/page.tsx` — error handling
- `apps/web/app/formations/(apprenant)/mes-formations/page.tsx` — design
- `apps/web/app/formations/[slug]/page.tsx` — design
- `apps/web/app/formations/(apprenant)/panier/page.tsx` — design

**Schema Prisma** : Pas de changement de schema necessaire
**Jobs BullMQ** : Aucun
**Templates email** : Aucun nouveau
