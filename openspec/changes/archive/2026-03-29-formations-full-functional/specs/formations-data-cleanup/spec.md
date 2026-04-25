## ADDED Requirements

### Requirement: Aucune page formations ne DOIT contenir de données hardcodées
Toutes les pages de la plateforme formations DOIVENT afficher exclusivement des données provenant d'appels API Prisma. Aucun tableau statique de statistiques, témoignages fictifs, ou compteurs codés en dur ne DOIT subsister.

#### Scenario: Page d'accueil sans données mock
- **WHEN** la page d'accueil formations se charge
- **THEN** les compteurs statistiques (formations, apprenants, instructeurs, satisfaction) DOIVENT provenir de `GET /api/formations/stats` et non d'un tableau `STATS` hardcodé

#### Scenario: Page devenir-instructeur sans données mock
- **WHEN** la page devenir-instructeur se charge
- **THEN** les compteurs (instructeurs actifs, apprenants) DOIVENT provenir de l'API et les témoignages DOIVENT être soit supprimés soit remplacés par des avis réels de la table `FormationReview`

### Requirement: Les dashboards DOIVENT afficher un état vide approprié
Quand il n'y a pas de données (0 formations, 0 inscriptions, 0 revenus), les dashboards DOIVENT afficher un état vide informatif avec une illustration et un appel à l'action au lieu d'afficher des zéros partout.

#### Scenario: Dashboard instructeur sans formations
- **WHEN** un instructeur qui n'a pas encore créé de formation accède à son dashboard
- **THEN** le système DOIT afficher un état vide avec un message encourageant et un bouton "Créer votre première formation"

#### Scenario: Dashboard apprenant sans inscriptions
- **WHEN** un apprenant qui n'est inscrit à aucune formation accède à son dashboard
- **THEN** le système DOIT afficher un état vide avec un message et un bouton "Explorer les formations"

### Requirement: Toutes les APIs DOIVENT retourner des données Prisma réelles
Chaque API route sous `/api/formations/`, `/api/apprenant/`, `/api/instructeur/`, et `/api/admin/formations/` DOIT exécuter des requêtes Prisma contre la base de données réelle et ne DOIT jamais retourner de données fictives ou de fallback statique.

#### Scenario: API dashboard apprenant retourne des données réelles
- **WHEN** `GET /api/apprenant/dashboard` est appelée pour un apprenant authentifié
- **THEN** la réponse DOIT contenir les inscriptions réelles de cet apprenant avec les progressions calculées depuis `LessonProgress`

#### Scenario: API dashboard instructeur retourne des revenus réels
- **WHEN** `GET /api/instructeur/dashboard` est appelée pour un instructeur authentifié
- **THEN** les revenus DOIVENT être calculés à partir de la somme des `Enrollment.paidAmount` pour les formations de cet instructeur
