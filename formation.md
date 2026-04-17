# 🎓 Structure Complète — Plateforme Formation FreelanceHigh

## Architecture globale

```
FreelanceHigh
├── / (Freelancing - existant)
├── /feed (marketplace services - existant)
└── /formations (NOUVELLE SECTION)
    ├── Pages publiques
    ├── Espace apprenant
    ├── Espace instructeur
    └── Administration formations
```

---

## Structure des fichiers Next.js

```
app/
├── (public)/
│   └── formations/
│       ├── page.tsx
│       │   └── Landing page formations
│       ├── explorer/
│       │   └── page.tsx
│       │       └── Marketplace formations
│       ├── [slug]/
│       │   └── page.tsx
│       │       └── Détail formation
│       ├── categories/
│       │   ├── page.tsx
│       │   └── [slug]/
│       │       └── page.tsx
│       ├── instructeurs/
│       │   └── [id]/
│       │       └── page.tsx
│       ├── devenir-instructeur/
│       │   └── page.tsx
│       └── verification/
│           └── [code]/
│               └── page.tsx
│
├── (apprenant)/
│   └── formations/
│       ├── mes-formations/
│       │   └── page.tsx
│       ├── apprendre/
│       │   └── [id]/
│       │       ├── page.tsx
│       │       └── quiz/
│       │           └── page.tsx
│       ├── certificats/
│       │   ├── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       ├── favoris/
│       │   └── page.tsx
│       ├── panier/
│       │   └── page.tsx
│       └── parametres/
│           └── page.tsx
│
├── (instructeur)/
│   └── formations/
│       └── instructeur/
│           ├── dashboard/
│           │   └── page.tsx
│           ├── mes-formations/
│           │   └── page.tsx
│           ├── creer/
│           │   └── page.tsx
│           ├── [id]/
│           │   ├── modifier/
│           │   │   └── page.tsx
│           │   └── statistiques/
│           │       └── page.tsx
│           ├── apprenants/
│           │   └── page.tsx
│           ├── revenus/
│           │   └── page.tsx
│           ├── avis/
│           │   └── page.tsx
│           ├── messages/
│           │   └── page.tsx
│           ├── statistiques/
│           │   └── page.tsx
│           └── parametres/
│               └── page.tsx
│
└── (paiement)/
    └── formations/
        ├── paiement/
        │   └── page.tsx
        ├── succes/
        │   └── page.tsx
        └── echec/
            └── page.tsx
```

---

## Schéma base de données

```prisma
model Formation {
  id              String   @id @default(cuid())
  slug            String   @unique
  
  // Bilingue
  titleFr         String
  titleEn         String
  descriptionFr   String
  descriptionEn   String
  
  // Médias
  thumbnail       String?
  previewVideo    String?
  
  // Infos
  category        String
  subCategory     String?
  level           Level
  language        String[]
  duration        Int      // minutes
  
  // Prix
  price           Float
  originalPrice   Float?
  isFree          Boolean  @default(false)
  
  // Certificat
  hasCertificate  Boolean  @default(true)
  minScore        Int      @default(80)
  
  // Stats
  studentsCount   Int      @default(0)
  rating          Float    @default(0)
  reviewsCount    Int      @default(0)
  
  // Statut
  status          FormationStatus
  publishedAt     DateTime?
  
  // Relations
  instructeurId   String
  instructeur     User     @relation
  sections        Section[]
  enrollments     Enrollment[]
  reviews         FormationReview[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Section {
  id          String   @id @default(cuid())
  titleFr     String
  titleEn     String
  order       Int
  formationId String
  formation   Formation @relation
  lessons     Lesson[]
}

model Lesson {
  id          String      @id @default(cuid())
  titleFr     String
  titleEn     String
  type        LessonType
  content     String?
  videoUrl    String?
  pdfUrl      String?
  audioUrl    String?
  duration    Int?
  order       Int
  isFree      Boolean     @default(false)
  sectionId   String
  section     Section     @relation
  resources   Resource[]
  quiz        Quiz?
}

model Quiz {
  id          String     @id @default(cuid())
  titleFr     String
  titleEn     String
  passingScore Int       @default(80)
  timeLimit   Int?
  lessonId    String     @unique
  lesson      Lesson     @relation
  questions   Question[]
}

model Question {
  id          String   @id @default(cuid())
  textFr      String
  textEn      String
  type        QuestionType
  options     Json
  correctAnswer String
  explanation String?
  quizId      String
  quiz        Quiz     @relation
}

model Enrollment {
  id          String   @id @default(cuid())
  userId      String
  formationId String
  progress    Float    @default(0)
  completedAt DateTime?
  paidAmount  Float
  
  user        User      @relation
  formation   Formation @relation
  progress_details LessonProgress[]
  certificate Certificate?
  
  createdAt   DateTime @default(now())
}

model LessonProgress {
  id           String     @id @default(cuid())
  enrollmentId String
  lessonId     String
  completed    Boolean    @default(false)
  score        Int?
  completedAt  DateTime?
  enrollment   Enrollment @relation
}

model Certificate {
  id           String     @id @default(cuid())
  code         String     @unique
  enrollmentId String     @unique
  userId       String
  formationId  String
  score        Int
  issuedAt     DateTime   @default(now())
  enrollment   Enrollment @relation
  user         User       @relation
  formation    Formation  @relation
}

model FormationReview {
  id          String    @id @default(cuid())
  rating      Int
  comment     String
  userId      String
  formationId String
  response    String?
  createdAt   DateTime  @default(now())
  user        User      @relation
  formation   Formation @relation
}

model InstructeurProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  bioFr       String?
  bioEn       String?
  expertise   String[]
  linkedin    String?
  website     String?
  youtube     String?
  totalEarned Float    @default(0)
  status      InstructeurStatus
  user        User     @relation
}

enum Level {
  DEBUTANT
  INTERMEDIAIRE
  AVANCE
  TOUS_NIVEAUX
}

enum LessonType {
  VIDEO
  PDF
  TEXTE
  AUDIO
  QUIZ
}

enum QuestionType {
  CHOIX_UNIQUE
  CHOIX_MULTIPLE
  VRAI_FAUX
  TEXTE_LIBRE
}

enum FormationStatus {
  BROUILLON
  EN_ATTENTE
  ACTIF
  ARCHIVE
}

enum InstructeurStatus {
  EN_ATTENTE
  APPROUVE
  SUSPENDU
}
```

---

# 📋 Prompt Complet pour Claude Code

````markdown
MISSION CRITIQUE : Développer la section 
complète de formations sur FreelanceHigh.
C'est une nouvelle grande section du site,
aussi complète qu'Udemy.
Tout doit être en FRANÇAIS et en ANGLAIS.
Travaille de façon 100% autonome.
ZÉRO donnée hardcodée.
ZÉRO prototype.
TOUT fonctionnel à 100%.

═══════════════════════════════════════════
## PARTIE 1 — LIEN DANS LA NAVBAR
═══════════════════════════════════════════

Dans la navbar de la landing page 
principale ET dans la navbar connectée :

Ajoute un lien :
🎓 Formations / Trainings

Position : entre "Services" et "À Propos"

Style :
- Badge légèrement coloré pour le distinguer
- Icône 🎓 devant le texte
- Texte FR : "Formations"
- Texte EN : "Trainings"
- Clic → /formations

Switch langue FR/EN :
- Bouton dans la navbar (globe 🌍)
- FR → EN ou EN → FR
- Sauvegardé dans localStorage
- Appliqué sur toutes les pages /formations

═══════════════════════════════════════════
## PARTIE 2 — LANDING PAGE FORMATIONS
   (/)
═══════════════════════════════════════════

Page d'accueil dédiée aux formations.
Design distinct mais cohérent avec le site.
Tout le contenu en FR et EN.

### HERO SECTION

FR :
- Titre : "Apprenez. Progressez. Certifiez."
- Sous-titre : "Des milliers de formations 
  pour booster votre carrière et vos revenus"
- Barre de recherche : 
  "Rechercher une formation..."
- CTA principal : "Explorer les formations"
- CTA secondaire : "Devenir instructeur"

EN :
- Title : "Learn. Grow. Get Certified."
- Subtitle : "Thousands of courses to boost
  your career and income"
- Search : "Search for a course..."
- CTA : "Browse Courses"
- CTA2 : "Become an Instructor"

Stats animées :
- 50K+ Apprenants / Learners
- 2K+ Formations / Courses
- 500+ Instructeurs / Instructors
- 98% Satisfaction

### CATÉGORIES POPULAIRES

Grille 4 colonnes :
🎨 Design & Créativité / Design & Creativity
💻 Développement Web / Web Development
📱 App Mobile / Mobile App
📈 Marketing Digital / Digital Marketing
🤖 Intelligence Artificielle / AI
📊 Data & Business / Data & Business
🎬 Vidéo & Animation / Video & Animation
✍️ Rédaction / Writing
🔐 Cybersécurité / Cybersecurity
💼 Freelancing & Business
🌍 Langues / Languages
🎓 Développement personnel / Self Development

Chaque catégorie :
- Icône colorée
- Nom FR/EN
- Nombre de formations
- Hover effect
- Clic → /formations/categories/[slug]

### FORMATIONS EN VEDETTE

Titre : "Formations populaires" / 
        "Popular Courses"
Grille 4 colonnes de cards :

Chaque card :
- Thumbnail (image du cours)
- Badge catégorie
- Titre FR ou EN selon langue active
- Nom instructeur + avatar
- Note ⭐ + nombre avis
- Durée totale
- Niveau (Débutant/Intermédiaire/Avancé)
- Prix en EUR
- Badge "Bestseller" si applicable
- Badge "Nouveau" si moins de 30 jours
- Bouton "Voir la formation"
- Bouton ♡ Favoris

### COMMENT ÇA MARCHE

4 étapes illustrées :
1. 🔍 Choisissez votre formation
2. 💳 Achetez en toute sécurité
3. 📚 Apprenez à votre rythme
4. 🏆 Obtenez votre certification

### TÉMOIGNAGES APPRENANTS

3 témoignages avec :
- Avatar + nom + pays
- Note ⭐⭐⭐⭐⭐
- Citation (FR et EN)
- Formation suivie

### DEVENIR INSTRUCTEUR CTA

Section invitant les experts :
FR : "Partagez votre expertise"
EN : "Share Your Expertise"
- Avantages listés
- "70% des revenus pour vous"
- Bouton "Commencer à enseigner"

### FOOTER FORMATIONS

Identique au footer principal du site.

═══════════════════════════════════════════
## PARTIE 3 — MARKETPLACE FORMATIONS
   (/explorer)
═══════════════════════════════════════════

### BARRE DE RECHERCHE

- Input grand et visible
- Placeholder FR/EN selon langue
- Recherche en temps réel (debounce 300ms)
- Suggestions automatiques
- Historique de recherche

### FILTRES (sidebar gauche)

Catégorie :
- Toutes les catégories
- Liste des catégories avec count

Niveau :
☐ Débutant / Beginner
☐ Intermédiaire / Intermediate
☐ Avancé / Advanced
☐ Tous niveaux / All Levels

Prix :
◉ Tous / All
○ Gratuit / Free
○ Payant / Paid
○ Moins de 20€ / Under €20
○ 20€ - 50€
○ Plus de 50€ / Over €50

Durée :
☐ Moins de 2h / Under 2h
☐ 2h - 5h
☐ 5h - 10h
☐ Plus de 10h / Over 10h

Note :
☐ 4.5⭐ et plus
☐ 4.0⭐ et plus
☐ 3.5⭐ et plus

Langue :
☐ Français
☐ English

Bouton "Appliquer" + "Réinitialiser"

### TRI

- Pertinence / Relevance
- Les plus populaires / Most Popular
- Les mieux notés / Highest Rated
- Les plus récents / Newest
- Prix croissant / Price: Low to High
- Prix décroissant / Price: High to Low

### GRILLE FORMATIONS

Desktop : 3 colonnes
Tablet : 2 colonnes
Mobile : 1 colonne
Infinite scroll ou pagination

### RÉSULTATS

"X formations trouvées" / 
"X courses found"

═══════════════════════════════════════════
## PARTIE 4 — PAGE DÉTAIL FORMATION
   (/[slug])
═══════════════════════════════════════════

### EN-TÊTE (fond coloré)
- Breadcrumb : Formations > Catégorie > Titre
- Titre complet FR/EN
- Description courte
- Note ⭐ + reviews + étudiants inscrits
- Dernière mise à jour
- Langue(s) disponible(s)
- Niveau
- Durée totale

### LAYOUT 2 COLONNES

Gauche (65%) :

Onglets :
[Aperçu] [Programme] [Instructeur] [Avis]

APERÇU :
- Vidéo de prévisualisation (lecture auto)
- "Ce que vous apprendrez" :
  Liste des compétences acquises (✅)
- Prérequis
- À qui s'adresse cette formation
- Description longue complète

PROGRAMME :
- X sections · X leçons · X heures
- Accordion par section :
  Section 1 : Introduction (2h)
  ✓ Leçon 1 : Bienvenue (5 min) 🔓 Gratuite
  ○ Leçon 2 : Concepts (25 min) 🔒
  ○ Quiz Section 1 (15 min) 🔒
  
  Section 2 : Avancé (3h)
  ○ Leçon 1 : ... (30 min) 🔒

INSTRUCTEUR :
- Photo + nom
- Note instructeur ⭐
- Nombre formations
- Nombre étudiants total
- Bio complète FR/EN
- Bouton "Voir le profil"

AVIS :
- Note globale (grand chiffre)
- Répartition par étoiles
- Liste des avis paginée
- Avatar + nom + date + note + commentaire

Droite (35%) STICKY :

Card achat :
- Vidéo ou thumbnail
- Prix EUR (grand)
- Prix barré si promo
- Badge "Promo -X%" si applicable
- Chrono si offre limitée
- Bouton "Acheter maintenant" (grand)
- Bouton "Ajouter au panier"
- Bouton ♡ Favoris
- "Satisfait ou remboursé 30 jours"

Ce qui est inclus :
- ⏱️ X heures de contenu
- 📱 Accès mobile et desktop
- 📥 X ressources téléchargeables
- 🏆 Certificat d'accomplissement
- ♾️ Accès à vie

Code promo :
- Input + Appliquer

Partager :
- Lien de partage
- Réseaux sociaux

═══════════════════════════════════════════
## PARTIE 5 — LECTEUR DE FORMATION
   (/apprendre/[id])
═══════════════════════════════════════════

Accessible uniquement après achat.
Layout plein écran sans footer.

### HEADER LECTEUR

- Logo FreelanceHigh (retour /formations)
- Titre de la formation
- Barre de progression globale (%)
- Bouton "Notes"
- Bouton "Questions"
- Bouton "Certifier" (si 100%)

### ZONE PRINCIPALE (gauche 75%)

LECTEUR VIDÉO :
- Lecteur custom HTML5
- Contrôles : Play/Pause/Volume/
  Plein écran/Vitesse/Sous-titres
- Vitesses : 0.5x / 0.75x / 1x / 
  1.25x / 1.5x / 1.75x / 2x
- Reprend là où on s'est arrêté
- Marquer comme complété automatiquement
  à 90% de visionnage

LECTEUR PDF :
- Visionneuse PDF intégrée
- Zoom in/out
- Navigation pages
- Téléchargement autorisé si instructeur l'a permis

CONTENU TEXTE :
- Rendu HTML du contenu rich text
- Table des matières cliquable

AUDIO :
- Lecteur audio avec forme d'onde
- Vitesse de lecture
- Téléchargement si autorisé

SOUS LE LECTEUR :
- Titre de la leçon en cours
- Description de la leçon
- Ressources téléchargeables :
  📎 Fichier1.pdf · Fichier2.zip
- Bouton "Marquer comme complétée" ✓
- Bouton "Poser une question"
- Section commentaires/questions :
  → Questions des apprenants
  → Réponses de l'instructeur
  → Upvote les questions
  → Rechercher dans les questions

### NOTES PERSONNELLES

Panel latéral :
- Éditeur de notes simple
- Liées au timestamp de la vidéo
- Sauvegarde automatique
- Export PDF des notes
- Recherche dans les notes

### SIDEBAR CURRICULUM (droite 25%)

Scroll indépendant :
Section 1 : Titre (2h 30min)
✅ Leçon 1 : Bienvenue (5 min)
✅ Leçon 2 : Concepts (25 min)
▶ Leçon 3 : Pratique (30 min) ← EN COURS
○ Quiz Section 1 (15 min)

Section 2 : Titre (3h)
○ Leçon 1 : ... (20 min)
○ Leçon 2 : ... (45 min)

Indicateurs :
✅ Vert = complétée
▶ Bleu = en cours
○ Gris = pas encore faite
📝 Icône quiz
🔒 Icône verrouillée (jamais pour formation achetée)

### QUIZ INTERACTIF
(/apprendre/[id]/quiz/[quizId])

Interface quiz :
- Titre du quiz
- Timer si configuré
- Question X sur Y
- Types :
  → Choix unique (radio)
  → Choix multiple (checkbox)
  → Vrai/Faux
  → Texte libre
- Barre de progression
- Bouton "Question suivante"
- Pas de retour en arrière possible
- Résultat immédiat à la fin :
  → Score obtenu : X/100
  → Score minimum : 80/100
  → ✅ Réussi ou ❌ À refaire
  → Corrections détaillées
  → Bouton "Réessayer" si échoué
  → Bouton "Continuer" si réussi

═══════════════════════════════════════════
## PARTIE 6 — DASHBOARD APPRENANT
   (/mes-formations)
═══════════════════════════════════════════

### STATISTIQUES PERSONNELLES

- Formations en cours
- Formations complétées
- Certifications obtenues
- Heures d'apprentissage total
- Streak (jours consécutifs)

### MES FORMATIONS

Onglets :
[En cours] [Complétées] [Toutes] [Favoris]

Chaque formation :
- Thumbnail
- Titre
- Nom instructeur
- Barre progression (%)
- Dernière leçon vue
- Bouton "Continuer" → lecteur
- Bouton "Certificat" si complété
- Bouton "Laisser un avis"

### CERTIFICATIONS

Section dédiée :
- Liste de toutes les certifications
- Vignette du certificat
- Bouton "Télécharger PDF"
- Bouton "Partager LinkedIn"
- Bouton "Voir la vérification"

═══════════════════════════════════════════
## PARTIE 7 — CERTIFICATIONS
═══════════════════════════════════════════

### GÉNÉRATION AUTOMATIQUE

Déclenchée quand :
✅ 100% des leçons complétées
✅ Tous les quiz de section réussis
✅ Quiz final réussi (score ≥ 80%)

Actions automatiques :
1. Génération certificat en DB
2. Code unique : FH-2026-XXXXXX
3. PDF généré avec @react-pdf/renderer
4. Email envoyé à l'apprenant (Resend) :
   FR : "Félicitations ! Votre certificat est prêt"
   EN : "Congratulations! Your certificate is ready"
5. Notification in-app

### DESIGN DU CERTIFICAT PDF

┌─────────────────────────────────────────┐
│  [Logo FreelanceHigh]                   │
│                                         │
│      CERTIFICAT D'ACCOMPLISSEMENT       │
│      CERTIFICATE OF COMPLETION          │
│                                         │
│  Délivré à / Issued to:                 │
│  [NOM COMPLET EN GRAND]                 │
│                                         │
│  Pour avoir complété avec succès /      │
│  For successfully completing:           │
│  [TITRE DE LA FORMATION]                │
│                                         │
│  Instructeur / Instructor:              │
│  [Nom instructeur]                      │
│                                         │
│  Score obtenu / Score: [X]%             │
│  Durée / Duration: [X] heures           │
│  Date: [JJ/MM/AAAA]                     │
│                                         │
│  N° [FH-2026-XXXXXX]                   │
│  [QR CODE]                              │
│                                         │
│  [Signature Lissanon Gildas]            │
│  Fondateur, FreelanceHigh               │
└─────────────────────────────────────────┘

### PAGE VÉRIFICATION PUBLIQUE
(/verification/[code])

Accessible par tous sans connexion :
- Logo FreelanceHigh
- ✅ "Ce certificat est authentique"
- Nom de l'apprenant
- Formation complétée
- Date d'obtention
- Score obtenu
- Nom de l'instructeur
- Lien vers la formation

═══════════════════════════════════════════
## PARTIE 8 — ESPACE INSTRUCTEUR
═══════════════════════════════════════════

### DEVENIR INSTRUCTEUR
(/devenir-instructeur)

Landing page instructeur :
FR/EN bilingue
- Hero : "Partagez votre expertise"
- Chiffres : "70% des revenus"
- Avantages listés
- Témoignages instructeurs
- Process en 3 étapes :
  1. Postulez en 5 minutes
  2. Attendez l'approbation (48h)
  3. Créez et gagnez
- Formulaire candidature :
  → Prénom + Nom
  → Email
  → Domaines expertise (multi-select)
  → Bio professionnelle (FR + EN)
  → Lien portfolio/LinkedIn/YouTube
  → Années d'expérience
  → Motivations
  → Bouton "Soumettre ma candidature"

Après soumission :
- Email confirmation automatique
- Admin voit dans /admin/formations/instructeurs
- Admin approuve → email accès instructeur
- Admin refuse → email avec raison

### DASHBOARD INSTRUCTEUR
(/instructeur/dashboard)

Données 100% réelles depuis DB :

Cartes stats :
- CA ce mois (EUR)
- Total apprenants
- Formations actives
- Note moyenne

Graphiques recharts :
- Revenus par mois (bar chart)
- Nouveaux apprenants (line chart)
- Formations par performance (bar)
- Sources de trafic (donut)
Tous avec filtres : 7j/30j/3m/6m/1an

Top formations :
- Classement par revenus
- Avec stats individuelles

Activité récente :
- Nouveaux inscrits
- Avis reçus
- Messages reçus

### CRÉER UNE FORMATION — 5 ÉTAPES
(/instructeur/creer)

Layout sidebar gauche (étapes) + 
contenu droite.

ÉTAPE 1 — INFORMATIONS DE BASE :

Langue :
- Sélectionner langue principale
- Cocher langues disponibles

Titre :
- Titre FR (max 80 caractères)
- Titre EN (max 80 caractères)
- Compteur en temps réel
- Suggestions IA basées sur la catégorie

Description courte :
- FR (max 200 caractères)
- EN (max 200 caractères)

Description longue :
- Éditeur rich text FR
- Éditeur rich text EN
- Mots illimités
- Tableaux, couleurs, listes, images

Catégorie + sous-catégorie :
- Dropdown catégorie
- Dropdown sous-catégorie

Niveau :
◉ Débutant / Beginner
○ Intermédiaire / Intermediate
○ Avancé / Advanced
○ Tous niveaux / All Levels

Durée estimée : [X] heures

ÉTAPE 2 — MÉDIAS ET DÉTAILS :

Image de couverture :
- Zone drag & drop
- Dimensions : 1280 × 720px
- Max 5MB · JPEG/PNG/WebP
- Prévisualisation immédiate
- Crop automatique si besoin

Vidéo de prévisualisation :
- URL YouTube ou Vimeo
- OU upload direct (max 500MB)
- Lecteur prévisualisation intégré

Ce que vous apprendrez :
(min 4 points, max 8)
- Input dynamique
- Bouton "+ Ajouter un point"
- FR + EN pour chaque point

Prérequis :
- Input dynamique
- Bouton "+ Ajouter un prérequis"
- FR + EN pour chaque prérequis

À qui s'adresse cette formation :
- Textarea FR
- Textarea EN

ÉTAPE 3 — PRIX ET CERTIFICAT :

Prix :
- Input EUR (min 5€, max 500€)
- Prix original (pour afficher promo)
- Toggle "Formation gratuite"

Certificat :
- Toggle "Certificat disponible"
Si activé :
→ Score minimum pour valider : [80]%
→ Complétion requise : 100%
→ Quiz final obligatoire : Oui/Non

Politique de remboursement :
- 30 jours satisfait ou remboursé
- Affiché automatiquement

ÉTAPE 4 — CURRICULUM :

Builder de contenu drag & drop :

Ajouter une section :
→ Titre FR + EN
→ Description optionnelle

Dans chaque section, ajouter une leçon :

Type VIDÉO :
- Titre FR + EN
- Upload vidéo (MP4/WebM max 2GB)
  OU URL YouTube/Vimeo
- Description FR + EN
- Durée (auto-détectée si upload)
- Toggle "Leçon gratuite (aperçu)"
- Upload ressources (PDF, ZIP, etc.)

Type PDF :
- Titre FR + EN
- Upload PDF (max 100MB)
- Description FR + EN
- Toggle téléchargement autorisé
- Toggle "Leçon gratuite"

Type TEXTE :
- Titre FR + EN
- Éditeur rich text FR
- Éditeur rich text EN
- Images dans le texte

Type AUDIO :
- Titre FR + EN
- Upload MP3/WAV (max 200MB)
- Description FR + EN
- Toggle téléchargement

Type QUIZ :
- Titre FR + EN
- Score de passage : [80]%
- Timer optionnel (minutes)
- Ajouter questions :
  → Choix unique :
    Question FR + EN
    4 options FR + EN
    1 bonne réponse
    Explication FR + EN
  → Choix multiple :
    Question FR + EN
    Options FR + EN
    Plusieurs bonnes réponses
  → Vrai/Faux :
    Affirmation FR + EN
    Réponse : Vrai / Faux
  → Texte libre :
    Question FR + EN
    Réponse attendue

Drag & drop :
- Réorganiser les sections
- Réorganiser les leçons
- Déplacer leçon d'une section à l'autre

ÉTAPE 5 — PUBLICATION :

Récapitulatif complet :
- Toutes les infos renseignées
- Checklist validation :
  ✅ Titre FR + EN
  ✅ Description complète
  ✅ Image de couverture
  ✅ Au moins 3 sections
  ✅ Au moins 5 leçons
  ✅ Prix défini
  ✅ Certificat configuré

Prévisualisation :
- Bouton "Voir la page formation"
- Comme un visiteur la verrait

Options publication :
- "Sauvegarder en brouillon"
- "Soumettre pour modération"
- "Planifier : [Date/Heure]"

Après soumission :
- Email instructeur (Resend)
- Notification in-app
- Visible dans admin pour modération

### GESTION DES FORMATIONS

Liste avec :
- Thumbnail + titre
- Statut : Brouillon/En attente/Actif/Archivé
- Apprenants inscrits
- Note moyenne
- Revenus générés
- Dernière mise à jour

Actions :
✏️ Modifier → formulaire pré-rempli
👁️ Voir → page publique
📊 Statistiques → analytics détaillés
📋 Dupliquer → copie en brouillon
📦 Archiver → retire du marketplace
🗑️ Supprimer → confirmation obligatoire

### GESTION DES APPRENANTS

Liste complète :
- Avatar + nom + email + pays
- Formation(s) achetée(s)
- Progression en %
- Date d'inscription
- Montant payé

Actions :
- Envoyer un message
- Voir sa progression détaillée
- Exporter la liste CSV

### REVENUS ET FINANCES

Données réelles DB :

Tableau de bord :
- CA total (depuis le début)
- CA ce mois
- CA en attente (30j remboursement)
- Commission FreelanceHigh (30%)
- Net à recevoir (70%)

Graphique revenus :
- 12 derniers mois (recharts)
- Par formation
- Filtres période

Demander un retrait :
- Montant disponible
- Méthodes : Virement IBAN / PayPal /
  Wave / Orange Money / MTN
- Minimum : 20€
- Email confirmation (Resend)

Historique transactions :
- Chaque achat d'apprenant
- Montant brut / commission / net
- Statut : Disponible / En attente / Retiré
- Export CSV + PDF

### AVIS REÇUS

- Note globale calculée DB
- Répartition étoiles
- Tous les avis avec possibilité de répondre
- Filtre par formation
- Filtre par note

### STATISTIQUES AVANCÉES

Graphiques recharts tous interactifs :
- Revenus par mois
- Nouveaux apprenants par semaine
- Taux de complétion par formation
- Score moyen aux quiz
- Vues des formations (entonnoir)
- Sources de trafic
- Taux conversion vue → achat
- Apprenants par pays (carte)

Export : CSV par graphique + rapport PDF

═══════════════════════════════════════════
## PARTIE 9 — PANIER ET PAIEMENT
═══════════════════════════════════════════

### PANIER (/panier)

Ajouter au panier depuis :
- Page détail formation
- Marketplace
- Dashboard apprenant (recommandations)

Panier affiche :
- Liste formations dans le panier
- Thumbnail + titre + instructeur
- Prix individuel
- Bouton retirer
- Code promo :
  → Input + Bouton "Appliquer"
  → Réduction affichée si valide
- Total avant/après promo
- Bouton "Passer la commande" → Stripe

### PAIEMENT STRIPE

Checkout Stripe complet :
- Carte bancaire
- PayPal
- Google Pay / Apple Pay
- Virement (si disponible)

Après paiement réussi :
1. Enrollment créé en DB
2. Email confirmation apprenant (Resend)
3. Email notification instructeur
4. Formation accessible immédiatement
5. Redirect → /formations/mes-formations

Politique remboursement :
- 30 jours satisfait ou remboursé
- Bouton dans l'espace apprenant
- Admin gère les remboursements

═══════════════════════════════════════════
## PARTIE 10 — SYSTÈME BILINGUE FR/EN
═══════════════════════════════════════════

Implémentation next-intl ou i18next :

Structure fichiers traduction :
/locales/
├── fr/
│   ├── formations.json
│   ├── apprenant.json
│   ├── instructeur.json
│   └── common.json
└── en/
    ├── formations.json
    ├── apprenant.json
    ├── instructeur.json
    └── common.json

Toutes les chaînes de texte traduite :
- Titres et descriptions de pages
- Labels de formulaires
- Messages d'erreur
- Emails automatiques
- Certificats (FR + EN sur le même PDF)
- Notifications

Switch langue :
- Bouton 🌍 FR | EN dans navbar
- Sauvegardé localStorage + DB
- URLs : /formations (FR par défaut)
         Switch → même page en EN
- Détection automatique navigateur

═══════════════════════════════════════════
## PARTIE 11 — ADMIN FORMATIONS
═══════════════════════════════════════════

Dans l'espace admin existant,
ajouter une section "Formations" :

/admin/formations/dashboard :
- Total formations actives
- Total apprenants
- CA formations ce mois
- Certifications délivrées
- Graphiques recharts

/admin/formations/liste :
- Toutes les formations
- Filtres : statut, catégorie, instructeur
- Actions : approuver / refuser / 
           archiver / supprimer

/admin/formations/instructeurs :
- Candidatures en attente
- Instructeurs actifs
- Approuver / Refuser / Suspendre
- Voir les formations de chaque instructeur

/admin/formations/apprenants :
- Tous les apprenants
- Formations achetées
- Progression

/admin/formations/finances :
- CA total formations
- Commissions perçues (30%)
- Retraits instructeurs
- Remboursements

/admin/formations/certificats :
- Tous les certificats délivrés
- Recherche par code
- Vérification authenticité
- Révoquer si fraude

/admin/formations/categories :
- Gérer les catégories
- Ajouter/modifier/supprimer
- Ordre d'affichage
- Icônes et couleurs

═══════════════════════════════════════════
## PARTIE 12 — APIs INTERNES
═══════════════════════════════════════════

Créer toutes ces routes API :

/api/formations/
├── GET    → Liste formations (marketplace)
├── POST   → Créer formation (instructeur)

/api/formations/[id]
├── GET    → Détail formation
├── PUT    → Modifier formation
├── DELETE → Supprimer formation

/api/formations/[id]/enroll
└── POST   → Inscrire apprenant (après paiement)

/api/formations/[id]/progress
├── GET    → Progression apprenant
└── PUT    → Mettre à jour progression

/api/formations/[id]/sections
└── POST   → Ajouter section

/api/formations/[id]/lessons
└── POST   → Ajouter leçon

/api/formations/[id]/quiz/submit
└── POST   → Soumettre réponses quiz

/api/formations/[id]/certificate
└── POST   → Générer certificat

/api/formations/[id]/reviews
├── GET    → Liste avis
└── POST   → Ajouter avis

/api/formations/certificats/verify/[code]
└── GET    → Vérifier certificat public

/api/instructeur/dashboard
└── GET    → Stats instructeur

/api/instructeur/revenus
└── GET    → Finances instructeur

/api/instructeur/withdraw
└── POST   → Demander retrait

/api/panier/
├── GET    → Voir panier
├── POST   → Ajouter au panier
└── DELETE → Retirer du panier

/api/paiement/formations
└── POST   → Créer session Stripe

/api/admin/formations/approve/[id]
└── POST   → Approuver formation

/api/admin/instructeurs/approve/[id]
└── POST   → Approuver instructeur

Toutes les APIs :
- Authentification JWT vérifiée
- Validation Zod des données
- Gestion erreurs complète
- Rate limiting
- Logs en DB

═══════════════════════════════════════════
## ORDRE DE TRAVAIL STRICT
═══════════════════════════════════════════

Fais EXACTEMENT dans cet ordre :

1. Schéma Prisma formations
   → Toutes les tables
   → Migration DB
   → Seed catégories

2. Lien navbar FR/EN
   → Landing page
   → Navbar connectée

3. Système bilingue
   → Installation next-intl
   → Fichiers de traduction
   → Switch langue

4. Landing page /formations
   → Bilingue complet
   → Toutes les sections

5. Marketplace /formations/explorer
   → Filtres fonctionnels
   → Grille formations
   → Recherche temps réel

6. Page détail /formations/[slug]
   → Toutes les sections
   → Achat fonctionnel

7. Panier et paiement Stripe
   → Ajout panier
   → Checkout complet
   → Enrollment après paiement

8. Lecteur /formations/apprendre/[id]
   → Vidéo player
   → PDF viewer
   → Progression sauvegardée
   → Notes personnelles
   → Quiz interactif

9. Dashboard apprenant
   → Mes formations
   → Progression
   → Certifications

10. Génération certificats PDF
    → @react-pdf/renderer
    → Email automatique
    → Page vérification publique

11. Devenir instructeur
    → Landing page
    → Formulaire candidature
    → Flow approbation admin

12. Dashboard instructeur
    → Stats réelles recharts
    → Toutes les sections

13. Créateur formation 5 étapes
    → Upload vidéos/PDF
    → Builder curriculum
    → Quiz creator
    → Publication

14. Gestion formations instructeur
    → CRUD complet
    → Analytics par formation

15. Revenus instructeur
    → Finances réelles
    → Retraits
    → Export PDF/CSV

16. Admin formations
    → Modération
    → Statistiques globales

17. APIs toutes fonctionnelles
    → Tests de chaque endpoint

18. Tests complets :

TEST 1 → Visiteur voit /formations ✅
TEST 2 → Switch FR → EN fonctionne ✅
TEST 3 → Acheter une formation → 
         accès immédiat ✅
TEST 4 → Progression leçon sauvegardée ✅
TEST 5 → Quiz réussi → certificat généré ✅
TEST 6 → PDF certificat téléchargeable ✅
TEST 7 → Email apprenant reçu ✅
TEST 8 → Instructeur crée formation → 
         visible marketplace ✅
TEST 9 → Revenus instructeur mis à jour ✅
TEST 10 → Admin approuve formation → 
          visible dans marketplace ✅
TEST 11 → Vérification certificat 
          public fonctionne ✅
TEST 12 → Retrait instructeur enregistré ✅

Si un test échoue :
→ Corriger immédiatement
→ Ne pas passer à la suite
→ Tout doit être parfait

ZÉRO prototype.
ZÉRO donnée hardcodée.
ZÉRO fonctionnalité simulée.
TOUT fonctionnel à 100%.
FR et EN sur chaque page.
Travaille 100% autonome.
````

---

