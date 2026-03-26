# FreelanceHigh — INDEX COMPLET DES SKILLS

> Catalogue exhaustif de tous les skills disponibles, avec chemins, résumés et dépendances.

---

## META-SKILLS (Gouvernance & Qualité)

### 1. freelancehigh-pro — Framework d'Expertise Avancée
- **Chemin:** `.claude/skills/freelancehigh-pro/SKILL.md`
- **Fichiers associés:**
  - `ANTIPATTERNS.md` — 42 patterns dangereux avec détection et fix
  - `VALIDATION-MATRIX.md` — 12 dimensions de validation qualité
- **7 Piliers:** DCA, VMD, ADE, SSMC, APD, DAG, WEP
- **Usage:** Activé automatiquement sur TOUTE tâche FreelanceHigh
- **Dépendances:** Aucune (skill racine)

### 2. responsivite-pro — Framework Responsive Mobile-First
- **Chemin:** `.claude/skills/responsivite-pro/SKILL.md`
- **Fichiers associés:**
  - `COMPONENTS.md` — 25+ composants responsive prêts à l'emploi
- **12 Piliers:** DEA, GIA, MFM, IMR, TF, LAI, AFP, ON, PMF, TRA, MR, VR
- **Usage:** Activé automatiquement sur TOUTE tâche UI/frontend
- **Dépendances:** Aucune (skill racine)

---

## SKILLS D'IMPLÉMENTATION (10 skills)

### 3. freelancehigh-api-builder — Routes API Dual-Mode
- **Chemin:** `.claude/skills/freelancehigh-api-builder/skill.md`
- **Résumé:** Crée des routes API Next.js avec pattern IS_DEV + Prisma
- **Étapes:** 8 (route structure → skeleton → validation → dev stores → Prisma → params → audit → events)
- **Dépendances:** `deploy-validator` (validation post)
- **Dépendants:** `store-sync`, `fullstack-feature`, `admin-module`

### 4. freelancehigh-bug-hunter — Debug Systématique
- **Chemin:** `.claude/skills/freelancehigh-bug-hunter/skill.md`
- **Résumé:** Diagnostic bugs via trace API → Store → Component
- **6 Patterns connus:** A (response shape), B (arrays undefined), C (KYC refresh), D (CSP), E (dev/prod divergence), F (auth callback)
- **Dépendances:** Aucune
- **Dépendants:** Aucun (skill réactif)

### 5. freelancehigh-maquette-to-code — Maquettes HTML → Next.js
- **Chemin:** `.claude/skills/freelancehigh-maquette-to-code/skill.md`
- **Résumé:** Convertit les 64+ maquettes HTML en pages Next.js production
- **Étapes:** 7 (localiser → analyser → mapper → builder → design system → skeleton → checklist)
- **Dépendances:** `responsivite-pro`, `page-builder`
- **Dépendants:** Aucun

### 6. freelancehigh-fullstack-feature — Feature End-to-End
- **Chemin:** `.claude/skills/freelancehigh-fullstack-feature/skill.md`
- **Résumé:** Implémentation complète Schema → API → Store → Component → Page
- **Étapes:** 8 (spec → schema → dev store → API → client → store → UI → wiring)
- **Dépendances:** `api-builder`, `db-migrator`, `store-sync`
- **Dépendants:** Aucun

### 7. freelancehigh-deploy-validator — Validation Pré-Deploy
- **Chemin:** `.claude/skills/freelancehigh-deploy-validator/skill.md`
- **Résumé:** 10 checks avant deploy (TypeScript, API shapes, null safety, CSP, auth, parity)
- **Dépendances:** Aucune
- **Dépendants:** Tous les skills (gate finale)

### 8. freelancehigh-page-builder — Pages Next.js Rapides
- **Chemin:** `.claude/skills/freelancehigh-page-builder/skill.md`
- **Résumé:** Création rapide de pages avec conventions projet, dark theme, stores
- **6 Workspaces:** Public, Freelance, Client, Agence, Admin, Formations
- **Dépendances:** `responsivite-pro`
- **Dépendants:** `maquette-to-code`

### 9. freelancehigh-store-sync — Stores Zustand + API
- **Chemin:** `.claude/skills/freelancehigh-store-sync/skill.md`
- **Résumé:** Crée/étend stores Zustand avec sync API, persistence, safe defaults
- **10 Stores existants:** dashboard, client, admin, agency, messaging, platform-data, service-wizard, currency, locale, toast
- **Dépendances:** `api-builder`
- **Dépendants:** `fullstack-feature`, `admin-module`

### 10. freelancehigh-db-migrator — Prisma Migrations
- **Chemin:** `.claude/skills/freelancehigh-db-migrator/skill.md`
- **Résumé:** Modifications Prisma + migrations + sync dev stores + validation dual-mode
- **50+ Models existants** dans schema.prisma
- **Dépendances:** Aucune
- **Dépendants:** `fullstack-feature`, `api-builder`

### 11. freelancehigh-email-builder — Templates Email
- **Chemin:** `.claude/skills/freelancehigh-email-builder/skill.md`
- **Résumé:** Templates email HTML dark theme, envoi via Resend, 23 templates PRD
- **Dépendances:** `api-builder` (triggers)
- **Dépendants:** Aucun

### 12. freelancehigh-admin-module — Pages Admin CRUD
- **Chemin:** `.claude/skills/freelancehigh-admin-module/skill.md`
- **Résumé:** Pages admin complètes avec tables, filtres, actions, modals, audit
- **18+ Pages admin existantes**
- **Dépendances:** `api-builder`, `store-sync`, `responsivite-pro`
- **Dépendants:** Aucun

---

## MATRICE DES DÉPENDANCES

```
                    ┌─────────────────────┐
                    │  freelancehigh-pro   │ (valide TOUT)
                    │  responsivite-pro    │ (valide TOUT UI)
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
  ┌───────▼───────┐   ┌───────▼───────┐   ┌────────▼──────┐
  │  api-builder  │   │  db-migrator  │   │  page-builder │
  └───────┬───────┘   └───────┬───────┘   └────────┬──────┘
          │                    │                     │
  ┌───────▼───────┐           │            ┌────────▼──────────┐
  │  store-sync   │←──────────┘            │ maquette-to-code  │
  └───────┬───────┘                        └───────────────────┘
          │
  ┌───────▼────────────┐
  │ fullstack-feature   │ (utilise api-builder + db-migrator + store-sync)
  │ admin-module        │ (utilise api-builder + store-sync)
  │ email-builder       │ (utilise api-builder pour triggers)
  └─────────────────────┘
          │
  ┌───────▼────────────┐
  │ deploy-validator    │ (gate finale pour TOUS)
  └─────────────────────┘
          │
  ┌───────▼────────────┐
  │ bug-hunter          │ (diagnostic si problème)
  └─────────────────────┘
```

---

## FICHIERS DE TRAVAIL

| Fichier | Chemin | Rôle |
|---------|--------|------|
| todo.md | `.claude/tasks/todo.md` | État des sprints et priorités |
| lessons.md | `.claude/tasks/lessons.md` | Apprentissages cumulatifs |
| anti_patterns.md | `.claude/tasks/anti_patterns.md` | Patterns détectés dans le projet |
| QUICK-START.md | `.claude/QUICK-START.md` | Guide démarrage rapide |
| INSTRUCTION-UTILISATION-SKILLS.md | `.claude/INSTRUCTION-UTILISATION-SKILLS.md` | Manuel d'utilisation détaillé |

---

## DOCUMENTS RÉFÉRENCE

| Document | Chemin | Contenu |
|----------|--------|---------|
| CLAUDE.md | `/mnt/c/FreelanceHigh/CLAUDE.md` | Workflow principal + conventions |
| PRD.md | `/mnt/c/FreelanceHigh/PRD.md` | Product Requirements Document complet |
| ARCHITECTURE.md | `/mnt/c/FreelanceHigh/ARCHITECTURE.md` | Architecture technique détaillée |
