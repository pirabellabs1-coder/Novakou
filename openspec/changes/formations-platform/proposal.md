## Why

FreelanceHigh est aujourd'hui une marketplace de services freelance. Pour fidéliser les freelances, augmenter la valeur perçue de la plateforme et ouvrir un nouveau flux de revenus récurrent, nous devons proposer une section de formations en ligne complète (équivalent Udemy) intégrée nativement à la plateforme. Les freelances pourront monétiser leur expertise via des cours, et les apprenants (clients ou freelances) pourront améliorer leurs compétences directement sur la même plateforme qu'ils utilisent pour travailler.

Cette fonctionnalité est planifiée pour la **V1 (mois 4–6)** et constitue un différenciateur majeur vis-à-vis des concurrents comme Fiverr, qui ne proposent pas de plateforme de formation intégrée.

## What Changes

- **Nouveau lien "Formations" dans la navbar** (entre "Services" et "À Propos") sur la landing page publique et les navbars des espaces connectés (freelance, client, agence), avec icône et badge coloré distinctif, bilingue FR/EN
- **Nouvelle section `/`** : landing page dédiée, marketplace de formations, pages détail, lecteur de cours intégré
- **Nouveau rôle "Instructeur"** : tout utilisateur peut postuler pour devenir instructeur via un formulaire de candidature, soumis à validation admin
- **Création de cours en 5 étapes** : wizard complet pour les instructeurs (informations, médias, prix/certificat, curriculum drag & drop, publication)
- **Lecteur de formation** (`/apprendre/[id]`) : vidéo HTML5 custom, visionneuse PDF, contenu texte rich, audio, quiz interactifs, notes personnelles horodatées, reprise automatique de la progression
- **Système de quiz** : 4 types de questions (choix unique, choix multiple, vrai/faux, texte libre), score de passage configurable, timer optionnel
- **Génération automatique de certificats PDF** : déclenchée à 100% de complétion + quiz réussis, code unique `FH-2026-XXXXXX`, QR code, générée avec `@react-pdf/renderer`, envoyée par email via Resend
- **Page de vérification publique de certificat** (`/verification/[code]`) : accessible sans connexion
- **Dashboard apprenant** : progression, certifications, favoris, panier, paramètres
- **Dashboard instructeur** : statistiques (recharts), gestion des formations, apprenants, revenus (70% instructeur / 30% plateforme), retraits
- **Administration formations** intégrée à l'espace admin existant (`/admin/formations/*`) : modération des cours, gestion des instructeurs, apprenants, finances, certificats, catégories
- **Système de panier** + **paiement Stripe Checkout** : carte, PayPal, Google Pay, Apple Pay
- **Code promo** : système de réduction applicable au panier
- **Remboursement 30 jours** : bouton dans l'espace apprenant, géré par l'admin
- **Nouvelles tables Prisma** : `Formation`, `Section`, `Lesson`, `Quiz`, `Question`, `Enrollment`, `LessonProgress`, `Certificate`, `FormationReview`, `InstructeurProfile`, `CartItem`, `PromoCode`
- **Nouvelles routes API tRPC** : 25+ procédures couvrant l'ensemble des flux
- **Nouveaux templates React Email** : confirmation inscription formation, certificat prêt, candidature instructeur reçue/approuvée/refusée, notification instructeur (nouvel apprenant, avis reçu), confirmation de retrait
- **Nouveau job BullMQ** : génération PDF certificat, envoi emails formations, synchronisation Postgres FTS pour la recherche formations
- **Fichiers de traduction next-intl** : 4 nouveaux namespaces (`formations`, `apprenant`, `instructeur`, `common`) en FR et EN

## Capabilities

### New Capabilities

- `formations-marketplace` : pages publiques de la section formations — landing `/`, marketplace `/explorer`, détail `/[slug]`, profil instructeur `/instructeurs/[id]`, catégories, page de vérification de certificat
- `formations-learner-space` : espace apprenant connecté — lecteur de cours `/apprendre/[id]`, quiz, dashboard `/mes-formations`, certificats, favoris, panier, paiement Stripe
- `formations-instructor-space` : espace instructeur — page "Devenir instructeur", dashboard, wizard de création (5 étapes), gestion des formations (CRUD), gestion apprenants, revenus et retraits, avis, statistiques avancées
- `formations-admin` : panneau admin dédié aux formations — modération des cours, gestion des instructeurs et apprenants, finances (commissions 30%), certificats, catégories
- `formations-schema` : schéma Prisma complet pour la section formations (12 nouveaux modèles, 5 nouveaux enums), migrations DB, policies RLS Supabase, seed catégories
- `formations-certificates` : génération automatique de certificats PDF bilingues FR/EN avec `@react-pdf/renderer`, code unique, QR code de vérification, envoi email via Resend + job BullMQ
- `formations-i18n` : système bilingue FR/EN complet pour toute la section formations — 4 namespaces next-intl, switch de langue dans la navbar, détection navigateur, sauvegarde localStorage + DB

### Modified Capabilities

- `navbar` : ajout du lien "Formations / Trainings" dans la navbar principale (landing page publique + navbars espaces connectés)
- `admin-dashboard` : ajout de la section "Formations" dans le menu de navigation admin et les métriques globales du dashboard admin

## Impact

**DB (`packages/db`)** :
- 12 nouveaux modèles Prisma, 5 nouveaux enums
- 1 nouvelle migration Prisma
- Policies RLS sur toutes les nouvelles tables
- Seed des 12 catégories de formations
- Index GIN `search_vector` sur `Formation` pour la recherche FTS

**Backend (`apps/api`)** :
- 25+ nouvelles procédures tRPC dans `apps/api/src/routes/formations.ts` et sous-fichiers
- 2 nouveaux workers BullMQ : `certificate-generator.worker.ts`, `formations-email.worker.ts`
- Intégration Stripe Checkout pour les paiements formations (distinct du flux de commandes freelance)
- Intégration Resend : 8 nouveaux templates React Email dans `packages/ui/emails/formations/`

**Frontend (`apps/web`)** :
- ~40 nouvelles pages Next.js (App Router) dans 4 nouveaux route groups : `(public)/formations/`, `(apprenant)/formations/`, `(instructeur)/formations/`, `(paiement)/formations/`
- Nouvelles dépendances : `@react-pdf/renderer`, `recharts` (déjà prévu), `react-player` ou lecteur vidéo custom
- 8 nouveaux namespaces de traduction dans `apps/web/messages/`
- Modification de la navbar (composant existant dans `packages/ui/`)
- Modification du dashboard admin (`apps/web/app/admin/`)

**Impact sur les autres rôles** :
- **Freelance** : peut devenir instructeur, voir ses revenus formations dans un espace dédié
- **Client** : peut acheter des formations, distinct de l'achat de services
- **Agence** : les membres peuvent individuellement être instructeurs (profil personnel)
- **Admin** : nouvelle section dédiée dans l'espace admin existant

**Jobs BullMQ requis** : oui (génération PDF certificat, envoi emails formations)
**Handlers Socket.io** : non (pas de temps réel nécessaire pour le MVP de la section formations)
**Templates email nouveaux** : 8 templates React Email
**Impact schéma Prisma** : 12 nouvelles tables, relations avec le modèle `User` existant
