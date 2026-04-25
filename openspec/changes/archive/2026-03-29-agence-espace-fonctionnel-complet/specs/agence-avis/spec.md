## ADDED Requirements

### Requirement: Agency reviews page SHALL display real statistics and reviews from API
La page avis (`/agence/avis`) MUST afficher en haut les statistiques depuis l'API : note moyenne globale, repartition par etoiles (barres en pourcentage), total avis recus, evolution de la note sur 6 mois (LineChart recharts). La liste des avis MUST provenir de l'API `/api/reviews`.

#### Scenario: Statistiques avis depuis API
- **WHEN** un utilisateur agence accede a `/agence/avis`
- **THEN** les statistiques affichent des valeurs calculees depuis l'API
- **THEN** un nouvel utilisateur voit "0 avis - Pas encore de note"

#### Scenario: Liste des avis depuis API
- **WHEN** l'agence a recu des avis
- **THEN** chaque avis affiche : avatar client, nom, date, note etoiles, commentaire, service concerne, montant commande, reponse de l'agence (si existe)

### Requirement: Agency SHALL be able to reply to reviews
Le systeme MUST permettre a l'agence de repondre a chaque avis. Un bouton "Repondre" MUST etre visible si l'agence n'a pas encore repondu. La reponse MUST etre sauvegardee en DB via l'API `/api/reviews/[id]/reply` et visible sur le profil public de l'agence.

#### Scenario: Repondre a un avis
- **WHEN** un utilisateur clique "Repondre" sur un avis et soumet sa reponse
- **THEN** la reponse est sauvegardee via l'API
- **THEN** la reponse apparait sous l'avis sur le profil public de l'agence
- **THEN** le client est notifie par email

#### Scenario: Avis deja repondu
- **WHEN** un avis a deja recu une reponse de l'agence
- **THEN** le bouton "Repondre" est remplace par la reponse existante
