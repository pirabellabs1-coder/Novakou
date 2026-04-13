# COMPETENCES FREELANCEHIGH — Index des 10 Skills

> 10 skills Claude Code personnalisées pour le projet FreelanceHigh.
> Source : `.claude/skills/freelancehigh-*/skill.md`

---

## Vue d'ensemble

| # | Skill | Fichier | Quand l'utiliser |
|---|-------|---------|-----------------|
| 1 | **API Builder** | [01-api-builder.md](./01-api-builder.md) | Créer une route API dual-mode (IS_DEV + Prisma) |
| 2 | **Bug Hunter** | [02-bug-hunter.md](./02-bug-hunter.md) | Debugger un bug en traçant API → Store → Component |
| 3 | **Maquette to Code** | [03-maquette-to-code.md](./03-maquette-to-code.md) | Convertir une maquette HTML en page Next.js |
| 4 | **Fullstack Feature** | [04-fullstack-feature.md](./04-fullstack-feature.md) | Feature end-to-end : Schema → API → Store → Page |
| 5 | **Deploy Validator** | [05-deploy-validator.md](./05-deploy-validator.md) | Validation pré-déploiement (10 checks) |
| 6 | **Page Builder** | [06-page-builder.md](./06-page-builder.md) | Créer une page avec le design system dark theme |
| 7 | **Store Sync** | [07-store-sync.md](./07-store-sync.md) | Zustand store avec sync API + persistence |
| 8 | **DB Migrator** | [08-db-migrator.md](./08-db-migrator.md) | Prisma schema + migration + dev store |
| 9 | **Email Builder** | [09-email-builder.md](./09-email-builder.md) | Templates email dark theme + envoi Resend |
| 10 | **Admin Module** | [10-admin-module.md](./10-admin-module.md) | Pages admin CRUD + modals + audit log |

---

## Résumé par couche

### Backend
- **01-api-builder** — Pattern dual-mode, Zod validation, auth guards, audit log
- **08-db-migrator** — Prisma schema, migrations, dev data store sync

### Frontend
- **03-maquette-to-code** — 64+ maquettes HTML → pages Next.js responsive
- **06-page-builder** — Template page + design system + skeleton loading

### Full-stack
- **04-fullstack-feature** — Schema → API → Store → Component en un pass
- **07-store-sync** — Zustand + API client + safe defaults + persistence

### Spécialisées
- **02-bug-hunter** — 6 patterns de bugs connus + diagnostic systématique
- **05-deploy-validator** — 10 checks pré-déploiement (TS, CSP, auth, shapes)
- **09-email-builder** — 23 templates email transactionnels dark theme
- **10-admin-module** — Pages admin avec tables, filtres, modals, audit

---

## Patterns critiques (communs à toutes les skills)

1. **Dual-mode API** : `if (IS_DEV) { devStore } else { prisma }`
2. **Response shape** : API et client doivent matcher exactement
3. **Arrays safe** : Toujours `|| []` — jamais `.map()` sur undefined
4. **Auth guards** : `getServerSession(authOptions)` sur toute route protégée
5. **Dark theme** : `bg-neutral-dark`, `border-border-dark`, `text-white/slate-400`
6. **Mobile-first** : Classes `sm:`, `md:`, `lg:` + skeleton loading
