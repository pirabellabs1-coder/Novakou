## ADDED Requirements

### Requirement: Structure du Footer
Le Footer public SHALL afficher 4 colonnes : branding + description, Plateforme, Support, Newsletter.

#### Scenario: Affichage desktop
- **WHEN** la page est affichée sur un écran ≥1024px
- **THEN** le footer est organisé en 4 colonnes côte à côte

#### Scenario: Affichage mobile
- **WHEN** la page est affichée sur un écran <768px
- **THEN** les colonnes s'empilent verticalement

#### Scenario: Mention légale
- **WHEN** la page est chargée
- **THEN** la mention "© 2026 FreelanceHigh. Tous droits réservés." est affichée en bas du footer

---

### Requirement: Liens Plateforme
Le Footer SHALL afficher une colonne "Plateforme" avec les liens vers les pages principales.

#### Scenario: Liens fonctionnels
- **WHEN** le visiteur clique sur un lien du footer (Explorer, Comment ça marche, Tarifs, Avis clients)
- **THEN** il est redirigé vers la page correspondante

---

### Requirement: Liens Support
Le Footer SHALL afficher une colonne "Support" avec les liens vers les pages légales et d'aide.

#### Scenario: Liens légaux présents
- **WHEN** la page est chargée
- **THEN** les liens Centre d'aide, Nous contacter, Politique de confidentialité et CGU sont visibles dans la colonne Support

---

### Requirement: Newsletter
Le Footer SHALL afficher un formulaire d'inscription à la newsletter.

#### Scenario: Soumission email
- **WHEN** le visiteur saisit son email et clique sur le bouton d'envoi
- **THEN** une confirmation visuelle est affichée (toast ou message inline) — au MVP, l'email est simplement loggé côté client sans envoi réel

#### Scenario: Validation email
- **WHEN** le visiteur soumet un email invalide
- **THEN** un message d'erreur est affiché sous le champ
