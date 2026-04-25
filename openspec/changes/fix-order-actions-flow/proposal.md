## Why

Les actions du flux de commande (accepter, livrer, valider, donner un avis) ne fonctionnent pas sur la plateforme. Les boutons existent dans le code mais les appels API échouent silencieusement : en mode dev, les vérifications d'authentification bloquent car `session` est null, et les fonctions store avalent les erreurs sans feedback utilisateur. De plus, il manque des modals de confirmation avant chaque action critique — l'utilisateur doit confirmer avant que l'action ne s'exécute. Ce fix est bloquant pour le MVP car sans lui aucune commande ne peut progresser de bout en bout.

**Version cible : MVP**

## What Changes

- **Freelance** (`/dashboard/commandes/[id]`) : les actions Accepter → Livrer doivent fonctionner avec confirmation modale, feedback visuel (loading, succès, erreur), et re-sync de l'état
- **Client** (`/client/commandes/[id]`) : les actions Valider la livraison → Donner un avis doivent fonctionner avec confirmation modale, feedback visuel, et re-sync de l'état
- **Client** : action Demander une revision avec modal de commentaire et confirmation
- **Agence** (`/agence/commandes/[id]`) : même flow que freelance (Accepter → Livrer) avec confirmation
- **API** (`/api/orders/[id]`) : le PATCH gère déjà tous les cas (accept, deliver, status changes) et fonctionne en mode dev — le problème est côté store/UI
- **Stores** (`dashboard.ts`, `client.ts`, `agency.ts`) : les fonctions catch les erreurs et retournent `false` sans afficher l'erreur réelle → ajouter le message d'erreur au retour pour que l'UI puisse l'afficher
- **Libération escrow** : à la validation par le client (status `termine`), les fonds passent en `released` — déjà implémenté côté API, doit juste fonctionner de bout en bout
- **Avis post-commande** : le formulaire d'avis existe mais est visible uniquement quand le statut est `termine` — s'assurer que la transition `livre` → `termine` fonctionne pour que le formulaire apparaisse

**Impact sur les autres rôles :** Admin voit les commandes changer de statut dans `/admin/commandes` — pas de changement nécessaire côté admin.

**Jobs BullMQ / Socket.io / Email :** Non — les event emitters existants (`emitEvent`) gèrent déjà les notifications. Pas de nouveau template email.

**Impact schéma Prisma :** Aucun — le schéma est correct, le problème est exclusivement UI/Store.

## Capabilities

### New Capabilities
- `order-action-flow`: Flux complet des actions de commande avec confirmations modales, feedback d'erreur, et transitions d'état correctes entre freelance/agence (accepter, livrer) et client (valider, révision, avis)

### Modified Capabilities
<!-- Aucune capability spec existante à modifier -->

## Impact

- **Pages UI** : `dashboard/commandes/[id]`, `client/commandes/[id]`, `agence/commandes/[id]`
- **Stores Zustand** : `store/dashboard.ts`, `store/client.ts`, `store/agency.ts`
- **API** : `api/orders/[id]/route.ts` (déjà fonctionnel, vérifier edge cases)
- **Composants** : `components/ui/confirm-modal.tsx` (existant, réutiliser)
- **Data store** : `lib/dev/data-store.ts` (fonctions `accept`, `deliver`, `update` déjà implémentées)
