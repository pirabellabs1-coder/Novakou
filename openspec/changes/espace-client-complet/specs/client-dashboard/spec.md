## ADDED Requirements

### Requirement: Dashboard SHALL display 3 stats cards in a row
La page `/client` SHALL afficher 3 cards de statistiques en grille `md:grid-cols-3` : "Projets Actifs" (valeur : 12, variation : +2% depuis le mois dernier, icône folder verte), "Messages" (valeur : 4, sous-titre "Non lus ce matin", icône mail bleue), "Dépenses Mensuelles" (valeur : 2 450,00 €, variation : -5% budget restant en rouge, icône camera orange).

#### Scenario: Affichage des stats cards
- **WHEN** l'utilisateur accède à `/client`
- **THEN** les 3 cards s'affichent côte à côte sur desktop avec les valeurs, variations et icônes colorées

#### Scenario: Responsive mobile
- **WHEN** l'écran est < 768px
- **THEN** les cards s'empilent verticalement en `grid-cols-1`

### Requirement: Dashboard SHALL show active projects table
La section "Projets Actifs" SHALL afficher un tableau avec colonnes : Nom du projet (avec client), Progression (barre + pourcentage + badge statut), Date d'échéance. Les projets de démo incluent : "Refonte Site E-commerce" (75%, En cours, 12 Oct), "Développement API Mobile" (32%, Phase de test, 25 Nov), "Identité Visuelle - Startup" (90%, Finalisation, 05 Oct). Un lien "Voir tout" redirige vers `/client/projets`.

#### Scenario: Affichage de la table projets
- **WHEN** la page dashboard se charge
- **THEN** les 3 projets s'affichent avec leurs barres de progression colorées (vert, bleu, orange) et badges de statut

#### Scenario: Clic sur Voir tout
- **WHEN** l'utilisateur clique sur "Voir tout"
- **THEN** il est redirigé vers `/client/projets`

### Requirement: Dashboard SHALL show latest orders panel
Le panneau droit SHALL afficher "Dernières Commandes" avec 2 commandes : "Pack Maintenance A..." (#CMD-90231, Payé, 890€) et "Audit SEO - Trimestriel" (#CMD-89442, En attente, 450€). Un lien "Voir tout l'historique" redirige vers `/client/commandes`.

#### Scenario: Affichage des dernières commandes
- **WHEN** la page dashboard se charge
- **THEN** les 2 commandes s'affichent avec numéro, statut et montant en EUR

### Requirement: Dashboard SHALL show storage usage widget
Un widget "Utilisation Stockage" SHALL afficher la valeur 78.4 GB / 100 GB avec une barre de progression verte et une icône nuage décorative.

#### Scenario: Affichage du widget stockage
- **WHEN** la page dashboard se charge
- **THEN** le widget stockage affiche le pourcentage utilisé avec une barre de progression
