# Custom Domains — Boutique vendeur/mentor

Feature : chaque vendeur (et plus tard mentor) peut connecter son propre nom de domaine pour sa boutique. Zéro intervention admin.

## Architecture

```
Vendeur saisit `example.com`
  └─ POST /api/formations/vendeur/domain
      └─ Notre API appelle Vercel API (addDomain)
      └─ Vercel retourne les TXT de vérification si nécessaire
      └─ On stocke customDomain dans InstructeurProfile
      └─ UI affiche les DNS à configurer :
          - A  @         76.76.21.21
          - TXT _vercel  vc-domain-verify=...

Vendeur configure DNS chez son registrar → propagation (5 min → 1 h)

Vendeur clique "Lancer une vérification"
  └─ POST /api/formations/vendeur/domain/verify
      └─ Notre API appelle Vercel verify
      └─ Si OK → customDomainVerified=true, SSL auto-provisionné
      └─ UI affiche "Vérifié · SSL actif"

Visiteur visite https://example.com
  └─ DNS pointe vers Vercel → Vercel route vers notre projet novakou
  └─ Middleware détecte host != novakou.com
  └─ Rewrite → /boutique/by-domain/example.com
  └─ Page fetch InstructeurProfile WHERE customDomain='example.com' AND verified=true
  └─ Rend la boutique (liste formations + produits)
```

## Variables d'env à ajouter sur Vercel

**Dashboard Vercel → Project `novakou` → Settings → Environment Variables** (Production + Preview + Development)

| Clé | Valeur |
|---|---|
| `VERCEL_API_TOKEN` | Token créé via https://vercel.com/account/tokens — scope "novakou project" |
| `VERCEL_PROJECT_ID` | `prj_yrEh7fL2HKqFPK8lAsEw2dpnWPDy` |
| `VERCEL_TEAM_ID` | `team_IHEGjbCN0XXQNhSHtEFdJHJi` |

⚠️ Le token partagé dans cette session doit être **rotaté** — il a été transmis en clair.

## Migration DB à appliquer sur Supabase

Fichier : `packages/db/prisma/migrations/2026041701_add_custom_domain/migration.sql`

À lancer **une fois** sur la DB de prod :

```bash
# Option 1 : via Supabase SQL editor — coller le contenu du .sql
# Option 2 : via prisma en local avec DATABASE_URL pointé sur prod
pnpm --filter=db migrate:deploy
```

Champs ajoutés sur `InstructeurProfile` et `MentorProfile` :
- `shopSlug` TEXT UNIQUE
- `customDomain` TEXT UNIQUE (+ index)
- `customDomainVerified` BOOLEAN (default false)
- `customDomainAddedAt` TIMESTAMP

## Routes créées

**API**
- `GET  /api/formations/vendeur/domain` — état actuel + DNS à configurer
- `POST /api/formations/vendeur/domain` — body `{ domain: "example.com" }` connecte le domaine
- `POST /api/formations/vendeur/domain/verify` — relance la vérification Vercel
- `DELETE /api/formations/vendeur/domain` — déconnecte

**UI**
- `/vendeur/parametres` → onglet "Nom de domaine"

**Public**
- `/boutique/<shopSlug>` — fallback URL (pas besoin de DNS)
- `/boutique/by-domain/<host>` — cible interne du middleware rewrite (pas d'URL publique directe)

## Limites connues
- **Middleware DB lookup** : chaque requête sur custom domain fait un Prisma query. Acceptable au démarrage, à cacher (Redis/Edge Config) si > 10k req/s.
- **Boutique minimale** : design sobre, liste formations + produits. À enrichir selon retours.
- **Mentor non-câblé** : le modèle `MentorProfile` a les champs mais les routes API + onglet Paramètres mentor n'existent pas encore. À dupliquer quand la feature vendeur est stable.

## Tester en vrai (après deploy)

1. Deploy sur Vercel (commit + push `main`)
2. Confirmer `VERCEL_API_TOKEN` en env vars Vercel
3. Exécuter la migration DB sur Supabase prod
4. Se connecter comme un vendeur → `/vendeur/parametres` → onglet "Nom de domaine"
5. Entrer un domaine de test (idéalement un sous-domaine non utilisé, genre `shop.mondomaine.com`)
6. Aller chez le registrar du domaine → créer les 2-3 records affichés
7. Attendre 5-10 min → revenir → "Lancer une vérification"
8. Une fois `Vérifié ✓` → ouvrir `https://shop.mondomaine.com` → la boutique s'affiche
