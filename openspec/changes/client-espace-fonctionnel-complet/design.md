## Context

L'espace client (`/client`) possede 20 pages React totalisant 6 144 lignes de code. Toute la couche UI est en place (sidebar, header, layout responsive, formulaires, tableaux) mais les donnees sont 100% hardcodees dans les composants. Le pattern a suivre est exactement celui deja applique avec succes sur l'espace agence (`/agence`, 27 pages, 79 taches) : creer un store Zustand dedie, connecter chaque page aux APIs existantes via `@/lib/api-client`, et ajouter les etats de chargement/vide/erreur.

Les APIs necessaires existent deja sous `apps/web/app/api/` : orders, projects, candidatures, offres, reviews, finances, invoices, notifications, profile, conversations. En mode dev (`DEV_MODE=true`), ces APIs retournent des donnees depuis le store JSON local.

## Goals / Non-Goals

**Goals :**
- Remplacer toutes les donnees hardcodees par des appels API reels dans les 20 pages client
- Creer un store Zustand `store/client.ts` centralise avec sync API, filtres, et actions CRUD
- Ajouter loading skeletons, empty states, et gestion d'erreur sur chaque page
- Creer la page detail commande `/client/commandes/[id]` (manquante)
- Transformer `/client/factures` d'un redirect en page complete avec liste, PDF, envoi email
- Ajouter des badges dynamiques dans la sidebar (commandes actives, messages non lus)
- Connecter les graphiques dashboard a des donnees reelles via Recharts

**Non-Goals :**
- Pas d'implementation de la recherche semantique IA (V3) — la page `/client/recherche-ia` reste en mockup UI
- Pas d'implementation du portefeuille Web3 (V4) — la page existe deja en mockup
- Pas de modification du backend (apps/api) — on utilise les APIs existantes
- Pas de modification du schema Prisma — les tables existantes suffisent
- Pas d'integration Socket.io pour le temps reel (V2) — les pages se rafraichissent via polling ou refresh manuel
- Pas de notifications push (V4) — seulement les notifications in-app

## Decisions

### 1. Store Zustand unique `store/client.ts` — comme `store/agency.ts`

**Choix :** Un seul store Zustand pour tout l'etat client, suivant le meme pattern que `store/agency.ts` (331 lignes).

**Pourquoi :** Le store agency fonctionne deja et a fait ses preuves. Il centralise stats, listes, filtres, et actions dans un seul fichier. Dupliquer ce pattern garantit la coherence et simplifie la maintenance.

**Structure du store :**
```typescript
interface ClientStore {
  // Donnees
  stats: ClientStats | null
  projects: Project[]
  orders: Order[]
  favorites: Favorite[]
  reviews: Review[]
  disputes: Dispute[]
  invoices: Invoice[]
  notifications: Notification[]
  transactions: Transaction[]
  proposals: Proposal[]
  activities: Activity[]

  // Etats
  loading: Record<string, boolean>
  error: Record<string, string | null>

  // Filtres
  filters: {
    projectStatus: string
    orderStatus: string
    reviewTab: string
    disputeStatus: string
    invoicePeriod: string
  }

  // Actions sync
  syncAll: () => Promise<void>
  syncProjects: () => Promise<void>
  syncOrders: () => Promise<void>
  syncFavorites: () => Promise<void>
  syncReviews: () => Promise<void>
  syncDisputes: () => Promise<void>
  syncInvoices: () => Promise<void>
  syncNotifications: () => Promise<void>
  syncTransactions: () => Promise<void>
  syncProposals: () => Promise<void>

  // Actions CRUD
  createProject: (data: ProjectInput) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  acceptCandidature: (projectId: string, candidatureId: string) => Promise<void>
  rejectCandidature: (projectId: string, candidatureId: string) => Promise<void>
  validateDelivery: (orderId: string) => Promise<void>
  requestRevision: (orderId: string, comment: string) => Promise<void>
  openDispute: (orderId: string, data: DisputeInput) => Promise<void>
  submitReview: (orderId: string, data: ReviewInput) => Promise<void>
  toggleFavorite: (type: string, id: string) => Promise<void>
  acceptProposal: (id: string) => Promise<void>
  rejectProposal: (id: string) => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  updateProfile: (data: ProfileInput) => Promise<void>
  updateSettings: (data: SettingsInput) => Promise<void>

  // Filtres
  setFilter: (key: string, value: string) => void
}
```

**Alternative rejetee :** Utiliser TanStack Query pour chaque page individuellement. Rejete car cela fragmenterait l'etat et rendrait les badges de la sidebar (qui doivent acceder aux compteurs globaux) plus complexes a implementer.

### 2. Pattern d'integration API identique a l'espace agence

**Choix :** Utiliser `@/lib/api-client` avec les fonctions existantes (`ordersApi`, `servicesApi`, `financesApi`, `reviewsApi`, `statsApi`, `notificationsApi`, `profileApi`, `candidaturesApi`).

**Pourquoi :** Ces fonctions API encapsulent deja les appels fetch avec gestion des erreurs. Le meme pattern est utilise dans l'espace agence et fonctionne correctement.

### 3. Page detail commande `/client/commandes/[id]` — nouvelle page

**Choix :** Creer une page dediee plutot qu'un panel lateral dans la liste des commandes.

**Pourquoi :** Le detail commande est riche (timeline, chat, fichiers, validation, revision, litige). Un panel lateral serait trop etroit. La page agence `commandes/[id]` suit le meme pattern et fait 289 lignes.

**Contenu de la page :**
- En-tete avec statut, service commande, freelance/agence, montant
- Pipeline visuel des phases (commande → en cours → livraison → revision → termine)
- Chat integre via `MessagingLayout` ou panel de messages
- Zone de telechargement des livrables
- Boutons : valider livraison, demander revision, ouvrir litige
- Timeline des evenements (commande, messages, livraisons, revisions)

### 4. Page factures refaite — de redirect a page complete

**Choix :** Remplacer le redirect `/client/factures → /client/paiements` par une vraie page dediee.

**Pourquoi :** Les factures et les paiements sont des concepts distincts. Les clients ont besoin de telecharger des factures PDF pour leur comptabilite.

**Contenu :**
- Liste des factures avec filtres (statut, periode, montant)
- Telechargement PDF via `/api/invoices/[id]/pdf`
- Envoi par email
- Export CSV de l'historique

### 5. Badges dynamiques dans la sidebar

**Choix :** Le store `client.ts` expose des getters `unreadMessages`, `activeOrders`, `unreadNotifications` que la sidebar consomme.

**Pourquoi :** La sidebar est rendue en permanence dans le layout. Les badges doivent refleter l'etat reel sans necessiter de props drilling.

### 6. Graphiques dashboard avec Recharts

**Choix :** Utiliser Recharts (deja installe) pour les graphiques du dashboard, comme dans l'espace agence.

**Contenu :**
- BarChart depenses mensuelles (12 mois)
- PieChart repartition commandes par statut
- LineChart evolution des depenses
- Feed d'activite recente

## Risks / Trade-offs

### [APIs dev retournent des donnees limitees] → Les APIs en mode `DEV_MODE=true` utilisent un store JSON local avec un jeu de donnees fixe. Certaines pages pourraient sembler vides si les donnees de test ne couvrent pas tous les cas. **Mitigation :** Enrichir les donnees de test dans `lib/dev/` si necessaire lors de l'implementation.

### [Pas de temps reel] → Les donnees ne se mettent pas a jour automatiquement (pas de Socket.io ni polling). **Mitigation :** Ajouter un auto-refresh toutes les 60s sur le dashboard et un refresh manuel sur les autres pages. Le temps reel sera ajoute en V2.

### [Coherence avec l'espace agence] → Le pattern du store et des pages doit rester coherent avec ce qui a ete fait pour l'espace agence. **Mitigation :** Suivre exactement les memes conventions de nommage, structure de store, et patterns de composants.

### [Volume de pages a modifier] → 20 pages a refactorer represente un volume consequent. **Mitigation :** Les pages suivent toutes le meme pattern (supprimer hardcode → appeler store → ajouter loading/empty/error). Le travail est repetitif mais previsible.
