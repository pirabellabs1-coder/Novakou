## Purpose

Interface chat moderne et stable pour FreelanceHigh, inspirée de WhatsApp. Couvre le header de conversation, les bulles de messages, l'input fixe, la suppression des IDs techniques, les indicateurs de statut de livraison, et la responsivité mobile.

## ADDED Requirements

### Requirement: Conversation header displays user info
Le header de chaque conversation SHALL afficher l'avatar, le nom complet de l'interlocuteur (ou le titre du groupe), et son statut en ligne.

#### Scenario: Direct conversation header
- **WHEN** l'utilisateur ouvre une conversation directe avec "Marie Dupont"
- **THEN** le header affiche l'avatar de Marie, son nom "Marie Dupont", son rôle (ex: "Freelance"), et un indicateur vert si elle est en ligne

#### Scenario: Order conversation header
- **WHEN** l'utilisateur ouvre une conversation liée à une commande
- **THEN** le header affiche le nom de l'interlocuteur et la référence "Commande #XXX" (où XXX est le numéro lisible de la commande, pas le CUID)

#### Scenario: No technical IDs displayed
- **WHEN** le header est affiché pour n'importe quelle conversation
- **THEN** aucun ID technique (CUID comme `cmn3oijdi0002...`) n'est visible — uniquement des noms, rôles, et références lisibles

### Requirement: Message bubbles with correct alignment
Les messages SHALL être affichés en bulles avec alignement gauche (messages reçus) et droite (messages envoyés), avec un max-width de 70%.

#### Scenario: Own message aligned right
- **WHEN** l'utilisateur voit un message qu'il a envoyé
- **THEN** la bulle est alignée à droite, avec une couleur de fond distincte (ex: violet/bleu), et contient le texte + horodatage + icône de statut de livraison

#### Scenario: Received message aligned left
- **WHEN** l'utilisateur voit un message reçu d'un autre participant
- **THEN** la bulle est alignée à gauche, avec une couleur de fond neutre (ex: gris clair), et contient le nom de l'expéditeur (si groupe) + texte + horodatage

#### Scenario: Max width 70%
- **WHEN** un message contient un texte long
- **THEN** la bulle ne dépasse jamais 70% de la largeur du conteneur chat

### Requirement: Input always visible and fixed at bottom
Le champ de saisie de message SHALL être fixé en bas de la zone de chat et toujours visible, quel que soit le scroll.

#### Scenario: Input visible on page load
- **WHEN** l'utilisateur ouvre une conversation
- **THEN** le champ de saisie est immédiatement visible en bas de l'écran, avec le placeholder "Écrire un message..." et un bouton Envoyer

#### Scenario: Input stays fixed during scroll
- **WHEN** l'utilisateur scrolle vers le haut dans l'historique des messages
- **THEN** le champ de saisie reste fixé en bas de l'écran et ne disparaît pas

#### Scenario: Send with Enter key
- **WHEN** l'utilisateur appuie sur Entrée dans le champ de saisie (et le champ n'est pas vide)
- **THEN** le message est envoyé et le champ est vidé

#### Scenario: Newline with Shift+Enter
- **WHEN** l'utilisateur appuie sur Shift+Entrée dans le champ de saisie
- **THEN** un retour à la ligne est inséré dans le message (pas d'envoi)

### Requirement: Delivery status icons on sent messages
Chaque message envoyé par l'utilisateur courant SHALL afficher une icône de statut de livraison.

#### Scenario: Sending indicator
- **WHEN** un message est au statut "sending"
- **THEN** une icône horloge (⏱) grise est affichée à côté de l'horodatage

#### Scenario: Sent indicator
- **WHEN** un message est au statut "sent"
- **THEN** une icône check simple (✓) grise est affichée

#### Scenario: Delivered indicator
- **WHEN** un message est au statut "delivered"
- **THEN** une icône double check (✓✓) grise est affichée

#### Scenario: Read indicator
- **WHEN** un message est au statut "read"
- **THEN** une icône double check (✓✓) bleue est affichée

### Requirement: No technical IDs displayed anywhere
L'interface chat MUST NOT afficher d'identifiants techniques (CUIDs, UUIDs, IDs Prisma). Tous les identifiants visibles MUST être des noms d'utilisateurs, des références de commandes lisibles, ou des titres de conversations.

#### Scenario: Conversation list shows names
- **WHEN** la liste des conversations est affichée
- **THEN** chaque conversation affiche le nom de l'interlocuteur (ex: "Marie Dupont"), pas son ID

#### Scenario: Order reference format
- **WHEN** une conversation est liée à une commande
- **THEN** la référence affichée est "Commande #1234" (numéro séquentiel ou court), jamais le CUID de la commande

#### Scenario: Sender name in group messages
- **WHEN** un message est affiché dans une conversation de groupe
- **THEN** le nom de l'expéditeur est affiché au-dessus de la bulle (ex: "Jean Martin"), pas son userId

### Requirement: Mobile responsive layout
L'interface de messagerie SHALL être responsive et utilisable sur mobile (375px minimum).

#### Scenario: Mobile view shows conversation list
- **WHEN** l'utilisateur est sur mobile et n'a pas sélectionné de conversation
- **THEN** la liste des conversations occupe toute la largeur de l'écran

#### Scenario: Mobile view shows chat on selection
- **WHEN** l'utilisateur sélectionne une conversation sur mobile
- **THEN** la liste disparaît et le chat occupe toute la largeur, avec un bouton retour (←) pour revenir à la liste

#### Scenario: Desktop shows sidebar + chat
- **WHEN** l'utilisateur est sur desktop (>768px)
- **THEN** la liste des conversations est affichée dans un sidebar à gauche (300-350px) et le chat occupe le reste de l'espace

### Requirement: Toast notification for new messages
Un toast notification SHALL apparaître quand un nouveau message arrive et que l'utilisateur n'est pas dans la conversation correspondante.

#### Scenario: New message in different conversation
- **WHEN** l'utilisateur est dans la conversation avec "Marie" et reçoit un message de "Jean"
- **THEN** un toast apparaît avec "Jean: Nouveau message" pendant 5 secondes, cliquable pour ouvrir la conversation

#### Scenario: New message when not on messaging page
- **WHEN** l'utilisateur est sur le dashboard et reçoit un message
- **THEN** le badge non lu dans la navbar s'incrémente et un toast discret apparaît

### Requirement: Empty state and loading states
L'interface SHALL afficher des états de chargement et des états vides appropriés.

#### Scenario: No conversations
- **WHEN** l'utilisateur n'a aucune conversation
- **THEN** un message "Aucune conversation" est affiché avec une illustration et un CTA pertinent

#### Scenario: Loading conversations
- **WHEN** les conversations sont en cours de chargement depuis l'API
- **THEN** des squelettes (skeletons) sont affichés à la place de la liste

#### Scenario: No conversation selected (desktop)
- **WHEN** aucune conversation n'est sélectionnée sur desktop
- **THEN** la zone de chat affiche un état vide avec une illustration et "Sélectionnez une conversation"
