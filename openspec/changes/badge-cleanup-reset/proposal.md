## Why

Le système de badges est incohérent : les noms varient entre UPPERCASE (`"ELITE"`), Title Case (`"Elite"`), avec/sans accents (`"Vérifié"` vs `"Verifie"`), et les badges sur les cards landing ne correspondent pas à ceux du profil public. De plus, les badges sont attribués arbitrairement (hardcodés) au lieu d'être calculés selon les critères KYC/performance définis dans le PRD. Le profil public affiche "Commandes complétées" en double (sidebar + stats). Enfin, la base dev contient des comptes/commandes/stats de test qui polluent le site — tout doit être remis à zéro pour un départ propre.

**Version cible : MVP**

## What Changes

- **Standardiser les badges** : un seul format (Title Case sans accents) partout — API, composants, profil
- **Badges mérités par critères** : Rising Talent (nouveau + bonnes notes), Top Rated (≥4.0, ≥3 commandes), Elite (≥4.5, ≥10 commandes), Verifie (KYC ≥3), Pro/Business/Agence (selon plan)
- **Badge cohérent card ↔ profil** : même composant `BadgeDisplay` utilisé partout, même source de données
- **Supprimer "Commandes complétées" du sidebar profil** : garder uniquement dans la section stats circulaires (éviter la répétition)
- **Reset complet des données dev** : supprimer tous les comptes, commandes, services, reviews, stats — repartir de zéro
- **Nettoyer les espaces admin** : remettre les compteurs et dashboards à zéro

## Capabilities

### New Capabilities
- `badge-system`: Système unifié d'attribution et d'affichage des badges freelance/agence basé sur des critères de performance et KYC
- `data-reset`: Script/API de remise à zéro complète des données dev (comptes, commandes, services, reviews, stats)

### Modified Capabilities
_(aucune spec existante modifiée)_

## Impact

- **Schéma Prisma** : aucune migration nécessaire (les champs `kyc`, `plan`, `rating` existent déjà)
- **APIs modifiées** : `top-freelances`, `top-services`, `public/services`, `public/freelances/[username]` — tous doivent utiliser la même fonction `computeBadges()`
- **Composants UI** : `BadgeDisplay.tsx` (nettoyage des doublons BADGE_CONFIG), `TopFreelancesSection.tsx` (utiliser BadgeDisplay standard), profil freelance (supprimer sidebar "Commandes complétées", unifier badges)
- **Dev data** : `data-store.ts` (supprimer services.json, orders.json, reviews.json, users.json, profiles.json), `mock-data.ts` (nettoyer)
- **Admin** : route API de reset ou script CLI pour vider les données
- **Impact multi-rôles** : Freelance (badges sur profil + cards), Client (voit badges dans explorer), Admin (dashboard stats à zéro)
- **Aucun job BullMQ, handler Socket.io ou template email requis**
