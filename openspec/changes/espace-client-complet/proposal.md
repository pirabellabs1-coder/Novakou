## Why

L'espace Client existe déjà en tant que pages fonctionnelles basiques, mais **ne correspond pas fidèlement aux maquettes de référence**. Les couleurs, la mise en page, la structure des composants et les interactions doivent être alignés exactement sur les 10+ maquettes Stitch fournies. L'objectif est de livrer un espace client complet, pixel-perfect par rapport aux maquettes, entièrement fonctionnel (données de démo, toutes les interactions, navigation complète), en français avec EUR comme devise par défaut.

## What Changes

### Refonte visuelle complète de l'espace Client
- **Alignement colorimétrique exact** : adoption du thème dark des maquettes avec couleur primaire verte (`#19e642`), backgrounds dark (`#112114`), police Manrope, icônes Material Symbols Outlined
- **Restructuration du layout** : sidebar fixe gauche (w-64) avec navigation client, header sticky avec recherche/notifications/avatar, zone de contenu scrollable — conforme à la maquette `tableau_de_bord_client`
- **10 pages refaites** selon les maquettes :
  1. `/client/dashboard` — Stats cards (projets actifs, messages, dépenses), table projets actifs avec barres de progression, dernières commandes, utilisation stockage
  2. `/client/projets` — Liste des projets publiés avec filtres par statut, actions CRUD
  3. `/client/projets/nouveau` — Wizard 4 étapes (Détails → Catégorie → Budget → Révision) avec stepper gauche, aperçu visibilité droite, conseil expert
  4. `/client/commandes` — Suivi de commandes avec timeline 3 étapes, countdown, livraison de fichiers (drag & drop), chat contextuel
  5. `/client/freelances` — Explorateur d'offres/freelances avec filtres avancés (budget, catégorie, pays, type contrat), cards horizontales, pagination
  6. `/client/favoris` — Grille freelances favoris (4 colonnes), services sauvegardés (3 colonnes), listes de projets organisées par catégorie
  7. `/client/messages` — Messagerie 3 panneaux (contacts, chat, détails mission) avec bulles vertes, pièces jointes, indicateur "en train d'écrire"
  8. `/client/paiements` — Méthodes de paiement (cartes, Mobile Money), solde portefeuille, actions rapides, transactions récentes + interface de paiement multi-devises
  9. `/client/profil` — Profil entreprise client avec formulaire d'édition
  10. `/client/parametres` — Paramètres du compte avec sidebar navigation (Profil Public, Sécurité, Paiements & Facturation, Langues & Devises, Notifications), zone danger

### Composants et patterns
- Refonte du `ClientSidebar.tsx` pour correspondre exactement à la maquette (logo vert bolt, "Espace Client", items avec icônes Material, bouton "+ Nouveau Projet" en bas)
- Refonte du `layout.tsx` client pour le layout sidebar + header + contenu
- Tous les composants interactifs fonctionnels : formulaires, filtres, modales, wizards, drag & drop, chat
- Données de démo réalistes en EUR et français

### Version cible : MVP

## Capabilities

### New Capabilities
- `client-dashboard`: Tableau de bord client avec statistiques temps réel, projets actifs, dernières commandes, utilisation stockage
- `client-projects`: Gestion des projets client (liste, création wizard 4 étapes, filtres, CRUD)
- `client-orders`: Suivi des commandes avec timeline, countdown, livraison de fichiers, chat contextuel
- `client-explorer`: Explorateur de freelances et offres avec filtres avancés, pagination, cards
- `client-favorites`: Gestion des favoris (freelances, services, listes de projets organisées)
- `client-messaging`: Messagerie temps réel 3 panneaux (contacts, chat, détails mission)
- `client-payments`: Paiements multi-devises, méthodes de paiement, portefeuille, transactions
- `client-profile-settings`: Profil entreprise et paramètres du compte (sécurité, langue, devise, notifications)
- `client-layout`: Layout commun de l'espace client (sidebar, header, thème dark vert)

### Modified Capabilities
_(Aucune capacité existante modifiée — les specs landing-page ne sont pas impactées)_

## Impact

### Code impacté
- `apps/web/app/client/` — Refonte complète de toutes les pages (10 fichiers `page.tsx` + `layout.tsx`)
- `apps/web/components/client/` — Refonte du `ClientSidebar.tsx` + nouveaux composants par page
- `apps/web/app/globals.css` — Possibles ajouts de variables CSS pour le thème vert client
- `apps/web/tailwind.config.ts` — Extension possible pour les couleurs spécifiques aux maquettes

### Impact sur les autres rôles
- Aucun impact direct sur les espaces Freelance, Agence ou Admin
- Les composants créés sont spécifiques au client et ne sont pas partagés

### Schéma Prisma
- Aucune modification du schéma — utilisation de données de démo statiques pour le MVP
- Les interfaces TypeScript existantes dans `lib/demo-data.ts` seront étendues si nécessaire

### Dépendances
- Aucune nouvelle dépendance npm requise
- Utilisation de shadcn/ui, Tailwind CSS, Material Symbols (déjà présents)
