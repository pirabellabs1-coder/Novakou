## 1. Types et schema de donnees

- [x] 1.1 Ajouter les champs `editedAt`, `deletedAt`, `fileUrl`, `fileType`, `fileSizeBytes`, `linkPreviewData` (Json?) au modele `Message` dans `schema.prisma` et generer la migration
- [x] 1.2 Mettre a jour le type `UnifiedMessage` dans `store/messaging.ts` avec les nouveaux champs : `editedAt?`, `deletedAt?`, `fileUrl?`, `fileType?`, `fileSizeBytes?`, `linkPreview?` (objet { title, description, image, domain })
- [x] 1.3 Mettre a jour le dev data-store (`lib/dev/data-store`) pour supporter les nouveaux champs dans les donnees demo

## 2. API — Edition et suppression de messages

- [x] 2.1 Creer l'endpoint `PUT /api/conversations/[id]/messages/[messageId]/route.ts` avec validation serveur (proprietaire + delai 15 min) pour l'edition de messages
- [x] 2.2 Creer l'endpoint `DELETE /api/conversations/[id]/messages/[messageId]/route.ts` avec validation serveur (proprietaire + delai 10 min) pour la suppression logique (soft delete)
- [x] 2.3 Ajouter les actions `editMessage` et `deleteMessage` au store Zustand `messaging.ts` (mise a jour optimiste cote client)
- [x] 2.4 Ajouter les methodes API `apiEditMessage` et `apiDeleteMessage` au store pour la synchronisation serveur

## 3. UI — Menu contextuel et edition inline

- [x] 3.1 Creer le composant `MessageContextMenu` avec les actions conditionnelles (Modifier, Supprimer) basees sur le proprietaire et les delais restants
- [x] 3.2 Integrer le `MessageContextMenu` dans `MessageBubble.tsx` (survol pour afficher le menu, clic pour les actions)
- [x] 3.3 Implementer le mode edition inline dans `MessageBubble.tsx` : champ de texte editable, boutons Sauvegarder/Annuler, gestion Echap
- [x] 3.4 Ajouter l'indicateur "modifie" dans `MessageBubble.tsx` a cote du timestamp quand `editedAt` est non-null
- [x] 3.5 Implementer l'affichage du message supprime : style italique, couleur attenuee, texte "Ce message a ete supprime"
- [x] 3.6 Ajouter la boite de dialogue de confirmation de suppression (AlertDialog shadcn/ui)

## 4. API — Upload de fichiers

- [x] 4.1 Renforcer l'endpoint `/api/upload/file/route.ts` avec validation de type MIME (whitelist: images, documents, videos, archives) et taille maximale (25 MB)
- [x] 4.2 Configurer le bucket Supabase Storage `message-attachments` avec politique RLS (acces uniquement aux participants de la conversation)
- [x] 4.3 Creer la logique de liaison fichier-commande : quand un fichier est uploade dans une conversation avec `orderId`, creer une entree dans les ressources de commande

## 5. UI — Partage de fichiers enrichi

- [x] 5.1 Mettre a jour `ChatPanel.tsx` : remplacer le handleFileUpload basique par un upload reel avec barre de progression (utiliser XMLHttpRequest ou fetch avec ReadableStream pour le tracking de progression)
- [x] 5.2 Implementer le drag-and-drop de fichiers dans la zone de chat avec zone de drop visuelle (overlay "Deposez vos fichiers ici")
- [x] 5.3 Ajouter l'affichage d'erreurs de validation dans le chat (taille, type non autorise) via un toast shadcn/ui
- [x] 5.4 Mettre a jour `MessageBubble.tsx` : ajouter le preview inline pour les images (thumbnail cliquable, max 300px de large)
- [x] 5.5 Ajouter un composant lightbox modale pour l'affichage des images en plein ecran
- [x] 5.6 Mettre a jour `MessageBubble.tsx` : ajouter le lecteur video inline pour les messages de type video (HTML5 video avec poster frame)
- [x] 5.7 Mettre a jour le bouton de telechargement dans `MessageBubble.tsx` pour generer des URLs signees Supabase Storage (expiration 1h)

## 6. Messages vocaux — Amelioration

- [x] 6.1 Mettre a jour `VoiceRecorder.tsx` : remplacer le `URL.createObjectURL` de demo par un upload reel vers Supabase Storage via `/api/upload/file`
- [x] 6.2 Verifier et ameliorer `VoicePlayer.tsx` : stabilite de lecture, affichage de la forme d'onde, controle de vitesse de lecture
- [x] 6.3 Ajouter un indicateur d'enregistrement en cours plus visible dans `ChatPanel.tsx` (animation pulsante, compteur de duree)

## 7. Apercu de liens

- [x] 7.1 Creer l'endpoint `/api/link-preview/route.ts` : extraction des balises OG (titre, description, image) avec timeout de 5 secondes, validation URL HTTPS
- [x] 7.2 Ajouter la detection d'URL dans le flow d'envoi de message : quand un message contient des URLs, appeler l'API link-preview apres envoi et mettre a jour le message avec les metadonnees
- [x] 7.3 Creer le composant `LinkPreview` : carte d'apercu avec image OG, titre, description, domaine — cliquable avec `target="_blank" rel="noopener noreferrer"`
- [x] 7.4 Integrer `LinkPreview` dans `MessageBubble.tsx` : affichage sous le texte du message, maximum 3 apercus par message

## 8. Appels audio et video — Verification et amelioration

- [x] 8.1 Verifier le hook `useWebRTC` et l'API `/api/signaling` : tester les flux complets (initier, accepter, refuser, raccrocher, reconnexion)
- [x] 8.2 Ameliorer les indicateurs d'etat dans `AudioCallModal.tsx` et `VideoCallModal.tsx` : sonnerie animee, etat "Connexion en cours...", minuteur d'appel
- [x] 8.3 Ameliorer `IncomingCallPopup.tsx` : animation de sonnerie, son de notification, timeout automatique a 30 secondes avec message "Appel manque"
- [x] 8.4 Verifier la stabilite de `CallControls.tsx` : mute/unmute, camera on/off, partage d'ecran

## 9. Notifications de messagerie

- [x] 9.1 Ajouter le type de notification `new_message` et `file_shared` dans le systeme de notifications existant (`/api/notifications`)
- [x] 9.2 Declencher les notifications in-app lors de la reception de messages (cote API dans POST `/api/conversations/[id]/messages`)
- [x] 9.3 Ajouter le badge de compteur de messages non lus dans le composant de navigation (navbar) pour tous les roles
- [x] 9.4 Creer le template email React Email `MessageNotification` pour les notifications de messages non lus
- [x] 9.5 Implementer la logique d'envoi email differe (5 min de delai) dans l'API d'envoi de message : utiliser un setTimeout simple au MVP ou un cron check

## 10. Indicateurs de lecture

- [x] 10.1 Mettre a jour l'API `POST /api/conversations/[id]/read` pour retourner la liste des `readBy` mise a jour
- [x] 10.2 Mettre a jour `MessageBubble.tsx` : afficher l'icone "envoye" (une coche) par defaut, "lu" (deux coches bleues) quand `readBy` contient d'autres participants

## 11. Integration et tests

- [x] 11.1 Verifier que la messagerie fonctionne dans les 4 espaces (dashboard, client, agence, admin) avec les nouvelles fonctionnalites
- [x] 11.2 Tester le responsive design de la messagerie (mobile 375px, tablette 768px, desktop 1280px) avec playwright-skill
- [x] 11.3 Verifier les cas limites : message vide, upload annule, edition apres delai, suppression apres delai, lien invalide
- [x] 11.4 Verifier l'accessibilite : navigation clavier dans le menu contextuel, labels ARIA sur les boutons, contraste des indicateurs
