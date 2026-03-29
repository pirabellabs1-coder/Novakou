## 1. Nettoyage donnees demo et fondation

- [x] 1.1 Auditer et supprimer tous les imports de `demo-data.ts`, `platform-data.ts`, et `lib/dev/` dans toutes les pages sous `apps/web/app/agence/` — remplacer par des appels API via fetch ou TanStack Query
- [x] 1.2 Supprimer tous les chiffres hardcodes, noms fictifs, avatars statiques, et compteurs statiques dans chaque page de l'espace agence — garantir que toutes les valeurs viennent de l'API
- [x] 1.3 Creer un store Zustand `apps/web/store/agency.ts` pour l'etat UI specifique a l'agence (equipe, clients CRM, filtres actifs, modales) — reutiliser `messaging.ts`, `service-wizard.ts`, `call.ts` pour les fonctionnalites partagees
- [x] 1.4 Implementer des etats vides propres (empty states) avec message explicatif et CTA pour chaque liste vide et chaque graphique sans donnees dans l'espace agence

## 2. Sidebar navigation complete

- [x] 2.1 Refondre `apps/web/components/agence/AgenceSidebar.tsx` — afficher TOUS les liens de navigation sans sections collapsibles cachees par defaut, dans l'ordre : Dashboard, Equipe, Services, Commandes, Clients, Messages, Finances, Factures, Avis, Statistiques, Boost, SEO, Automatisation, Litiges, Aide, Parametres
- [x] 2.2 Ajouter le scroll vertical a la sidebar si le contenu depasse la hauteur de l'ecran (overflow-y-auto)
- [x] 2.3 Ajouter en bas de la sidebar : logo de l'agence (depuis API), nom de l'agence, badge plan actuel (Gratuit/Pro/Business/Agence), lien vers profil, bouton deconnexion fonctionnel
- [x] 2.4 Verifier que chaque lien de la sidebar navigue vers la bonne page sans erreur 404

## 3. Dashboard principal avec donnees temps reel

- [x] 3.1 Connecter les 6 cartes statistiques du dashboard (`/agence`) aux APIs : CA total via `/api/finances/summary`, commandes actives via `/api/orders?status=active`, membres equipe via `/api/agency/team`, note moyenne via `/api/reviews`, services actifs via `/api/services?status=active`, taux de conversion via `/api/stats`
- [x] 3.2 Implementer 5 graphiques recharts fonctionnels avec donnees reelles : BarChart CA par mois (12 mois), LineChart commandes par semaine, PieChart repartition services par categorie, BarChart horizontal performance equipe, AreaChart taux de conversion
- [x] 3.3 Ajouter les filtres temporels fonctionnels (7j / 30j / 3m / 6m / 1an) qui rechargent les donnees des graphiques via l'API
- [x] 3.4 Implementer le feed d'activite recente depuis l'API avec items cliquables (nouvelle commande → `/agence/commandes/[id]`, membre ajoute → `/agence/equipe`, service approuve → `/agence/services`, avis recu → `/agence/avis`, paiement libere → `/agence/finances`)
- [x] 3.5 Ajouter le refetch automatique des cartes statistiques toutes les 60 secondes via TanStack Query `refetchInterval`

## 4. Wizard creation de service 7 etapes

- [x] 4.1 Adapter le wizard de creation de service existant (`/dashboard/services/creer`) pour l'espace agence (`/agence/services/creer`) — reutiliser le store `service-wizard.ts` et les memes composants avec le contexte agence
- [x] 4.2 Ajouter a l'etape 7 (publication) un selecteur de membre de l'equipe pour assigner le service — charger la liste des membres depuis l'API
- [x] 4.3 Ajouter le flag `isAgency: true` et le `agencyId` lors de la publication du service via l'API `/api/services/publish`
- [x] 4.4 Verifier que le service publie affiche le badge "Agence" et le nom de l'agence (pas le nom du membre) dans le feed et le profil public
- [x] 4.5 Verifier que l'editeur rich text de l'etape 2 (description) supporte : gras, italique, listes, tableaux, couleurs, taille de police — identique au wizard freelance

## 5. Gestion des services

- [x] 5.1 Connecter la page `/agence/services` a l'API `/api/services` filtree par l'agence — afficher les 4 cartes statistiques (total services, actifs, CA total, taux conversion moyen) calculees depuis l'API
- [x] 5.2 Implementer les filtres fonctionnels : Tous / Actifs / En pause / En attente / Refuses — qui filtrent la liste en appelant l'API avec le parametre `status`
- [x] 5.3 Pour chaque service, afficher : thumbnail, titre + badge statut, categorie + prix EUR, tags, vues/commandes/CA/conversion depuis l'API, membre assigne
- [x] 5.4 Implementer les 4 actions CRUD fonctionnelles : Modifier (ouvre le wizard 7 etapes pre-rempli), Pauser (toggle via `/api/services/[id]/toggle`), Dupliquer (cree copie brouillon via API), Supprimer (dialogue confirmation + suppression via API)

## 6. Gestion des commandes

- [x] 6.1 Connecter la page `/agence/commandes` a l'API `/api/orders` filtree par l'agence — afficher la liste avec filtres (Toutes/En cours/Livrees/Annulees/En litige/En retard), tri (date/montant/statut/membre), recherche, pagination 20/page
- [x] 6.2 Pour chaque commande dans la liste, afficher : numero, client (nom + avatar), service commande, membre assigne, montant EUR, badge statut colore, date limite livraison, barre de progression
- [x] 6.3 Implementer le bouton export CSV fonctionnel qui genere et telecharge un fichier CSV de toutes les commandes filtrees
- [x] 6.4 Completer la page detail commande `/agence/commandes/[id]` — timeline complete des etapes, informations commande (client, service, montant, membre assigne, date limite)
- [x] 6.5 Implementer les actions fonctionnelles dans le detail commande : assigner/changer membre (dropdown equipe via API), livrer fichiers (upload reel via API), message de livraison, demander extension delai, ouvrir litige
- [x] 6.6 Integrer le chat temps reel dans le detail commande (reutiliser `ChatPanel` avec conversation liee a la commande)

## 7. Gestion de l'equipe

- [x] 7.1 Connecter la page `/agence/equipe` a l'API — afficher la grille de cards membres avec : photo, nom, role (Proprietaire/Manager/Freelance/Commercial), statut (actif/inactif), commandes actives, CA genere
- [x] 7.2 Afficher les statistiques globales de l'equipe en haut : nombre total membres, membres actifs, CA total equipe, commandes en cours
- [x] 7.3 Implementer le formulaire d'invitation de membre : email + role → envoi email via l'API (qui declenche Resend) → lien valide 48h → affichage invitation en attente dans la liste
- [x] 7.4 Implementer les actions par membre : modifier role (dropdown), voir commandes assignees, voir CA genere, desassigner commandes, retirer de l'agence (dialogue confirmation + API)
- [x] 7.5 Creer la page profil membre avec : photo de profil + photo de couverture, informations personnelles, competences, commandes en cours, historique commandes, CA genere, avis recus, graphique performance (LineChart recharts commandes/mois)

## 8. Gestion des clients CRM

- [x] 8.1 Connecter la page `/agence/clients` a l'API — afficher la liste des clients ayant commande avec : nom, avatar, email, pays, date premiere commande, date derniere commande, nombre commandes total, CA genere, statut (actif/inactif)
- [x] 8.2 Implementer la recherche et le tri des clients (par nom, email, CA, nombre commandes)
- [x] 8.3 Implementer la fiche client detaillee avec : historique commandes completes, conversations messagerie liees, factures generees, notes internes (textarea sauvegardee via API, visible agence uniquement), bouton "Contacter"

## 9. Messagerie agence

- [x] 9.1 Adapter la page `/agence/messages` pour reutiliser exactement les composants de la messagerie freelance (`MessagingLayout`, `ConversationList`, `ChatPanel`, `MessageBubble`) avec le contexte agence
- [x] 9.2 Connecter la messagerie aux APIs `/api/conversations` et `/api/conversations/[id]/messages` — charger les conversations reelles de l'agence
- [x] 9.3 Verifier que toutes les fonctionnalites fonctionnent : messages texte temps reel (Socket.io), upload fichiers/images, messages vocaux (MediaRecorder), statut lu/non lu, recherche conversations
- [x] 9.4 Verifier que les appels audio/video WebRTC fonctionnent depuis l'espace agence (reutiliser `lib/webrtc/` et store `call.ts`)
- [x] 9.5 Implementer l'etat vide propre : "Aucun message pour le moment" avec suggestion de contacter des clients

## 10. Finances et gains

- [x] 10.1 Connecter la page `/agence/finances` a l'API `/api/finances/summary` — afficher les 4 metriques : solde disponible, en attente, CA total historique, commission prelevee ce mois
- [x] 10.2 Implementer le BarChart recharts des revenus (12 derniers mois) avec donnees depuis l'API `/api/finances/transactions` — ajouter filtres periode fonctionnels et comparaison periode precedente
- [x] 10.3 Implementer le formulaire de demande de retrait : montant (minimum 20 EUR), methode (virement SEPA / PayPal / Wave / Orange Money / MTN), soumission via `/api/finances/withdrawal`, confirmation email
- [x] 10.4 Implementer l'historique des transactions depuis `/api/finances/transactions` avec : type, montant, commission, montant net, date, statut — et le bouton export CSV fonctionnel

## 11. Factures PDF

- [x] 11.1 Connecter la page `/agence/factures` a l'API — afficher la liste des factures avec : numero (FH-2026-XXXX), client, date, montant, statut — filtres par statut (toutes/payees/en attente) et export CSV
- [x] 11.2 Verifier que la route API `/api/invoices/[id]/pdf` genere un PDF professionnel avec @react-pdf/renderer contenant : en-tete (logo FreelanceHigh, numero, dates), informations agence (nom, adresse, email, SIRET), informations client, detail service (forfait, options, montant HT, TVA, TTC, commission, net), pied de page
- [x] 11.3 Implementer les 4 actions fonctionnelles sur chaque facture : telecharger PDF (appel API + download), envoyer par email au client (appel API qui declenche Resend), previsualiser (modal avec rendu), imprimer (window.print)

## 12. Avis recus

- [x] 12.1 Connecter la page `/agence/avis` a l'API `/api/reviews` — afficher les statistiques en haut : note moyenne globale, repartition etoiles (barres %), total avis recus, evolution note sur 6 mois (LineChart recharts)
- [x] 12.2 Afficher la liste des avis depuis l'API avec : avatar client, nom, date, note etoiles, commentaire, service concerne, montant commande, reponse de l'agence (si existe)
- [x] 12.3 Implementer le bouton "Repondre" sur chaque avis sans reponse — textarea + sauvegarde via `/api/reviews/[id]/reply` — affichage de la reponse sous l'avis

## 13. Statistiques avancees

- [x] 13.1 Implementer les 10 graphiques recharts fonctionnels sur `/agence/statistiques` avec donnees depuis l'API `/api/stats` : BarChart CA/mois, LineChart commandes/semaine, tableau performance par service, BarChart horizontal performance par membre, AreaChart vues profil, PieChart sources trafic, AreaChart taux conversion, PieChart clients recurrents vs nouveaux, LineChart evolution note, BarChart revenus par categorie
- [x] 13.2 Ajouter les filtres temporels fonctionnels (7j/30j/3m/6m/1an) sur chaque graphique avec affichage du pourcentage d'evolution par rapport a la periode precedente
- [x] 13.3 Implementer l'export CSV par graphique et l'export PDF rapport complet de toutes les statistiques

## 14. Boost de service

- [x] 14.1 Connecter la page boost (`/agence/services/boost`) a l'API `/api/services/[id]/boost` — afficher les 3 options (Standard 9,99 EUR/3j, Premium 24,99 EUR/7j, Ultime 79,99 EUR/30j) avec paiement Stripe fonctionnel
- [x] 14.2 Afficher les statistiques de chaque boost actif (vues, clics, commandes, ROI calcule) et l'historique de tous les boosts passes depuis l'API
- [x] 14.3 Afficher le compteur "Boost actif encore X jours" pour les services avec boost actif

## 15. SEO services

- [x] 15.1 Connecter la page SEO (`/agence/services/seo`) a l'API `/api/services/[id]/seo` — afficher pour chaque service : score SEO (0-100), meta titre (60 chars), meta description (160 chars), URL slug modifiable, mots-cles (10 max), alt text images
- [x] 15.2 Implementer la previsualisation SERP (apercu Google) et la checklist SEO avec conseils concrets
- [x] 15.3 Implementer la sauvegarde des modifications SEO via l'API avec recalcul automatique du score

## 16. Automatisation marketing

- [x] 16.1 Connecter la page automatisation (`/agence/automatisation`) — pour le plan Gratuit afficher un message d'upgrade, pour Pro/Business afficher le createur de scenarios
- [x] 16.2 Implementer le createur de scenarios visuels : declencheurs (nouvelle commande, nouveau message, avis recu, delai proche, client inactif), conditions (montant > X, statut = Y), actions (envoyer message, envoyer email, notifier membre)
- [x] 16.3 Ajouter les specificites agence : scenarios applicables a toute l'equipe ou a un membre specifique, statistiques par scenario (declenchements total, ce mois, taux de succes)
- [x] 16.4 Implementer l'historique des declenchements avec date, declencheur, et action executee

## 17. Litiges

- [x] 17.1 Connecter la page `/agence/litiges` a l'API — afficher la liste des litiges avec filtres (ouverts/resolus/tous) et timeline complete des echanges
- [x] 17.2 Implementer les actions agence : soumettre preuves (upload fichiers via API), envoyer message dans le litige, accepter la resolution, faire appel
- [x] 17.3 Afficher la decision admin (si rendue) avec le verdict et les consequences sur chaque litige

## 18. Profil public agence

- [x] 18.1 Implementer la page profil public agence avec en-tete : photo de couverture (1200x300px), logo, nom + slogan, localisation, site web, badge verifie, note + nombre avis, "Membre depuis [date]", boutons "Contacter" et "Commander"
- [x] 18.2 Implementer l'upload de la photo de couverture dans les parametres agence — validation dimensions (1200x300px, JPG/PNG/WebP), previsualisation, sauvegarde via API d'upload
- [x] 18.3 Implementer les sections du profil public : A propos, Services (6 premiers actifs), Portfolio, Equipe (conditionnelle selon parametres), Statistiques (conditionnelle), Avis clients

## 19. Parametres complets

- [x] 19.1 Implementer la section profil public des parametres : upload logo, upload photo couverture, edition nom/slogan/description (rich text)/site web/secteur/langues — toutes les modifications sauvegardees via l'API
- [x] 19.2 Implementer la section confidentialite : toggles fonctionnels (afficher equipe, afficher stats, accepter messages directs, apparaitre dans recherches) — sauvegarde en DB
- [x] 19.3 Implementer la section paiements : formulaires IBAN, email PayPal, numeros Mobile Money — sauvegarde en DB
- [x] 19.4 Implementer la section notifications : toggles fonctionnels (email nouvelle commande, email nouveau message, email avis recu, notifications in-app) — sauvegarde en DB
- [x] 19.5 Implementer la section securite : formulaire changement mot de passe, toggle 2FA, liste sessions actives avec bouton revocation — via API auth
- [x] 19.6 Implementer la section plan/abonnement : affichage plan actuel avec features et limites, bouton upgrade vers Stripe, historique facturation

## 20. Communication temps reel inter-espaces

- [x] 20.1 Configurer TanStack Query avec `refetchInterval` sur les queries critiques : cartes stats dashboard (60s), graphiques (300s), solde financier (a chaque navigation)
- [x] 20.2 Verifier que les events Socket.io existants (nouveaux messages, notifications) fonctionnent dans le contexte agence — le store `messaging.ts` MUST recevoir les updates pour les conversations agence
- [x] 20.3 Verifier la communication bout-en-bout : client commande service agence → dashboard agence mis a jour → notification in-app agence → membre assigne notifie → membre livre → client notifie → finances agence mises a jour → avis client → note agence recalculee
