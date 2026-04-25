## Why

La plateforme est deployee sur Vercel mais les actions principales sont cassees : impossible de publier un service (crash toLocaleString), les images/videos des services ne s'affichent pas, la messagerie ne fonctionne pas entre utilisateurs, l'admin ne peut pas valider/refuser les services, le client ne voit pas les candidatures sur ses projets, et l'achat d'un service est impossible. Ces bugs bloquent toute activite commerciale et doivent etre corriges en priorite absolue avant tout autre developpement.

**Version cible :** MVP

## What Changes

### Correction des crashs (toLocaleString sur undefined)
- Proteger TOUS les appels `.toLocaleString()` sur des valeurs potentiellement undefined avec `?? 0` dans : admin dashboard, admin litiges, admin utilisateurs, formations, explorer, candidatures
- Couvre ~40 fichiers avec des appels non proteges

### Affichage images et videos des services
- Corriger le ServiceCard dans `/explorer` : l'image du service n'est jamais rendue (seul un gradient/icone s'affiche)
- Ajouter un lecteur video (YouTube/Vimeo/direct) sur la page detail service
- S'assurer que l'API publique retourne les bonnes URLs d'images depuis ServiceMedia + fallback images[]

### Messagerie fonctionnelle entre tous les roles
- Verifier que POST `/api/conversations/[id]/messages` cree bien le message en Prisma
- S'assurer que la MessagingLayout charge les messages depuis l'API
- Corriger le flux : clic "Contacter" → creation conversation → envoi message → redirect vers /messages

### Admin : actions sur les services
- Verifier que le store admin appelle PATCH `/api/admin/services/[id]` avec `{ action: "approve"|"refuse"|"pause"|"feature" }`
- S'assurer que le endpoint Prisma fonctionne en production (pas seulement le dev-store)
- Corriger les boutons d'action dans la page admin services

### Achat d'un service (flux commande)
- Ajouter un modal de commande sur la page detail service (choix forfait + requirements)
- Appeler POST `/api/orders` avec `{ serviceId, packageType, requirements }`
- Redirect vers la page de commande apres creation

### Candidatures client : visibilite et approbation
- Verifier que `/api/projects/[id]/bids` retourne les candidatures en mode Prisma
- S'assurer que le client peut accepter/refuser depuis `/client/projets/[id]`
- Afficher le nombre de candidatures sur la liste des projets

### Edition service (PATCH complet)
- Completer le handler PATCH `/api/services/[id]` pour supporter TOUS les champs du wizard en mode Prisma
- Gerer la mise a jour des images (ServiceMedia) et options (ServiceOption)

## Capabilities

### New Capabilities
- `service-order-flow`: Flux d'achat complet — modal de commande sur page service, creation order, redirect
- `service-video-player`: Lecteur video integre (YouTube, Vimeo, video directe) sur la page detail service

### Modified Capabilities
_(aucune spec existante modifiee — les bugs sont des implementations manquantes, pas des changements de requirements)_

## Impact

**Impact sur les roles :**
- **Freelance** : peut publier un service sans crash, modifier ses services, recevoir des messages
- **Client** : peut acheter un service, voir les candidatures, envoyer des messages, approuver des freelances
- **Agence** : peut echanger avec clients et freelances via messagerie
- **Admin** : peut valider/refuser/mettre en pause/mettre en vedette les services

**Code impacte :**
- ~40 fichiers pour les corrections toLocaleString
- `apps/web/app/(public)/explorer/page.tsx` — ServiceCard images
- `apps/web/app/(public)/services/[slug]/page.tsx` — video player + order modal + contact
- `apps/web/app/admin/services/page.tsx` + store admin — actions services
- `apps/web/app/client/projets/[id]/page.tsx` — candidatures
- `apps/web/app/api/services/[id]/route.ts` — PATCH complet
- `apps/web/app/api/orders/route.ts` — verification POST
- `apps/web/components/messaging/MessagingLayout.tsx` — envoi messages

**APIs impactees :** `/api/services`, `/api/orders`, `/api/conversations`, `/api/admin/services/[id]`, `/api/projects/[id]/bids`

**Schema Prisma :** Aucune modification requise — les tables existent deja (Service, Order, Conversation, Message, ProjectBid)

**Jobs BullMQ :** Aucun nouveau job requis
**Handlers Socket.io :** Aucun nouveau handler requis
**Templates email :** Aucun nouveau template requis
