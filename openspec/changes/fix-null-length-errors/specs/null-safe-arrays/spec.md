## ADDED Requirements

### Requirement: Les champs tableau des API routes DOIVENT renvoyer des tableaux vides au lieu de null
Les API routes qui renvoient des objets service, commande ou formation DOIVENT garantir que les champs de type liste (`tags`, `extras`, `faq`, `reviews`, `images`, `sections`, `orders`) sont toujours des tableaux (eventuellement vides), jamais `null` ou `undefined`.

#### Scenario: API service avec champs null en base
- **WHEN** un service en base a les champs `tags`, `extras` et `faq` a `null` (JSON Prisma optionnel)
- **THEN** la reponse API DOIT renvoyer `tags: []`, `extras: []`, `faq: []`

#### Scenario: API service avec des donnees valides
- **WHEN** un service a des tags et extras remplis en base
- **THEN** la reponse API DOIT renvoyer les tableaux tels quels sans modification

### Requirement: Les composants frontend DOIVENT utiliser des gardes null avant tout acces a .length, .map, .filter, .reduce
Tout composant qui accede a un champ potentiellement nullable avec `.length`, `.map()`, `.filter()` ou `.reduce()` DOIT utiliser le pattern `(value ?? [])` ou une verification conditionnelle equivalente.

#### Scenario: Page detail service avec tags null
- **WHEN** un utilisateur visite `/services/[slug]` et le service a `tags: null`
- **THEN** la page DOIT s'afficher normalement sans erreur, la section tags etant simplement masquee

#### Scenario: Page detail service avec extras null
- **WHEN** un utilisateur visite `/services/[slug]` et le service a `extras: null`
- **THEN** la page DOIT s'afficher normalement, la section extras etant simplement masquee

#### Scenario: Page detail service avec faq null
- **WHEN** un utilisateur visite `/services/[slug]` et le service a `faq: null`
- **THEN** la page DOIT s'afficher normalement, la section FAQ etant simplement masquee

#### Scenario: Page commandes freelance avec orders non charge
- **WHEN** un freelance accede a `/dashboard/commandes` avant que le store ait charge les commandes
- **THEN** la page DOIT s'afficher avec un etat vide (0 commandes) sans crash

#### Scenario: Page commandes client avec orders non charge
- **WHEN** un client accede a `/client/commandes` avant que le store ait charge les commandes
- **THEN** la page DOIT s'afficher avec un etat vide (0 commandes) sans crash

#### Scenario: Page formation avec sections null
- **WHEN** un utilisateur visite `/[slug]` et la formation a `sections: null`
- **THEN** la page DOIT s'afficher normalement avec 0 lecons comptees

### Requirement: Les stores Zustand DOIVENT initialiser les champs tableau a des tableaux vides
Les stores qui contiennent des champs de type liste (`orders`, `services`, `reviews`, etc.) DOIVENT les initialiser a `[]` et non a `null` ou `undefined`.

#### Scenario: Initialisation du store client
- **WHEN** le store client est cree pour la premiere fois
- **THEN** le champ `orders` DOIT etre initialise a `[]`

#### Scenario: Initialisation du store dashboard freelance
- **WHEN** le store dashboard est cree pour la premiere fois
- **THEN** les champs `orders`, `services`, `reviews` DOIVENT etre initialises a `[]`
