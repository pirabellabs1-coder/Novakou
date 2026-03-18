## ADDED Requirements

### Requirement: Instructor profile SHALL use platform design system
Le profil instructeur DOIT utiliser le meme design system que les profils freelance et agence : Material Symbols pour les icones, meme structure de page (header avec banner, sidebar, onglets), meme palette de couleurs, meme typographie Tailwind.

#### Scenario: Coherence visuelle avec le profil freelance
- **WHEN** un visiteur consulte le profil d'un instructeur
- **THEN** la page a la meme structure visuelle qu'un profil freelance : banner en haut, avatar superpose, informations principales, sidebar droite, contenu en onglets

#### Scenario: Icones Material Symbols
- **WHEN** le profil instructeur affiche des icones
- **THEN** toutes les icones utilisent la classe `material-symbols-outlined` (pas lucide-react)

### Requirement: Instructor profile SHALL display cover banner
Le profil instructeur DOIT afficher une image de couverture (banner) en haut de la page, avec l'avatar de l'instructeur superpose en bas a gauche, similaire au profil freelance.

#### Scenario: Banner avec image
- **WHEN** un instructeur a renseigne une image de couverture
- **THEN** la banner affiche cette image en arriere-plan avec un overlay gradient

#### Scenario: Banner sans image
- **WHEN** un instructeur n'a pas d'image de couverture
- **THEN** la banner affiche un gradient par defaut (primary → secondary)

### Requirement: Instructor profile SHALL display badges and achievements
Le profil instructeur DOIT afficher des badges de statut a cote du nom : Instructeur Verifie, Top Instructeur, Nouveau. Les badges DOIVENT utiliser le meme composant/style que les badges freelance.

#### Scenario: Badges affiches
- **WHEN** un instructeur a des badges (ex: Verifie, Top Instructeur)
- **THEN** les badges s'affichent sous forme de pilules colorees a cote du nom

### Requirement: Instructor profile SHALL display student reviews
Le profil instructeur DOIT afficher une section "Avis des etudiants" dans un onglet dedie, avec la note moyenne, la distribution des etoiles, et les avis individuels (nom etudiant, note, commentaire, date). L'instructeur DOIT pouvoir repondre aux avis.

#### Scenario: Affichage des avis etudiants
- **WHEN** un visiteur consulte l'onglet "Avis" du profil instructeur
- **THEN** la page affiche le resume (note moyenne, nombre d'avis, distribution 5→1 etoiles) puis la liste paginee des avis avec nom, note, commentaire et date

#### Scenario: Aucun avis
- **WHEN** un instructeur n'a aucun avis
- **THEN** l'onglet "Avis" affiche un message "Aucun avis pour le moment"

### Requirement: Instructor profile SHALL display detailed statistics
Le profil instructeur DOIT afficher une grille de statistiques avec au minimum : nombre total d'etudiants, nombre de formations, note moyenne, taux de completion des cours.

#### Scenario: Grille de statistiques
- **WHEN** un visiteur consulte le profil d'un instructeur
- **THEN** une grille 4 colonnes affiche : Etudiants totaux, Formations publiees, Note moyenne, Taux de completion

### Requirement: Instructor profile SHALL have contact CTA
Le profil instructeur DOIT afficher un bouton "Contacter" et un formulaire rapide de contact (toggle) pour permettre aux visiteurs de poser des questions.

#### Scenario: Formulaire de contact
- **WHEN** un visiteur clique sur "Contacter" sur le profil instructeur
- **THEN** un formulaire s'affiche avec un champ message et un bouton Envoyer

### Requirement: Instructor profile SHALL display courses in grid
Le profil instructeur DOIT afficher les formations publiees dans un onglet "Formations" avec une grille de cartes (image, titre, note, nombre d'etudiants, prix, duree). Le format DOIT etre identique aux cartes de cours utilisees dans la marketplace formations.

#### Scenario: Grille de formations
- **WHEN** un visiteur consulte l'onglet "Formations" du profil instructeur
- **THEN** les cours s'affichent en grille (3 colonnes desktop, 2 tablette, 1 mobile) avec image, titre, note, etudiants, prix
