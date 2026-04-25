## ADDED Requirements

### Requirement: Agency statistics page SHALL display 10 functional recharts graphs
La page statistiques (`/agence/statistiques`) MUST afficher 10 graphiques recharts fonctionnels avec des donnees reelles depuis l'API `/api/stats` : CA par mois (BarChart), commandes par semaine (LineChart), performance par service (tableau), performance par membre (BarChart horizontal), vues profil agence (AreaChart), sources de trafic (PieChart/DonutChart), taux de conversion (gauge ou AreaChart), clients recurrents vs nouveaux (PieChart/DonutChart), evolution note moyenne (LineChart), revenus par categorie (BarChart).

#### Scenario: Tous les graphiques affichent des donnees reelles
- **WHEN** un utilisateur agence accede a `/agence/statistiques`
- **THEN** les 10 graphiques affichent des donnees depuis l'API
- **THEN** un nouvel utilisateur voit des graphiques vides ou avec des messages "Pas encore de donnees"

#### Scenario: Hover sur les graphiques
- **WHEN** un utilisateur passe la souris sur un point ou une barre d'un graphique
- **THEN** un tooltip affiche le detail (valeur, date, pourcentage)

### Requirement: Agency statistics SHALL support time filters and period comparison
Chaque graphique MUST avoir des filtres temporels fonctionnels : 7j, 30j, 3m, 6m, 1an. La comparaison avec la periode precedente MUST etre affichee avec un pourcentage d'evolution.

#### Scenario: Filtre temporel
- **WHEN** un utilisateur selectionne "3m" sur un graphique
- **THEN** le graphique se recharge avec les donnees des 3 derniers mois

#### Scenario: Comparaison periode precedente
- **WHEN** un filtre temporel est actif
- **THEN** un pourcentage d'evolution par rapport a la periode precedente est affiche (ex: "+12%")

### Requirement: Agency statistics SHALL support CSV and PDF export
Chaque graphique MUST avoir un bouton export CSV. Un bouton global MUST permettre d'exporter un rapport PDF complet de toutes les statistiques.

#### Scenario: Export CSV par graphique
- **WHEN** un utilisateur clique sur "Export CSV" sur un graphique
- **THEN** un fichier CSV contenant les donnees du graphique est telecharge

#### Scenario: Export PDF rapport complet
- **WHEN** un utilisateur clique sur "Exporter rapport PDF"
- **THEN** un PDF contenant tous les graphiques et statistiques est genere et telecharge
