## ADDED Requirements

### Requirement: New message SHALL trigger in-app notification
Le systeme DOIT creer une notification in-app lorsqu'un nouveau message est recu dans une conversation ou l'utilisateur n'est pas actuellement actif. La notification DOIT utiliser le systeme de notifications existant (`/api/notifications`).

#### Scenario: Notification pour message recu hors conversation active
- **WHEN** un utilisateur recoit un nouveau message dans une conversation qu'il n'est pas en train de consulter
- **THEN** une notification in-app est creee avec le nom de l'expediteur, un extrait du message (50 premiers caracteres), et un lien vers la conversation

#### Scenario: Pas de notification si conversation active
- **WHEN** un utilisateur recoit un message dans la conversation qu'il est en train de consulter activement
- **THEN** aucune notification n'est creee (le message s'affiche directement dans le chat)

### Requirement: File shared SHALL trigger in-app notification
Le systeme DOIT creer une notification in-app lorsqu'un fichier est partage dans une conversation.

#### Scenario: Notification pour fichier partage
- **WHEN** un utilisateur recoit un message contenant un fichier dans une conversation inactive
- **THEN** une notification in-app est creee avec le texte "[Nom expediteur] a partage un fichier : [nom du fichier]"

### Requirement: Incoming call SHALL trigger in-app notification
Le systeme DOIT creer une notification in-app avec son pour les appels entrants (audio ou video).

#### Scenario: Notification pour appel entrant
- **WHEN** un utilisateur recoit un appel audio ou video
- **THEN** une notification popup s'affiche avec les boutons "Accepter" et "Refuser", accompagnee d'un son de sonnerie

#### Scenario: Notification pour appel manque
- **WHEN** un utilisateur ne repond pas a un appel dans les 30 secondes
- **THEN** une notification in-app est creee avec le texte "Appel manque de [Nom expediteur]"

### Requirement: Unread message count SHALL be displayed in navigation
Le systeme DOIT afficher un badge avec le nombre total de messages non lus dans la barre de navigation, a cote de l'icone de messagerie. Le badge DOIT se mettre a jour en temps reel.

#### Scenario: Badge visible avec messages non lus
- **WHEN** l'utilisateur a 3 messages non lus dans differentes conversations
- **THEN** un badge rouge affichant "3" est visible sur l'icone de messagerie dans la navbar

#### Scenario: Badge disparait quand tout est lu
- **WHEN** l'utilisateur ouvre et lit tous ses messages non lus
- **THEN** le badge disparait de l'icone de messagerie

### Requirement: Email notification SHALL be sent for unread messages after delay
Le systeme DOIT envoyer un email de notification lorsqu'un message reste non lu pendant plus de 5 minutes, si l'utilisateur a active les notifications email dans ses parametres. Un seul email DOIT etre envoye par lot de messages non lus (pas un email par message).

#### Scenario: Email envoye apres 5 minutes de messages non lus
- **WHEN** un utilisateur a des messages non lus depuis plus de 5 minutes et les notifications email sont activees
- **THEN** un email est envoye avec le resume des messages non lus (nombre de messages, noms des expediteurs) et un lien vers la messagerie

#### Scenario: Pas d'email si notifications desactivees
- **WHEN** un utilisateur a des messages non lus mais a desactive les notifications email pour la messagerie
- **THEN** aucun email n'est envoye

#### Scenario: Pas d'email si messages lus avant le delai
- **WHEN** un utilisateur recoit un message et le lit dans les 5 minutes
- **THEN** aucun email n'est envoye

### Requirement: Read and delivery receipts SHALL be displayed
Le systeme DOIT afficher des indicateurs de livraison et de lecture sur les messages envoyes. L'icone DOIT passer de "envoye" (une coche) a "livre" (deux coches grises) a "lu" (deux coches bleues).

#### Scenario: Message envoye
- **WHEN** un message est envoye avec succes via l'API
- **THEN** une coche grise est affichee a cote du timestamp

#### Scenario: Message lu par le destinataire
- **WHEN** le destinataire ouvre la conversation contenant le message
- **THEN** l'icone passe a deux coches bleues pour l'expediteur
