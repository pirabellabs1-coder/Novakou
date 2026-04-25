## ADDED Requirements

### Requirement: System SHALL provide Tiptap editor for formation descriptions
Le système DOIT intégrer l'éditeur Tiptap existant (`RichTextEditor`) dans le wizard de création de formation pour les champs description FR et EN. L'éditeur DOIT supporter : gras, italique, souligné, titres (H2-H4), listes (numérotées et à puces), tableaux, images inline, liens, couleurs de texte, surlignage, blocs de citation, blocs de code, et séparateurs horizontaux.

#### Scenario: Édition de la description avec mise en forme
- **WHEN** un instructeur édite la description de sa formation et ajoute un tableau, une image et du texte en gras
- **THEN** l'éditeur Tiptap enregistre le contenu au format JSON Tiptap, le champ `descriptionFormat` est mis à `tiptap`, et le rendu côté public affiche exactement la même mise en forme

#### Scenario: Migration automatique des descriptions existantes
- **WHEN** le système charge une formation avec `descriptionFormat` absent ou égal à `text`
- **THEN** le contenu texte brut est automatiquement wrappé dans un nœud `paragraph` Tiptap pour le rendu, sans modification en base de données

### Requirement: System SHALL provide Tiptap editor for digital product descriptions
Le système DOIT utiliser le même éditeur Tiptap pour les descriptions de produits numériques, offrant les mêmes fonctionnalités que pour les formations.

#### Scenario: Description riche d'un ebook
- **WHEN** un instructeur crée un produit numérique et rédige une description avec images, tableau comparatif des chapitres, et texte coloré
- **THEN** le contenu est sauvegardé en format Tiptap JSON et rendu fidèlement sur la page publique du produit

### Requirement: System SHALL render Tiptap content safely on public pages
Le système DOIT rendre le contenu Tiptap en mode readonly sur les pages publiques en utilisant le composant `@tiptap/react` avec `editable: false`. Le rendu DOIT sanitiser le HTML pour prévenir les attaques XSS (pas de scripts, pas d'iframes non autorisées).

#### Scenario: Rendu sécurisé d'une description riche
- **WHEN** une page publique affiche une description au format Tiptap contenant une tentative d'injection `<script>alert('xss')</script>`
- **THEN** le script est supprimé par la sanitisation et seul le contenu sûr est affiché

#### Scenario: Rendu d'images inline
- **WHEN** une description contient des images uploadées via l'éditeur
- **THEN** les images sont affichées avec les dimensions d'origine, optimisées via Cloudinary si c'est une URL Cloudinary, avec un attribut `alt` descriptif

### Requirement: System SHALL support image upload in Tiptap editor
Le système DOIT permettre l'upload d'images directement dans l'éditeur Tiptap via drag-and-drop ou bouton. Les images sont uploadées vers Cloudinary via l'API existante `/api/upload/image` et insérées comme nœuds image dans le document Tiptap.

#### Scenario: Upload d'image par drag-and-drop
- **WHEN** un instructeur glisse une image dans l'éditeur Tiptap
- **THEN** l'image est uploadée via `/api/upload/image`, un placeholder de chargement s'affiche, puis l'image est insérée avec son URL Cloudinary optimisée
