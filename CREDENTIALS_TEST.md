# FreelanceHigh — Acces Admin

> **CONFIDENTIEL — Ne jamais partager ce fichier**

---

## Lien 1 — Admin Marketplace

```
https://freelancehigh.com/admin-login/marketplace/EGOV4eBSoLnH2dqjqkObCsgE0xs1XXx05Kf2Pt66zEM
```

Redirige vers `/admin` (dashboard, utilisateurs, KYC, finances, litiges, etc.)

---

## Lien 2 — Admin Formations

```
https://freelancehigh.com/admin-login/formations/o-Az9wrtFXr4Qj0KByvGvohp5J8B4pdSXf0AQbVukkw
```

Redirige vers `/admin/dashboard` (formations, instructeurs, apprenants, etc.)

---

## Identifiants (meme compte pour les deux)

| Email | Mot de passe |
|---|---|
| `admin@freelancehigh.com` | `FH@dmin2026!Secure#` |

---

## Securite

- Chaque lien contient un token cryptographique unique verifie cote serveur
- Token invalide = redirection 404 (page introuvable)
- Seul le role `admin` peut se connecter via ces portails
- Tentatives non autorisees enregistrees dans les logs serveur
- Le formulaire classique `/connexion` ne donne PAS acces a l'admin

---

## Setup initial (premiere fois seulement)

```bash
curl -X POST https://freelancehigh.com/api/admin/seed \
  -H "Content-Type: application/json" \
  -d '{"token":"WUKwkrr40GVrt2z0fyeCelK1x54SKiq7QpeJ2ZzoJHw"}'
```

---

*Mis a jour le 2026-03-20 — FreelanceHigh*
