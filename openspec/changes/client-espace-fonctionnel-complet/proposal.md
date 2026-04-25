## Why

L'espace client (`/client`) dispose de 20 pages avec une UI complete (6 144 lignes de code) mais **aucune integration API reelle**. Toutes les donnees sont hardcodees directement dans les composants React — aucun appel API, aucun store Zustand dedie, aucune gestion d'etats de chargement/erreur. Les formulaires affichent des toasts "succes" sans rien soumettre. Il faut transformer cet espace prototype en espace 100% fonctionnel avec donnees reelles, comme ce qui a ete fait pour l'espace agence.

**Version cible :** MVP + V1 (les fonctionnalites V2+ comme la recherche IA semantique et le portefeuille Web3 restent en mockup UI).

## What Changes

### Nettoyage et fondation
- Supprimer toutes les donnees hardcodees et imports de demo-data/platform-data dans les pages client
- Creer un store Zustand `store/client.ts` dedie a l'espace client (projets, commandes, favoris, avis, litiges, factures, notifications, statistiques)
- Implementer des etats vides (empty states), des squelettes de chargement (skeletons), et des etats d'erreur pour chaque page

### Dashboard (`/client`)
- Connecter les cartes KPI aux APIs reelles (projets actifs, depenses, commandes, freelances engages)
- Ajouter des graphiques Recharts fonctionnels (depenses par mois, commandes par statut)
- Implementer un feed d'activite recente depuis l'API
- Auto-refresh periodique des statistiques

### Projets & Candidatures
- Connecter `/client/projets` a l'API GET `/api/projects` avec filtres et pagination
- Connecter le wizard `/client/projets/nouveau` a POST `/api/projects` avec validation Zod
- Connecter `/client/projets/[id]` a l'API pour afficher les candidatures reelles et permettre accepter/refuser/contacter
- Ajouter suppression et edition de projets existants

### Commandes
- Connecter `/client/commandes` a l'API GET `/api/orders` avec filtres par statut
- Implementer la page detail commande `/client/commandes/[id]` (nouvelle page) avec : timeline, chat integre, validation livraison, demande de revision, ouverture de litige
- Pipeline visuel des phases de commande (commande → en cours → livraison → revision → termine)

### Explorer & Favoris
- Connecter `/client/explorer` aux APIs services, freelances et agences avec filtres avancés, tri et pagination
- Connecter `/client/favoris` a une API de gestion des favoris (ajout/suppression/listes personnalisees)

### Messagerie
- Renforcer `/client/messages` pour utiliser le composant `MessagingLayout` avec le bon contexte client
- S'assurer que les conversations sont liees aux commandes et projets

### Finances & Factures
- Connecter `/client/paiements` aux APIs transactions avec historique reel
- Transformer `/client/factures` d'un simple redirect en une vraie page de gestion des factures (liste, filtre, telechargement PDF, envoi par email)
- Integrer le selecteur de devise avec conversion en temps reel

### Avis
- Connecter `/client/avis` a l'API reviews pour afficher les avis donnes et en attente
- Permettre de soumettre de nouveaux avis apres validation de commande
- Permettre la modification d'un avis dans les 7 jours

### Propositions (offres personnalisees recues)
- Connecter `/client/propositions` a l'API `/api/offres` pour afficher les offres recues
- Permettre d'accepter/refuser/contacter pour chaque proposition

### Litiges
- Connecter `/client/litiges` a l'API pour afficher les litiges reels
- Permettre la creation de nouveau litige avec upload de preuves
- Afficher la timeline de resolution

### Profil & Parametres
- Connecter `/client/profil` a l'API profile pour sauvegarder les modifications
- Connecter `/client/parametres` a l'API pour sauvegarder les preferences (notifications, securite, langue, devise)

### Notifications
- Connecter `/client/notifications` a l'API notifications avec mark-as-read et preferences

### Sidebar & Navigation
- Verifier que `ClientSidebar` navigue correctement vers toutes les pages sans erreur
- Ajouter des badges de comptage dynamiques (commandes actives, messages non lus, notifications)

## Capabilities

### New Capabilities
- `client-data-store`: Store Zustand dedie a l'espace client avec sync API, actions CRUD, filtres et etats de chargement
- `client-dashboard-live`: Dashboard client avec KPIs, graphiques et activite en temps reel depuis les APIs
- `client-projects-api`: Gestion complete des projets client (CRUD, candidatures, wizard creation) connectee aux APIs
- `client-orders-api`: Gestion des commandes client avec detail, timeline, chat, validation et revision connectee aux APIs
- `client-explorer-api`: Explorer freelances/services/agences avec filtres avancés, pagination et favoris connectes aux APIs
- `client-finances-api`: Paiements, factures PDF et historique de transactions connectes aux APIs
- `client-reviews-api`: Avis donnes et en attente avec soumission et modification connectes aux APIs
- `client-proposals-api`: Propositions recues avec actions accepter/refuser connectees aux APIs
- `client-disputes-api`: Litiges avec creation, timeline et upload de preuves connectes aux APIs
- `client-profile-settings-api`: Profil entreprise et parametres (notifications, securite, devise) connectes aux APIs
- `client-notifications-api`: Systeme de notifications avec badge dynamique et preferences connecte aux APIs

### Modified Capabilities
_(Aucune modification de specs existantes — il s'agit uniquement de connecter les pages UI existantes aux APIs)_

## Impact

### Code affecte
- **20 pages** sous `apps/web/app/client/` — refactoring pour remplacer les donnees hardcodees par des appels API
- **1 nouveau store** `apps/web/store/client.ts` — etat centralise de l'espace client
- **1 nouvelle page** `apps/web/app/client/commandes/[id]/page.tsx` — detail commande
- **1 page refondue** `apps/web/app/client/factures/page.tsx` — de redirect a page complete
- **2 composants** `ClientSidebar.tsx` et `ClientHeader.tsx` — badges dynamiques

### APIs utilisees
- `/api/projects`, `/api/orders`, `/api/services`, `/api/reviews`, `/api/offres`, `/api/candidatures`
- `/api/finances/transactions`, `/api/invoices/[id]/pdf`, `/api/notifications`, `/api/profile`
- `/api/conversations`, `/api/conversations/[id]/messages`

### Dependances
- Recharts (deja installe) pour les graphiques dashboard
- `@react-pdf/renderer` (deja installe) pour les factures PDF
- Composant partage `MessagingLayout` pour la messagerie

### Impact sur les autres roles
- Aucun impact direct — les APIs sont partagees mais les pages client sont isolees
- Les donnees affichees dans l'espace client (commandes, avis) correspondent aux memes entites vues depuis l'espace freelance/agence

### Impact sur le schema Prisma
- Aucune nouvelle table necessaire — les tables existantes (orders, projects, reviews, invoices, favorites, disputes, notifications) couvrent tous les besoins
- Potentiellement ajouter une table `client_favorites` si elle n'existe pas encore
