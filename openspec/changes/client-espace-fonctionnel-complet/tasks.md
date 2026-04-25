## 1. Nettoyage donnees demo et fondation

- [x] 1.1 Auditer et supprimer toutes les donnees hardcodees, imports de `usePlatformDataStore`, `demo-data.ts`, `platform-data.ts` dans toutes les pages sous `apps/web/app/client/` — identifier chaque variable locale contenant des donnees fictives
- [x] 1.2 Creer le store Zustand `apps/web/store/client.ts` avec : types (ClientStats, Project, Order, Favorite, Review, Dispute, Invoice, Notification, Transaction, Proposal, Activity), etat initial, map loading/error par domaine, filtres, et stubs pour toutes les actions sync et CRUD
- [x] 1.3 Implementer les actions sync dans `store/client.ts` : `syncAll()`, `syncProjects()`, `syncOrders()`, `syncFavorites()`, `syncReviews()`, `syncDisputes()`, `syncInvoices()`, `syncNotifications()`, `syncTransactions()`, `syncProposals()` — chaque action appelle l'API correspondante via `@/lib/api-client` et met a jour loading/error
- [x] 1.4 Implementer les actions CRUD dans `store/client.ts` : `createProject()`, `deleteProject()`, `acceptCandidature()`, `rejectCandidature()`, `validateDelivery()`, `requestRevision()`, `openDispute()`, `submitReview()`, `toggleFavorite()`, `acceptProposal()`, `rejectProposal()`, `markNotificationRead()`, `updateProfile()`, `updateSettings()`
- [x] 1.5 Implementer les getters calcules dans `store/client.ts` : `activeOrdersCount`, `unreadNotificationsCount`, `pendingReviewsCount`, et la construction automatique du feed d'activite a partir des donnees chargees
- [ ] 1.6 Implementer des etats vides propres (empty states) reutilisables avec message explicatif et CTA pour chaque liste vide — creer un composant `EmptyState` si necessaire

## 2. Sidebar et navigation

- [ ] 2.1 Modifier `apps/web/components/client/ClientSidebar.tsx` pour afficher des badges dynamiques depuis le store client : nombre de commandes actives a cote de "Commandes", nombre de notifications non lues a cote de "Notifications", nombre de messages non lus a cote de "Messages"
- [ ] 2.2 Verifier que chaque lien de la sidebar navigue vers la bonne page sans erreur 404 et que l'etat actif est correctement applique
- [ ] 2.3 S'assurer que la sidebar appelle `syncAll()` au montage du layout pour initialiser les compteurs de badges

## 3. Dashboard principal

- [ ] 3.1 Refactorer `/client/page.tsx` pour remplacer les donnees hardcodees par les donnees du store client — connecter les cartes KPI a `clientStore.stats` (projets actifs, depenses totales, commandes en cours, freelances engages)
- [ ] 3.2 Ajouter des graphiques Recharts fonctionnels avec donnees du store : BarChart depenses mensuelles (12 mois), PieChart repartition commandes par statut
- [ ] 3.3 Implementer le feed d'activite recente depuis le store avec items cliquables (commande → `/client/commandes/[id]`, projet → `/client/projets/[id]`, avis → `/client/avis`)
- [ ] 3.4 Ajouter un auto-refresh toutes les 60 secondes via `setInterval` sur `syncStats()`
- [ ] 3.5 Ajouter des loading skeletons pour les cartes KPI et les graphiques pendant le chargement initial

## 4. Projets et candidatures

- [ ] 4.1 Refactorer `/client/projets/page.tsx` pour charger les projets depuis `syncProjects()` avec filtres par statut (tous, actifs, termines, brouillons) — supprimer le tableau de donnees hardcodees
- [ ] 4.2 Refactorer `/client/projets/nouveau/page.tsx` pour soumettre le formulaire via `clientStore.createProject()` avec validation des champs obligatoires et redirection vers `/client/projets` apres creation
- [ ] 4.3 Refactorer `/client/projets/[id]/page.tsx` pour charger le projet et ses candidatures depuis l'API — implementer les actions accepter/refuser/contacter via le store
- [ ] 4.4 Ajouter les fonctionnalites de suppression de projet (brouillons) et d'edition (projets actifs) avec modales de confirmation

## 5. Commandes

- [ ] 5.1 Refactorer `/client/commandes/page.tsx` pour charger les commandes depuis `syncOrders()` avec filtres par statut (toutes, en cours, livrees, terminees, litige) — supprimer les donnees hardcodees
- [ ] 5.2 Creer la page `/client/commandes/[id]/page.tsx` avec : en-tete (service, freelance/agence, montant, statut), pipeline visuel des phases (commande → en cours → livraison → revision → termine), zone de livrables telechargeable, boutons valider/revision/litige
- [ ] 5.3 Integrer le chat dans la page detail commande via le composant `MessagingLayout` ou un panel de messages inline connecte a la conversation de la commande
- [ ] 5.4 Implementer les actions dans la page detail : `validateDelivery()`, `requestRevision()` avec champ commentaire, `openDispute()` avec formulaire

## 6. Explorer et favoris

- [ ] 6.1 Refactorer `/client/explorer/page.tsx` pour charger les services, freelances et agences depuis les APIs respectives avec filtres avances (categorie, prix min/max, note, pays) et pagination — supprimer les tableaux hardcodes
- [ ] 6.2 Ajouter le tri (pertinence, prix croissant/decroissant, note, nouveaute) et la vue grille/liste
- [ ] 6.3 Refactorer `/client/favoris/page.tsx` pour charger les favoris depuis l'API via `syncFavorites()` — supprimer les donnees hardcodees
- [ ] 6.4 Implementer les actions favoris : `toggleFavorite()` (ajout/suppression), creation de listes personnalisees

## 7. Messagerie

- [ ] 7.1 Verifier que `/client/messages/page.tsx` utilise correctement `MessagingLayout` avec le userId et userRole du client connecte (depuis la session NextAuth)
- [ ] 7.2 S'assurer que les conversations chargees sont bien filtrees pour le client et liees aux commandes/projets existants

## 8. Finances et factures

- [ ] 8.1 Refactorer `/client/paiements/page.tsx` pour charger l'historique des transactions depuis `syncTransactions()` — supprimer les donnees hardcodees de transactions et methodes de paiement
- [ ] 8.2 Connecter le selecteur de devise dans la page paiements avec conversion en temps reel des montants
- [ ] 8.3 Refactorer `/client/factures/page.tsx` : supprimer le redirect, creer une vraie page avec liste des factures chargees depuis l'API, filtres par periode/statut, telechargement PDF via `/api/invoices/[id]/pdf`, envoi par email, export CSV

## 9. Avis

- [ ] 9.1 Refactorer `/client/avis/page.tsx` pour charger les avis donnes et en attente depuis `syncReviews()` — supprimer les donnees hardcodees
- [ ] 9.2 Implementer la soumission d'un nouvel avis via `submitReview()` avec formulaire (notes qualite/communication/delai + commentaire)
- [ ] 9.3 Implementer la modification d'un avis existant (seulement si < 7 jours) via le store

## 10. Propositions (offres personnalisees recues)

- [ ] 10.1 Refactorer `/client/propositions/page.tsx` pour charger les propositions depuis `syncProposals()` — supprimer les 6 propositions hardcodees
- [ ] 10.2 Implementer les actions accepter/refuser/contacter via `acceptProposal()`, `rejectProposal()` et redirection vers la messagerie

## 11. Litiges

- [ ] 11.1 Refactorer `/client/litiges/page.tsx` pour charger les litiges depuis `syncDisputes()` — supprimer les 3 litiges hardcodes
- [ ] 11.2 Connecter le formulaire de creation de litige a `openDispute()` avec selection de commande, categorie, description et upload de fichiers
- [ ] 11.3 Connecter le detail litige avec timeline depuis l'API

## 12. Profil et parametres

- [ ] 12.1 Refactorer `/client/profil/page.tsx` pour charger les donnees du profil depuis l'API et sauvegarder via `updateProfile()` — ajouter gestion de l'upload d'avatar
- [ ] 12.2 Refactorer `/client/parametres/page.tsx` pour charger et sauvegarder les preferences via `updateSettings()` — connecter chaque section (profil, securite, paiements, langues, notifications) a l'API

## 13. Notifications

- [ ] 13.1 Refactorer `/client/notifications/page.tsx` pour charger les notifications depuis `syncNotifications()` — supprimer les 8 notifications hardcodees
- [ ] 13.2 Implementer le mark-as-read via `markNotificationRead()` et les filtres par type
- [ ] 13.3 Connecter les preferences de notification a l'API pour sauvegarder les toggles email/push par type

## 14. Pages secondaires (aide, recherche-ia, portefeuille-web3)

- [ ] 14.1 Verifier que `/client/aide/page.tsx` est fonctionnelle — les FAQs peuvent rester hardcodees car elles sont statiques, mais le formulaire de ticket support doit envoyer via l'API
- [ ] 14.2 La page `/client/recherche-ia/page.tsx` reste en mockup UI (V3) — ajouter un banner "Fonctionnalite a venir" si elle n'en a pas
- [ ] 14.3 La page `/client/portefeuille-web3/page.tsx` reste en mockup UI (V4) — ajouter un banner "Fonctionnalite a venir" si elle n'en a pas

## 15. Loading states et error handling global

- [ ] 15.1 Ajouter des loading skeletons sur chaque page qui charge des donnees depuis l'API — utiliser des skeletons coherents avec le design existant (rectangles animes gris)
- [ ] 15.2 Ajouter des etats d'erreur avec message et bouton "Reessayer" sur chaque page en cas d'echec API
- [ ] 15.3 Verifier que chaque formulaire affiche des messages de validation clairs en cas d'erreur et des toasts de confirmation en cas de succes
