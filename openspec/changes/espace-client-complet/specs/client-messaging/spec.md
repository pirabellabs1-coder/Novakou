## ADDED Requirements

### Requirement: Messaging page SHALL render 3-panel layout
La page `/client/messages` SHALL afficher un layout 3 panneaux conforme à la maquette `messagerie_temps_r_el_int_gr_e_1` : panneau contacts gauche (w-80), fenêtre de chat central (flex-1), panneau détails mission droit (w-80, masqué sous xl). La hauteur est `h-screen` sans scroll sur le body.

#### Scenario: Affichage 3 panneaux sur desktop
- **WHEN** l'utilisateur accède à `/client/messages` sur un écran >= 1280px
- **THEN** les 3 panneaux s'affichent côte à côte avec le chat au centre

#### Scenario: Panneau détails masqué sur tablette
- **WHEN** l'écran est < 1280px
- **THEN** le panneau détails mission est masqué, seuls contacts et chat sont visibles

### Requirement: Contact panel SHALL show conversation list with status indicators
Le panneau gauche SHALL afficher "Discussions" en header avec un bouton compose, un toggle "Direct Messages" / "Équipes & Canaux", et la liste des conversations récentes. Chaque contact affiche : avatar (48px), indicateur de statut en ligne (vert), away (orange), ou offline (gris), nom, dernier message en aperçu, timestamp. Le contact actif a un fond vert plein avec texte blanc et shadow.

#### Scenario: Sélection d'un contact
- **WHEN** l'utilisateur clique sur un contact dans la liste
- **THEN** le contact est surligné en vert plein et le chat affiche la conversation correspondante

#### Scenario: Bouton Nouveau Message
- **WHEN** l'utilisateur clique sur "+ Nouveau Message" en bas du panneau
- **THEN** un formulaire de nouveau message s'ouvre

### Requirement: Chat window SHALL display messages with colored bubbles
La fenêtre de chat SHALL afficher : header avec avatar du contact, nom, statut "En ligne maintenant" (point vert animé), boutons appel/vidéo/info. Les messages entrants ont un fond slate, les messages sortants un fond vert `#19e642` avec texte dark. Les séparateurs de jour affichent "AUJOURD'HUI" ou "HIER". Les pièces jointes PDF s'affichent comme cards avec icône rouge, nom, taille et bouton télécharger.

#### Scenario: Envoi d'un message
- **WHEN** l'utilisateur tape "Bonjour" et appuie Entrée ou clique le bouton envoyer
- **THEN** le message apparaît comme bulle verte à droite avec l'heure actuelle

#### Scenario: Affichage pièce jointe PDF
- **WHEN** un message contient un fichier PDF
- **THEN** une card PDF s'affiche avec l'icône rouge, le nom du fichier, la taille et un bouton de téléchargement

### Requirement: Chat input SHALL support attachments and emoji
La zone de saisie SHALL contenir : bouton "+" (ajouter), bouton image, textarea extensible, bouton emoji, bouton envoyer (rond vert). Le texte "Shift + Enter pour une nouvelle ligne" s'affiche en hint.

#### Scenario: Bouton envoyer animé
- **WHEN** l'utilisateur survole le bouton envoyer
- **THEN** le bouton s'agrandit (scale-105) et revient à la taille normale au clic (scale-95)

### Requirement: Mission details panel SHALL show project context
Le panneau droit SHALL afficher : ID contrat (#AF-92384), "PROJET ACTIF" en badge vert, nom du projet "Refonte de l'interface E-commerce Mobile", statut "En cours", budget "1 500 €", échéance, tracker de jalons (60% complété, 4 jalons avec check/radio), fichiers partagés (thumbnails + bouton "+" ), boutons "Créer une facture" et "Signaler un litige" (rouge).

#### Scenario: Affichage des jalons
- **WHEN** le panneau détails est visible
- **THEN** les 4 jalons s'affichent : "Définition du cahier des charges" (done), "Architecture API" (done), "Implémentation Frontend" (en cours), "Tests unitaires et QA" (à faire)

#### Scenario: Signaler un litige
- **WHEN** l'utilisateur clique "Signaler un litige"
- **THEN** un modal de confirmation s'affiche ou un toast d'action est déclenché
