## ADDED Requirements

### Requirement: Offer creation sends message in conversation
When a freelance creates an offer via `POST /api/offres`, the system SHALL send a message of type `"offer"` in the conversation with the target client. The message SHALL contain the complete `offerData` (offerId, title, amount, delay, revisions, description, status, validityDays, expiresAt). If no conversation exists between the freelance and the client, the system SHALL create a new `"direct"` conversation.

#### Scenario: Freelance creates offer with existing conversation
- **WHEN** freelance creates an offer for a client with whom a direct conversation already exists
- **THEN** a message of type `"offer"` is sent in the existing conversation with `offerData` populated from the created offer

#### Scenario: Freelance creates offer without existing conversation
- **WHEN** freelance creates an offer for a client with no existing direct conversation
- **THEN** the system creates a new direct conversation between freelance and client, and sends the offer message in it

#### Scenario: Offer data is complete in message
- **WHEN** the offer message is sent
- **THEN** `offerData` SHALL contain: `offerId`, `title`, `amount` (number), `delay` (string), `revisions` (number), `description`, `status` ("en_attente"), `validityDays`, `expiresAt` (ISO string)

### Requirement: Offer messages render as rich cards in chat
The chat UI SHALL render messages with `type: "offer"` as a distinct visual card, not as plain text. The card SHALL display: title, amount in EUR, delivery delay, number of revisions, description (truncated with expand), and expiration countdown.

#### Scenario: Client views offer card
- **WHEN** a client opens a conversation containing an offer message
- **THEN** the message renders as a card with title, amount, delay, revisions, description summary, and expiration date

#### Scenario: Freelance views own offer card
- **WHEN** the freelance who sent the offer views the conversation
- **THEN** the card displays the same info but without Accept/Refuse buttons, and shows the current status (en_attente, acceptee, refusee, expiree)

#### Scenario: Expired offer display
- **WHEN** the current time is past `offerData.expiresAt`
- **THEN** the card displays a "Expiree" badge, buttons are hidden, and the card is visually muted

### Requirement: Client can accept offer from chat card
The client SHALL be able to accept an offer directly from the chat card by clicking an "Accepter" button. Accepting SHALL call `POST /api/offres/[offerId]/accept` which creates a new order with escrow. The card status SHALL update to "acceptee" and a system message SHALL be sent confirming order creation.

#### Scenario: Client accepts valid offer
- **WHEN** client clicks "Accepter l'offre" on a card with status "en_attente" and not expired
- **THEN** the system calls `POST /api/offres/[offerId]/accept`, creates the order, updates the card status to "acceptee", and sends a system message "Offre acceptee ! Commande #[orderId] creee."

#### Scenario: Client accepts already processed offer
- **WHEN** client clicks Accept on an offer that is already acceptee, refusee, or expiree
- **THEN** the system displays an error toast and does not create a duplicate order

#### Scenario: Accept shows loading state
- **WHEN** client clicks "Accepter l'offre"
- **THEN** the button shows a loading spinner until the API responds, and both buttons are disabled during the request

### Requirement: Client can refuse offer from chat card
The client SHALL be able to refuse an offer from the chat card by clicking a "Refuser" button. Refusing SHALL call `POST /api/offres/[offerId]/refuse`. The card status SHALL update to "refusee".

#### Scenario: Client refuses valid offer
- **WHEN** client clicks "Refuser" on a card with status "en_attente"
- **THEN** the system calls `POST /api/offres/[offerId]/refuse`, updates the card status to "refusee"

#### Scenario: Refuse with confirmation
- **WHEN** client clicks "Refuser"
- **THEN** a confirmation dialog appears before the API call is made

### Requirement: System message on offer acceptance
When an offer is accepted and an order is created, the system SHALL send a system message in the conversation. The message SHALL contain the order ID and a reminder that the freelance has 3 days to start.

#### Scenario: System message after acceptance
- **WHEN** offer is accepted successfully and order is created
- **THEN** a system message is sent: "Offre acceptee ! Commande #[orderId] creee. Le freelance dispose de 3 jours pour commencer le travail."
