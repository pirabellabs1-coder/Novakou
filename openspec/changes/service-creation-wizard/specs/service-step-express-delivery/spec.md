## ADDED Requirements

### Requirement: Configuration de la livraison express
Le système SHALL permettre de configurer la livraison express pour le service de base et pour chaque option supplémentaire, avec un prix supplémentaire et une réduction de délai.

#### Scenario: Activer la livraison express pour le service de base
- **WHEN** l'utilisateur active le checkbox "Activer la livraison express" pour le service de base
- **THEN** un dropdown de réduction de délai et un champ prix supplémentaire en EUR apparaissent

#### Scenario: Configurer la réduction de délai
- **WHEN** l'utilisateur sélectionne "-2 jours" dans le dropdown de réduction de délai pour un service avec un délai de base de 7 jours
- **THEN** la réduction est enregistrée et le délai express affiché est de 5 jours

#### Scenario: Configurer le prix express
- **WHEN** l'utilisateur entre 20 EUR comme prix supplémentaire pour la livraison express
- **THEN** le prix express est enregistré à 20 EUR

### Requirement: Délai express minimum 1 jour
Le système SHALL garantir que le délai avec livraison express ne descend jamais en dessous de 1 jour.

#### Scenario: Tentative de délai express à 0 jour
- **WHEN** l'utilisateur a un service avec délai de base de 2 jours et sélectionne une réduction de 3 jours
- **THEN** le système limite la réduction à -1 jour (résultat = 1 jour) et affiche un message "Le délai express ne peut pas être inférieur à 1 jour"

### Requirement: Tableau récapitulatif livraison express
Le système SHALL afficher un tableau listant le service de base et chaque option, avec pour chaque ligne : le titre, le délai normal, le toggle express, le délai express, et le prix express.

#### Scenario: Affichage du tableau
- **WHEN** l'utilisateur arrive sur l'étape 4 avec un service de base et 2 options
- **THEN** un tableau avec 3 lignes est affiché (service de base + 2 options), chacune avec un toggle express configurable

#### Scenario: Aucune option créée
- **WHEN** l'utilisateur arrive sur l'étape 4 sans avoir créé d'option à l'étape 3
- **THEN** le tableau affiche uniquement la ligne du service de base

### Requirement: Étape 4 facultative
L'étape 4 SHALL être considérée comme complétée même sans activer la livraison express.

#### Scenario: Passage sans livraison express
- **WHEN** l'utilisateur n'active aucune livraison express et clique sur "Enregistrer et suivant"
- **THEN** l'étape 4 est marquée comme complétée et l'étape 5 s'affiche
