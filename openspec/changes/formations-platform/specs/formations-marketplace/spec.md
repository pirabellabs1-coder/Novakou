## ADDED Requirements

### Requirement: Formations landing page is publicly accessible
La landing page `/` DOIT être accessible à tous les visiteurs sans authentification. Elle DOIT afficher un hero bilingue FR/EN, des statistiques animées, les 12 catégories de formations, une grille de formations en vedette (populaires), une section "Comment ça marche", des témoignages d'apprenants et une section CTA pour devenir instructeur.

#### Scenario: Visiteur non connecté accède à la landing page formations
- **WHEN** un visiteur navigue vers `/`
- **THEN** la page se charge sans redirection vers l'authentification et affiche le contenu complet en français par défaut

#### Scenario: Statistiques de la landing page reflètent les données réelles
- **WHEN** la landing page se charge
- **THEN** les statistiques affichées (nombre d'apprenants, formations, instructeurs) correspondent aux données réelles en base de données et non à des valeurs codées en dur

#### Scenario: Clic sur une catégorie depuis la landing page
- **WHEN** un visiteur clique sur une catégorie (ex: "Développement Web")
- **THEN** il est redirigé vers `/explorer?category=developpement-web` avec le filtre catégorie pré-sélectionné

#### Scenario: Clic sur "Devenir instructeur" depuis la landing page
- **WHEN** un visiteur clique sur le CTA "Devenir instructeur" / "Become an Instructor"
- **THEN** il est redirigé vers `/devenir-instructeur`

### Requirement: Formations marketplace offers advanced search and filtering
La marketplace `/explorer` DOIT permettre de rechercher et filtrer les formations par catégorie, niveau, prix, durée, note minimale et langue. La recherche textuelle DOIT utiliser Postgres Full-Text Search avec debounce de 300ms. La pagination DOIT être infinie ou par pages. Les résultats DOIVENT afficher le nombre total de formations trouvées.

#### Scenario: Recherche textuelle avec résultats en temps réel
- **WHEN** un utilisateur saisit "React" dans la barre de recherche
- **THEN** les formations dont le titre ou la description contient "React" sont affichées dans un délai maximum de 500ms, sans rechargement de page

#### Scenario: Application d'un filtre de niveau
- **WHEN** un utilisateur coche "Débutant" dans les filtres de niveau
- **THEN** seules les formations de niveau DEBUTANT sont affichées et le compteur de résultats est mis à jour

#### Scenario: Filtre prix "Gratuit"
- **WHEN** un utilisateur sélectionne "Gratuit / Free" dans le filtre prix
- **THEN** seules les formations dont `isFree = true` sont affichées

#### Scenario: Combinaison de plusieurs filtres simultanément
- **WHEN** un utilisateur applique simultanément le filtre catégorie "Design" ET niveau "Débutant" ET prix "Moins de 20€"
- **THEN** les résultats correspondent à l'intersection de tous les critères

#### Scenario: Réinitialisation des filtres
- **WHEN** un utilisateur clique sur "Réinitialiser / Reset"
- **THEN** tous les filtres sont effacés et la liste complète des formations est affichée

#### Scenario: Tri par "Les mieux notés"
- **WHEN** un utilisateur sélectionne le tri "Les mieux notés / Highest Rated"
- **THEN** les formations sont affichées par ordre décroissant de note moyenne (champ `rating`)

### Requirement: Formation detail page displays complete course information
La page détail d'une formation `/[slug]` DOIT afficher l'en-tête de la formation (titre, description courte, note, étudiants inscrits, niveau, durée, langue), le layout en deux colonnes avec les onglets Aperçu / Programme / Instructeur / Avis, et une card d'achat sticky à droite avec le prix, les boutons d'action et les informations incluses dans la formation.

#### Scenario: Visiteur non connecté voit la page détail d'une formation active
- **WHEN** un visiteur navigue vers `/introduction-react-pour-debutants`
- **THEN** la page affiche toutes les informations de la formation (titre, description, programme, instructeur, avis) sans nécessiter de connexion

#### Scenario: Leçons gratuites sont accessibles sans achat
- **WHEN** un visiteur non inscrit clique sur une leçon marquée `isFree = true` dans le programme
- **THEN** il peut prévisualiser le contenu de cette leçon directement sur la page détail

#### Scenario: Tentative d'accès au lecteur sans achat
- **WHEN** un utilisateur connecté non inscrit à la formation clique sur "Accéder à la formation"
- **THEN** il est redirigé vers la page détail avec la card d'achat mise en évidence, et non vers le lecteur

#### Scenario: Bouton "Continuer la formation" pour un apprenant inscrit
- **WHEN** un apprenant déjà inscrit visite la page détail de la formation
- **THEN** la card d'achat est remplacée par un bouton "Continuer la formation" pointant vers le lecteur à la dernière leçon vue

#### Scenario: Affichage du badge "Bestseller"
- **WHEN** une formation a plus de 500 étudiants inscrits ET une note supérieure à 4.5
- **THEN** le badge "Bestseller" est affiché sur la card de la formation dans la marketplace et sur la page détail

#### Scenario: Affichage du badge "Nouveau"
- **WHEN** une formation a une date de publication (`publishedAt`) inférieure à 30 jours
- **THEN** le badge "Nouveau / New" est affiché sur la card

### Requirement: Instructor public profile page is accessible
La page de profil public d'un instructeur `/instructeurs/[id]` DOIT afficher les informations bilingues de l'instructeur (nom, photo, bio FR/EN, expertise, note moyenne, nombre de formations et d'étudiants), la liste de ses formations actives et ses avis reçus.

#### Scenario: Accès au profil public d'un instructeur approuvé
- **WHEN** un visiteur navigue vers `/instructeurs/[id]` pour un instructeur avec statut APPROUVE
- **THEN** la page affiche le profil complet de l'instructeur avec ses formations actives

#### Scenario: Profil d'un instructeur suspendu est inaccessible publiquement
- **WHEN** un visiteur tente d'accéder au profil d'un instructeur suspendu (statut SUSPENDU)
- **THEN** il reçoit une réponse 404

### Requirement: Certificate verification page is publicly accessible
La page `/verification/[code]` DOIT être accessible sans authentification. Elle DOIT vérifier l'authenticité d'un certificat par son code unique et afficher les informations du certificat si authentique, ou une erreur si le code est invalide ou révoqué.

#### Scenario: Vérification d'un certificat authentique
- **WHEN** un visiteur accède à `/verification/FH-2026-A1B2C3`
- **THEN** la page affiche "Ce certificat est authentique" avec le nom de l'apprenant, la formation, la date d'obtention, le score et le nom de l'instructeur

#### Scenario: Vérification d'un code de certificat invalide
- **WHEN** un visiteur accède à `/verification/INVALIDE-CODE`
- **THEN** la page affiche "Ce certificat n'existe pas ou a été révoqué" sans exposer d'informations internes

### Requirement: Formation SEO metadata is generated dynamically
Chaque page publique de la section formations DOIT générer des métadonnées SEO dynamiques (title, description, Open Graph) basées sur les données réelles de la formation. Le sitemap dynamique Next.js DOIT inclure toutes les formations au statut ACTIF.

#### Scenario: Métadonnées SEO d'une page formation
- **WHEN** un moteur de recherche indexe `/introduction-react-pour-debutants`
- **THEN** la page retourne un tag `<title>` et `<meta name="description">` spécifiques à cette formation, et non les métadonnées génériques du site

#### Scenario: Formation archivée est exclue du sitemap
- **WHEN** une formation passe au statut ARCHIVE
- **THEN** son URL disparaît du sitemap dans le prochain cycle de revalidation ISR (maximum 60 secondes)
