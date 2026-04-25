## Why

Le flux de commande complet ne fonctionne pas de bout en bout sur la plateforme. Plusieurs problemes critiques :

1. **Offres dans la messagerie** : quand un freelance envoie une offre personnalisee, le client ne la voit nulle part dans le chat. Pas de carte visuelle, pas de boutons Accepter/Refuser. Le client doit naviguer hors du chat pour traiter l'offre.
2. **Boutons d'action invisibles** : les pages de suivi de commande (freelance/client/agence) ne montrent pas les banners d'action a cause du cache localStorage qui persiste des donnees obsoletes. Le store Zustand ne re-fetche pas l'API au chargement.
3. **Pas d'auto-annulation** : les commandes en `en_attente` restent indefiniment sans consequence. Le freelance a 3 jours max pour accepter.
4. **Pas d'auto-validation** : les commandes `livre` restent indefiniment sans validation du client. Le client a 7 jours max pour valider, apres quoi la commande est auto-validee.
5. **Liberation des fonds** : apres validation (manuelle ou auto), les fonds escrow doivent etre automatiquement liberes pour le vendeur.

**Version cible : MVP**

## What Changes

### Flux complet de commande (bout en bout)
```
Offre creee par freelance
  → Carte riche dans le chat (boutons Accepter/Refuser pour le client)
  → Client accepte → Commande creee (status: en_attente)
  → Freelance a 3 JOURS pour accepter la commande
    → Si pas accepte → auto-annulation
    → Si accepte → status: en_cours, travail commence
  → Freelance livre (status: livre)
  → Client a 7 JOURS pour valider
    → Si pas valide → auto-validation
    → Si valide manuellement → status: termine
  → Formulaire d'avis disponible pour le client
  → Fonds escrow liberes automatiquement pour le vendeur
```

### Changements specifiques
- **Message type "offer" dans le chat** : carte riche avec titre, montant, delai, revisions, boutons Accepter/Refuser
- **Sync forcee au chargement** : les pages de suivi de commande forcent un re-fetch API au mount (plus de donnees stagnantes localStorage)
- **Store version bump** : `freelancehigh-dashboard-v3` pour invalider le cache existant
- **Auto-annulation 3 jours** : commandes `en_attente` > 72h auto-annulees
- **Auto-validation 7 jours** : commandes `livre` > 7 jours auto-validees
- **Liberation escrow** : a la validation (manuelle ou auto), fonds passes en `released`
- **Message systeme** : notifications dans le chat a chaque transition de statut

**Impact sur les autres roles :**
- **Freelance** : voit carte offre (lecture seule), banners d'action visibles, 3 jours pour accepter
- **Client** : boutons Accepter/Refuser offre dans chat, 7 jours pour valider, formulaire avis
- **Agence** : meme comportement que freelance
- **Admin** : pas de changement

**Jobs BullMQ / Socket.io / Email :** Pas de nouveau job BullMQ au MVP. Auto-cancel/auto-validate verifies cote API endpoint + au chargement des pages. Pas de nouveau template email.

**Impact schema Prisma :** Aucun — les structures existantes supportent deja tout le flux.

## Capabilities

### New Capabilities
- `offer-message-card`: Rendu des messages de type "offer" comme cartes riches dans le chat avec boutons Accept/Refuse pour le client
- `order-auto-cancel`: Auto-annulation des commandes en_attente > 72h + auto-validation des commandes livre > 7 jours
- `order-flow-sync`: Sync forcee API au chargement des pages de suivi, invalidation cache localStorage, liberation escrow automatique

### Modified Capabilities

## Impact

- **Pages UI** : `dashboard/commandes/[id]`, `client/commandes/[id]`, `agence/commandes/[id]`
- **Stores** : `store/dashboard.ts`, `store/client.ts`, `store/agency.ts`, `store/messaging.ts`
- **API** : `api/offres/route.ts`, `api/offres/[id]/accept`, `api/orders/auto-cancel`, `api/orders/auto-validate`
- **Composants** : nouveau `OfferMessageCard` dans `components/messaging/`
- **Data store dev** : `lib/dev/data-store.ts`
