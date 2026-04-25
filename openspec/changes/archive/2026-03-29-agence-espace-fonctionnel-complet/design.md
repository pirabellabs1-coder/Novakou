## Context

L'espace agence (`/agence`) dispose de 34 pages routees, une sidebar, un layout avec theme vert, et des pages avec du contenu demo hardcode. L'espace freelance (`/dashboard`) est fonctionnel avec 38 pages connectees aux APIs, un wizard de creation de service en 7 etapes, une messagerie temps reel, la generation de factures PDF, et des statistiques dynamiques avec recharts.

Le projet utilise Next.js 14 App Router, Zustand pour l'etat UI, TanStack Query v5 pour l'etat serveur, et des routes API dans `apps/web/app/api/`. Les APIs existantes couvrent : services (CRUD + toggle + boost + seo), commandes (CRUD + messages), conversations (CRUD + messages + read), finances (summary + transactions + withdrawal), avis (CRUD + reply + helpful + report), factures (PDF), offres, candidatures, notifications, categories, feed, stats, abonnement, et upload d'images.

La messagerie utilise un store Zustand `messaging.ts` et des composants partages dans `components/messaging/` (ChatPanel, ConversationList, MessageBubble, MessagingLayout). Les appels audio/video utilisent WebRTC via `lib/webrtc/` et le store `call.ts`.

Le store `dashboard.ts` gere l'etat de l'espace freelance. Le store `platform-data.ts` contient des donnees demo partagees. Le fichier `lib/demo-data.ts` fournit des donnees fictives.

## Goals / Non-Goals

**Goals:**
- Rendre chaque page de l'espace agence 100% fonctionnelle avec donnees reelles depuis les APIs
- Reproduire exactement les fonctionnalites de l'espace freelance dans l'espace agence
- Wizard creation service 7 etapes identique au freelance avec specificites agence
- Messagerie temps reel identique au freelance (texte, fichiers, vocal, audio/video WebRTC)
- Generation et telechargement de factures PDF professionnelles
- Graphiques recharts fonctionnels sur dashboard, finances, et statistiques
- Communication temps reel entre espaces via les APIs et store updates
- Etat zero pour tout nouvel utilisateur agence
- Sidebar agence avec tous les liens visibles

**Non-Goals:**
- Modification du schema Prisma (reutilisation des tables existantes)
- Creation d'un backend Fastify dedie (reutilisation des routes API Next.js existantes)
- Implementation de Meilisearch ou pgvector (reste sur Postgres FTS)
- Implementation de nouveaux templates React Email (reutilisation des templates existants)
- Implementation de paiements CinetPay/Flutterwave (ces integrations sont deja dans le flow existant)
- Mode sombre (hors scope MVP)

## Decisions

### 1. Reutilisation des APIs existantes (pas de duplication)

**Decision :** Les routes API dans `apps/web/app/api/` sont deja generiques (services, commandes, finances, avis, factures, etc.) et fonctionnent avec un parametre `userId` ou un contexte d'authentification. L'espace agence appellera les memes endpoints que l'espace freelance, avec un parametre supplementaire `agencyId` quand necessaire.

**Rationale :** Evite la duplication de code et garantit la coherence des donnees. Les APIs filtrent deja par utilisateur authentifie — une agence est simplement un utilisateur avec le role "agency".

**Alternatives considerees :**
- Creer des routes API separees `/api/agency/*` → rejete car duplication massive et maintenance double
- Utiliser tRPC sur le backend Fastify → hors scope, le frontend utilise deja les routes API Next.js

### 2. Store Zustand dedie agence

**Decision :** Creer un nouveau store `apps/web/store/agency.ts` pour l'etat specifique a l'espace agence (equipe, clients CRM, automation scenarios), et reutiliser les stores existants (`messaging.ts`, `service-wizard.ts`, `call.ts`) pour les fonctionnalites partagees.

**Rationale :** Separation claire des responsabilites. Le store `dashboard.ts` est specifique au freelance. L'agence a des concepts differents (equipe, clients CRM, sous-traitance) qui necessitent leur propre etat.

**Alternatives considerees :**
- Etendre le store `dashboard.ts` avec un flag `isAgency` → rejete car complexifie le store et melange les responsabilites
- Pas de store dedie, tout via TanStack Query → rejete car certains etats UI (onglet actif, filtres, modales) sont mieux geres par Zustand

### 3. Composants partages avec variantes agence

**Decision :** Les composants existants (MessageBubble, ChatPanel, ConversationList, etc.) sont reutilises tels quels. Pour les composants specifiques a l'agence (cards membres equipe, CRM clients, etc.), creer de nouveaux composants dans le meme pattern que les composants freelance.

**Rationale :** Maximise la reutilisation. La messagerie, le wizard de creation de service, et les graphiques sont identiques — seul le contexte (agence vs freelance) change.

### 4. Nettoyage progressif des donnees demo

**Decision :** Supprimer les donnees demo de chaque page au moment de la connecter aux APIs. Le fichier `lib/demo-data.ts` reste intact pour les espaces qui ne sont pas encore migres (public, etc.), mais les references depuis l'espace agence sont toutes supprimees.

**Rationale :** Approche pragmatique qui permet de travailler page par page sans casser les autres espaces.

### 5. Generation PDF avec @react-pdf/renderer

**Decision :** Reutiliser le meme systeme de generation PDF que l'espace freelance (route API `/api/invoices/[id]/pdf`). L'endpoint genere deja un PDF professionnel — l'espace agence appelle simplement le meme endpoint.

**Rationale :** La generation PDF est identique, seules les informations de l'emetteur changent (agence au lieu de freelance).

### 6. Socket.io pour communication temps reel

**Decision :** Reutiliser l'infrastructure Socket.io existante. Les channels de messagerie sont deja bases sur les conversations (pas sur le role), donc un channel agence-client fonctionne exactement comme un channel freelance-client.

**Rationale :** Pas besoin de nouveau setup. Le store `messaging.ts` gere deja les connexions WebSocket et les events en temps reel.

## Risks / Trade-offs

**[Risk] APIs existantes ne supportent pas certains cas agence (ex: assignation membre)** → Etendre les endpoints existants avec des parametres optionnels. Si un endpoint necessite un `assignedMemberId`, l'ajouter au body de la requete sans casser la compatibilite.

**[Risk] Performance des graphiques recharts avec donnees volumineuses** → Implementer une pagination cote API et limiter les donnees retournees (ex: 12 derniers mois max pour les bar charts). Les graphiques utilisent des donnees pre-agregees, pas des requetes brutes.

**[Risk] Store Zustand agence trop volumineux** → Decouper en slices si necessaire (equipe, clients, automation comme slices separees du store agence).

**[Risk] Donnees demo restantes dans d'autres imports** → Audit systematique de tous les imports de `demo-data.ts` et `platform-data.ts` dans l'espace agence pour garantir zero donnee hardcodee.

**[Risk] Wizard creation service — divergence avec le freelance** → Copier le composant exact du freelance et ajouter les specificites agence (assignation membre) comme une couche supplementaire, sans modifier le composant original.

**[Risk] Photo de couverture profil agence — upload et stockage** → Utiliser le meme endpoint d'upload d'image existant (`/api/upload/image`), stocker l'URL dans le profil agence en DB, servir via Cloudinary pour l'optimisation.
