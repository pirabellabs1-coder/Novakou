## Context

Les profils publics sont la premiere impression que les visiteurs et clients potentiels ont des utilisateurs FreelanceHigh. Actuellement :
- **Profil freelance** (983 lignes) : bien structure avec banner, badges, stats, avis, mais des sections definies dans les types ne sont pas rendues (competences barres de progression, langues, education, portfolio)
- **Profil agence** (853 lignes) : similaire au freelance mais sans section equipe ni portfolio realisations
- **Profil instructeur** (203 lignes) : minimal, design inconsistant (lucide-react au lieu de Material Symbols, theme different)
- **Profil apprenant** : inexistant

La maquette de reference (`profil_public_freelance_et_portfolio/screen.png`) montre un design sombre avec sections : a propos + competences (barres vertes), portfolio (grille 4 images), statistiques cles, avis clients, liens sociaux.

## Goals / Non-Goals

**Goals :**
- Rendre toutes les sections du profil freelance qui sont definies dans les types mais pas affichees (competences, langues, education, portfolio)
- Ajouter une section equipe au profil agence avec cartes des membres
- Redesigner le profil instructeur pour l'aligner avec le design system existant
- Creer un profil public apprenant depuis zero
- Assurer la coherence visuelle entre les 4 types de profils

**Non-Goals :**
- Modifier le schema Prisma pour le profil freelance (les types existent deja)
- Ajouter des fonctionnalites d'edition depuis le profil public (l'edition se fait dans le dashboard)
- Systeme de comparaison de profils (V4)
- Mode sombre (hors MVP selon CLAUDE.md)
- Profil public pour le role Client (pas necessaire — les clients n'ont pas besoin d'etre decouverts)

## Decisions

### 1. Reutiliser la structure existante du profil freelance (pas de rewrite)

**Choix :** Ajouter les sections manquantes dans le fichier existant `freelances/[username]/page.tsx` plutot que de le reecrire.

**Pourquoi :** Le fichier est deja bien structure (983 lignes) avec un systeme d'onglets fonctionnel, des types corrects, et des donnees demo. Ajouter 3-4 sections (competences, langues, education, portfolio) est plus sur qu'un rewrite complet.

### 2. Refonte complete du profil instructeur (rewrite)

**Choix :** Reecrire `formations/instructeurs/[id]/page.tsx` en utilisant la meme structure que le profil freelance.

**Pourquoi :** Le fichier actuel (203 lignes) utilise lucide-react, un style completement different (dark minimal), et manque de sections essentielles. Un rewrite est plus efficace que des patches.

### 3. Profil apprenant dans le namespace formations

**Choix :** Creer la page a `/apprenants/[id]/page.tsx` (dans l'espace formations, pas dans `(public)/`).

**Pourquoi :** Le profil apprenant est lie a l'ecosysteme formations (cours, certificats, cohorts). Le placer dans `/` maintient la coherence avec les profils instructeurs.

### 4. Portfolio via donnees JSON dans le profil (pas de table separee)

**Choix :** Les projets portfolio sont stockes comme JSON dans le champ profil de l'utilisateur (le meme pattern que les competences et langues), pas dans une table Prisma separee.

**Pourquoi :** Au MVP/V1, le portfolio est une simple liste de projets avec titre, description, images et lien. Une table separee serait du sur-engineering. Si les besoins evoluent en V2+, une migration sera simple.

### 5. Coherence via composants partages

**Choix :** Extraire des composants reutilisables (`ProfileHeader`, `StatsGrid`, `ReviewsSection`, `BadgeDisplay`) si le pattern se repete entre les 4 profils. Sinon, garder le code inline.

**Pourquoi :** Les profils freelance/agence/instructeur partagent beaucoup de structure (header + stats + avis). Des composants partages reduisent la duplication et assurent la coherence visuelle.

## Risks / Trade-offs

**[Taille des fichiers profil]** → Le profil freelance fait deja 983 lignes. Ajouter 4 sections pourrait le porter a ~1200+ lignes. Mitigation : extraire les sections en composants si necessaire.

**[Donnees demo pour les nouvelles sections]** → Les sections portfolio, langues, education necessitent des donnees demo realistes. Mitigation : ajouter les donnees dans le meme pattern que les donnees demo existantes.

**[Profil instructeur — migration lucide-react]** → Le remplacement de lucide-react par Material Symbols dans le profil instructeur pourrait casser si d'autres composants formations importent ces icones. Mitigation : le scope est limite a une seule page.

**[Profil apprenant — pas de donnees]** → Le profil apprenant n'a pas d'API existante. Le endpoint devra etre cree avec des donnees demo.
