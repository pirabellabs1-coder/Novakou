## 1. Layout, Sidebar et Header

- [x] 1.1 Réécrire `app/agence/layout.tsx` avec thème CSS variables agence (primary #14b835, bg-dark #112114, neutral-dark #1a2f1e, border-dark #2a3f2e), responsive mobile/desktop
- [x] 1.2 Réécrire `components/agence/AgenceSidebar.tsx` avec 10 items principaux + 4 items secondaires + bouton CTA "Nouveau Projet" + logo agence
- [x] 1.3 Créer `components/agence/AgenceHeader.tsx` avec recherche, notifications, aide, paramètres, profil agence

## 2. Dashboard (`/agence`)

- [x] 2.1 Réécrire `app/agence/page.tsx` — 6 KPI cards (CA mensuel €145 200, Projets actifs 24, Membres 12, Commandes 38, Satisfaction 92%, Occupation 75%)
- [x] 2.2 Ajouter graphique CA mensuel en SVG (6 mois, aire sous courbe)
- [x] 2.3 Ajouter section statut équipe (avatars, nom, rôle, indicateur disponibilité)
- [x] 2.4 Ajouter tableau projets actifs (Projet, Responsable, Statut badge, Progression barre, Budget)
- [x] 2.5 Ajouter fil d'activité récente (5 dernières actions avec horodatage)

## 3. Gestion d'Équipe (`/agence/equipe`)

- [x] 3.1 Réécrire `app/agence/equipe/page.tsx` — stats d'équipe en haut (Charge Moyenne, Taux d'Activité, Projets Actifs)
- [x] 3.2 Ajouter onglets "Tous les membres" / "Disponibilité" / "Demandes d'accès"
- [x] 3.3 Ajouter tableau des membres (avatar, nom, rôle badge coloré, accès, charge barre %, actions)
- [x] 3.4 Ajouter filtre par rôle (admin/manager/membre/commercial)
- [x] 3.5 Ajouter modal d'invitation de membre (email, rôle, message)

## 4. CRM Clients (`/agence/clients`)

- [x] 4.1 Réécrire `app/agence/clients/page.tsx` — pipeline visuel 4 colonnes (Prospect, Devis, Commande, Livré)
- [x] 4.2 Ajouter fiches client (nom, entreprise, CA total, dernière interaction)
- [x] 4.3 Ajouter panneau de détail client avec historique, notes internes, relances
- [x] 4.4 Ajouter formulaire d'ajout de client

## 5. Projets (`/agence/projets`)

- [x] 5.1 Réécrire `app/agence/projets/page.tsx` — vue Kanban (4 colonnes : À faire, En cours, En révision, Terminé)
- [x] 5.2 Ajouter cartes projet (priorité badge, titre, assigné avatar, deadline, progression barre)
- [x] 5.3 Ajouter toggle vue Kanban / vue Liste (tableau)
- [x] 5.4 Ajouter sidebar filtres (par client, par membre, par priorité, capacité agence %)
- [x] 5.5 Ajouter formulaire nouveau projet (titre, client, description, membres, deadline, budget, priorité)

## 6. Services (`/agence/services`)

- [x] 6.1 Réécrire `app/agence/services/page.tsx` — liste des services avec stats (vues, commandes, CA, taux conversion)
- [x] 6.2 Ajouter actions par service (modifier, pause/activer, dupliquer, supprimer)
- [x] 6.3 Ajouter stats globales en haut (Total services, Services actifs, CA total services, Taux conversion moyen)

## 7. Commandes (`/agence/commandes`)

- [x] 7.1 Réécrire `app/agence/commandes/page.tsx` — liste commandes avec filtres par statut
- [x] 7.2 Ajouter colonnes : référence, service, client, membre assigné, montant, statut, date
- [x] 7.3 Ajouter assignation/réassignation de membre via dropdown

## 8. Finances (`/agence/finances`)

- [x] 8.1 Réécrire `app/agence/finances/page.tsx` — KPI financiers (CA global, Solde disponible, En attente, Total gagné) + toggle devise
- [x] 8.2 Ajouter graphique CA mensuel SVG
- [x] 8.3 Ajouter onglet Revenus par membre (tableau contribution)
- [x] 8.4 Ajouter onglet Factures et historique avec download PDF
- [x] 8.5 Ajouter formulaire demande de retrait (méthode, montant)

## 9. Sous-traitance (`/agence/sous-traitance`)

- [x] 9.1 Réécrire `app/agence/sous-traitance/page.tsx` — recherche freelances externes avec filtres
- [x] 9.2 Ajouter onglet Missions en cours (freelance, statut, montant, marge)
- [x] 9.3 Ajouter formulaire commande externe (description, budget, deadline)

## 10. Analytics (`/agence/analytics`)

- [x] 10.1 Réécrire `app/agence/analytics/page.tsx` — performance équipe (commandes, note, délai par membre)
- [x] 10.2 Ajouter indicateur NPS avec répartition (promoteurs, passifs, détracteurs)
- [x] 10.3 Ajouter graphique revenus par catégorie de service
- [x] 10.4 Ajouter comparaison de périodes et bouton export CSV

## 11. Ressources (`/agence/ressources`)

- [x] 11.1 Réécrire `app/agence/ressources/page.tsx` — dossiers par projet/client avec navigation
- [x] 11.2 Ajouter liste de fichiers (nom, taille, date, uploader) + upload zone
- [x] 11.3 Ajouter indicateur quota stockage (barre progression utilisé/50 GB)

## 12. Messages (`/agence/messages`)

- [x] 12.1 Réécrire `app/agence/messages/page.tsx` — interface messagerie (liste conversations + chat)
- [x] 12.2 Ajouter canaux internes par projet + conversations clients
- [x] 12.3 Ajouter envoi de messages avec champ de saisie

## 13. Paramètres (`/agence/parametres`)

- [x] 13.1 Réécrire `app/agence/parametres/page.tsx` — menu latéral 6 sections
- [x] 13.2 Section Informations agence (nom, logo, description, secteur, site web, pays, SIRET)
- [x] 13.3 Section Rôles & Permissions (tableau permissions par rôle avec toggles)
- [x] 13.4 Section Plan d'abonnement (Agence €99/mois, fonctionnalités, changement)
- [x] 13.5 Section Paiements, Notifications, Zone danger

## 14. Vérification et build

- [x] 14.1 Corriger toutes les erreurs TypeScript et warnings dans les fichiers agence
- [x] 14.2 Vérifier que `npx next build` passe sans erreur pour les pages agence
