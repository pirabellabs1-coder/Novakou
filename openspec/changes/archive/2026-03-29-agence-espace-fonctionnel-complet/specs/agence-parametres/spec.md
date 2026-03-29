## ADDED Requirements

### Requirement: Agency settings SHALL save all changes to database
La page parametres (`/agence/parametres`) MUST sauvegarder toutes les modifications en DB via les APIs. Les sections MUST inclure : profil public, confidentialite, paiements, notifications, securite, plan et abonnement.

#### Scenario: Sauvegarde du profil public
- **WHEN** un utilisateur modifie le logo, la photo de couverture, le nom, le slogan, la description, le site web, le secteur d'activite, ou les langues
- **THEN** les modifications sont sauvegardees via l'API et immediatement visibles sur le profil public

### Requirement: Agency settings profile section SHALL support uploads and rich text
La section profil MUST permettre : upload logo, upload photo de couverture (1200x300px), edition du nom, slogan, description (editeur rich text), site web, secteur d'activite, langues. Les previsualisations MUST etre affichees avant la sauvegarde.

#### Scenario: Upload logo agence
- **WHEN** un utilisateur uploade un nouveau logo
- **THEN** une previsualisation est affichee avant sauvegarde
- **THEN** apres sauvegarde, le logo est mis a jour sur le profil public et dans la sidebar

#### Scenario: Upload photo de couverture
- **WHEN** un utilisateur uploade une photo de couverture (1200x300px, JPG/PNG/WebP)
- **THEN** une previsualisation est affichee
- **THEN** apres sauvegarde, la photo est visible sur le profil public

### Requirement: Agency settings privacy section SHALL control visibility
La section confidentialite MUST inclure les toggles : afficher membres equipe (off par defaut), afficher statistiques (off par defaut), accepter messages directs, apparaitre dans les recherches. Tous les toggles MUST etre fonctionnels et sauvegardes en DB.

#### Scenario: Toggle afficher membres equipe
- **WHEN** un utilisateur active le toggle "Afficher membres equipe"
- **THEN** la section equipe apparait sur le profil public de l'agence

### Requirement: Agency settings payment section SHALL manage withdrawal methods
La section paiements MUST permettre de configurer : IBAN pour virement, email PayPal, numeros Mobile Money. Les methodes MUST etre sauvegardees en DB.

#### Scenario: Ajout d'un IBAN
- **WHEN** un utilisateur ajoute un IBAN
- **THEN** l'IBAN est sauvegarde et disponible pour les futures demandes de retrait

### Requirement: Agency settings notifications SHALL have functional toggles
La section notifications MUST inclure les toggles : email nouvelle commande, email nouveau message, email avis recu, notifications in-app. Tous les toggles MUST etre fonctionnels et sauvegardes en DB.

#### Scenario: Desactiver notification email nouvelle commande
- **WHEN** un utilisateur desactive le toggle "Email nouvelle commande"
- **THEN** le parametre est sauvegarde et aucun email n'est envoye pour les nouvelles commandes

### Requirement: Agency settings security section SHALL support password change and 2FA
La section securite MUST permettre : changer le mot de passe, activer/desactiver la 2FA, voir les sessions actives avec possibilite de revocation.

#### Scenario: Changer le mot de passe
- **WHEN** un utilisateur change son mot de passe via le formulaire
- **THEN** le mot de passe est mis a jour via l'API auth

#### Scenario: Revoquer une session
- **WHEN** un utilisateur revoque une session active
- **THEN** la session est terminee et l'appareil correspondant est deconnecte

### Requirement: Agency settings subscription section SHALL display plan and allow upgrade
La section abonnement MUST afficher : le plan actuel avec ses fonctionnalites, les limites (services, candidatures, membres), un bouton pour changer de plan qui redirige vers le flow Stripe, l'historique de facturation.

#### Scenario: Upgrade de plan
- **WHEN** un utilisateur clique sur "Changer de plan" et selectionne un plan superieur
- **THEN** le flow de paiement Stripe s'ouvre pour finaliser l'upgrade
