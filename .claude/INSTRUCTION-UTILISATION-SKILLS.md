# FreelanceHigh — Manuel d'Utilisation des Skills

> Guide détaillé pour utiliser le système de 12 skills + 2 meta-skills de manière optimale.

---

## PRINCIPE FONDAMENTAL

Les skills FreelanceHigh fonctionnent en **deux couches** :

```
COUCHE 1 — META-SKILLS (toujours actifs)
├── freelancehigh-pro    → Qualité, validation, anti-patterns
└── responsivite-pro     → Responsive 375px→2000px, mobile-first

COUCHE 2 — SKILLS TÂCHE (activés selon le besoin)
├── api-builder          → Backend
├── db-migrator          → Base de données
├── store-sync           → État frontend
├── page-builder         → Pages UI
├── maquette-to-code     → Conversion maquettes
├── fullstack-feature    → Feature complète
├── admin-module         → Pages admin
├── email-builder        → Templates email
├── bug-hunter           → Debugging
└── deploy-validator     → Pré-deploy
```

---

## WORKFLOW EN 5 PHASES

### Phase 0 — Détection Automatique (DCA)

Avant toute tâche, le système analyse automatiquement :

| Question | Impact |
|----------|--------|
| Espace du projet ? | Détermine le workspace (dashboard/, client/, admin/...) |
| Rôle utilisateur ? | Détermine les permissions et le store |
| Type de tâche ? | Sélectionne les skills appropriés |
| Risque technique ? | Détermine le niveau de validation |
| Dépendances ? | Identifie les skills chaînés |
| Maquette existante ? | Localise la référence HTML |
| Contrainte temporelle ? | Ajuste le workflow |

### Phase 1 — Conception (15-30% du temps)

- Architecture dessinée
- Décisions documentées (ADE)
- Interfaces TypeScript typées
- Schema DB validé si besoin

### Phase 2 — Implémentation (40-50% du temps)

Les skills sont invoqués dans l'ordre des dépendances :

```
DB change ?  → db-migrator
     ↓
API needed ? → api-builder
     ↓
Store sync ? → store-sync
     ↓
UI page ?    → page-builder / maquette-to-code / admin-module
     ↓
Email ?      → email-builder
```

### Phase 3 — Validation (15-20% du temps)

```
deploy-validator  → 10 checks techniques
freelancehigh-pro → VMD 12 dimensions (score >= 11/12)
freelancehigh-pro → APD 42 patterns (0 critique)
responsivite-pro  → VR checklist responsive
```

### Phase 4 — Shipping (5-10% du temps)

- Documentation auto-générée
- Lessons learned → `tasks/lessons.md`
- Anti-patterns détectés → `tasks/anti_patterns.md`

---

## QUAND UTILISER CHAQUE SKILL

### Scénario 1 : Créer une page depuis une maquette

```
1. maquette-to-code  → Localiser maquette, analyser structure
2. page-builder      → Template page, conventions, design system
3. store-sync        → Connecter au store (si data nécessaire)
4. responsivite-pro  → Vérifier responsive 375px→2000px
5. deploy-validator  → Validation finale
```

### Scénario 2 : Ajouter une feature complète

```
1. fullstack-feature → Orchestrer tout le flow
   ├── db-migrator   → Modifier schema.prisma si besoin
   ├── api-builder   → Créer routes API
   ├── store-sync    → Créer/étendre store Zustand
   └── page-builder  → Créer pages UI
2. deploy-validator  → Validation finale
```

### Scénario 3 : Créer une page admin

```
1. admin-module      → Template admin (table, filtres, actions, modals)
2. api-builder       → Routes /api/admin/xxx avec audit logging
3. store-sync        → Étendre useAdminStore
4. responsivite-pro  → Vérifier responsive
5. deploy-validator  → Validation finale
```

### Scénario 4 : Debugger un problème

```
1. bug-hunter        → Classifier le bug, tracer le data flow
   ├── Pattern A-F   → Vérifier les 6 patterns connus
   └── Diagnostic    → Identifier la cause racine
2. (skill approprié) → Corriger selon le type de bug
3. deploy-validator  → Vérifier pas de régression
```

### Scénario 5 : Modifier la base de données

```
1. db-migrator       → Schema change + migration + dev store sync
2. api-builder       → Mettre à jour les routes concernées
3. store-sync        → Mettre à jour les stores si changement de shape
4. deploy-validator  → Vérifier parity dev/prod
```

### Scénario 6 : Préparer un deploy

```
1. deploy-validator  → 10 checks automatiques
2. freelancehigh-pro → VMD 12 dimensions, APD 42 patterns
3. responsivite-pro  → VR checklist responsive (si UI modifié)
```

---

## CHAÎNE DE DÉPENDANCES

Respecter l'ordre d'exécution des skills :

```
INDÉPENDANTS (peuvent démarrer en parallèle) :
  • db-migrator     — Pas de pré-requis
  • page-builder    — Pas de pré-requis (sauf maquette)
  • bug-hunter      — Pas de pré-requis

DÉPENDANTS (attendre les pré-requis) :
  • api-builder     — APRÈS db-migrator (si schema changé)
  • store-sync      — APRÈS api-builder (shapes doivent exister)
  • admin-module    — APRÈS api-builder + store-sync
  • fullstack-feature — APRÈS db-migrator + api-builder + store-sync
  • email-builder   — APRÈS api-builder (triggers)
  • maquette-to-code — APRÈS page-builder (utilise ses conventions)

TOUJOURS EN DERNIER :
  • deploy-validator — Gate finale
```

---

## VALIDATION VMD — 12 DIMENSIONS

Chaque output est validé sur 12 dimensions pondérées :

| # | Dimension | Poids | Seuil minimum |
|---|-----------|-------|---------------|
| 1 | Spec Conformité | 1.5x | 8/10 |
| 2 | Maquette Alignment | 1.4x | 8/10 |
| 3 | Code Qualité | 1.3x | 9/10 |
| 4 | Sécurité | 1.5x | 9/10 |
| 5 | Performance | 1.2x | 8/10 |
| 6 | Tests | 1.2x | 8/10 |
| 7 | Accessibilité | 1.0x | 8/10 |
| 8 | RTL Ready | 1.0x | 9/10 |
| 9 | DB Integrity | 1.1x | 9/10 |
| 10 | Documentation | 1.0x | 8/10 |
| 11 | Longevity | 1.0x | 8/10 |
| 12 | Élégance Ingénieur | 1.0x | 8/10 |

**Résultat :** Score >= 11/12 pour PRODUCTION-READY

---

## ANTI-PATTERNS — 42 PATTERNS CLASSÉS

### Sévérité CRITIQUE (bloquer le deploy) :
- AKEY-001 : API Key Exposure
- 2FA-001 : 2FA Bypass
- RLS-001 : RLS Disabled
- ESC-001 : Escrow côté client
- INJ-001 : SQL Injection
- XSS-001 : Cross-Site Scripting

### Sévérité HAUTE (corriger avant merge) :
- ANY-001 : TypeScript `any`
- MAP-001 : `.map()` sur undefined
- SHAPE-001 : API response shape mismatch
- DEV-001 : Dev/Prod divergence
- AUTH-001 : Missing auth guard

### Sévérité MOYENNE (corriger dans le sprint) :
- RTL-001 : Missing RTL classes
- MAQ-001 : Maquette deviation
- PERF-001 : Performance regression
- A11Y-001 : Accessibility missing

Référence complète : `.claude/skills/freelancehigh-pro/ANTIPATTERNS.md`

---

## STORES EXISTANTS — RÉFÉRENCE RAPIDE

| Store | Fichier | Workspace | Taille |
|-------|---------|-----------|--------|
| `useDashboardStore` | `store/dashboard.ts` | Freelance | 27KB |
| `useClientStore` | `store/client.ts` | Client | 25KB |
| `useAdminStore` | `store/admin.ts` | Admin | 26KB |
| `useAgencyStore` | `store/agency.ts` | Agence | 9KB |
| `useMessagingStore` | `store/messaging.ts` | Tous | 27KB |
| `usePlatformDataStore` | `store/platform-data.ts` | Global | 66KB |
| `useServiceWizardStore` | `store/service-wizard.ts` | Freelance/Agence | 7KB |
| `useCurrencyStore` | `store/currency.ts` | Global | 1.5KB |
| `useLocaleStore` | `store/locale.ts` | Global | 1.7KB |
| `useToastStore` | `store/toast.ts` | Global | 1.1KB |

---

## MAQUETTES — 64+ DISPONIBLES

Localisation : `/mnt/c/FreelanceHigh/[nom_dossier]/`

Chaque dossier contient :
- `code.html` — Maquette HTML complète
- `screen.png` — Screenshot de référence

```bash
# Trouver une maquette par mot-clé
ls /mnt/c/FreelanceHigh/ | grep -i "<mot-clé>"
```

**Règle impérative :** TOUJOURS consulter la maquette AVANT de coder une page.

---

## RÉSUMÉ — COMMENT DÉMARRER

1. **Décrivez votre tâche** en langage naturel
2. **Les meta-skills** (freelancehigh-pro + responsivite-pro) s'activent automatiquement
3. **Les skills tâche** sont sélectionnés selon le contexte
4. **L'exécution** suit le workflow 5 phases
5. **La validation** vérifie VMD 12D + APD 42 patterns + responsive
6. **Le résultat** est production-ready avec docs auto-générées
