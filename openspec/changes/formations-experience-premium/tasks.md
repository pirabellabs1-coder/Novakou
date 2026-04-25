## 1. Schéma Prisma & Dépendances

- [ ] 1.1 Ajouter les champs `chapters Json?`, `subtitleUrl String?`, `subtitleStoragePath String?`, `subtitleLabel String?` sur le modèle `Lesson` dans `packages/db/prisma/schema.prisma`
- [ ] 1.2 Ajouter le modèle `CourseDiscussion` (id, formationId, userId, title, content @db.Text, isPinned Boolean @default(false), isResolved Boolean @default(false), replyCount Int @default(0), createdAt, updatedAt) avec relations Formation et User, index sur [formationId, createdAt]
- [ ] 1.3 Ajouter le modèle `CourseDiscussionReply` (id, discussionId, userId, content @db.Text, isInstructorReply Boolean @default(false), createdAt) avec relations CourseDiscussion et User, index sur [discussionId, createdAt]
- [ ] 1.4 Exécuter `prisma migrate dev` et régénérer le client Prisma
- [ ] 1.5 Installer `papaparse` et `@types/papaparse` via pnpm

## 2. Drag-and-Drop Réorganisation (Sections & Leçons)

- [ ] 2.1 Créer `PATCH /api/instructeur/formations/[id]/reorder` — reçoit `{ sections: [{ id, order, lessons: [{ id, order }] }] }`, met à jour les champs `order` en transaction atomique, vérifie que l'utilisateur est propriétaire de la formation
- [ ] 2.2 Modifier le wizard de création (`app/formations/(instructeur)/instructeur/creer/page.tsx`) étape Curriculum — intégrer `@dnd-kit/sortable` pour les sections : DndContext + SortableContext + SortableItem wrapper, appel API reorder au onDragEnd
- [ ] 2.3 Intégrer `@dnd-kit/sortable` pour les leçons à l'intérieur de chaque section — chaque section a son propre SortableContext vertical, les leçons sont réordonnées dans leur section uniquement
- [ ] 2.4 Ajouter les icônes de drag handle (GripVertical déjà présentes) comme déclencheurs du drag via `useSortable` listeners, styling visuel pendant le drag (opacity, shadow, border)

## 3. Player Vidéo Custom (Vitesse + Sous-titres + Chapitres)

- [ ] 3.1 Créer le composant `VideoPlayer` (`components/formations/VideoPlayer.tsx`) — wrapper autour de `<video>` avec contrôles custom en overlay : play/pause, barre de progression cliquable, volume slider, bouton vitesse, bouton CC (si sous-titres), bouton plein écran. Auto-hide des contrôles après 3s d'inactivité souris.
- [ ] 3.2 Implémenter le sélecteur de vitesse dans `VideoPlayer` — popup avec options 0.5x/0.75x/1x/1.25x/1.5x/1.75x/2x, changement via `videoRef.current.playbackRate`, persistance en localStorage clé `fh-video-speed`, restauration au chargement
- [ ] 3.3 Implémenter le support sous-titres dans `VideoPlayer` — rendu via `<track kind="subtitles" src={subtitleUrl} label={subtitleLabel} default>`, toggle CC on/off via `track.mode = "showing"/"hidden"`, bouton CC visible uniquement si subtitleUrl existe
- [ ] 3.4 Implémenter l'affichage des chapitres dans `VideoPlayer` — liste de chapitres sous la vidéo (titre + timestamp formaté mm:ss), clic = `videoRef.current.currentTime = timestamp`, chapitre actif mis en surbrillance basé sur currentTime, marqueurs visuels sur la barre de progression
- [ ] 3.5 Intégrer `VideoPlayer` dans le player de cours (`app/formations/(apprenant)/apprendre/[id]/page.tsx`) — remplacer le `<video>` natif par `<VideoPlayer>`, passer les props : src, subtitleUrl, subtitleLabel, chapters, onProgress, onEnded. Conserver le comportement existant pour YouTube/Vimeo (iframe inchangé).

## 4. Sous-titres — Upload & API

- [ ] 4.1 Ajouter le champ upload sous-titres dans le wizard de création (étape Curriculum, par leçon VIDEO) — input fichier acceptant .vtt/.srt, upload vers Supabase Storage bucket `lesson-subtitles`, conversion SRT→VTT côté client avant upload (regex : virgules→points dans timestamps, ajout en-tête WEBVTT)
- [ ] 4.2 Modifier l'API `POST /api/instructeur/formations` et `PUT /api/instructeur/formations/[id]` pour sauvegarder les champs subtitleUrl, subtitleStoragePath, subtitleLabel lors de la création/modification de leçons
- [ ] 4.3 Modifier l'API `GET /api/formations/[id]/progress` pour inclure subtitleUrl, subtitleLabel et chapters dans les données de leçon retournées au player

## 5. Chapitres Vidéo — Création & API

- [ ] 5.1 Ajouter la section "Chapitres" dans le wizard de création (étape Curriculum, par leçon VIDEO) — formulaire dynamique pour ajouter/supprimer des entrées (titre + timestamp mm:ss), conversion mm:ss→secondes à la sauvegarde, visible uniquement si le type de leçon est VIDEO
- [ ] 5.2 Modifier l'API `POST /api/instructeur/formations` et `PUT /api/instructeur/formations/[id]` pour sauvegarder le champ `chapters` (Json) lors de la création/modification de leçons vidéo

## 6. Forum de Discussion par Cours

- [ ] 6.1 Créer `GET /api/formations/[id]/discussions` — liste paginée (20/page) triée par isPinned DESC + createdAt DESC, inclut user (name, avatar), replyCount. Accessible aux utilisateurs inscrits à la formation.
- [ ] 6.2 Créer `POST /api/formations/[id]/discussions` — création d'une discussion (title, content), vérifie que l'utilisateur est inscrit à la formation ou est l'instructeur
- [ ] 6.3 Créer `GET /api/formations/[id]/discussions/[discussionId]` — détail d'une discussion avec toutes les réponses (triées createdAt ASC), inclut user info et isInstructorReply
- [ ] 6.4 Créer `POST /api/formations/[id]/discussions/[discussionId]/replies` — ajout d'une réponse, détecte automatiquement isInstructorReply si l'auteur est l'instructeur, incrémente replyCount
- [ ] 6.5 Créer `PATCH /api/formations/[id]/discussions/[discussionId]` — modération instructeur : toggle isPinned, toggle isResolved. Vérifie que l'appelant est l'instructeur.
- [ ] 6.6 Créer `DELETE /api/formations/[id]/discussions/[discussionId]` — suppression par l'instructeur. Cascade delete des réponses.
- [ ] 6.7 Ajouter l'onglet "Discussions" dans le player de cours (`app/formations/(apprenant)/apprendre/[id]/page.tsx`) — panneau avec liste des discussions, formulaire nouvelle discussion, vue détail avec réponses, boutons modération (pin/résolu/supprimer) visibles uniquement pour l'instructeur
- [ ] 6.8 Créer le composant `DiscussionThread` (`components/formations/DiscussionThread.tsx`) — affichage d'un thread avec avatar, nom, date, contenu, badges (Épinglé, Résolu, Instructeur), formulaire de réponse, liste des réponses

## 7. Export PDF Rapports de Progression

- [ ] 7.1 Créer `lib/pdf/progress-report-template.ts` — template jsPDF pour le rapport de progression instructeur : en-tête FreelanceHigh brandé, titre formation, date d'export, stats globales (étudiants, taux complétion, revenu), tableau des étudiants (nom, progression %, score quiz, date inscription, statut)
- [ ] 7.2 Créer `GET /api/instructeur/formations/[id]/export/progress-pdf` — génère le PDF avec les données réelles de tous les étudiants inscrits, retourne `application/pdf`
- [ ] 7.3 Créer `lib/pdf/student-progress-template.ts` — template jsPDF pour le rapport de progression apprenant : en-tête brandé, titre formation, progression globale, tableau des leçons (titre, type, complété oui/non, score quiz), certificat obtenu, notes personnelles
- [ ] 7.4 Créer `GET /api/apprenant/enrollments/[id]/export/progress-pdf` — génère le PDF avec les données réelles de progression de l'apprenant, retourne `application/pdf`
- [ ] 7.5 Ajouter le bouton "Exporter en PDF" sur la page statistiques formation instructeur (`app/formations/(instructeur)/instructeur/[id]/statistiques/page.tsx`)
- [ ] 7.6 Ajouter le bouton "Télécharger mon rapport" sur la page mes-formations apprenant (`app/formations/(apprenant)/mes-formations/page.tsx`) — bouton par formation avec icône PDF

## 8. Import CSV en Masse

- [ ] 8.1 Créer `POST /api/instructeur/formations/[id]/import-csv` — parse le fichier CSV avec papaparse côté serveur, valide chaque ligne (lessonType dans VIDEO/PDF/TEXTE/AUDIO, duration numérique), crée les sections et leçons en transaction Prisma. Format CSV : sectionTitle, lessonTitle, lessonType, duration, videoUrl, pdfUrl, audioUrl, isFree
- [ ] 8.2 Créer `GET /api/instructeur/formations/csv-template` — retourne un fichier CSV modèle avec les en-têtes et une ligne d'exemple
- [ ] 8.3 Ajouter le bouton "Importer CSV" dans le wizard de création (étape Curriculum) — modal avec zone de drop (react-dropzone), aperçu des sections/leçons parsées en tableau, erreurs ligne par ligne en rouge, bouton Confirmer l'import, bouton Télécharger le modèle

## 9. Internationalisation (i18n)

- [ ] 9.1 Ajouter les clés i18n FR dans `messages/fr.json` pour : drag-and-drop (réorganiser, glisser, déposer), player vidéo (vitesse, sous-titres, chapitres, plein écran, contrôles), discussions (nouvelle discussion, répondre, épingler, résolu, supprimer), export PDF (exporter, télécharger rapport), import CSV (importer, modèle, aperçu, confirmer, erreurs)
- [ ] 9.2 Ajouter les clés i18n EN dans `messages/en.json` — traduction anglaise de toutes les nouvelles clés

## 10. Vérification Finale

- [ ] 10.1 Vérifier que le build TypeScript passe sans erreur (`npx tsc --noEmit`)
- [ ] 10.2 Tester le flux drag-and-drop : réordonner sections + leçons, recharger et vérifier persistance
- [ ] 10.3 Tester le player vidéo : vitesse, sous-titres, chapitres sur une vidéo native
- [ ] 10.4 Tester les discussions : créer, répondre, épingler, résoudre, supprimer
- [ ] 10.5 Tester l'export PDF : rapport instructeur + rapport apprenant
- [ ] 10.6 Tester l'import CSV : fichier valide + fichier avec erreurs
