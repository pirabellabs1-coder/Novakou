## Why

L'espace Agence (`/agence`) est un pilier du MVP FreelanceHigh : les agences s'inscrivent, gèrent leur équipe, publient des services, traitent des commandes et suivent leurs finances. Les pages existantes nécessitent une refonte complète pour correspondre exactement aux maquettes Stitch (couleurs, layout, composants) et être pleinement fonctionnelles (chaque bouton, formulaire, filtre et modal doit fonctionner). La mise en ligne approche : toutes les interactions doivent fonctionner comme une vraie plateforme de production.

**Version cible : MVP**

## What Changes

- **Refonte du layout Agence** : header dédié avec recherche, notifications et profil ; sidebar avec 14 items de navigation ; thème vert/teal via CSS variables
- **Refonte Dashboard** (`/agence`) : 6 KPI cards, graphique CA mensuel SVG, statut équipe en temps réel, tableau projets avec progression, fil d'activité récente
- **Refonte Gestion d'Équipe** (`/agence/equipe`) : tableau des membres avec rôles (admin/manager/membre/commercial), taux d'occupation, barres de charge, modal d'invitation, filtres par rôle, onglets (Tous / Disponibilité / Demandes d'accès)
- **Refonte CRM Clients** (`/agence/clients`) : pipeline visuel (prospect → devis → commande → livré), fiches client, notes internes, relances, ajout manuel
- **Refonte Projets** (`/agence/projets`) : vue Kanban (drag conceptuel avec colonnes À faire / En cours / En révision / Terminé), vue Liste, filtres par client/membre/priorité, barres de progression, sidebar filtres avec capacité agence
- **Refonte Services** (`/agence/services`) : liste des services publiés sous la marque agence, stats par service (vues, commandes, CA), wizard création identique freelance, pause/suppression
- **Refonte Commandes** (`/agence/commandes`) : toutes les commandes avec assignation à un membre, suivi par statut, filtres avancés
- **Refonte Finances** (`/agence/finances`) : CA global avec graphiques, revenus par membre, commission interne paramétrable, factures, demande de retrait, toggle devise (EUR/FCFA/USD)
- **Refonte Sous-traitance** (`/agence/sous-traitance`) : recherche de freelances externes, commandes sous-traitées, suivi missions, facturation avec marges
- **Refonte Analytics** (`/agence/analytics`) : performance équipe, satisfaction clients (NPS), revenus par catégorie, comparaisons de périodes, export
- **Nouvelle page Ressources** (`/agence/ressources`) : cloud partagé par projet/client, upload de fichiers, quota de stockage
- **Nouvelle page Messages** (`/agence/messages`) : messagerie avec canaux internes par projet + conversations clients
- **Refonte Paramètres** (`/agence/parametres`) : infos agence, gestion rôles/permissions, plan d'abonnement, méthodes de paiement, notifications, zone danger
- **Composants partagés** : AgencySidebar mis à jour, nouveau AgenceHeader, composants réutilisables (stats cards, status badges, progress bars)

## Capabilities

### New Capabilities
- `agence-layout`: Layout global agence avec sidebar, header, thème CSS variables et responsive mobile
- `agence-dashboard`: Tableau de bord agence avec KPI, graphiques, statut équipe et projets
- `agence-equipe`: Gestion d'équipe complète avec rôles, occupation, invitation et filtres
- `agence-clients`: CRM clients avec pipeline visuel, fiches, notes et relances
- `agence-projets`: Gestion de projets avec vue Kanban, vue liste, filtres et progression
- `agence-services`: Publication et gestion de services sous la marque agence
- `agence-commandes`: Suivi de toutes les commandes avec assignation aux membres
- `agence-finances`: Finances complètes avec CA, revenus par membre, factures et retraits
- `agence-sous-traitance`: Gestion de la sous-traitance avec freelances externes
- `agence-analytics`: Analytics et rapports de performance
- `agence-ressources`: Cloud partagé pour fichiers et ressources d'équipe
- `agence-messages`: Messagerie avec canaux internes et conversations clients
- `agence-parametres`: Paramètres complets de l'agence

### Modified Capabilities
<!-- Aucune capability existante modifiée -->

## Impact

- **Frontend (`apps/web`)** : 13 fichiers de pages dans `app/agence/`, 3+ composants dans `components/agence/`, mise à jour du layout et du thème CSS
- **CSS** : ajout des variables de thème agence dans le layout (override `--color-primary`, `--color-bg-dark`, etc.)
- **Navigation** : sidebar avec 14 items, header avec recherche + notifications + profil
- **État** : `useToastStore` (Zustand) pour les notifications UI, `useState` local pour formulaires et filtres
- **Aucun impact sur le schéma Prisma** au MVP (données de démonstration en constantes TypeScript)
- **Aucun job BullMQ, handler Socket.io ou template email** requis pour cette phase (frontend uniquement)
- **Impact sur les autres rôles** : aucun, l'espace Agence est indépendant des espaces Client/Freelance/Admin
