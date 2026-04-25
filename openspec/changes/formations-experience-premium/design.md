## Context

La plateforme formations FreelanceHigh est opérationnelle avec ~51 pages, 70+ API routes et 15+ modèles Prisma. Le player vidéo utilise du HTML5 natif (`<video>`, `<iframe>` YouTube/Vimeo), le wizard de création a des icônes GripVertical visuelles mais pas de drag-and-drop fonctionnel, les statistiques n'ont pas d'export, et il n'y a pas de système de discussion par cours.

Bibliothèques déjà installées : @dnd-kit/core + sortable + utilities (non utilisé), jsPDF (utilisé pour factures), pdf-lib, recharts, Tiptap v3, react-dropzone. Manquant : papaparse (CSV).

## Goals / Non-Goals

**Goals :**
- Implémenter 7 améliorations d'expérience utilisateur 100% fonctionnelles
- Toutes les fonctionnalités communiquent via APIs réelles (pas de mock/hardcode)
- Toutes les données persistées en base via Prisma
- i18n FR/EN complet pour chaque fonctionnalité
- TypeScript strict sans erreur de compilation

**Non-Goals :**
- Pas de liens de paiement ni d'API de paiement dans ce change
- Pas de streaming HLS ni de transcodage vidéo côté serveur
- Pas de WebSocket pour les discussions (polling via fetch classique)
- Pas de modération admin des discussions (l'instructeur modère)
- Pas d'OCR/extraction automatique de sous-titres

## Decisions

### D1 — Drag-and-drop : @dnd-kit/sortable
**Choix :** @dnd-kit/sortable (déjà installé v10)
**Raison :** Déjà dans les dépendances, API moderne avec hooks React, support SortableContext + DndContext, performance sur les longues listes. Alternative react-beautiful-dnd est en maintenance.
**Approche :**
- Sortable pour les sections (vertical list)
- Sortable pour les leçons à l'intérieur de chaque section (vertical list dans chaque section)
- API dédiée `PATCH /api/instructeur/formations/[id]/reorder` qui reçoit `{ sections: [{ id, order, lessons: [{ id, order }] }] }` et fait un batch update
- Pas de cross-section drag (trop complexe pour le moment) : les leçons restent dans leur section

### D2 — Export PDF : jsPDF
**Choix :** jsPDF v2.5.2 (déjà installé)
**Raison :** Déjà utilisé pour les factures dans `lib/pdf/invoice-template.ts`. Même pattern réutilisable.
**Approche :**
- Créer `lib/pdf/progress-report-template.ts` (modèle progress report)
- API `GET /api/instructeur/formations/[id]/export/progress-pdf` retourne le PDF avec les stats de tous les étudiants
- API `GET /api/apprenant/enrollments/[id]/export/progress-pdf` retourne le PDF de progression personnelle
- Boutons d'export dans les pages stats instructeur et mes-formations apprenant

### D3 — Chapitres vidéo : champ Json sur Lesson
**Choix :** Stocker les chapitres dans un champ `chapters Json?` sur le modèle Lesson
**Raison :** Pas besoin d'un modèle séparé — les chapitres sont intrinsèquement liés à une leçon vidéo. Format : `[{ title: string, timestamp: number }]` (timestamp en secondes).
**Approche :**
- Ajouter le champ dans le schema Prisma
- UI dans le wizard : section "Chapitres" visible quand le type est VIDEO
- Dans le player : sidebar chapitres sous le curriculum, clic = `videoRef.current.currentTime = timestamp`
- Pour YouTube/Vimeo : non supporté (les chapitres natifs YouTube suffisent)

### D4 — Discussions : 2 nouveaux modèles Prisma
**Choix :** Modèles `CourseDiscussion` + `CourseDiscussionReply` dans Prisma
**Raison :** Structure simple thread → réponses, suffisante pour un forum de cours. Pas besoin de nested threads (complexité inutile).
**Approche :**
- `CourseDiscussion` : id, formationId, userId, title, content, isPinned, isResolved, createdAt
- `CourseDiscussionReply` : id, discussionId, userId, content, isInstructorReply, createdAt
- API CRUD : GET/POST discussions, GET/POST replies, PATCH (pin/resolve), DELETE
- Nouvelle page/tab dans le player : onglet "Discussions" à côté du curriculum et des notes
- L'instructeur peut épingler et marquer comme résolu
- Pagination par 20 discussions, réponses chargées au clic

### D5 — Sous-titres : champs sur Lesson + upload Supabase Storage
**Choix :** Champs `subtitleUrl`, `subtitleStoragePath`, `subtitleLabel` sur Lesson
**Raison :** Un seul fichier de sous-titres par leçon suffit pour le MVP. Format VTT (standard W3C).
**Approche :**
- Upload du fichier .vtt/.srt via l'API existante d'upload vers Supabase Storage
- Conversion SRT → VTT côté client (simple regex) car `<track>` ne supporte que VTT
- Rendu via `<track kind="subtitles" src={subtitleUrl} label={subtitleLabel} />` sur le `<video>`
- Toggle CC on/off dans les contrôles custom du player
- Non applicable aux iframes YouTube/Vimeo (ils ont leurs propres sous-titres)

### D6 — Import CSV : papaparse
**Choix :** papaparse (à installer)
**Raison :** Bibliothèque standard pour le parsing CSV en JS, 0 dépendances, 50KB gzip.
**Approche :**
- Installer `papaparse` + `@types/papaparse`
- API `POST /api/instructeur/formations/[id]/import-csv` : parse côté serveur, crée sections + leçons
- Format CSV : `sectionTitle,lessonTitle,lessonType,duration,videoUrl,pdfUrl,audioUrl,isFree`
- Si sectionTitle change → nouvelle section, sinon ajout à la section courante
- Validation stricte : lessonType doit être VIDEO/PDF/TEXTE/AUDIO, duration doit être un nombre
- UI : bouton "Importer CSV" dans le wizard, modal avec zone de drop + aperçu des données parsées + bouton confirmer

### D7 — Vitesse de lecture : contrôles custom HTML5
**Choix :** Contrôles custom superposés au `<video>` natif
**Raison :** `HTMLVideoElement.playbackRate` est supporté par tous les navigateurs. Pas besoin de librairie.
**Approche :**
- Wrapper custom autour du `<video>` avec contrôles overlay : play/pause, timeline, volume, vitesse, sous-titres, fullscreen
- Vitesses disponibles : 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x
- Préférence sauvegardée en `localStorage` (clé `fh-video-speed`)
- Non applicable aux iframes YouTube/Vimeo (pas d'accès au DOM)

## Risks / Trade-offs

- **Cross-section drag-and-drop non supporté** → Les leçons ne peuvent pas être déplacées entre sections. Mitigation : l'instructeur peut supprimer et recréer la leçon dans l'autre section. Acceptable pour le MVP.
- **Sous-titres uniquement pour vidéos natives** → Les embeds YouTube/Vimeo ne supportent pas `<track>`. Mitigation : ces plateformes ont leurs propres systèmes de sous-titres.
- **Vitesse uniquement pour vidéos natives** → Même limitation que les sous-titres. Mitigation : YouTube a sa propre vitesse intégrée.
- **Forum sans notifications temps réel** → Les réponses ne notifient pas en push. Mitigation : l'utilisateur voit les nouvelles discussions au rechargement de la page. Suffisant pour un forum de cours.
- **Import CSV sans gestion de conflits** → Si des sections/leçons existent déjà, le CSV ajoute des nouvelles sans dédupliquer. Mitigation : l'import est conçu pour la création initiale d'un curriculum, pas pour la mise à jour.
- **Un seul fichier de sous-titres par leçon** → Pas de multi-langue pour les sous-titres. Acceptable pour le MVP, extensible en ajoutant un modèle `LessonSubtitle` plus tard.

## Migration Plan

1. Modifier le schema Prisma (ajout champs + nouveaux modèles)
2. Exécuter `prisma migrate dev`
3. Installer papaparse
4. Implémenter les APIs
5. Implémenter les composants frontend
6. Ajouter les clés i18n
7. Vérifier TypeScript `npx tsc --noEmit`

Rollback : les nouveaux champs sont nullable, les nouveaux modèles n'impactent pas les existants. Aucune migration destructive.
