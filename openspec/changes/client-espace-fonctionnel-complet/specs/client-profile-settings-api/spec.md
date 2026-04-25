## ADDED Requirements

### Requirement: Profile page SHALL save to API
La page `/client/profil` SHALL sauvegarder les modifications du profil entreprise via `PUT /api/profile`.

#### Scenario: Sauvegarder le profil
- **WHEN** le client modifie son nom d'entreprise et clique "Enregistrer"
- **THEN** l'API est appelee, un toast confirme la sauvegarde, et les donnees sont persistees

#### Scenario: Upload d'avatar
- **WHEN** le client upload une nouvelle photo de profil
- **THEN** l'image est envoyee a l'API et l'avatar est mis a jour

### Requirement: Settings page SHALL save preferences to API
La page `/client/parametres` SHALL sauvegarder les preferences (notifications, securite, langue, devise) via l'API.

#### Scenario: Modifier les preferences de notification
- **WHEN** le client desactive les notifications email pour les messages
- **THEN** la preference est sauvegardee via l'API

#### Scenario: Changer la devise par defaut
- **WHEN** le client selectionne FCFA comme devise
- **THEN** la preference est sauvegardee et tous les montants de l'espace client s'affichent en FCFA

#### Scenario: Modifier le mot de passe
- **WHEN** le client remplit l'ancien et le nouveau mot de passe et clique "Modifier"
- **THEN** l'API est appelee pour changer le mot de passe

### Requirement: Sidebar SHALL display dynamic badges
La sidebar `ClientSidebar.tsx` SHALL afficher des badges dynamiques depuis le store : commandes actives, messages non lus, notifications non lues.

#### Scenario: Badge notification dans la sidebar
- **WHEN** le client a 5 notifications non lues
- **THEN** un badge rouge "5" est affiche a cote du lien Notifications dans la sidebar
