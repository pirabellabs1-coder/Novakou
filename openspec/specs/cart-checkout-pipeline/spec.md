## ADDED Requirements

### Requirement: User can add formation to cart
The system SHALL allow an authenticated user to add a formation to their cart. The system SHALL prevent duplicate entries (same formation twice). The system SHALL prevent adding a formation the user is already enrolled in.

#### Scenario: Add formation to cart successfully
- **WHEN** authenticated user sends POST `/api/formations/cart` with `{ formationId }`
- **THEN** system creates a `CartItem` record with the user's ID and formation ID, and returns the updated cart with items and computed totals

#### Scenario: Formation already in cart
- **WHEN** user tries to add a formation that is already in their cart
- **THEN** system returns 409 with message "Cette formation est deja dans votre panier"

#### Scenario: User already enrolled in formation
- **WHEN** user tries to add a formation they already have an active enrollment for
- **THEN** system returns 409 with message "Vous etes deja inscrit a cette formation"

#### Scenario: Unauthenticated user
- **WHEN** unauthenticated user tries to add to cart
- **THEN** system returns 401

### Requirement: User can view their cart with computed totals
The system SHALL return all cart items with formation details and compute subtotal, discount amount, and total on-the-fly from current formation prices.

#### Scenario: View cart with items
- **WHEN** authenticated user sends GET `/api/formations/cart`
- **THEN** system returns `{ items: CartItemWithFormation[], subtotal: number, discountAmount: number, total: number, promoCode: PromoCode | null, itemCount: number }`

#### Scenario: View empty cart
- **WHEN** authenticated user with no cart items sends GET
- **THEN** system returns `{ items: [], subtotal: 0, discountAmount: 0, total: 0, promoCode: null, itemCount: 0 }`

### Requirement: User can remove formation from cart
The system SHALL allow a user to remove a specific formation from their cart.

#### Scenario: Remove item from cart
- **WHEN** authenticated user sends DELETE `/api/formations/cart` with `{ formationId }`
- **THEN** system deletes the CartItem and returns updated cart totals

#### Scenario: Remove item not in cart
- **WHEN** user tries to remove a formation not in their cart
- **THEN** system returns 404

### Requirement: User can apply promo code to cart
The system SHALL validate a promo code against all conditions and apply the discount to the cart total.

#### Scenario: Apply valid percentage promo code
- **WHEN** user sends POST `/api/formations/cart/promo` with `{ code: "SUMMER2024" }` and the code is active, within date range, under usage limit, and type is PERCENTAGE with value 20
- **THEN** system computes discountAmount = subtotal * 20 / 100, returns updated cart with discount applied

#### Scenario: Apply valid fixed amount promo code
- **WHEN** user applies a promo code with type FIXED and value 10
- **THEN** system computes discountAmount = 10 (or subtotal if 10 > subtotal), total = subtotal - discountAmount

#### Scenario: Apply expired promo code
- **WHEN** user applies a code where `expiresAt < now()` or `isActive = false`
- **THEN** system returns 400 with message "Ce code promo est expire"

#### Scenario: Apply exhausted promo code
- **WHEN** user applies a code where `usageCount >= maxUsage`
- **THEN** system returns 400 with message "Ce code promo a atteint sa limite d'utilisation"

#### Scenario: Apply promo code not applicable to cart formations
- **WHEN** user applies a code with `formationIds` restriction and none of the cart formations are in the list
- **THEN** system returns 400 with message "Ce code promo ne s'applique pas aux formations de votre panier"

### Requirement: User can remove promo code from cart
The system SHALL allow removing an applied promo code, resetting discount to 0.

#### Scenario: Remove promo code
- **WHEN** user sends DELETE `/api/formations/cart/promo`
- **THEN** system resets discount to 0 and returns updated cart totals

### Requirement: User can checkout cart via Stripe
The system SHALL create a Stripe Checkout Session with all cart items as line items, applying the promo code discount if present.

#### Scenario: Successful checkout initiation
- **WHEN** user sends POST `/api/formations/checkout` with non-empty cart
- **THEN** system creates Stripe Checkout Session with formation names as line items, correct amounts (after discount), success/cancel URLs, and returns `{ sessionId, url }`

#### Scenario: Checkout with empty cart
- **WHEN** user sends POST `/api/formations/checkout` with no items in cart
- **THEN** system returns 400 with message "Votre panier est vide"

### Requirement: System creates enrollments after successful payment
The system SHALL verify the Stripe payment and create Enrollment records for each purchased formation on payment success.

#### Scenario: Payment verification creates enrollments
- **WHEN** user sends POST `/api/formations/checkout/verify` with `{ sessionId }` and Stripe confirms payment succeeded
- **THEN** system creates one Enrollment per cart item with `paidAmount` = price after discount, `stripeSessionId` = session ID, status = active, progress = 0. System clears all cart items. System increments `studentsCount` and `totalRevenue` on each Formation. System increments promo code `usageCount` if one was applied.

#### Scenario: Payment verification with failed payment
- **WHEN** user sends verify with a session that was not paid
- **THEN** system returns 400 with message "Le paiement n'a pas ete confirme"

#### Scenario: Duplicate verification (idempotency)
- **WHEN** user sends verify for a session that was already processed (enrollments already exist)
- **THEN** system returns the existing enrollments without creating duplicates

### Requirement: User can add formation to favorites
The system SHALL allow toggling a formation as favorite (add if not favorited, remove if already favorited).

#### Scenario: Add to favorites
- **WHEN** authenticated user sends POST `/api/formations/favorites` with `{ formationId }` and formation is not yet favorited
- **THEN** system creates FormationFavorite record and returns `{ isFavorite: true }`

#### Scenario: Remove from favorites
- **WHEN** authenticated user sends POST `/api/formations/favorites` with `{ formationId }` and formation is already favorited
- **THEN** system deletes FormationFavorite record and returns `{ isFavorite: false }`

### Requirement: User can list their favorite formations
The system SHALL return all formations marked as favorite by the user.

#### Scenario: List favorites
- **WHEN** authenticated user sends GET `/api/formations/favorites`
- **THEN** system returns array of formations with formation details (title, thumbnail, price, rating, studentsCount)
