## Why

L'espace agence (`/agence`) existe structurellement (34 pages routees, sidebar, layout) mais reste non fonctionnel : donnees demo hardcodees, formulaires non connectes aux APIs, graphiques statiques, messagerie non operationnelle, generation PDF inexistante, communication inter-espaces absente. L'espace freelance (`/dashboard`) est deja fonctionnel avec APIs reelles, wizard de creation de service en 7 etapes, messagerie temps reel, generation de factures PDF, statistiques dynamiques. L'objectif est de rendre l'espace agence 100% operationnel et au meme niveau de qualite que l'espace freelance, en eliminant toutes les donnees demo et en connectant chaque fonctionnalite aux APIs internes avec communication temps reel entre tous les espaces.

**Version cible :** MVP + V1 (fonctionnalites de base + matching + equipe + finances completes)

## What Changes

### Nettoyage et fondation
- **Suppression de toutes les donnees demo/mock** de l'espace agence — chiffres hardcodes, noms fictifs, compteurs statiques
- **Etat zero pour tout nouvel utilisateur agence** — tous les compteurs, graphiques, listes demarrent a zero
- **Connexion de chaque page aux APIs internes** existantes ou nouvelles

### Sidebar et navigation
- **Refonte de la sidebar agence** — tous les liens visibles sans elements caches, scroll si necessaire, ordre : Dashboard, Equipe, Services, Commandes, Clients, Messages, Finances, Factures, Avis, Statistiques, Boost, SEO, Automatisation, Litiges, Aide, Parametres
- **Profil agence en bas de sidebar** avec logo, nom, plan actuel, lien vers profil

### Dashboard principal (/agence)
- **Cartes statistiques calculees depuis DB** : CA total, commandes actives, membres equipe, note moyenne, services actifs, taux conversion
- **Graphiques recharts fonctionnels** : CA par mois (bar), commandes par semaine (line), repartition services par categorie (donut), performance equipe (horizontal bar), taux conversion (area)
- **Filtres temporels fonctionnels** : 7j / 30j / 3m / 6m / 1an
- **Feed activite recente** depuis DB

### Creation de service — wizard 7 etapes (identique freelance)
- **Copie exacte du wizard freelance** : titre/categorie → prix/description (rich text) → options → livraison express → consignes → galerie medias → publication
- **Specificites agence** : assignation a un membre de l'equipe, badge "Agence", publication sous le nom de l'agence

### Gestion des services
- **Statistiques par service depuis DB** : vues, commandes, CA, taux conversion
- **Actions fonctionnelles** : modifier (formulaire pre-rempli), pauser, dupliquer, supprimer
- **Filtres** : tous / actifs / en pause / en attente / refuses

### Gestion des commandes
- **Liste filtree depuis DB** avec pagination, tri, recherche
- **Detail commande** : timeline complete, chat integre temps reel, zone livraison fichiers, assignation membre, demande extension delai
- **Export CSV**

### Gestion de l'equipe
- **Grille de cards membres depuis DB** : photo, nom, role, statut, commandes actives, CA genere
- **Invitation par email** via Resend avec lien valide 48h
- **Roles** : Proprietaire, Manager, Freelance, Commercial
- **Profil membre** : photo de profil + couverture, competences, commandes, CA, avis, performance (graphique)

### Gestion des clients
- **Liste clients depuis DB** : nom, avatar, email, pays, premiere/derniere commande, nombre commandes, CA genere
- **Fiche client detaillee** : historique commandes, conversations, factures, notes internes

### Messagerie agence (identique freelance)
- **Messagerie temps reel** : messages texte, upload fichiers/images, messages vocaux (MediaRecorder), appels audio/video WebRTC, partage ecran, statut lu/non lu, recherche conversations
- **Etat vide propre** pour nouvel utilisateur
- **Conversations liees aux commandes**

### Finances et gains
- **Dashboard finances depuis DB** : solde disponible, en attente, CA total, commission prelevee
- **Graphique revenus recharts** : 12 derniers mois, filtres periode, comparaison periode precedente
- **Demande de retrait** : montant minimum 20€, methodes multiples (virement, PayPal, Wave, Orange Money, MTN)
- **Historique transactions** avec export CSV

### Factures
- **Generation automatique** pour chaque commande terminee
- **Template PDF professionnel** avec logo FreelanceHigh, informations agence/client, details service, montants HT/TTC/commission/net
- **Telechargement PDF instantane** via @react-pdf/renderer
- **Envoi par email** via Resend

### Avis recus (identique freelance)
- **Statistiques** : note moyenne, repartition etoiles, total avis, evolution sur 6 mois
- **Liste avis depuis DB** avec reponse possible
- **Reponse sauvegardee en DB** et visible sur profil public

### Statistiques avancees
- **10 graphiques recharts fonctionnels** : CA/mois, commandes/semaine, performance par service, performance par membre, vues profil, sources trafic, taux conversion, clients recurrents vs nouveaux, evolution note, revenus par categorie
- **Filtres temporels** et **comparaison periode precedente**
- **Export CSV et PDF**

### Boost de service (identique freelance)
- **3 options boost** : Standard (9,99€/3j), Premium (24,99€/7j), Ultime (79,99€/30j)
- **Statistiques boost** : vues, clics, commandes, ROI

### SEO services (identique freelance)
- **Score SEO calcule** (0-100) par service
- **Meta titre, description, slug, mots-cles, alt text**
- **Previsualisation SERP**

### Automatisation marketing (identique freelance)
- **Createur de scenarios visuels** avec declencheurs, conditions, actions
- **Specificites agence** : applicable a toute l'equipe ou a un membre specifique

### Litiges
- **Liste litiges depuis DB** avec filtres, timeline complete, soumission preuves, messages, decision admin

### Profil public agence
- **Photo de couverture uploadable** (1200x300px)
- **Logo, nom, slogan, localisation, site web, badge verifie, note, avis**
- **Sections** : a propos, services, portfolio, equipe (si active), stats (si actives), avis clients

### Parametres agence
- **Toutes les modifications sauvegardees en DB** : profil public, confidentialite, paiements, notifications, securite, plan/abonnement

### Communication temps reel inter-espaces
- **Socket.io** pour updates instantanees entre espaces client/agence/admin
- **Recalcul automatique des stats** a chaque transaction
- **Notifications in-app immediates** pour nouvelles commandes, messages, avis, paiements

## Capabilities

### New Capabilities
- `agence-nettoyage-donnees`: Suppression de toutes les donnees demo/mock et initialisation a zero pour nouveaux utilisateurs agence
- `agence-sidebar-navigation`: Refonte complete de la sidebar avec tous les liens visibles et scrollable
- `agence-dashboard-temps-reel`: Dashboard principal avec cartes stats calculees depuis DB et graphiques recharts fonctionnels
- `agence-creation-service-wizard`: Wizard creation de service en 7 etapes identique au freelance avec specificites agence (assignation membre, badge agence)
- `agence-gestion-services`: Page de gestion des services avec statistiques depuis DB, filtres, actions CRUD completes
- `agence-gestion-commandes`: Liste et detail des commandes avec timeline, chat integre, livraison fichiers, assignation membre
- `agence-gestion-equipe`: Gestion equipe avec invitation par email, roles, profils membres avec photo de couverture, performances
- `agence-gestion-clients`: CRM clients avec historique complet, fiches detaillees, notes internes
- `agence-messagerie`: Messagerie temps reel identique au freelance (texte, fichiers, vocal, audio/video WebRTC)
- `agence-finances`: Dashboard finances avec graphiques, demande de retrait multi-methodes, historique transactions
- `agence-factures-pdf`: Generation et telechargement de factures PDF professionnelles via react-pdf, envoi par email
- `agence-avis`: Page avis avec statistiques, liste depuis DB, reponses sauvegardees
- `agence-statistiques`: 10 graphiques recharts fonctionnels avec filtres temporels et export CSV/PDF
- `agence-boost`: Boost de services avec 3 options tarifaires, paiement Stripe, statistiques ROI
- `agence-seo`: Optimisation SEO par service avec score calcule, meta tags, previsualisation SERP
- `agence-automatisation`: Automatisation marketing avec scenarios visuels, specificites agence (equipe)
- `agence-litiges`: Gestion des litiges avec timeline, preuves, messages, decision admin
- `agence-profil-public`: Page profil public agence avec photo de couverture, sections completes
- `agence-parametres`: Parametres complets avec sauvegarde en DB (profil, confidentialite, paiements, notifications, securite, abonnement)
- `agence-communication-temps-reel`: Communication Socket.io inter-espaces avec recalcul automatique des stats et notifications immediates

### Modified Capabilities
_(aucune capability existante modifiee au niveau des requirements)_

## Impact

### Code affecte
- **34 pages dans `apps/web/app/agence/`** — refonte complete du contenu de chaque page
- **`apps/web/components/agence/AgenceSidebar.tsx`** — refonte navigation
- **`apps/web/store/`** — nouveau store Zustand dedie agence ou extension du store existant
- **`apps/web/lib/demo-data.ts`** — suppression des donnees demo agence

### APIs
- **APIs existantes dans `apps/web/app/api/`** — reutilisees et etendues pour l'espace agence (services, commandes, finances, messagerie, avis, factures)
- **Nouvelles routes API potentielles** : `/api/agency/team`, `/api/agency/clients`, `/api/agency/stats`, `/api/agency/automation`, `/api/agency/disputes`

### Dependencies
- **@react-pdf/renderer** — generation de factures PDF (deja utilise pour l'espace freelance)
- **recharts** — graphiques (deja installe)
- **Socket.io client** — communication temps reel (deja installe)

### Schema Prisma
- **Tables existantes reutilisees** : `services`, `orders`, `wallet_transactions`, `conversations`, `messages`, `reviews`, `invoices`, `notifications`
- **Tables potentiellement nouvelles ou etendues** : `agency_members` (roles, invitations), `agency_clients` (notes internes), `agency_automation_scenarios`, `disputes` (preuves, timeline)

### Impact sur les autres roles
- **Client** : les commandes de services agence suivent le meme flux que les commandes freelance — le client voit "Service par [Nom Agence]" au lieu de "Service par [Nom Freelance]"
- **Admin** : les services agence passent par le meme processus de moderation
- **Freelance** : les membres d'une agence gardent leur profil freelance individuel en parallele

### Jobs BullMQ necessaires
- Envoi email invitation membre equipe
- Envoi email notification commande agence
- Generation PDF factures agence
- Envoi email facture au client

### Handlers Socket.io necessaires
- Channel agence pour updates commandes en temps reel
- Channel agence pour notifications equipe
- Channel messagerie agence (reutilise le systeme existant)

### Templates email (React Email)
- Email invitation membre equipe
- Email notification nouvelle commande agence
- Email envoi facture agence au client
