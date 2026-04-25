## Why

La plateforme formations FreelanceHigh est fonctionnelle à 95% mais il manque 7 améliorations d'expérience utilisateur qui font la différence entre une plateforme basique et une plateforme premium surpassant Udemy/Coursera. Ces fonctionnalités impactent directement la rétention des apprenants, la productivité des instructeurs et la qualité pédagogique. Version cible : MVP (immédiat).

## What Changes

- **Drag-and-drop réorganisation des leçons et sections** : les instructeurs pourront réordonner visuellement les sections et les leçons dans le wizard de création via @dnd-kit (déjà installé mais non utilisé). API de réordonnancement dédiée.
- **Export PDF des rapports de progression** : les instructeurs exportent les statistiques de progression de leurs étudiants en PDF, les apprenants exportent leur propre rapport de progression. Utilise jsPDF (déjà installé).
- **Chapitres/timestamps dans les vidéos** : les instructeurs définissent des marqueurs de chapitres dans les vidéos, les apprenants naviguent par chapitre dans le player.
- **Forum de discussion par cours** : système de discussions threaded par formation — les apprenants posent des questions, les instructeurs et autres apprenants répondent. Modération par l'instructeur.
- **Support sous-titres/captions** : upload de fichiers .vtt/.srt par leçon vidéo, rendu via `<track>` HTML5, toggle on/off dans le player.
- **Import CSV en masse de leçons** : les instructeurs importent un curriculum complet via fichier CSV (sections + leçons d'un coup). Installation de papaparse.
- **Contrôle de vitesse de lecture vidéo** : sélecteur de vitesse (0.5x à 2x) dans le player vidéo pour les vidéos natives, préférence sauvegardée en localStorage.

Impact sur le schéma Prisma :
- Nouveaux champs sur `Lesson` : `subtitleUrl`, `subtitleStoragePath`, `subtitleLabel`, `chapters` (Json)
- Nouveaux modèles : `CourseDiscussion`, `CourseDiscussionReply`

Aucun job BullMQ ni handler Socket.io requis. Pas de templates email supplémentaires.

## Capabilities

### New Capabilities
- `drag-drop-reorder`: Réorganisation drag-and-drop des sections et leçons dans le wizard instructeur + API de réordonnancement
- `progress-pdf-export`: Export PDF des rapports de progression pour instructeurs et apprenants via jsPDF
- `video-chapters`: Système de chapitres/timestamps dans les vidéos avec navigation dans le player
- `course-discussions`: Forum de discussion par formation avec threads, réponses et modération instructeur
- `video-subtitles`: Upload et affichage de sous-titres .vtt/.srt dans le player vidéo
- `csv-lesson-import`: Import CSV en masse du curriculum (sections + leçons) pour les instructeurs
- `video-speed-control`: Contrôle de vitesse de lecture vidéo (0.5x-2x) avec préférence persistée

### Modified Capabilities

## Impact

- **Schéma Prisma** : 2 nouveaux modèles (CourseDiscussion, CourseDiscussionReply), 4 nouveaux champs sur Lesson
- **APIs** : ~10 nouveaux endpoints (reorder, export PDF, discussions CRUD, import CSV)
- **Frontend** : modification du player vidéo, du wizard de création, des pages statistiques + nouvelle page discussions
- **Dépendances** : installation de `papaparse` + `@types/papaparse` (CSV parsing)
- **i18n** : nouvelles clés FR/EN pour toutes les fonctionnalités
- **Impact sur les rôles** : Instructeur (wizard, stats export, discussions), Apprenant (player, discussions, export), Admin (aucun impact direct)
