# FreelanceHigh — Structure Complète de la Plateforme

> **Fondateur :** Lissanon Gildas — CEO & Fondateur (2026)
> **Slogan :** "La plateforme freelance qui élève votre carrière au plus haut niveau"
> **Stack :** Next.js 14 · TypeScript · Tailwind CSS · shadcn/ui · Supabase · Prisma · Socket.io · Stripe

---

## 📌 Positionnement

- **Marché cible :** Afrique francophone + diaspora + international
- **Devise par défaut :** EUR (€) avec conversion automatique
- **Devises disponibles :** EUR, FCFA, USD, GBP, MAD
- **Langues :** Français (principal), Anglais
- **Taux de conversion :**
  - 1 EUR = 655,957 FCFA
  - 1 EUR = 1,08 USD
  - 1 EUR = 0,85 GBP
  - 1 EUR = 10,95 MAD

---

## 🏗️ Architecture — 6 Espaces

```
FreelanceHigh
├── 🌐 Public (non connecté)
├── 🔐 Authentification (multi-rôles)
├── 👨‍💻 Espace Freelance
├── 💼 Espace Client
├── 🏢 Espace Agence
└── ⚙️  Espace Admin
```

---

## 🌐 1. Espace Public & Acquisition

### Pages principales

#### Landing Page (`/`)
- Hero avec slogan + CTA double (Je cherche / Je propose)
- Statistiques live (freelances actifs, € payés, pays couverts, avis)
- Catégories de services en vedette avec icônes
- Top freelances du moment
- Section "Comment ça marche" par rôle
- Témoignages vérifiés
- Section partenaires & méthodes de paiement
- Newsletter
- Sélecteur de devise dans la navbar

#### Marketplace (`/explorer`)
- Grille et vue liste des services
- Filtres avancés : catégorie, sous-catégorie, prix min/max, délai, note, pays, langue, disponibilité, fuseau horaire, niveau de vérification
- Tri : pertinence, prix croissant/décroissant, note, nouveauté, popularité
- Pagination + chargement infini
- Tags populaires
- Services boostés (mis en avant)

#### Page Détail Service (`/services/[slug]`)
- Galerie photos/vidéo
- Description complète
- 3 forfaits (Basique / Standard / Premium) : prix, délai, révisions, inclusions
- FAQ du vendeur
- Avis vérifiés avec réponses
- Profil vendeur résumé + badge
- Bouton Commander (redirige vers inscription si non connecté)
- Services similaires

#### Profil Public Freelance (`/freelances/[username]`)
- Photo, bio, titre professionnel
- Badges (Vérifié, Top Rated, Rising Talent, Pro, Elite)
- Compétences avec niveaux
- Portfolio visuel
- Tous les services publiés
- Avis reçus avec réponses
- Statistiques publiques (taux de complétion, délai moyen, clients satisfaits)
- Disponibilité et fuseau horaire
- Bouton Contacter / Commander

#### Profil Public Agence (`/agences/[slug]`)
- Logo, nom, description, secteur
- Membres de l'équipe visibles
- Réalisations collectives / portfolio agence
- Services publiés sous la marque agence
- Avis clients
- Badge "Agence Vérifiée" / "Agence Premium"
- Bouton Contacter l'agence

#### Explorateur d'Offres Clients (`/projets`)
- Liste des projets publiés par les clients
- Filtres : budget, catégorie, urgence, type de contrat, compétences
- Résumé de chaque projet (titre, budget, deadline, candidatures reçues)
- Bouton Postuler

#### Page Détail Offre Client (`/projets/[id]`)
- Description complète du projet
- Budget estimé, deadline, type de contrat
- Compétences requises
- Profil du client (réputation, projets postés, taux d'embauche)
- Formulaire de candidature : lettre de motivation + prix proposé + délai

#### Blog / Magazine (`/blog`)
- Articles sur le freelancing, conseils, success stories
- Catégories, tags, auteurs
- Commentaires
- Partage social
- Newsletter intégrée
- Montants en EUR (ex : "Comment gagner €3 000/mois depuis Dakar")

### Pages secondaires

| Route | Description |
|-------|-------------|
| `/categories` | Toutes les catégories de services |
| `/recherche` | Résultats multi-types (services, freelances, agences, projets) |
| `/tarifs` | Plans Gratuit/Pro/Business/Agence, toggle mensuel/annuel, FAQ |
| `/comment-ca-marche` | Guide complet par rôle + FAQ |
| `/confiance-securite` | Escrow, KYC, SSL, garanties, litiges |
| `/a-propos` | Histoire, équipe, mission, valeurs, presse, chiffres |
| `/contact` | Formulaire, FAQ, live chat |
| `/affiliation` | Programme de parrainage, commissions en EUR |
| `/faq` | 30 questions fréquentes |
| `/404` | Page personnalisée |
| `/maintenance` | Page de maintenance |
| `/status` | Statut en temps réel des services de la plateforme |
| `/cgu` | Conditions Générales d'Utilisation |
| `/confidentialite` | Politique RGPD complète |
| `/mentions-legales` | Informations légales |
| `/cookies` | Politique cookies |

---

## 🔐 2. Authentification (Tous rôles)

### Inscription (`/inscription`)
- Choix du rôle dès le départ : **Freelance / Client / Agence**
- Les agences ont un formulaire d'inscription dédié (nom agence, secteur, taille, SIRET optionnel)
- Email + mot de passe OU connexion sociale (Google, Facebook, LinkedIn, Apple)
- Vérification email par OTP obligatoire avant toute action

### Connexion (`/connexion`)
- Email + mot de passe
- Connexion sociale
- "Se souvenir de moi"
- Détection automatique du rôle et redirection vers le bon espace

### Onboarding par rôle (wizard 4 étapes)
- **Freelance :** profil de base → compétences → premier service → publication
- **Client :** profil entreprise → premier projet ou exploration → méthode de paiement → confirmation
- **Agence :** infos agence → membres fondateurs → premier service agence → vérification

### Sécurité
- Mot de passe oublié par email (`/mot-de-passe-oublie`)
- Double authentification (2FA) : Google Authenticator ou SMS
- Sessions actives avec révocation possible

### KYC progressif (par niveaux)
- **Niveau 1 :** email vérifié → accès de base
- **Niveau 2 :** téléphone vérifié → envoyer des offres, commander
- **Niveau 3 :** pièce d'identité → retirer des fonds, publier des services
- **Niveau 4 :** vérification professionnelle → badge Elite, limites relevées

### Démo rapide
- Accès démo sans inscription pour Freelance / Client / Agence / Admin
- Données fictives réalistes pour tester la plateforme

---

## 👨‍💻 3. Espace Freelance (`/dashboard`)

### Dashboard principal
- Revenus du mois avec graphique de progression
- Commandes actives avec statuts
- Messages non lus
- Vues du profil (semaine / mois)
- Taux de complétion des commandes
- Alertes importantes (délai proche, révision demandée, paiement reçu)
- Recommandations IA (services à améliorer, projets à postuler)

### Mes Services (`/dashboard/services`)
- Liste de tous ses services avec statistiques (vues, clics, commandes, taux de conversion, revenus)
- Actions : créer, modifier, mettre en pause, dupliquer, supprimer
- **Wizard de création en 4 étapes :**
  - Étape 1 — Informations : titre, catégorie, sous-catégorie, tags, description
  - Étape 2 — Forfaits : Basique / Standard / Premium (prix, délai, révisions, inclusions)
  - Étape 3 — Extras & FAQ : options payantes additionnelles, questions fréquentes
  - Étape 4 — Galerie & Publication : photos/vidéo, prévisualisation, publier
- Optimisation SEO du service (titre optimisé, mots-clés, meta description)
- Boost publicitaire interne (mettre en avant dans la marketplace)

### Commandes (`/dashboard/commandes`)
- Vue filtrée : en cours / livrées / révision / annulées / litiges
- **Page de détail d'une commande :**
  - Chat intégré avec le client
  - Espace de livraison de fichiers
  - Timeline des étapes
  - Historique des révisions
  - Demande d'extension de délai
  - Marquer comme livré
- Commandes récurrentes (abonnements mensuels avec un client fixe)

### Candidatures (`/dashboard/candidatures`)
- Explorer les projets publiés par les clients
- Postuler avec lettre de motivation + prix proposé + délai
- Suivi des candidatures (en attente, vue, acceptée, refusée)
- Filtres sur les projets (budget, catégorie, urgence)

### Offres Personnalisées (`/dashboard/offres`)
- Créer une offre sur mesure pour un client spécifique
- Montant, délai, révisions, description
- Durée de validité de l'offre
- Historique des offres envoyées avec statuts
- Relance automatique avant expiration

### Gains & Finances (`/dashboard/finances`)
- Solde disponible / en attente / total gagné
- Demande de retrait : Mobile Money (Orange, Wave, MTN), virement SEPA, PayPal, Wise, crypto
- Méthodes de paiement sauvegardées
- Factures automatiques générées (téléchargeables en PDF)
- Simulation fiscale indicative (revenus bruts → nets)

### Statistiques (`/dashboard/statistiques`)
- Graphiques de revenus (mensuel / annuel / personnalisé)
- Performances des services : vues, conversions, abandons
- Comparaison avec la période précédente
- Classement dans sa catégorie
- Rapport exportable (CSV / PDF)

### Mon Profil (`/dashboard/profil`)
- Infos personnelles : prénom, nom, photo, bio, ville, pays
- Profil professionnel : titre, description, tarif horaire
- Compétences avec niveaux (débutant / intermédiaire / expert)
- Formation & certifications (avec justificatifs uploadables)
- Langues parlées avec niveaux
- Liens externes : LinkedIn, GitHub, Behance, portfolio
- Barre de complétion du profil avec suggestions

### Portfolio (`/dashboard/portfolio`)
- Ajouter des projets : titre, description, images, lien, catégorie, compétences utilisées
- Gérer / Réorganiser / Supprimer
- Mise en avant de 3 projets en "coup de cœur"

### Avis (`/dashboard/avis`)
- Tous les avis reçus avec note globale (qualité, communication, délai)
- Répondre publiquement aux avis
- Signaler un avis abusif

### Disponibilité (`/dashboard/disponibilite`)
- Calendrier de disponibilité (jours/heures)
- Mode vacances : pause automatique de tous les services
- Disponible pour missions urgentes (badge spécial)

### Certifications IA (`/dashboard/certifications`)
- Tests de compétences techniques surveillés par IA
- Certifications validées affichées en badge sur le profil
- Catalogue : développement, design, rédaction, marketing, etc.

### Outils de productivité (`/dashboard/productivite`)
- Timer Pomodoro intégré
- Journal d'activité quotidien
- Preuve de travail (captures horodatées pour missions à l'heure)

### Abonnement (`/dashboard/abonnement`)
- Plan actuel (Gratuit / Pro / Business)
- Fonctionnalités et limites de chaque plan
- Changer de plan
- Historique de facturation

### Paramètres (`/dashboard/parametres`)
- Préférences : langue, devise, thème clair/sombre
- Notifications : email / push / SMS par type d'événement, fréquence
- Confidentialité : visibilité du profil (public / connexions / privé)
- Sécurité : mot de passe, 2FA, sessions actives avec révocation
- Méthodes de paiement sauvegardées
- Clés API & Webhooks (plan Business)
- Supprimer le compte

---

## 💼 4. Espace Client (`/client`)

### Dashboard (`/client/dashboard`)
- Projets actifs avec barre de progression
- Dernières commandes et leur statut
- Freelances et agences favoris
- Dépenses du mois avec graphique
- Recommandations de freelances basées sur l'historique

### Publier une Offre (`/client/projets/nouveau`)
- Wizard complet :
  - Titre et catégorie
  - Description détaillée du besoin
  - Budget : fixe ou horaire (min/max)
  - Délai souhaité
  - Compétences requises (avec niveau)
  - Fichiers joints : brief, maquettes, documents de référence
  - Visibilité : public / privé / restreint à des pays
  - Urgence : normale / urgente / très urgente
  - Type de contrat : ponctuel / long terme / récurrent
  - Prévisualisation avant publication

### Mes Projets (`/client/projets`)
- Liste des offres actives, closes, en brouillon
- Candidatures reçues par projet avec profils résumés
- Filtrer / trier les candidatures (note, prix, délai, expérience)
- Accepter / Refuser / Mettre en favoris une candidature
- Contacter directement un candidat
- Marquer un projet comme pourvu ou annuler

### Mes Commandes (`/client/commandes`)
- Toutes les commandes actives et historiques
- Suivre l'avancement en temps réel
- Valider la livraison / Demander une révision (avec commentaires) / Ouvrir un litige
- Télécharger les livrables

### Explorer Freelances & Agences (`/client/explorer`)
- Recherche avec filtres avancés (compétences, note, prix, disponibilité, pays, type : freelance ou agence)
- Vue profil complet, portfolio, avis
- Envoyer un message direct
- Inviter à postuler sur un projet publié

### Recherche Intelligente IA (`/client/recherche-ia`)
- Moteur de recherche sémantique (NLP)
- Le client décrit son besoin en langage naturel
- L'IA suggère les services, freelances et agences les plus pertinents
- Suggestions affinées selon l'historique d'achats

### Favoris (`/client/favoris`)
- Freelances favoris organisés en listes
- Services sauvegardés
- Agences favorites

### Messages (`/client/messages`)
- Messagerie unifiée avec tous les prestataires
- Lien vers la commande associée

### Factures & Paiements (`/client/factures`)
- Toutes les factures reçues (téléchargeables en PDF)
- Historique des paiements par projet
- Méthodes de paiement : carte, Mobile Money, virement
- Solde et crédits FreelanceHigh
- Rapport de dépenses exportable

### Avis laissés (`/client/avis`)
- Historique des évaluations données aux freelances et agences
- Modifier un avis dans les 7 jours suivant la commande

### Profil Entreprise (`/client/profil`)
- Nom, logo, description, site web
- Secteur d'activité, taille d'équipe
- Visible des freelances pour rassurer sur le sérieux

### Paramètres (`/client/parametres`)
- Identiques à l'espace Freelance

---

## 🏢 5. Espace Agence (`/agence`)

> Les agences s'inscrivent avec un compte dédié (rôle "Agence") dès l'inscription. Elles ont accès à un espace distinct avec des outils de gestion collective.

### Inscription & Profil Agence
- Formulaire dédié : nom agence, secteur, taille, description, logo, site web, pays, SIRET (optionnel)
- Profil public agence avec page dédiée
- Badge "Agence Vérifiée" après validation KYC agence
- Affichage des membres de l'équipe (avec leur consentement)

### Dashboard Agence (`/agence/dashboard`)
- CA mensuel global avec graphique d'évolution
- Projets actifs et en attente
- Clients actifs
- Membres de l'équipe et leur taux d'occupation
- Commandes en cours par membre
- Alertes importantes (délai proche, litige, paiement reçu)

### Gestion de l'Équipe (`/agence/equipe`)
- Liste des membres avec statuts
- Inviter un freelance par email (il garde son profil individuel)
- Définir les rôles : Admin agence / Manager / Freelance membre / Commercial
- Taux d'occupation par membre (% de temps disponible)
- Assigner une commande ou un projet à un membre
- Suivi de la charge de travail par membre
- Retirer un membre de l'agence

### CRM Clients (`/agence/clients`)
- Liste des clients de l'agence avec historique complet
- Notes internes par client
- Rappels et suivi de relance
- Ajouter un client externe manuellement
- Pipeline commercial visuel (prospect → devis → commande → livré)

### Projets Agence (`/agence/projets`)
- Projets complexes impliquant plusieurs membres
- Vue Kanban (par statut)
- Vue Calendrier (par deadline)
- Vue Liste (exportable)
- Suivi de l'avancement global et par membre
- Gestion des jalons / milestones par étape
- Commentaires internes sur les projets

### Services de l'Agence (`/agence/services`)
- Services publiés sous le nom et la marque de l'agence
- Wizard de création identique à l'espace Freelance
- Stats de performance par service agence

### Commandes Agence (`/agence/commandes`)
- Toutes les commandes issues des services agence
- Assignation à un membre de l'équipe
- Suivi global et détaillé par commande

### Finances Agence (`/agence/finances`)
- CA global avec graphiques mensuels/annuels
- Revenus par membre (contribution individuelle)
- Commission interne de l'agence (paramétrable en %)
- Facturation clients externes
- Demande de retrait collectif
- Rapport financier exportable (CSV / PDF)

### Ressources & Médias (`/agence/ressources`)
- Cloud partagé pour fichiers lourds (assets, briefs, livrables)
- Dossiers organisés par projet / client / catégorie
- Accessible à toute l'équipe selon les permissions
- Quota de stockage selon le plan

### Contrats (`/agence/contrats`)
- Templates de contrats personnalisables (mission, prestation, NDA)
- Génération automatique basée sur les détails du projet
- Signature électronique intégrée
- Archivage et historique des contrats signés

### Sous-traitance (`/agence/sous-traitance`)
- Trouver des freelances externes sur la plateforme
- Passer une commande depuis l'espace agence
- Suivi des missions sous-traitées
- Facturation automatique agence → client avec marges

### Analytics Agence (`/agence/analytics`)
- Performance de l'équipe (commandes livrées, note moyenne, délai moyen)
- Satisfaction clients (NPS score)
- Revenus par catégorie de service
- Comparaisons de périodes
- Rapport de performance exportable

### Messagerie Agence (`/agence/messages`)
- Canaux internes (par projet)
- Messagerie externe avec les clients
- Traduction temps réel (FR ↔ EN ↔ AR)
- Convertisseur de devises intégré dans le chat
- Notifications par membre

### Paramètres Agence (`/agence/parametres`)
- Informations de l'agence (logo, description, contacts)
- Gestion des rôles et permissions des membres
- Plan d'abonnement agence
- Méthodes de paiement et retrait
- Notifications
- Clés API (plan Business)

---

## ⚙️ 6. Espace Admin (`/admin`)

### Dashboard Global (`/admin/dashboard`)
- Métriques temps réel : utilisateurs totaux, GMV, commandes actives, commissions perçues, litiges ouverts
- Graphiques interactifs (revenus, inscriptions, conversions)
- Alertes automatiques (anomalie financière, litige urgent, service signalé, tentative de fraude)
- Carte du monde avec activité par pays

### Gestion des Utilisateurs (`/admin/utilisateurs`)
- Liste filtrée par rôle (freelance, client, agence), statut, pays, date
- Accès au profil complet
- Actions : vérifier, suspendre, bannir, envoyer un message
- Impersonation : se connecter en tant que n'importe quel utilisateur
- Historique des actions admin sur chaque compte

### Vérifications KYC (`/admin/kyc`)
- File d'attente des demandes par niveau
- Documents soumis avec visualisation
- Interface d'approbation / rejet avec motif détaillé
- Historique des décisions par opérateur admin

### Modération des Services (`/admin/services`)
- Nouveaux services en attente d'approbation
- Services signalés par des utilisateurs
- Interface de review : approuver / demander modification / refuser / supprimer
- Modération des profils agence

### Gestion des Commandes (`/admin/commandes`)
- Vue de toutes les commandes de la plateforme
- Filtres avancés (statut, montant, date, rôle)
- Intervenir manuellement si nécessaire

### Litiges (`/admin/litiges`)
- File des litiges triée par urgence et ancienneté
- Timeline complète des échanges entre parties
- Accès aux preuves (captures, fichiers soumis)
- Interface de verdict : en faveur du freelance / du client / remboursement partiel
- Historique des litiges résolus avec verdicts
- Statistiques des litiges (taux, causes, temps de résolution)

### Transactions & Finance (`/admin/finances`)
- Toutes les transactions de la plateforme
- Fonds en escrow par commande
- Valider / Bloquer un paiement
- Gérer les remboursements
- Commissions perçues par période
- Paiements en attente de virement
- Rapports financiers exportables

### Blog & Contenu (`/admin/blog`)
- Éditeur d'articles rich text (avec médias)
- Gestion des catégories et tags
- Programmer une publication
- Gérer les auteurs
- Statistiques de lecture par article

### Catégories & Tags (`/admin/categories`)
- CRUD complet sur les catégories de services et sous-catégories
- Définir l'ordre d'affichage et les catégories mises en avant
- Tags populaires et tendances

### Plans & Commissions (`/admin/plans`)
- Modifier les taux de commission par plan
- Modifier les fonctionnalités et limites de chaque plan
- Gérer les codes promotionnels (conditions, expirations, limites d'usage)
- Créer des offres spéciales temporaires

### Notifications & Emailing (`/admin/notifications`)
- Envoyer une notification ciblée (tous les utilisateurs, un segment, un rôle, un pays)
- Créer des campagnes email
- Gérer les templates d'emails transactionnels
- Statistiques d'ouverture et de clics

### Analytics Plateforme (`/admin/analytics`)
- Trafic et inscriptions par source, pays, rôle
- Conversions par étape du tunnel
- Revenus par catégorie, pays, devise, période
- Cohortes d'utilisateurs (rétention)
- Rapports exportables (CSV, PDF)

### Configuration Plateforme (`/admin/configuration`)
- Nom, logo, couleurs, langues actives
- Devises disponibles et taux de conversion
- Modes de paiement activés/désactivés
- Mode maintenance avec message personnalisé
- Configuration des emails transactionnels
- Règles de modération automatique

---

## 🤝 7. Fonctionnalités Transversales

### Messagerie Temps Réel (tous les rôles)
- Chat moderne avec indicateurs de lecture et de frappe
- Conversations individuelles et de groupe
- Pièces jointes : images, fichiers, PDF, vidéos
- Historique persistant lié aux commandes
- Notifications push
- Traduction automatique en temps réel (FR ↔ EN ↔ AR)
- Convertisseur de devises intégré dans le chat

### Générateur de Contrats par IA
- Génération automatique basée sur les détails de la commande
- Clauses : parties, prestations, montants, délais, révisions, propriété intellectuelle, confidentialité
- Entièrement personnalisable
- Signature électronique intégrée
- Archivage sécurisé

### Automatisation des Workflows
- Règles logiques paramétrables par l'utilisateur
- Exemples :
  - "Si commande acceptée → envoyer message de bienvenue"
  - "Si délai dans 24h → notifier"
  - "Si client inactif depuis 3j → relancer"
- Bibliothèque de templates de workflows
- Réponses automatiques aux messages fréquents

### Espace de Co-working Collaboratif
- Édition partagée de documents (type Notion)
- Utilisé pour les briefs, cahiers des charges, livrables
- Commentaires et historique de versions
- Partage avec permission (lecture / édition)

---

## 💰 8. Finances, Paiements & Sécurité

### Système de Devises
- Devise par défaut : EUR (€) partout sur le site
- Sélecteur visible dans la navbar, le footer et les paramètres
- Conversion en temps réel (taux mis à jour régulièrement)
- Préférence sauvegardée en localStorage + profil utilisateur
- Tous les montants se mettent à jour instantanément

### Méthodes de Paiement
- Carte bancaire (Visa, Mastercard) via Stripe
- CinetPay (paiement africain)
- Orange Money
- Wave
- MTN Mobile Money
- PayPal
- Virement bancaire SEPA
- USDC / USDT (crypto stablecoins)

### Système Escrow (Séquestre)
- À la commande : fonds bloqués automatiquement
- À la livraison validée : fonds libérés dans le portefeuille freelance
- En cas de litige : fonds gelés jusqu'à résolution admin
- Suivi visuel du statut des fonds pour les deux parties
- Suivi blockchain optionnel (Ethereum)

### Portefeuille Multi-devises
- Soldes en EUR, FCFA, USD, GBP, MAD
- Conversion entre devises avec taux en temps réel
- Historique complet par devise
- Retraits vers Mobile Money, virement, PayPal, Wise, crypto

### Journal de Sécurité & Audit
- Log complet de toutes les actions du compte
- Alertes de connexion depuis un appareil inconnu
- Révocation de sessions à distance

### Clés API & Webhooks (plan Business)
- Génération et révocation de clés API
- Configuration de webhooks (Slack, Zapier, n8n, etc.)
- Documentation API complète avec exemples

---

## 📋 9. Plans d'Abonnement

| | Gratuit | Pro | Business | Agence |
|---|---|---|---|---|
| **Prix** | €0/mois | €15/mois | €45/mois | €99/mois |
| **Commission** | 20% | 15% | 10% | 8% |
| **Services actifs** | 3 | 15 | Illimité | Illimité |
| **Candidatures/mois** | 5 | 20 | Illimité | Illimité |
| **Boost publicitaire** | Non | 1/mois | 5/mois | 10/mois |
| **Certification IA** | Non | Oui | Oui | Oui |
| **Clés API** | Non | Non | Oui | Oui |
| **Membres équipe** | — | — | — | 20 max |
| **Stockage ressources** | — | — | — | 50 GB |

---

## 📧 10. Emails Transactionnels (liste complète)

- Confirmation d'inscription + OTP
- Email de bienvenue (onboarding)
- Confirmation commande (client + freelance)
- Nouveau message reçu
- Livraison effectuée par le freelance
- Révision demandée par le client
- Commande validée → fonds libérés
- Litige ouvert
- Verdict litige rendu
- Retrait demandé
- Retrait disponible sur le compte
- Rappel : délai de livraison dans 24h
- Rappel : livraison en attente de validation depuis 3 jours
- Nouvelle candidature reçue (client)
- Candidature acceptée (freelance)
- Offre personnalisée reçue (client)
- Facture mensuelle abonnement
- Renouvellement abonnement à venir
- Alerte connexion depuis un nouvel appareil
- Code 2FA
- Réinitialisation de mot de passe
- KYC approuvé / refusé
- Service approuvé / refusé par la modération
- Nouveau membre invité dans une agence

---

## 🔗 11. Récapitulatif Fonctionnalités Transversales

| Fonctionnalité | Détail |
|---|---|
| **Système de devises** | EUR par défaut, sélecteur partout, conversion temps réel |
| **Notifications** | In-app, email, SMS, push navigateur — paramétrable finement |
| **Recherche globale** | Full-text sur services, freelances, agences, projets, articles |
| **Évaluations double sens** | Client évalue le freelance ET le freelance évalue le client |
| **Système de badges** | Vérifié, Top Rated, Rising Talent, Pro, Elite, Agence Vérifiée |
| **Multi-langues** | Français principal, Anglais complet, extensible |
| **Thème clair/sombre** | Toggle dans les paramètres |
| **Responsive & Mobile-first** | Toutes les pages fonctionnent sur mobile |
| **PWA** | Installation sur écran d'accueil possible |
| **SEO** | Sitemap dynamique, meta tags, URLs propres, Schema.org |
| **Programme d'affiliation** | Lien de parrainage unique, commissions en EUR |
| **Support** | Live chat widget, système de tickets, FAQ indexée |
| **Partage social** | Partager un service ou profil sur les réseaux |
| **Calendrier** | Disponibilités freelances, deadlines projets |
| **Rappels automatiques** | Délai proche, livraison en attente, client inactif |
| **Politique d'annulation** | Règles claires (délai, pénalités, impact sur le badge) |
| **Politique de contenu interdit** | Liste des services interdits encodée dans la modération |
| **Page de statut** | status.freelancehigh.com — état des services en temps réel |
| **Onboarding gamifié** | Barre de complétion profil avec % et actions suggérées |
| **Mode comparaison** | Comparer 2-3 freelances ou services côte à côte |

---

## 🛠️ 12. Stack Technique

```
FRONTEND              BACKEND                  INFRA
Next.js 14            Node.js                  Vercel / Railway
TypeScript            Express / Fastify        PostgreSQL (Supabase)
Tailwind CSS          Prisma ORM               Redis (cache + sessions)
shadcn/ui             Socket.io (WebSocket)    Cloudinary (médias)
Zustand               NextAuth.js              Resend (emails)
React Query           Stripe Connect           Algolia (recherche)
                      CinetPay API             Sentry (monitoring)
                      OpenAI API (IA)          Ethereum (escrow optionnel)
```

---

---

# 🗓️ Plan de Versions — MVP → V4

> **Principe directeur :** Chaque version doit être utilisable et génératrice de valeur seule, sans attendre la suivante.

---

## 🟥 MVP — "Ça marche, on peut gagner de l'argent"

> **Objectif :** Prouver que la plateforme fonctionne. Un freelance peut vendre, un client peut acheter, une agence peut exister, l'argent circule.
> **Durée estimée :** Mois 1–3

### Public & Auth
- [ ] Landing page (version simplifiée)
- [ ] Inscription / Connexion (email + mot de passe)
- [ ] Choix du rôle à l'inscription : Freelance / Client / Agence
- [ ] Formulaire d'inscription dédié pour les agences (nom, secteur, taille, logo)
- [ ] Vérification email (OTP)
- [ ] Onboarding basique par rôle (2 étapes)
- [ ] Sélecteur de devise (EUR par défaut)

### Espace Freelance (MVP)
- [ ] Dashboard simple (commandes actives, revenus du mois)
- [ ] Créer / modifier / supprimer un service (wizard 4 étapes)
- [ ] Mettre en pause un service
- [ ] Gérer ses commandes (en cours, livré, annulé)
- [ ] Livraison de fichiers dans la commande
- [ ] Profil public basique (bio, compétences, services)
- [ ] Portefeuille (solde disponible, en attente)
- [ ] Retrait basique (virement SEPA)

### Espace Client (MVP)
- [ ] Dashboard simple (commandes actives, dépenses)
- [ ] Commander un service (avec les 3 forfaits)
- [ ] Suivre sa commande (valider / demander révision)
- [ ] Paiement par carte (Stripe)
- [ ] Profil entreprise basique

### Espace Agence (MVP)
- [ ] Inscription en tant qu'agence (formulaire dédié)
- [ ] Profil public agence (logo, description, secteur)
- [ ] Publier des services sous la marque agence (wizard identique freelance)
- [ ] Gérer les commandes agence
- [ ] Inviter des membres par email (rôles basiques : Admin / Membre)
- [ ] Dashboard agence minimal (CA, commandes, membres)

### Finance (MVP)
- [ ] Escrow basique (blocage à la commande, libération à la validation)
- [ ] Devise EUR par défaut partout
- [ ] Factures PDF automatiques
- [ ] Paiement par carte (Stripe)

### Admin (MVP)
- [ ] Dashboard admin minimal (utilisateurs, commandes, revenus)
- [ ] Approuver / suspendre / bannir un utilisateur
- [ ] Voir toutes les commandes
- [ ] Approuver les services avant publication

---

## 🟧 V1 — "On peut trouver du travail et en donner"

> **Objectif :** Activer le matching. Les freelances trouvent des clients, les clients trouvent des freelances et des agences.
> **Durée estimée :** Mois 4–6

### Public (V1)
- [ ] Marketplace complète (filtres avancés, tri, pagination, vue grille/liste)
- [ ] Page détail service complète (galerie, avis, forfaits, FAQ vendeur)
- [ ] Profils publics complets (freelance + agence)
- [ ] Explorateur d'offres / projets clients
- [ ] Sélecteur de devise fonctionnel (EUR, FCFA, USD, GBP, MAD)
- [ ] Conversion automatique des prix selon la devise choisie
- [ ] Connexion sociale (Google, LinkedIn)
- [ ] Blog basique (liste d'articles, page article)

### Freelance (V1)
- [ ] Candidatures aux offres clients (lettre + prix + délai)
- [ ] Suivi des candidatures (en attente, vue, acceptée, refusée)
- [ ] Offres personnalisées (devis sur mesure pour un client spécifique)
- [ ] Statistiques de base (vues, commandes, taux de conversion)
- [ ] Mode vacances + calendrier de disponibilité
- [ ] Portfolio enrichi (projets avec images, lien, compétences)
- [ ] Barre de complétion du profil avec suggestions

### Client (V1)
- [ ] Publier une offre / projet (wizard complet)
- [ ] Gérer les candidatures reçues (accepter / refuser / contacter)
- [ ] Explorer les freelances ET les agences avec filtres avancés
- [ ] Favoris (freelances + services + agences)
- [ ] Messagerie basique (avant commande)

### Agence (V1)
- [ ] Dashboard agence complet (CA, projets actifs, membres, graphiques)
- [ ] Gestion de l'équipe complète (inviter, rôles détaillés, taux d'occupation, assigner)
- [ ] Projets agence (vue liste + Kanban)
- [ ] Sous-traitance (passer commande depuis l'espace agence)
- [ ] Profil public agence complet (équipe visible, portfolio agence)

### Finance (V1)
- [ ] Paiements Mobile Money (Orange Money, Wave)
- [ ] Méthodes de retrait multiples (PayPal, Wise)
- [ ] Portefeuille multi-devises (soldes en EUR, FCFA, USD)

### Admin (V1)
- [ ] Modération des services (approuver, refuser, signalements)
- [ ] Gestion des litiges basique (verdict simple)
- [ ] Blog & contenu (éditeur, catégories, publication, programmation)
- [ ] Catégories & tags (CRUD)
- [ ] Plans & commissions paramétrables

---

## 🟨 V2 — "On peut collaborer et avoir confiance"

> **Objectif :** Installer la confiance et la collaboration. Les utilisateurs restent, ils reviennent.
> **Durée estimée :** Mois 7–10

### Messagerie (V2)
- [ ] Messagerie temps réel complète (WebSocket / Socket.io)
- [ ] Pièces jointes (images, fichiers, PDF)
- [ ] Notifications push
- [ ] Historique persistant lié aux commandes
- [ ] Messagerie interne agence (canaux par projet)

### Confiance & Vérification (V2)
- [ ] KYC complet par niveaux (email → téléphone → identité → pro)
- [ ] Badges (Vérifié, Top Rated, Rising Talent, Pro, Elite, Agence Vérifiée)
- [ ] Évaluations double sens (client évalue freelance + freelance évalue client)
- [ ] Réponses publiques aux avis
- [ ] Signalement d'avis abusifs

### Agence (V2)
- [ ] CRM léger (liste clients, historique, notes, relances)
- [ ] Pipeline commercial visuel (prospect → devis → commande → livré)
- [ ] Finances agence complètes (CA par membre, commission interne paramétrable)
- [ ] Gestionnaire de ressources / cloud partagé (dossiers par projet)
- [ ] Contrats avec templates + signature électronique

### Notifications complètes (V2)
- [ ] Tous les emails transactionnels (liste complète définie ci-dessus)
- [ ] Notifications in-app, email, SMS paramétrables finement
- [ ] Rappels automatiques (délai proche, livraison en attente, inactivité)
- [ ] Alertes de connexion depuis un appareil inconnu

### Admin (V2)
- [ ] KYC complet : file d'attente, approbation par niveau, historique
- [ ] Analytics plateforme (trafic, inscriptions, conversions, revenus par pays)
- [ ] Notifications & emailing ciblés (campagnes, segments)
- [ ] Impersonation utilisateur (connexion en tant que, pour support)
- [ ] Statistiques litiges (taux, causes, temps de résolution)

---

## 🟦 V3 — "L'IA travaille pour toi"

> **Objectif :** Automatiser, personnaliser, différencier la plateforme de la concurrence.
> **Durée estimée :** Mois 11–15

### Intelligence Artificielle (V3)
- [ ] Recherche sémantique NLP (décrire son besoin en langage naturel)
- [ ] Recommandations personnalisées (freelances, services, projets)
- [ ] Certifications IA (tests de compétences surveillés, badges validés)
- [ ] Optimisation SEO des services assistée par IA
- [ ] Réponses automatiques intelligentes aux messages fréquents

### Contrats & Juridique (V3)
- [ ] Générateur de contrats par IA (basé sur les détails de la commande)
- [ ] Signature électronique intégrée
- [ ] Templates personnalisables (mission, prestation, NDA)
- [ ] Archivage sécurisé

### Automatisation Workflows (V3)
- [ ] Règles logiques paramétrables (si X → alors Y)
- [ ] Bibliothèque de templates de workflows
- [ ] Intégration Zapier / n8n via webhooks
- [ ] Espace de co-working collaboratif (édition partagée de documents)

### Productivité Freelance (V3)
- [ ] Timer Pomodoro + journal d'activité
- [ ] Preuve de travail (captures horodatées)
- [ ] Commandes récurrentes (abonnements mensuels client → freelance)
- [ ] Simulation fiscale indicative (revenus bruts → nets)

### Agence (V3)
- [ ] Gestion des jalons / milestones dans les projets
- [ ] NPS automatique pour mesurer la satisfaction clients
- [ ] Traduction temps réel dans le chat (FR ↔ EN ↔ AR)
- [ ] Convertisseur de devises intégré dans la messagerie

### Admin (V3)
- [ ] Modération automatique par règles configurables
- [ ] Carte du monde avec activité par pays
- [ ] Rapports financiers avancés exportables
- [ ] Statistiques d'ouverture et clics des emails

---

## 🟩 V4 — "La plateforme s'intègre partout"

> **Objectif :** Ouvrir la plateforme vers l'extérieur, fidéliser sur mobile, activer les développeurs.
> **Durée estimée :** Mois 16–20

### Mobile & PWA (V4)
- [ ] PWA installable (écran d'accueil iOS et Android)
- [ ] UI optimisée mobile (navigation, commandes, messagerie)
- [ ] Notifications push natives mobile

### Web3 & Crypto (V4)
- [ ] Paiements en USDC / USDT
- [ ] Escrow optionnel sur blockchain Ethereum
- [ ] Portefeuille Web3 intégré

### API Publique (V4)
- [ ] Clés API pour plans Business et Agence
- [ ] Documentation API complète avec exemples et sandbox
- [ ] Webhooks configurables

### Affiliation & Croissance (V4)
- [ ] Programme d'affiliation complet (lien unique, commissions en EUR, tableau de bord)
- [ ] Mode comparaison (2-3 freelances ou services côte à côte)
- [ ] Partage social enrichi (carte visuelle de service à partager)
- [ ] Page de statut (status.freelancehigh.com — état en temps réel)

---

## ⛔ Hors-périmètre (pour l'instant)

> Fonctionnalités intéressantes mais qui dilueraient le focus ou nécessitent une maturité produit plus grande.

- Application native iOS / Android (→ la PWA couvre le besoin au départ)
- Marketplace de formations / e-learning
- Espace communautaire / forum
- Système d'enchères sur les projets
- Visioconférence intégrée (→ renvoyer vers Zoom / Google Meet)
- Marketplace de produits physiques livrés
- Assurance freelance
- Carte FreelanceHigh (carte bancaire physique)
- Facturation automatique conforme à chaque législation africaine
- IA générative de contenu pour les clients (rédaction automatique de briefs)

---

## 📊 Résumé des Versions

| Version | Durée | Ce que ça débloque |
|---|---|---|
| **MVP** | Mois 1–3 | Vendre, acheter, encaisser. Les 3 rôles existent. |
| **V1** | Mois 4–6 | Matching freelance ↔ client ↔ agence. Marketplace complète. |
| **V2** | Mois 7–10 | Confiance, messagerie, KYC, rétention. |
| **V3** | Mois 11–15 | IA, automatisation, contrats, différenciation. |
| **V4** | Mois 16–20 | PWA mobile, Web3, API publique, affiliation. |

---

*© 2026 FreelanceHigh. Tous droits réservés. Fondée par Lissanon Gildas.*