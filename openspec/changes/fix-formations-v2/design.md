## Context

Le module formations a ete deploye avec les bugs suivants :
1. **Quiz 404** : Les quiz existent en seed mais le routing est correct (searchParams). Le probleme est que `ensureUserInDb` n'est pas appele dans les routes quiz, donc en DEV_MODE la requete echoue avec FK constraint.
2. **Remboursement** : Les routes API existent (`/api/apprenant/refunds`, `/api/formations/[id]/refund`) mais manquent `ensureUserInDb` pour DEV_MODE. La page `mes-achats` a le UI mais l'utilisateur doit y acceder.
3. **Profil instructeur** : La page `/instructeurs/[id]` existe avec un UI complet. Le fetch ne verifie pas `r.ok` avant d'appeler `.json()`. Si l'API retourne 404 (instructeur non APPROUVE), le JSON parse echoue silencieusement.
4. **Double inscription** : Le register endpoint permet de mettre a jour le `formationsRole` d'un utilisateur existant sans verification de conflit.
5. **Donnees seed** : Les quiz, questions, et enrollments sont seedes mais les quiz questions manquent de variete et les donnees ne sont pas assez realistes.

## Goals / Non-Goals

**Goals:**
- Rendre fonctionnel le flux quiz → score → certificat bout en bout
- Permettre les demandes de remboursement depuis l'espace apprenant
- Afficher correctement le profil public instructeur
- Empecher un meme email d'avoir les deux roles formations (instructeur + apprenant)
- Generer des donnees de demo realistes et coherentes cross-espaces
- Ameliorer le design des pages formations cles pour un rendu professionnel

**Non-Goals:**
- Refonte complete du design system (on ameliore l'existant)
- Ajout de nouvelles fonctionnalites (pas de nouvelles pages)
- Modification du schema Prisma
- Toucher au module marketplace

## Decisions

### D1 : ensureUserInDb sur toutes les routes formations
**Choix** : Ajouter `ensureUserInDb` a TOUTES les routes API formations qui utilisent `session.user.id` avec Prisma.
**Rationale** : Plutot que de fixer au cas par cas, on applique systematiquement pour eviter les regressions futures.
**Routes concernees** : quiz/[quizId], [id]/quiz/submit, apprenant/refunds, formations/[id]/refund

### D2 : Rejet strict de double role
**Choix** : Si un utilisateur existe deja avec un `formationsRole`, on rejette toute tentative d'inscription avec un role different.
**Alternative rejetee** : Permettre le switch de role (complexite excessive, confusion UX).
**Implementation** : Dans register/route.ts, verifier si `existing.formationsRole` est different du `formationsRole` demande et retourner 409.

### D3 : Profil instructeur — verification r.ok
**Choix** : Ajouter `if (!r.ok)` avant `.json()` et afficher le fallback "Instructeur introuvable" proprement.
**Alternative** : Rediriger vers /formations/explorer — rejete car le fallback actuel est correct, il manque juste la verification HTTP.

### D4 : Design — ameliorations incrementales
**Choix** : Ameliorer les pages existantes avec :
- Meilleurs gradients et ombres sur les cards
- Spacing plus coherent (gap-6 partout)
- Animations subtiles (fade-in, hover transitions)
- Typography plus lisible (line-height, letter-spacing)
- Progress bars plus visuelles
**Alternative rejetee** : Nouveau design system complet (trop long, hors scope).

### D5 : Seed data — enrichissement quiz
**Choix** : Enrichir le QUIZ_BANK avec plus de questions par formation et des donnees d'enrollment plus variees.
**Approche** : 6-10 questions par quiz, scores realistes (60-100%), mix de formations completees et en cours.

## Risks / Trade-offs

- **Risk** : `ensureUserInDb` ajoute une requete DB supplementaire par route en DEV_MODE → Mitigation : en production, la fonction retourne immediatement (IS_DEV check)
- **Risk** : Le rejet de double role pourrait bloquer des utilisateurs existants → Mitigation : seulement pour les nouvelles inscriptions, pas pour les comptes existants
- **Trade-off** : Les ameliorations design sont incrementales et ne couvrent pas 100% des pages → acceptable car le focus est sur les pages les plus visibles
