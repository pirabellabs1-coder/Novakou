## ADDED Requirements

### Requirement: Agency dashboard SHALL display real-time statistics from API
Le dashboard agence SHALL afficher 6 cartes statistiques avec des valeurs calculees depuis les APIs : CA total (somme des commandes payees), commandes actives (count en cours), membres equipe (count actifs), note moyenne (moyenne avis recus), services actifs (count actifs), taux de conversion (commandes/vues x 100). Toutes les valeurs MUST provenir des APIs, zero valeur hardcodee.

#### Scenario: Dashboard affiche les statistiques reelles
- **WHEN** un utilisateur agence accede au dashboard (`/agence`)
- **THEN** les 6 cartes statistiques affichent des valeurs calculees depuis l'API `/api/stats` ou equivalent
- **THEN** un nouvel utilisateur voit toutes les valeurs a 0

#### Scenario: Statistiques se mettent a jour apres une action
- **WHEN** une nouvelle commande est recue pour un service de l'agence
- **THEN** la carte "Commandes actives" se met a jour sans rechargement de page

### Requirement: Agency dashboard SHALL display functional recharts graphs
Le dashboard MUST afficher 5 graphiques recharts fonctionnels : CA par mois (BarChart, 12 mois), commandes par semaine (LineChart), repartition services par categorie (PieChart/DonutChart), performance equipe (horizontal BarChart), taux de conversion (AreaChart). Tous les graphiques MUST avoir des donnees reelles depuis l'API.

#### Scenario: Graphiques avec donnees reelles
- **WHEN** un utilisateur agence a des commandes et services
- **THEN** les graphiques affichent des donnees correspondant aux vraies transactions
- **THEN** le hover sur un point/barre affiche le detail (montant, date, pourcentage)

#### Scenario: Filtres temporels fonctionnels sur les graphiques
- **WHEN** un utilisateur selectionne un filtre temporel (7j / 30j / 3m / 6m / 1an)
- **THEN** tous les graphiques se rechargent avec les donnees de la periode selectionnee

#### Scenario: Etat vide des graphiques
- **WHEN** un nouvel utilisateur agence n'a aucune donnee
- **THEN** les graphiques affichent un message "Pas encore de donnees" ou un graphique vide avec axes

### Requirement: Agency dashboard SHALL display real-time activity feed
Le dashboard MUST afficher un feed d'activite recente avec les evenements : nouvelle commande recue, membre ajoute, service approuve, avis recu, paiement libere. Chaque item du feed MUST etre cliquable et rediriger vers l'action correspondante.

#### Scenario: Feed affiche les activites recentes
- **WHEN** un utilisateur agence a de l'activite
- **THEN** le feed affiche les evenements tries par date decroissante
- **THEN** chaque evenement affiche une icone, un texte descriptif, et une date relative

#### Scenario: Click sur un item du feed
- **WHEN** un utilisateur clique sur "Nouvelle commande #123"
- **THEN** il est redirige vers `/agence/commandes/123`
