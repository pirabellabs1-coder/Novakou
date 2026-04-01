## ADDED Requirements

### Requirement: Checkout API uses correct base URL
The checkout API route (`/api/formations/checkout`) SHALL use `process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"` as the base URL for success/cancel redirect URLs, instead of the current hardcoded fallback to port 3450.

#### Scenario: Mock payment redirect in local dev
- **WHEN** a user completes a mock payment (no STRIPE_SECRET_KEY configured)
- **THEN** the API returns a success URL pointing to port 3000 (or the configured NEXT_PUBLIC_APP_URL)

#### Scenario: Stripe payment redirect in production
- **WHEN** a user completes a Stripe payment with STRIPE_SECRET_KEY configured
- **THEN** the Stripe session success_url uses the configured NEXT_PUBLIC_APP_URL

### Requirement: Add to cart provides visual feedback
When a user clicks "Ajouter au panier" on a formation detail page, the system SHALL show a visible success indicator (toast notification) before redirecting to the cart page.

#### Scenario: Successful add to cart
- **WHEN** an authenticated user clicks "Ajouter au panier" on `/formations/[slug]`
- **THEN** the system calls POST `/api/formations/cart` with the formation ID
- **THEN** a success toast appears briefly ("Formation ajoutée au panier" / "Course added to cart")
- **THEN** the user is redirected to `/formations/panier`

#### Scenario: Add to cart while not authenticated
- **WHEN** a non-authenticated user clicks "Ajouter au panier"
- **THEN** the user is redirected to `/formations/connexion`

#### Scenario: Add to cart when already enrolled
- **WHEN** a user clicks "Ajouter au panier" for a formation they are already enrolled in
- **THEN** the API returns a 400 error with message "Vous êtes déjà inscrit à cette formation"
- **THEN** the UI shows an error toast with the message

### Requirement: Buy Now creates enrollment in mock mode
When a user clicks "Acheter" and the system is in mock payment mode, the system SHALL create the enrollment, clear the cart, and redirect the user to the success page using a client-side relative URL.

#### Scenario: Buy Now in mock mode
- **WHEN** an authenticated user clicks "Acheter" on a formation detail page
- **THEN** the system adds the formation to the cart via POST `/api/formations/cart`
- **THEN** the system calls POST `/api/formations/checkout`
- **THEN** the checkout creates an enrollment record in the database
- **THEN** the checkout clears the user's cart
- **THEN** the API response includes `mock: true` and a `url` field
- **THEN** the client redirects to `/formations/succes?session_id=xxx` using `router.push` (relative URL)

#### Scenario: Buy Now in Stripe mode
- **WHEN** an authenticated user clicks "Acheter" with STRIPE_SECRET_KEY configured
- **THEN** the system redirects to the Stripe checkout URL using `window.location.href`

### Requirement: Cart checkout creates enrollment in mock mode
When a user clicks "Passer la commande" on the cart page and the system is in mock mode, the system SHALL redirect to the success page using a relative URL.

#### Scenario: Cart checkout in mock mode
- **WHEN** an authenticated user with items in cart clicks "Passer la commande"
- **THEN** the system calls POST `/api/formations/checkout`
- **THEN** the checkout creates enrollment records for all cart items
- **THEN** the API returns `{ url, mock: true }`
- **THEN** the client redirects to `/formations/succes?session_id=xxx` using `router.push`

#### Scenario: Cart checkout in Stripe mode
- **WHEN** an authenticated user with items in cart clicks "Passer la commande" with Stripe configured
- **THEN** the client redirects to the Stripe checkout URL using `window.location.href`

### Requirement: Success page verifies enrollment
After redirection to the success page, the system SHALL verify the payment and display enrollment confirmation.

#### Scenario: Success page with mock session
- **WHEN** the user lands on `/formations/succes?session_id=mock_xxx`
- **THEN** the page calls GET `/api/formations/checkout/verify?session_id=mock_xxx`
- **THEN** the API returns `{ paid: true }`
- **THEN** the page displays the success confirmation with links to "Mes formations"

### Requirement: Error handling on add-to-cart and buy buttons
The system SHALL handle API errors gracefully and display error messages to the user.

#### Scenario: Cart API returns error
- **WHEN** the POST `/api/formations/cart` call fails (network error or 500)
- **THEN** the UI displays an error toast message
- **THEN** the loading state is reset (button is clickable again)

#### Scenario: Checkout API returns error
- **WHEN** the POST `/api/formations/checkout` call fails
- **THEN** the UI displays an error toast message
- **THEN** the loading state is reset
