# FreelanceHigh — Comptes de Test

> **IMPORTANT : Ce fichier est pour le DEVELOPPEMENT uniquement.**
> Ne JAMAIS utiliser ces comptes en production.
> Supprimer ce fichier avant tout deploiement public.

## Prerequis

1. Demarrer le serveur : `pnpm dev --filter=@freelancehigh/web`
2. S'assurer que `DEV_MODE=true` est dans `.env.local`
3. Ouvrir : http://localhost:3450

---

## Mot de passe universel

**Tous les comptes de test utilisent le meme mot de passe :**

```
Test1234!
```

---

## Comptes par role

### Admin (Espace Admin)

| Email | Mot de passe | Nom | Acces |
|---|---|---|---|
| `admin@test.com` | `Test1234!` | Admin FreelanceHigh | `/admin` — Dashboard, utilisateurs, KYC, litiges, finances, blog, config |

**Ce que tu peux tester :**
- Dashboard admin avec metriques
- Gestion des utilisateurs (suspendre, bannir)
- Validation KYC
- Moderation des services
- Gestion du blog
- Configuration plateforme (commissions, modes de paiement)
- Analytics

**Admin Formations** (meme compte `admin@test.com`) :

| Page | URL |
|---|---|
| Dashboard formations | http://localhost:3450/formations/admin/dashboard |
| Gestion formations | http://localhost:3450/formations/admin/formations |
| Produits numeriques | http://localhost:3450/formations/admin/produits |
| Instructeurs | http://localhost:3450/formations/admin/instructeurs |
| Apprenants | http://localhost:3450/formations/admin/apprenants |
| Finances formations | http://localhost:3450/formations/admin/finances |
| Certificats | http://localhost:3450/formations/admin/certificats |
| Categories | http://localhost:3450/formations/admin/categories |
| Codes promo | http://localhost:3450/formations/admin/promo-codes |

Le lien "Formations" dans le sidebar admin principal redirige directement vers `/formations/admin/dashboard`.

---

### Freelance (Espace Freelance)

| Email | Mot de passe | Nom | Pays |
|---|---|---|---|
| `freelance@test.com` | `Test1234!` | Marie Diallo | Senegal |

**Ce que tu peux tester :**
- Dashboard freelance (`/dashboard`)
- Creer / modifier / supprimer un service
- Gerer les commandes
- Voir les finances et factures
- Profil, portfolio, disponibilite
- Messagerie
- Candidatures aux projets
- KYC verification
- Parametres

---

### Client (Espace Client)

| Email | Mot de passe | Nom | Pays |
|---|---|---|---|
| `client@test.com` | `Test1234!` | Jean Dupont | France |

**Ce que tu peux tester :**
- Dashboard client (`/client`)
- Explorer les services et freelances
- Commander un service (3 forfaits)
- Publier un projet
- Suivre les commandes
- Messagerie avec les freelances
- Paiements et factures
- Recherche IA
- Favoris

---

### Agence (Espace Agence)

| Email | Mot de passe | Nom | Pays |
|---|---|---|---|
| `agence@test.com` | `Test1234!` | Studio Digital Abidjan | Cote d'Ivoire |

**Ce que tu peux tester :**
- Dashboard agence (`/agence`)
- Gestion de l'equipe
- Publier des services sous la marque agence
- Gerer les commandes agence
- CRM clients
- Projets agence
- Sous-traitance
- Contrats
- Ressources partagees
- Finances et factures

---

### Instructeur Formations

| Email | Mot de passe | Nom |
|---|---|---|
| `instructeur@test.com` | `Test1234!` | Instructeur Test |

**Ce que tu peux tester :**
- Dashboard instructeur (`/formations/instructeur/dashboard`)
- Creer une formation
- Gerer les apprenants
- Revenus et statistiques
- Marketing (pixels)
- Produits numeriques

---

### Apprenant Formations

| Email | Mot de passe | Nom |
|---|---|---|
| `apprenant@test.com` | `Test1234!` | Apprenant Test |

**Ce que tu peux tester :**
- Mes formations (`/formations/mes-formations`)
- Explorer le catalogue (`/formations/explorer`)
- Mes certificats
- Mes cohorts
- Panier et paiement
- Favoris

---

## Pages publiques (sans connexion)

| Page | URL |
|---|---|
| Landing page | http://localhost:3450/ |
| Marketplace | http://localhost:3450/explorer |
| Tarifs | http://localhost:3450/tarifs |
| Comment ca marche | http://localhost:3450/comment-ca-marche |
| A propos | http://localhost:3450/a-propos |
| Contact | http://localhost:3450/contact |
| FAQ | http://localhost:3450/faq |
| Blog | http://localhost:3450/blog |
| Status | http://localhost:3450/status |
| Formations | http://localhost:3450/formations |
| CGU | http://localhost:3450/cgu |
| Confidentialite | http://localhost:3450/confidentialite |

---

## Flux a tester

### 1. Inscription + Verification Email
1. Aller sur `/inscription`
2. Remplir le formulaire (email quelconque)
3. Apres soumission → redirection vers `/verifier-email`
4. En DEV_MODE, le code OTP est envoye via Resend (verifier les logs serveur si pas de cle Resend)
5. Entrer le code 6 chiffres → redirection vers `/connexion`

### 2. Mot de passe oublie
1. Aller sur `/connexion` → cliquer "Mot de passe oublie"
2. Entrer un email → email envoye avec lien
3. Cliquer le lien → page de reinitialisation
4. Entrer nouveau mot de passe (10 chars min, majuscule, minuscule, chiffre)

### 3. Commande complete (Freelance + Client)
1. Se connecter en tant que `freelance@test.com`
2. Creer un service dans `/dashboard/services/creer`
3. Se deconnecter
4. Se connecter en tant que `client@test.com`
5. Explorer → trouver le service → Commander
6. Suivre la commande dans `/client/commandes`

### 4. Admin
1. Se connecter en tant que `admin@test.com`
2. Dashboard → voir les metriques
3. Utilisateurs → voir tous les comptes
4. Services → approuver/refuser
5. KYC → valider des demandes

---

## Variables d'environnement (`.env.local`)

```bash
# Mode developpement (OBLIGATOIRE pour les comptes de test)
DEV_MODE=true

# NextAuth
NEXTAUTH_SECRET=une-cle-secrete-de-test-32-chars-min
NEXTAUTH_URL=http://localhost:3450

# Optionnel — pour tester les vrais emails
RESEND_API_KEY=re_xxxxx

# Optionnel — pour tester Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

---

*Fichier genere le 2026-03-14 — FreelanceHigh MVP*
