## ADDED Requirements

### Requirement: Le POST /api/marketing/funnels SHALL respecter le champ isActive
Quand le wizard envoie `isActive: true` dans le body du POST, le funnel créé SHALL avoir `isActive: true`. Le handler SHALL ne plus forcer `isActive: false`.

#### Scenario: Création avec activation immédiate
- **WHEN** le wizard envoie POST avec `{ name: "Mon funnel", steps: [...], isActive: true }`
- **THEN** le funnel créé a `isActive: true` et est immédiatement accessible via son URL publique

#### Scenario: Création en brouillon
- **WHEN** le wizard envoie POST avec `{ name: "Mon funnel", steps: [...], isActive: false }`
- **THEN** le funnel créé a `isActive: false` et n'est pas accessible publiquement

### Requirement: Le wizard SHALL charger les formations et produits réels de l'instructeur
La liste de produits/formations dans les étapes PRODUCT, UPSELL et DOWNSELL SHALL provenir des API `GET /api/instructeur/formations` et `GET /api/instructeur/produits`, pas d'une liste hardcodée.

#### Scenario: Chargement des produits dans le wizard
- **WHEN** l'instructeur ouvre le wizard et déploie une étape PRODUCT
- **THEN** le select "Produit / Formation lié(e)" affiche les formations et produits réels de l'instructeur avec leur titre et prix

#### Scenario: Instructeur sans produits
- **WHEN** l'instructeur n'a aucune formation ni produit
- **THEN** le select affiche un message "Aucun produit disponible. Créez une formation ou un produit d'abord." avec un lien vers la page de création

### Requirement: Le wizard SHALL valider le contenu de chaque étape
Chaque étape du funnel SHALL avoir au minimum un `headlineFr` non vide et un `ctaTextFr` non vide. Les étapes PRODUCT, UPSELL et DOWNSELL SHALL obligatoirement avoir un `linkedProductId`.

#### Scenario: Étape PRODUCT sans produit lié
- **WHEN** l'instructeur essaie de passer à l'étape suivante avec une étape PRODUCT sans `linkedProductId`
- **THEN** le wizard affiche une erreur "Veuillez sélectionner un produit ou une formation pour cette étape"

#### Scenario: Étape sans headline
- **WHEN** l'instructeur essaie de passer à l'étape suivante avec une étape dont `headlineFr` est vide
- **THEN** le wizard affiche une erreur "Le titre (FR) est requis pour chaque étape"

### Requirement: L'instructeur SHALL pouvoir dupliquer un funnel
Un bouton "Dupliquer" SHALL être disponible sur chaque funnel dans la liste. La duplication SHALL créer une copie complète (nom + " (copie)", toutes les étapes, `isActive: false`, stats remises à zéro).

#### Scenario: Duplication réussie
- **WHEN** l'instructeur clique "Dupliquer" sur un funnel nommé "Lancement React"
- **THEN** un nouveau funnel "Lancement React (copie)" est créé avec les mêmes étapes, `isActive: false`, et la liste se rafraîchit

#### Scenario: Route API de duplication
- **WHEN** POST `/api/marketing/funnels/{id}/duplicate` est appelé
- **THEN** le serveur copie le funnel et ses étapes, génère un nouveau slug, retourne le funnel dupliqué avec status 201

### Requirement: Le renderer public SHALL supporter la locale FR/EN
La page publique `/f/[slug]` SHALL afficher le contenu dans la langue de l'utilisateur. Si `locale === "en"` et que les champs EN sont remplis, elle SHALL utiliser `headlineEn`, `descriptionEn`, `ctaTextEn`. Sinon, fallback vers les champs FR.

#### Scenario: Visiteur anglophone
- **WHEN** un visiteur avec `locale = "en"` accède à un funnel dont les champs EN sont remplis
- **THEN** les headlines, descriptions et CTA sont affichés en anglais

#### Scenario: Champs EN vides — fallback FR
- **WHEN** un visiteur avec `locale = "en"` accède à un funnel dont `headlineEn` est vide
- **THEN** le système affiche `headlineFr` en fallback

### Requirement: La page publique SHALL avoir des métadonnées SEO dynamiques
La page `/f/[slug]` SHALL générer des balises `<title>`, `<meta description>`, et des Open Graph tags basés sur le contenu de la première étape du funnel.

#### Scenario: Métadonnées générées
- **WHEN** un moteur de recherche ou un réseau social crawle `/f/mon-funnel`
- **THEN** le titre est le `headlineFr` de la première étape, la description est son `descriptionFr` tronquée à 160 caractères, et l'OG image est le thumbnail de la formation liée (si disponible)

### Requirement: Tous les textes français SHALL avoir les accents corrects
Les ~35 occurrences d'accents manquants dans les fichiers funnels (liste, wizard, renderer, API) SHALL être corrigées.

#### Scenario: Accents corrigés dans la liste
- **WHEN** l'instructeur consulte la liste des funnels
- **THEN** tous les textes affichent les accents corrects ("Créez", "étape", "Créé le", "Désactiver", "Mis à jour le", "optimisés")

#### Scenario: Accents corrigés dans le renderer
- **WHEN** un visiteur accède à un funnel public
- **THEN** les textes statiques affichent les accents corrects ("sécurisé", "Accès", "spéciale", "Réservée", "réduit", "Récapitulatif", "étapes", "communauté")

### Requirement: Les imports morts SHALL être supprimés
Les imports inutilisés (`GripVertical` dans le wizard, fonction `BarChart` inline) SHALL être supprimés des fichiers funnels.

#### Scenario: Imports propres dans le wizard
- **WHEN** le code du wizard est inspecté
- **THEN** aucun import ou fonction inutilisé n'est présent
