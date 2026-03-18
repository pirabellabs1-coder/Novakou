# FreelanceHigh — Comptes de Test

> **IMPORTANT : Ce fichier est pour le DEVELOPPEMENT uniquement.**
> Ne JAMAIS utiliser ces comptes en production.
> Supprimer ce fichier avant tout deploiement public.

## Prerequis

1. Demarrer le serveur : `pnpm dev --filter=@freelancehigh/web`
2. S'assurer que `DEV_MODE=true` est dans `.env.local`
3. Ouvrir : http://localhost:3000

---

## Mot de passe universel

**Tous les comptes de test utilisent le meme mot de passe :**

```
Test1234!
```

---

## Comptes par role

### Admin (Espace Admin + Admin Formations)

| Email | Mot de passe | Nom | Acces |
|---|---|---|---|
| `admin@test.com` | `Test1234!` | Admin FreelanceHigh | `/admin` + `/formations/admin` |

**Pages Admin Marketplace :**

| Page | URL |
|---|---|
| Dashboard admin | http://localhost:3000/admin |
| Utilisateurs | http://localhost:3000/admin/utilisateurs |
| KYC | http://localhost:3000/admin/kyc |
| Services | http://localhost:3000/admin/services |

**Pages Admin Formations :**

| Page | URL |
|---|---|
| Dashboard formations | http://localhost:3000/formations/admin/dashboard |
| Formations | http://localhost:3000/formations/admin/formations |
| Produits numeriques | http://localhost:3000/formations/admin/produits |
| Instructeurs | http://localhost:3000/formations/admin/instructeurs |
| Apprenants | http://localhost:3000/formations/admin/apprenants |
| Finances | http://localhost:3000/formations/admin/finances |
| Certificats | http://localhost:3000/formations/admin/certificats |
| Categories | http://localhost:3000/formations/admin/categories |
| Codes promo | http://localhost:3000/formations/admin/promo-codes |
| Marketing | http://localhost:3000/formations/admin/marketing |
| Cohortes | http://localhost:3000/formations/admin/cohorts |
| Discussions | http://localhost:3000/formations/admin/discussions |
| Journal d'audit | http://localhost:3000/formations/admin/audit-log |
| Configuration | http://localhost:3000/formations/admin/configuration |

---

### Freelance (Espace Freelance)

| Email | Mot de passe | Nom | Pays |
|---|---|---|---|
| `freelance@test.com` | `Test1234!` | Marie Diallo | Senegal |

**Acces :** `/dashboard` — services, commandes, finances, profil, messagerie

---

### Client (Espace Client)

| Email | Mot de passe | Nom | Pays |
|---|---|---|---|
| `client@test.com` | `Test1234!` | Jean Dupont | France |

**Acces :** `/client` — explorer, commander, projets, messagerie

---

### Agence (Espace Agence)

| Email | Mot de passe | Nom | Pays |
|---|---|---|---|
| `agence@test.com` | `Test1234!` | Studio Digital Abidjan | Cote d'Ivoire |

**Acces :** `/agence` — equipe, services, commandes, CRM, projets

---

### Instructeur Formations

| Email | Mot de passe | Nom |
|---|---|---|
| `instructeur@test.com` | `Test1234!` | Instructeur FreelanceHigh |

**Pages Instructeur :**

| Page | URL |
|---|---|
| Dashboard | http://localhost:3000/formations/instructeur/dashboard |
| Mes formations | http://localhost:3000/formations/instructeur/mes-formations |
| Creer formation | http://localhost:3000/formations/instructeur/creer |
| Apprenants | http://localhost:3000/formations/instructeur/apprenants |
| Revenus | http://localhost:3000/formations/instructeur/revenus |
| Avis | http://localhost:3000/formations/instructeur/avis |
| Statistiques | http://localhost:3000/formations/instructeur/statistiques |
| Produits | http://localhost:3000/formations/instructeur/produits |
| Marketing | http://localhost:3000/formations/instructeur/marketing |
| Parametres | http://localhost:3000/formations/instructeur/parametres |

---

### Apprenant Formations

| Email | Mot de passe | Nom |
|---|---|---|
| `apprenant@test.com` | `Test1234!` | Apprenant FreelanceHigh |

**Pages Apprenant :**

| Page | URL |
|---|---|
| Mes formations | http://localhost:3000/formations/mes-formations |
| Mes cohortes | http://localhost:3000/formations/mes-cohorts |
| Mes produits | http://localhost:3000/formations/mes-produits |
| Certificats | http://localhost:3000/formations/certificats |
| Discussions | http://localhost:3000/formations/mes-discussions |
| Mes avis | http://localhost:3000/formations/mes-avis |
| Favoris | http://localhost:3000/formations/favoris |
| Mes achats | http://localhost:3000/formations/mes-achats |
| Panier | http://localhost:3000/formations/panier |
| Parametres | http://localhost:3000/formations/parametres |

---

## Pages publiques (sans connexion)

| Page | URL |
|---|---|
| Landing page | http://localhost:3000/ |
| Marketplace | http://localhost:3000/explorer |
| Formations | http://localhost:3000/formations |
| Explorer formations | http://localhost:3000/formations/explorer |
| Categories formations | http://localhost:3000/formations/categories |
| Connexion formations | http://localhost:3000/formations/connexion |
| Inscription formations | http://localhost:3000/formations/inscription |
| Tarifs | http://localhost:3000/tarifs |
| A propos | http://localhost:3000/a-propos |
| Contact | http://localhost:3000/contact |
| FAQ | http://localhost:3000/faq |
| Blog | http://localhost:3000/blog |
| CGU | http://localhost:3000/cgu |
| Confidentialite | http://localhost:3000/confidentialite |
| Status | http://localhost:3000/status |

---

## Variables d'environnement (`.env.local`)

```bash
# Mode developpement (OBLIGATOIRE pour les comptes de test)
DEV_MODE=true

# NextAuth
NEXTAUTH_SECRET=une-cle-secrete-de-test-32-chars-min
NEXTAUTH_URL=http://localhost:3000
```

---

*Fichier mis a jour le 2026-03-18 — FreelanceHigh MVP*
