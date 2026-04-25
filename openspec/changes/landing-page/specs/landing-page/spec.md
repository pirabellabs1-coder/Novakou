## ADDED Requirements

### Requirement: Hero Section
La landing page SHALL afficher une section hero avec une image de fond, le slogan de la plateforme, une barre de recherche et deux boutons CTA ("Trouver un freelance" / "Devenir Freelance").

#### Scenario: Affichage initial de la page
- **WHEN** un visiteur non connecté accède à `/`
- **THEN** la section hero est visible avec le titre principal, le sous-titre, la barre de recherche et les deux boutons CTA

#### Scenario: Clic sur "Trouver un freelance"
- **WHEN** le visiteur clique sur le bouton "Trouver un freelance" dans le hero
- **THEN** il est redirigé vers `/explorer`

#### Scenario: Clic sur "Devenir Freelance"
- **WHEN** le visiteur clique sur le bouton "Devenir Freelance"
- **THEN** il est redirigé vers `/inscription`

#### Scenario: Responsive mobile
- **WHEN** la page est affichée sur un écran de 375px de large
- **THEN** le hero occupe toute la largeur, les boutons CTA s'empilent verticalement et le texte reste lisible

---

### Requirement: Stats Bar
La landing page SHALL afficher une barre de statistiques avec 3 métriques : nombre de freelances actifs, missions complétées et pays couverts.

#### Scenario: Affichage des statistiques
- **WHEN** la page est chargée
- **THEN** 3 cartes de stats sont affichées (Freelances actifs, Missions complétées, Pays couverts) avec leurs valeurs numériques et une icône

#### Scenario: Positionnement sur la maquette
- **WHEN** la page est affichée sur desktop (≥1280px)
- **THEN** les cartes stats apparaissent en grille de 3 colonnes en chevauchement avec le bas du hero

---

### Requirement: Catégories Populaires
La landing page SHALL afficher une section de catégories de services populaires sous forme de grille cliquable.

#### Scenario: Affichage des catégories
- **WHEN** la page est chargée
- **THEN** au moins 4 catégories sont affichées avec une icône, un titre et une description courte

#### Scenario: Hover sur une catégorie
- **WHEN** le visiteur survole une carte catégorie sur desktop
- **THEN** la carte passe à la couleur primaire (`#6C2BD9`) avec le texte en blanc

#### Scenario: Clic sur une catégorie
- **WHEN** le visiteur clique sur une catégorie
- **THEN** il est redirigé vers `/explorer?categorie=<slug>`

#### Scenario: Lien "Voir tout"
- **WHEN** le visiteur clique sur "Voir tout"
- **THEN** il est redirigé vers `/explorer`

---

### Requirement: Top Freelances
La landing page SHALL afficher une section présentant les freelances les mieux notés sous forme de grille de cartes.

#### Scenario: Affichage des cartes freelances
- **WHEN** la page est chargée
- **THEN** au moins 3 cartes de freelances sont affichées avec photo, nom, titre, note, compétences et tarif journalier

#### Scenario: Clic sur une carte freelance
- **WHEN** le visiteur clique sur une carte freelance
- **THEN** il est redirigé vers `/freelances/<username>`

---

### Requirement: Comment ça marche
La landing page SHALL afficher une section explicative "Comment ça marche" avec 3 étapes numérotées.

#### Scenario: Affichage des étapes
- **WHEN** la page est chargée
- **THEN** 3 étapes sont affichées (Publiez votre mission / Sélectionnez votre expert / Collaborez en toute sécurité) avec leurs descriptions respectives

#### Scenario: Bouton CTA de la section
- **WHEN** le visiteur clique sur le bouton "Lancer mon projet"
- **THEN** il est redirigé vers `/inscription`

---

### Requirement: Section CTA finale
La landing page SHALL afficher une section CTA en bas de page avec un titre accrocheur et deux boutons d'action.

#### Scenario: Affichage du CTA final
- **WHEN** la page est chargée
- **THEN** le CTA final est visible avec le titre, le sous-titre et les boutons "Trouver un freelance" / "Devenir Freelance"

#### Scenario: Actions des boutons CTA finals
- **WHEN** le visiteur clique sur "Trouver un freelance" ou "Devenir Freelance"
- **THEN** il est respectivement redirigé vers `/explorer` ou `/inscription`

---

### Requirement: SEO et Metadata
La landing page MUST exposer des balises meta complètes pour le référencement et le partage social.

#### Scenario: Balises meta présentes
- **WHEN** un crawler ou le moteur Next.js lit la page
- **THEN** les balises `<title>`, `<meta name="description">`, OpenGraph (`og:title`, `og:description`, `og:image`) et JSON-LD Organisation sont présentes dans le `<head>`

#### Scenario: Génération SSG
- **WHEN** la page est buildée avec `next build`
- **THEN** la route `/` est générée statiquement (SSG) sans appel API côté serveur
