## ADDED Requirements

### Requirement: Instructeur SHALL configure ad pixels
Le système DOIT permettre aux instructeurs de configurer leurs pixels publicitaires depuis la page paramètres marketing `/instructeur/marketing/pixels`. Les pixels supportés sont : Facebook Pixel, Google Ads Tag, TikTok Pixel.

#### Scenario: Configuration d'un Facebook Pixel
- **WHEN** un instructeur saisit son Facebook Pixel ID (ex: `123456789012345`) dans les paramètres
- **THEN** le système crée un `MarketingPixel` avec `type: FACEBOOK`, `pixelId: "123456789012345"`, `instructeurId`, `isActive: true`

#### Scenario: Configuration de plusieurs pixels
- **WHEN** un instructeur configure un Facebook Pixel ET un Google Ads Tag
- **THEN** le système stocke les deux pixels séparément, et les deux sont chargés sur les pages de ses formations

#### Scenario: Désactivation d'un pixel
- **WHEN** un instructeur désactive son pixel Google Ads
- **THEN** le script Google Ads n'est plus injecté sur ses pages de formation, mais la configuration reste sauvegardée pour réactivation

### Requirement: System SHALL inject pixel scripts on formation pages
Le système DOIT injecter les scripts de pixels publicitaires dans le `<head>` des pages de formation via un composant `PixelTracker` utilisant `next/script` avec stratégie `afterInteractive`. Seuls les pixels de l'instructeur de la formation consultée sont injectés.

#### Scenario: Injection du Facebook Pixel sur une page formation
- **WHEN** un visiteur accède à la page détail d'une formation dont l'instructeur a un Facebook Pixel actif
- **THEN** le script `fbq('init', 'PIXEL_ID')` est injecté via `next/script`, suivi de `fbq('track', 'PageView')`

#### Scenario: Pas de pixel si instructeur n'en a pas configuré
- **WHEN** un visiteur accède à une formation dont l'instructeur n'a aucun pixel configuré
- **THEN** aucun script de tracking n'est injecté dans la page

### Requirement: System SHALL fire conversion events on pixels
Le système DOIT déclencher les événements de conversion standards sur les pixels configurés : `PageView` (page formation vue), `AddToCart` (ajout panier), `Purchase` (achat complété avec valeur).

#### Scenario: Événement AddToCart sur Facebook Pixel
- **WHEN** un utilisateur clique "Ajouter au panier" sur une formation avec Facebook Pixel actif
- **THEN** le système exécute `fbq('track', 'AddToCart', { content_name: 'titre formation', content_ids: ['formation-id'], value: 49.00, currency: 'EUR' })`

#### Scenario: Événement Purchase après paiement
- **WHEN** l'utilisateur revient sur la page de succès après paiement d'une formation avec Google Ads Tag actif
- **THEN** le système exécute `gtag('event', 'conversion', { send_to: 'AW-XXXXX/XXXXX', value: 49.00, currency: 'EUR', transaction_id: 'stripe-session-id' })`

#### Scenario: Événement TikTok ViewContent
- **WHEN** un visiteur accède à une formation avec TikTok Pixel actif
- **THEN** le système exécute `ttq.track('ViewContent', { content_id: 'formation-id', content_name: 'titre', value: 49.00, currency: 'EUR' })`

### Requirement: System SHALL validate pixel IDs for security
Le système DOIT valider que les IDs de pixels sont au format attendu et ne contiennent pas de code malveillant. Seuls des identifiants numériques/alphanumériques sont acceptés.

#### Scenario: ID pixel valide
- **WHEN** un instructeur soumet un Facebook Pixel ID `123456789012345`
- **THEN** le système accepte l'ID (15 chiffres, format Facebook standard)

#### Scenario: Tentative d'injection via pixel ID
- **WHEN** un instructeur soumet un pixel ID contenant `"><script>alert(1)</script>`
- **THEN** le système rejette l'ID avec "Format de pixel invalide" et ne sauvegarde pas
