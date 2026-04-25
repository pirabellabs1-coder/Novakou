## Context

Le systeme de messagerie utilise deja un type `"offer"` dans `MessageContentType` et un champ `offerData` dans `UnifiedMessage` (store/messaging.ts). Cependant ce type n'est pas rendu visuellement — les messages offer apparaissent comme du texte brut. L'API d'acceptation d'offre (`POST /api/offres/[id]/accept`) cree deja une commande avec escrow, mais n'est appelee que depuis la page `/client/offres` separee, jamais depuis le chat.

Le `conversationStore` (dev mode) supporte deja `sendMessage` avec un type optionnel. Le `offreStore` gere CRUD complet. Il manque uniquement :
1. L'envoi automatique d'un message "offer" lors de la creation d'offre
2. Le rendu carte riche dans le chat
3. Les actions accept/refuse depuis le chat
4. L'auto-annulation des commandes stagnantes

## Goals / Non-Goals

**Goals:**
- Le freelance cree une offre → elle apparait dans le chat comme une carte riche
- Le client voit titre, montant, delai, revisions, description, expiration dans la carte
- Le client peut accepter ou refuser depuis le chat (boutons dans la carte)
- Accepter cree une commande + escrow (utilise l'API existante)
- Un message systeme confirme la creation de commande
- Les commandes en_attente > 72h sont auto-annulees

**Non-Goals:**
- Pas de paiement inline dans le chat (le paiement reste via Stripe au checkout)
- Pas de modification d'offre depuis le chat (le freelance edite depuis /dashboard/offres)
- Pas de cron job externe au MVP (verification cote client + endpoint API pour futur cron)
- Pas de notifications push pour les offres (les notifications existantes suffisent)

## Decisions

### 1. Envoi du message offer : API-side vs Client-side

**Choix : API-side dans `POST /api/offres`**

Quand l'API cree une offre, elle envoie aussi le message dans la conversation. Cela garantit que le message est toujours envoye meme si le client frontend crash. Si aucune conversation n'existe avec le client, l'API en cree une.

Alternative rejetee : envoyer le message cote frontend apres le POST. Risque de desynchronisation si le message echoue apres la creation de l'offre.

### 2. Composant OfferMessageCard : inline vs composant separe

**Choix : composant separe `components/messaging/OfferMessageCard.tsx`**

Le composant est importe dans le ChatPanel et rendu conditionnellement quand `message.type === "offer"`. Il recoit `offerData`, `userRole`, `onAccept`, `onRefuse` en props.

Alternative rejetee : inline dans le rendu de message existant. Trop de logique specifique (etats, actions, countdown) qui polluerait le composant message generique.

### 3. Mise a jour du statut de la carte apres accept/refuse

**Choix : optimistic update + re-fetch**

Quand le client clique Accept, on met a jour localement `offerData.status = "acceptee"` (optimistic), puis on appelle `POST /api/offres/[id]/accept`. En cas d'echec, on rollback. Apres succes, un message systeme est ajoute a la conversation.

### 4. Auto-annulation : cron vs check at load

**Choix : check at load (MVP) avec endpoint pour futur cron**

Au `syncOrders()` dans les stores (dashboard, client, agency), on verifie les commandes `en_attente` dont `createdAt` < now - 72h et on appelle `PATCH /api/orders/[id]` avec `{ status: "annule", reason: "auto_cancel_3days" }`. Un endpoint `POST /api/orders/auto-cancel` est cree pour un futur cron Vercel/Railway.

Alternative rejetee : BullMQ delayed job a la creation de commande. Plus robuste mais complexite excessive pour le MVP.

### 5. Conversation creation : quand et comment

**Choix : creer/reutiliser lors de l'envoi d'offre**

L'API `POST /api/offres` verifie si une conversation directe existe entre le freelance et le client (par email ou ID). Si oui, envoie le message offer dedans. Si non, cree une nouvelle conversation de type `"direct"` et y envoie le message.

Le `conversationStore.create()` a deja une logique de deduplication — on la reutilise.

## Risks / Trade-offs

- **Race condition sur accept** : deux clics rapides pourraient creer 2 commandes. Mitigation : verifier cote API que l'offre n'est pas deja `acceptee` avant de creer la commande (deja fait dans l'endpoint existant).
- **Auto-cancel faux positif** : le freelance accepte la commande 2h59 apres creation, mais le check cote client la marque annulee car il ne voit pas encore l'acceptation. Mitigation : le check auto-cancel ne s'execute que cote API endpoint, pas directement dans le store. Le store appelle l'endpoint qui fait la verification atomique.
- **Offre expiree non visible** : si l'offre expire pendant que le client est sur le chat, les boutons restent visibles. Mitigation : la carte verifie `expiresAt` a chaque rendu et desactive les boutons si expiree.
- **Conversation introuvable par email** : le client n'a pas encore de userId (juste un email dans l'offre). Mitigation : en dev mode, utiliser le `clientEmail` pour trouver ou creer la conversation. En Prisma mode, le `clientId` est obligatoire.
