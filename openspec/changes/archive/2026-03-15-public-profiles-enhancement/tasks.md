## 1. Profil Freelance — Section Portfolio

- [x] 1.1 Ajouter le champ `portfolio` (JSON array) a la reponse de l'API `/api/public/freelances/[username]` en lisant les projets portfolio depuis le profil utilisateur (structure: titre, description, image, lien, competences, featured)
- [x] 1.2 Ajouter la section "Portfolio" dans le profil freelance entre le contenu principal et les services — grille de cartes projet avec image, titre, description, lien externe, competences utilisees
- [x] 1.3 Ajouter le systeme de projets "en vedette" (featured) avec badge etoile et affichage en priorite dans la grille portfolio
- [x] 1.4 Ajouter les barres de couleur par niveau dans la section Competences sidebar (vert Expert, bleu Avance, jaune Intermediaire, gris Debutant) selon la maquette

## 2. Profil Agence — Sections additionnelles

- [x] 2.1 Ajouter les donnees `team` et `portfolio` a l'API `/api/public/agences/[slug]` en lisant les membres d'equipe et realisations depuis le profil agence
- [x] 2.2 Ajouter la section "Notre Equipe" avec grille de cartes membres (avatar, nom, role, competences) — lien vers profil freelance si existant
- [x] 2.3 Ajouter la section "Nos Realisations" avec grille de cartes projets (image, titre, categorie, description)
- [x] 2.4 Ajouter la section "Notre Processus" dans l'onglet "A propos" avec timeline horizontale numerotee

## 3. Profil Instructeur — Refonte complete

- [x] 3.1 Reecrire le profil instructeur avec header banner + avatar superpose + badges + boutons action — meme structure que le profil freelance
- [x] 3.2 Ajouter la grille de statistiques 4 colonnes (Etudiants, Formations, Note moyenne, Taux completion)
- [x] 3.3 Implementer le systeme d'onglets (A propos, Formations, Avis) style freelance
- [x] 3.4 Implementer l'onglet "A propos" avec bio, expertise tags, liens sociaux
- [x] 3.5 Implementer l'onglet "Formations" avec grille de cartes cours depuis l'API existante
- [x] 3.6 Implementer l'onglet "Avis" avec resume + distribution etoiles + liste d'avis etudiants depuis l'API
- [x] 3.7 Ajouter le formulaire de contact rapide dans la sidebar
- [x] 3.8 Utiliser Material Symbols partout et aligner le style avec le design system existant

## 4. Profil Apprenant — Creation

- [x] 4.1 Creer l'endpoint API `GET /api/formations/apprenants/[id]/route.ts` qui retourne les donnees depuis Prisma (enrollments, certificates, stats)
- [x] 4.2 Creer la page `/apprenants/[id]/page.tsx` avec header (banner, avatar, nom, bio, badges progression) meme structure que les autres profils
- [x] 4.3 Ajouter la grille de statistiques 4 colonnes (Formations completees, Certificats, Heures, Note moyenne)
- [x] 4.4 Ajouter la section "Formations completees" avec grille de cartes depuis les enrollments
- [x] 4.5 Ajouter la section "Certificats" avec grille de cartes et lien de verification
- [x] 4.6 Ajouter les badges de progression (Premier Cours, 5 Cours, 10 Cours, Expert Certifie)

## 5. Verification et coherence

- [x] 5.1 Verifier que les 4 profils utilisent les memes styles de composants (header, stats, badges, onglets)
- [x] 5.2 Verifier le responsive des 4 profils (mobile 375px, tablette 768px, desktop 1280px)
- [x] 5.3 Verifier que les sections vides sont masquees correctement sur les 4 profils
- [x] 5.4 Verifier les meta tags SEO sur les pages profils (title, description, OG tags)
