## Why

Les profils publics sont la vitrine des utilisateurs sur la plateforme. Actuellement, le profil freelance (983 lignes) et le profil agence (853 lignes) sont fonctionnels mais incomplets — des sections definies dans les types (competences, langues, education, portfolio) ne sont pas rendues dans l'UI. Le profil instructeur (203 lignes) est minimal et visuellement inconsistant avec le reste de la plateforme. Le profil apprenant n'existe pas du tout. Ameliorer ces profils est essentiel pour la credibilite et la conversion sur la marketplace.

Version cible : **V1** (profils publics complets, matching freelance ↔ client ↔ agence).

## What Changes

### Profil Freelance — Amelioration
- Rendre la section **Competences** avec barres de progression (defini dans les types mais pas affiche)
- Rendre la section **Langues** avec niveaux et drapeaux
- Rendre la section **Formation & Education** avec diplomes et certifications
- Ajouter une section **Portfolio** dediee avec projets (images, description, lien, competences) distincte des services
- Ajouter un systeme de **3 projets en vedette** dans le portfolio
- Conformite avec la maquette de reference (`profil_public_freelance_et_portfolio/screen.png`)

### Profil Agence — Amelioration
- Ajouter une section **Equipe** avec cartes des membres visibles (photo, nom, role, competences)
- Ajouter une section **Portfolio / Realisations** avec etudes de cas (distincte des services)
- Ajouter une description du processus de travail de l'agence

### Profil Instructeur — Refonte complete
- Redesign complet pour aligner avec le design system de la plateforme (Material Symbols, meme structure que freelance/agence)
- Ajouter : banner/cover photo, badges, section avis etudiants, formulaire de contact, statistiques detaillees
- Remplacer lucide-react par Material Symbols pour la coherence

### Profil Apprenant — Creation
- Creer la page `/apprenants/[id]` avec : avatar, bio, formations completees, certificats obtenus, portfolio d'apprentissage, badges de progression

## Capabilities

### New Capabilities
- `freelancer-profile-sections`: Rendu des sections manquantes du profil freelance (competences avec barres, langues, education, portfolio projets avec vedettes)
- `agency-profile-sections`: Sections additionnelles du profil agence (equipe, portfolio/realisations)
- `instructor-profile-redesign`: Refonte complete du profil instructeur avec design system unifie, avis etudiants, badges, contact
- `learner-public-profile`: Creation du profil public apprenant avec formations, certificats, badges, portfolio d'apprentissage

### Modified Capabilities
<!-- Pas de specs existantes a modifier -->

## Impact

### Impact sur les autres roles
- **Visiteurs publics** : meilleure decouverte des profils, plus de confiance pour commander
- **Freelances** : profil plus complet = meilleure visibilite dans la marketplace
- **Agences** : mise en avant de l'equipe et des realisations
- **Instructeurs** : profil professionnel aligné avec le design de la plateforme
- **Apprenants** : nouveau profil public pour valoriser leurs apprentissages

### Code impacte
- `app/(public)/freelances/[username]/page.tsx` — ajout des sections competences, langues, education, portfolio
- `app/(public)/agences/[slug]/page.tsx` — ajout des sections equipe et portfolio
- `app/formations/instructeurs/[id]/page.tsx` — refonte complete
- `app/formations/apprenants/[id]/page.tsx` — nouvelle page
- `app/api/public/freelances/[username]/route.ts` — ajout des donnees portfolio
- `app/api/formations/instructeurs/[id]/route.ts` — ajout des avis et badges
- `app/api/formations/apprenants/[id]/route.ts` — nouvel endpoint

### Impact sur le schema Prisma
- Aucune nouvelle table requise — les donnees portfolio, competences, langues, education sont deja dans le schema ou gerees via JSON dans le profil utilisateur
- Potentielle table `PortfolioProject` si les projets portfolio ne sont pas encore modelises

### Jobs BullMQ / Socket.io / Templates email
- Aucun job BullMQ necessaire
- Aucun handler Socket.io necessaire
- Aucun template email necessaire
