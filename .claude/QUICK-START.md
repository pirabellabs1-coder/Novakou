# FreelanceHigh — QUICK-START Guide

> Démarrage rapide pour utiliser le système de skills FreelanceHigh en 5 minutes.

---

## 1. Structure des Skills

Tous les skills sont dans `.claude/skills/` :

```
.claude/skills/
├── freelancehigh-pro/          ← META-SKILL: qualité & validation
│   ├── SKILL.md                  7 piliers (DCA, VMD, ADE, SSMC, APD, DAG, WEP)
│   ├── ANTIPATTERNS.md           42 patterns dangereux à scanner
│   └── VALIDATION-MATRIX.md     12 dimensions de validation
│
├── responsivite-pro/           ← META-SKILL: responsive 375px→2000px
│   ├── SKILL.md                  12 piliers responsivité
│   └── COMPONENTS.md             25+ composants responsive prêts
│
├── freelancehigh-api-builder/  ← Routes API dual-mode
├── freelancehigh-bug-hunter/   ← Debug systématique
├── freelancehigh-maquette-to-code/ ← Maquettes HTML → pages Next.js
├── freelancehigh-fullstack-feature/ ← Feature end-to-end
├── freelancehigh-deploy-validator/ ← Validation pré-deploy
├── freelancehigh-page-builder/ ← Pages Next.js rapides
├── freelancehigh-store-sync/   ← Stores Zustand + API sync
├── freelancehigh-db-migrator/  ← Prisma migrations
├── freelancehigh-email-builder/ ← Templates email dark theme
└── freelancehigh-admin-module/ ← Pages admin CRUD
```

---

## 2. Quel Skill Pour Quelle Tâche ?

| Tâche | Skill principal | Skills secondaires |
|-------|----------------|-------------------|
| Créer une page UI | `page-builder` | `maquette-to-code`, `responsivite-pro` |
| Implémenter page depuis maquette | `maquette-to-code` | `page-builder`, `responsivite-pro` |
| Créer endpoint API | `api-builder` | `deploy-validator` |
| Feature complète (DB→UI) | `fullstack-feature` | `api-builder`, `db-migrator`, `store-sync` |
| Modifier schéma DB | `db-migrator` | `api-builder` |
| Créer/modifier store Zustand | `store-sync` | `api-builder` |
| Créer page admin | `admin-module` | `store-sync`, `responsivite-pro` |
| Créer template email | `email-builder` | — |
| Debugger un bug | `bug-hunter` | (dépend du bug) |
| Vérifier avant deploy | `deploy-validator` | — |
| Valider qualité globale | `freelancehigh-pro` | `responsivite-pro` |

---

## 3. Workflow Typique

```
1. Décrire la tâche
2. Claude détecte le contexte (DCA du skill freelancehigh-pro)
3. Skills appropriés sont chargés automatiquement
4. Implémentation avec mobile-first (responsivite-pro)
5. Validation VMD 12 dimensions (freelancehigh-pro)
6. Scan APD 42 anti-patterns (freelancehigh-pro)
7. Deploy validation (deploy-validator)
```

---

## 4. Commandes Essentielles

```bash
pnpm dev --filter=@freelancehigh/web   # Dev server port 3000
pnpm typecheck                          # Vérif TypeScript
pnpm lint                               # ESLint
pnpm build --filter=@freelancehigh/web  # Build production
pnpm --filter=db migrate:dev            # Migration Prisma
pnpm --filter=db generate               # Régénérer client Prisma
```

---

## 5. Règles Non-Négociables

1. **Pas de `any`** → TypeScript strict partout
2. **Pas d'API keys côté client** → `process.env` serveur uniquement
3. **Pas de scrollbar horizontal** → Responsive 375px→2000px
4. **Pas de `.map()` sur undefined** → Toujours `|| []`
5. **Maquette = vérité** → Consulter avant de coder
6. **Classes `rtl:`** → Dès le premier composant
7. **Dual-mode API** → IS_DEV (stores) + Prisma (production)
