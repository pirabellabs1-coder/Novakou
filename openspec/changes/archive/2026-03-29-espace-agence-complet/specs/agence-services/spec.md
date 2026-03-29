## ADDED Requirements

### Requirement: Liste des services de l'agence
La page services SHALL afficher tous les services publiés sous la marque agence avec : titre, catégorie, prix, statut (actif/pause), vues, commandes, CA généré.

#### Scenario: Affichage de la liste
- **WHEN** l'utilisateur accède à `/agence/services`
- **THEN** les services sont listés en cartes avec statistiques de performance

### Requirement: Actions sur les services
Chaque service SHALL proposer les actions : modifier, mettre en pause/activer, dupliquer, supprimer.

#### Scenario: Mise en pause d'un service
- **WHEN** l'utilisateur clique "Mettre en pause"
- **THEN** le statut change en "En pause" et un toast de confirmation est affiché

### Requirement: Statistiques par service
Chaque carte service SHALL afficher : nombre de vues, nombre de commandes, CA total, taux de conversion.

#### Scenario: Affichage des stats
- **WHEN** la page est chargée
- **THEN** chaque service affiche ses métriques de performance
