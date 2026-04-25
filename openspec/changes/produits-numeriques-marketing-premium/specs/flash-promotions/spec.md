## ADDED Requirements

### Requirement: Instructeur SHALL create flash promotions
Le système DOIT permettre aux instructeurs de créer des promotions flash sur leurs formations et produits numériques. Une promotion flash comprend : pourcentage de réduction, date de début, date de fin, et optionnellement un nombre maximum d'utilisations.

#### Scenario: Création d'une promotion flash sur une formation
- **WHEN** un instructeur configure une promo flash : -30% du 15 mars 10h au 17 mars 23h59, max 50 utilisations
- **THEN** le système crée une `FlashPromotion` liée à la formation avec `discountPct: 30`, `startsAt`, `endsAt`, `maxUsage: 50`, `usageCount: 0`, et la promotion s'active automatiquement à la date de début

#### Scenario: Promotion flash sur un produit numérique
- **WHEN** un instructeur configure une promo flash sur son ebook
- **THEN** le système crée une FlashPromotion liée au `DigitalProduct` avec les mêmes paramètres

### Requirement: System SHALL display countdown timer on promoted items
Le système DOIT afficher un widget countdown timer sur les pages détail des formations et produits en promotion flash active. Le timer affiche le temps restant en jours, heures, minutes, secondes avec mise à jour en temps réel.

#### Scenario: Countdown timer visible sur une formation en promo
- **WHEN** un visiteur accède à la page détail d'une formation avec une promo flash active
- **THEN** la page affiche : le prix original barré, le prix réduit en gros, le pourcentage de réduction en badge, et un countdown timer "Se termine dans : Xj Xh Xm Xs" qui se met à jour chaque seconde

#### Scenario: Promotion expirée
- **WHEN** le countdown atteint zéro
- **THEN** le timer disparaît, le prix revient au prix original, et le badge promo est retiré. Un job BullMQ `flash-promo-expiry` vérifie toutes les 5 minutes et désactive les promotions expirées en base

### Requirement: Instructeur SHALL limit stock quantity
Le système DOIT permettre aux instructeurs de limiter le nombre d'acheteurs (formations via `maxStudents`, produits via `maxBuyers`). Un compteur de "places restantes" est affiché publiquement pour créer un sentiment d'urgence.

#### Scenario: Formation avec places limitées
- **WHEN** un instructeur configure `maxStudents: 100` sur sa formation et que 85 étudiants sont inscrits
- **THEN** la page détail affiche "Plus que 15 places !" en rouge, et la barre de progression du stock est visible

#### Scenario: Stock épuisé
- **WHEN** `currentBuyers >= maxBuyers` ou `studentsCount >= maxStudents`
- **THEN** le bouton "Acheter" est remplacé par "Complet" désactivé, et le badge "Complet" est affiché sur la carte dans la marketplace

#### Scenario: Instructeur modifie le stock max
- **WHEN** un instructeur augmente `maxStudents` de 100 à 150
- **THEN** le compteur se met à jour immédiatement et le bouton "Acheter" redevient actif si le stock redevient disponible

### Requirement: System SHALL auto-deactivate expired promotions
Le système DOIT automatiquement désactiver les promotions flash expirées via un job BullMQ `flash-promo-expiry` exécuté toutes les 5 minutes. Les promotions avec `usageCount >= maxUsage` DOIVENT aussi être désactivées.

#### Scenario: Désactivation automatique par date
- **WHEN** la date actuelle dépasse `endsAt` d'une promotion flash active
- **THEN** le job BullMQ met `isActive: false` sur la promotion et le prix public revient au prix original

#### Scenario: Désactivation automatique par usage max
- **WHEN** `usageCount` atteint `maxUsage`
- **THEN** la promotion est désactivée même si `endsAt` n'est pas encore atteint
