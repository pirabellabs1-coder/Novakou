## ADDED Requirements

### Requirement: Links in messages SHALL display automatic preview
Le systeme DOIT detecter automatiquement les URLs dans les messages texte et generer un apercu visuel en dessous du texte du message. L'apercu DOIT inclure : titre de la page, description (meta description ou OG description), et image OG si disponible.

#### Scenario: Message avec un lien valide
- **WHEN** un utilisateur envoie un message contenant une URL (ex: "Regarde ce site https://example.com")
- **THEN** le message s'affiche immediatement avec le texte, puis un apercu se charge en dessous avec le titre, la description et l'image du site

#### Scenario: Message avec un lien sans metadata OG
- **WHEN** un utilisateur envoie un message contenant une URL vers un site sans balises OG
- **THEN** le message s'affiche avec le texte, et un apercu minimal est affiche avec uniquement le domaine et le titre de la page HTML

#### Scenario: Message avec un lien invalide ou inaccessible
- **WHEN** un utilisateur envoie un message contenant une URL vers un site inaccessible (timeout, 404)
- **THEN** le message s'affiche avec le texte sans apercu (l'URL reste cliquable)

### Requirement: Link preview SHALL be generated server-side
Le systeme DOIT generer les apercus de liens via un endpoint API server-side (`/api/link-preview`) pour eviter les problemes CORS. Le resultat DOIT etre stocke dans le champ `linkPreviewData` du message en JSON.

#### Scenario: Extraction de metadata OG reussie
- **WHEN** l'API recoit une URL valide avec des balises OG
- **THEN** les metadonnees (titre, description, image, domaine) sont extraites et retournees en JSON

#### Scenario: Timeout sur l'extraction
- **WHEN** le fetch de l'URL prend plus de 5 secondes
- **THEN** l'API retourne une reponse vide et aucun apercu n'est affiche pour ce lien

#### Scenario: URL malveillante ou non-HTTPS
- **WHEN** l'API recoit une URL non-HTTPS ou vers un domaine blackliste
- **THEN** aucun apercu n'est genere (le lien reste cliquable mais sans preview)

### Requirement: Link preview SHALL be clickable
L'apercu de lien DOIT etre entierement cliquable et ouvrir l'URL dans un nouvel onglet (`target="_blank"` avec `rel="noopener noreferrer"`).

#### Scenario: Clic sur l'apercu de lien
- **WHEN** l'utilisateur clique sur l'apercu de lien
- **THEN** l'URL s'ouvre dans un nouvel onglet du navigateur

### Requirement: Link detection SHALL support multiple URLs per message
Le systeme DOIT detecter et generer des apercus pour tous les liens presents dans un meme message (maximum 3 apercus par message pour eviter la surcharge visuelle).

#### Scenario: Message avec 2 liens
- **WHEN** un utilisateur envoie un message contenant 2 URLs
- **THEN** 2 apercus sont affiches en dessous du texte, empiles verticalement

#### Scenario: Message avec plus de 3 liens
- **WHEN** un utilisateur envoie un message contenant 5 URLs
- **THEN** seuls les 3 premiers liens ont un apercu genere, les 2 restants sont affiches comme des liens cliquables simples
