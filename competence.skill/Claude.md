# CLAUDE.md — FreelanceHigh Workflow Framework

> *Framework de workflow avancé pour FreelanceHigh, adapté du système de Boris Cherny (créateur de Claude Code)*
> **Projet :** FreelanceHigh — Marketplace freelance Afrique francophone  
> **Fondateur :** Lissanon Gildas  
> **Statut MVP :** Phase zéro → Implémentation (61 maquettes HTML existantes)  
> **Slogan :** "La plateforme freelance qui élève votre carrière au plus haut niveau"

---

## 📋 TABLE DES MATIÈRES
1. [Initialisation de Session — Contexte FreelanceHigh](#initialisation-de-session)
2. [Framework de Workflow Avancé](#framework-de-workflow-avancé)
3. [Principes Fondamentaux](#principes-fondamentaux)
4. [Systèmes de Gestion](#systèmes-de-gestion)
5. [Patterns de Résolution](#patterns-de-résolution)
6. [Métriques et Validation](#métriques-et-validation)
7. [Contexte Projet FreelanceHigh](#contexte-projet-freelancehigh)
8. [Commandes & Config](#commandes--config)

---

## 🚀 INITIALISATION DE SESSION

### Phase 1: Diagnostic (5 min)
```
ORDRE STRICT:
1. tasks/lessons.md      → Charger contexte + historique des erreurs
2. tasks/todo.md         → État actuel + priorités
3. tasks/context.md      → Dépendances + contraintes système
4. Créer si absent       → Structure par défaut + templates
```

### Phase 2: État Mental
- [ ] Vérifier le état cognitif (contexte propre, pas de pollution)
- [ ] Identifier les défis précédents (anti-patterns)
- [ ] Établir les invariants pour cette session
- [ ] Fixer le scope — **jamais** dépasser la session courante

### Phase 3: Pré-vérification
- Lister les tâches bloquantes
- Identifier les dépendances critiques
- Valider les ressources disponibles
- S'arrêter si manque d'infos (poser 1 question, attendre, ne pas supposer)

---

## ⚙️ FRAMEWORK DE WORKFLOW AVANCÉ

### 1️⃣ ÉTAPE: PLANIFICATION STRATÉGIQUE

#### A. Analyse de Complexité
```
Trivial (< 30 min)      → Exécute directement
Simple (30 min - 2h)    → Plan en prose 
Modéré (2-8h)          → Plan structuré + diagramme dépendances
Complexe (> 8h)        → Décomposition + sous-agents + phases
```

#### B. Matrice de Décision
```
Décision needed? → Évaluer sur 3 axes:
  1. Impact (faible/moyen/élevé)
  2. Réversibilité (facile/difficile/impossible)
  3. Urgence (peut attendre/aujourd'hui/MAINTENANT)

Matrice résultante:
- Élevé + Difficile + Urgent   → STOP, poser question
- Élevé + Difficile + Normal   → Planifier avec extrême soin
- Moyen/Faible                 → Procéder avec vérification standard
```

#### C. Plan Structuré (dans tasks/todo.md)
```markdown
## Tâche: [Nom]
- **Scope**: [Périmètre exact]
- **Dépendances**: [Prérequis]
- **Risques identifiés**: [Points critiques]
- **Phases**:
  1. [Phase] - Résultat attendu - Validation
  2. [Phase] - Résultat attendu - Validation
  
- **Critères de succès**:
  - [ ] Critère 1 (mesurable)
  - [ ] Critère 2 (vérifiable)
```

---

### 2️⃣ ÉTAPE: ARCHITECTURE DE SOUS-AGENTS

**Quand utiliser:** Problème > 8 heures OU contexte > 100KB OU dépendances complexes

#### Hiérarchie:
```
Agent Principal (direction, synthèse, validation)
├── Sous-agent 1 (Domaine A)
│   ├── Tâche micro 1
│   └── Tâche micro 2
├── Sous-agent 2 (Domaine B)
│   └── Tâche micro 3
└── [Intégration finale]
```

#### Protocole Sous-agent:
- **Input**: Contexte isolé + 1 objectif clair
- **Scope**: Une tâche, une responsabilité
- **Output**: Résultat + logs de décisions
- **Feedback**: Remonter blocages immédiatement

---

### 3️⃣ ÉTAPE: EXÉCUTION AVEC VÉRIFICATION CONTINUE

#### Cycle Micro (toutes les 10-15 min):
```
Faire (code) → Vérifier (test/log) → Documenter → Valider
     ↓                ↓                    ↓           ↓
  < 5 min      JAMAIS sans          Commentaires   Vs critères
              preuve                  + decisions   de succès
```

#### Checklist Vérification (non-trivial):
- [ ] Code écrit et compilé sans erreur
- [ ] Tests unitaires passent (ou manuel si N/A)
- [ ] Logs affichent comportement attendu
- [ ] Pas de regression (comparer avant/après)
- [ ] Comportement valide vs spec

#### Pattern: Quand Quelque Chose Sent Mauvais
```
Sensation de "bricolage"?
  → STOP immédiatement
  → Re-examiner l'approche
  → Existe-t-il une solution plus propre?
  → Reconstruire si oui
  → Ne JAMAIS continuer avec un hack
```

---

### 4️⃣ ÉTAPE: BOUCLE D'AUTO-AMÉLIORATION

#### Après Chaque Correction:
```markdown
## Leçon du [DATE]
- **Problème**: [Description]
- **Cause racine**: [Analyse]
- **Règle**: [Pattern à éviter / appliquer]
- **Preuve**: [Exemple concret]
- **Priorité**: [Haute/Normale/Basse]
```

#### Relecture Ritualisée:
```
Avant chaque session:
  1. Lire tasks/lessons.md
  2. Identifier 3 patterns critiques
  3. Les appliquer IMMÉDIATEMENT
  4. Surveiller ces erreurs spécifiquement
```

#### Anti-pattern Tracking:
```
Créer une section tasks/anti_patterns.md:
- Pattern mauvais + pourquoi
- Symptôme d'alerte
- Technique de détection
- Correction standard
```

---

## 💡 PRINCIPES FONDAMENTAUX

### Simplicité Radicale
```
• Toucher minimum de code pour effet maximum
• Pas de couches inutiles
• Si possible en 10 lignes: ne pas faire 50 lignes
• Quand en doute: code le plus bête qui marche
```

### Pas de Paresse
```
• Bug? → Cause racine, pas symptôme
• Performance lente? → Profiler, pas cacher
• Test qui échoue? → Comprendre pourquoi, pas skip
• Questions ouvertes? → Les résoudre avant de continuer
```

### Validation Avant Assomption
```
✗ "L'API est probablement /users"
✓ "J'ai vérifié: c'est /api/v2/users"

✗ "Cette variable doit être définie"
✓ "Validé: var existe avec type X"

✗ "Le test doit passer"
✓ "Exécuté: test passe avec logs concrets"
```

### Élégance Exigée
```
Question par défaut: "Un staff engineer approuverait-il ça?"
  - Code lisible? (self-documenting)
  - Structure cohérente? (patterns constants)
  - Maintenable? (quelqu'un d'autre peut le toucher)
  - Pas de sur-ingénierie? (complexité justifiée)
```

### Autonomie d'Exécution
```
• Bugs: Les corriger directement (logs → cause → fix)
• Décisions: Les prendre si < 30 min d'impact
• Blocages: Les escalader IMMÉDIATEMENT
• Questions: Les poser 1x avant de démarrer, pas pendant
```

---

## 📊 SYSTÈMES DE GESTION

### A. Système d'Énergie (Token Budget)
```
Session = Budget fixe
  ├─ 20% Planification
  ├─ 60% Exécution
  ├─ 15% Vérification
  └─ 5% Documentation

SI dépassement:
  1. Prioriser critères de succès
  2. Créer sous-tâches pour prochaine session
  3. Documenter l'état précis (pas de perte de contexte)
```

### B. Système de Priorités (MoSCoW Allégé)
```
MUST  (Bloquant)      → Fait AVANT tout
SHOULD (Important)    → Fait après MUST
COULD (Nice-to-have)  → Si temps/énergie
WON'T (Déprioritisé)  → Documenter explicitement
```

### C. Système d'État (Tâche)
```
États:
  📋 PLANIFIÉE    → Dans le plan, pas commencée
  🔄 EN_COURS     → Activement travaillée
  ⏸️  BLOQUÉE      → En attente (cause documentée)
  ✅ VÉRIFIÉE     → Terminée + validée
  ❌ ÉCHOUÉE      → Abandonnée + apprise
```

### D. Gestion des Dépendances
```
Pour chaque tâche, identifier:
  - Hard dependencies (blocke si absent)
  - Soft dependencies (idéal d'avoir)
  - Conflits potentiels

Ordre d'exécution:
  1. Dépendances hard
  2. Dépendances soft critiques
  3. Tâche principale
  4. Vérification globale
```

---

## 🎯 PATTERNS DE RÉSOLUTION

### Pattern 1: Bug Hunt (Cause Racine)
```
1. Symptôme → Description précise + contexte
2. Reproduction → Cas minimal qui le montre
3. Hypothèses → Liste ordonnée par probabilité
4. Test → Valider/invalider chaque hypothèse (logs, debugger)
5. Cause racine → Formulation claire
6. Fix → Minimal, non-symptôme
7. Validation → Prouve que ça marche
8. Leçon → Documenter pour éviter répétition
```

### Pattern 2: Refactor Élégant
```
1. Analyser le code actuel
   → Identifier les patterns répétés
   → Points de friction
   → Violations de principes
2. Concevoir la version élégante
   → Sur papier d'abord (pas de code)
   → Valider la structure
3. Implémenter progressivement
   → Garder green tests à chaque étape
   → Commits logiques
4. Comparer
   → Avant/après côte à côte
   → Vérifier pas de regression
5. Documenter
   → Pourquoi c'est mieux
   → Patterns appliqués
```

### Pattern 3: Décision Complexe
```
1. Identifier l'enjeu réel
   → Pas la question surface, la vraie tension
2. Inventorier les options
   → Au minimum 3
   → Même les mauvaises (pour comparaison)
3. Évaluer sur critères
   → Impact (maintenant vs long-terme)
   → Risque
   → Coût de change (reversibilité)
4. Prototyper le chemin risqué
   → Vérifier assumptions
   → Réviser estimate
5. Décider + communiquer
   → Écrire la décision
   → Raison + alternatives rejetées
```

### Pattern 4: Performance Lente
```
1. Mesurer (profiler)
   → Où exactement le temps est-il dépensé?
   → Quels chemins critiques?
2. Analyser les goulots
   → DB queries? N+1?
   → Algorithme O(n²)?
   → I/O bloquant?
3. Hypothèses optimisation
   → Classé par impact théorique
4. Optimiser + Mesurer
   → Une chose à la fois
   → Avant/après comparaison
5. Réévaluer
   → Assez rapide?
   → Autre goulot apparu?
```

---

## ✅ MÉTRIQUES ET VALIDATION

### A. Criteria de Succès (Défaut)
```
Toute tâche doit avoir:
  1. Mesurable (pas "bon", mais "< 500ms")
  2. Binaire (marche ou marche pas)
  3. Exécutable (pas "utilisateur satisfait", mais "test passe")
  4. Timé (quand vérifier?)
```

### B. Seuil de Validation
```
Trivial       → Pas de test formel (mais vérifier quand même)
Simple        → Test manuel documenté
Modéré        → Tests automatisés
Complexe      → Tests auto + code review mental
Critique      → Tests auto + pair review + staging
```

### C. Checklist de Clôture (Avant de marquer ✅)
```
Code:
  [ ] Compilé/Exécuté sans erreur
  [ ] Tests passent (ou N/A avec justif)
  [ ] Pas de warnings non-documentés
  [ ] Relisible par un pair

Logique:
  [ ] Validé vs spec
  [ ] Edge cases considérés
  [ ] Pas de assumptions (tout vérifiés)

Documentation:
  [ ] Changements documentés
  [ ] Commentaires non-évidents ajoutés
  [ ] Tasks/lessons.md mis à jour si nécessaire

Performance:
  [ ] Pas de regression (avant/après)
  [ ] Pas de hardcoding de secrets/paths
  [ ] Pas de logs verbeux qui restent
```

---

## 🎯 CONTEXTE PROJET FREELANCEHIGH

### Architecture technique (immuable)
```
Monorepo pnpm + Turborepo
├── apps/web           → Next.js 14 App Router (SSR + RSC)
├── apps/api           → Fastify + tRPC + Socket.io + BullMQ
├── packages/db        → Prisma ORM (Supabase Postgres 15+)
├── packages/ui        → shadcn/ui + Tailwind + React Email
├── packages/types     → Types TypeScript partagés
└── packages/config    → ESLint, TypeScript configs
```

### Stack validée — NE PAS SUBSTITUER

#### Frontend
| Outil | Rôle | Non-négociable |
|---|---|---|
| **Next.js 14** | Framework SSR/RSC | App Router seulement |
| **TypeScript** | Typage | Partout — pas de `any` |
| **Tailwind CSS** | Styles | Classes `rtl:` dès le MVP |
| **shadcn/ui** | Composants UI | Vérifier avant d'en créer nouveau |
| **Zustand** | État UI local | Devise, langue, modales |
| **TanStack Query v5** | État serveur | Requêtes API, cache |
| **next-intl** | i18n | FR principal, EN, AR, ES, PT |

#### Backend
| Outil | Rôle | Non-négociable |
|---|---|---|
| **Fastify** | Framework HTTP | WebSocket + uploads longs |
| **tRPC v11** | API RPC typée | Sur Fastify, pas Routes serveur |
| **Socket.io** | Temps réel | Redis adapter dès le jour 1 |
| **BullMQ** | Jobs async | Redis broker, retries intégrés |
| **Prisma 5** | ORM | Source de vérité DB |

#### Infrastructure
| Service | Région | Rôle | Non-négociable |
|---|---|---|---|
| **Supabase** | eu-central-1 | Postgres + Auth + Storage + Realtime | RLS sur toutes tables |
| **Stripe Connect** | International | Paiements cartes, SEPA, PayPal, Apple/Google Pay | Pas de substitution |
| **CinetPay** | 17 pays AF | Mobile Money (Orange, Wave, MTN) | Fallback Flutterwave V1 |
| **Cloudinary** | Global | Images publiques (avatars, portfolio) | Stockage privé = Supabase |
| **Redis (Upstash)** | eu-central-1 | Sessions, cache, rate-limit, broker | Upstash MVP → Railway V2+ |
| **Vercel** | Edge CDN + Johannesburg | Frontend hosting | Railway si besoins Postgres |

### Variables d'environnement critiques
```bash
# JAMAIS exposer côté client — serveur uniquement
STRIPE_SECRET_KEY=
CINETPAY_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=

# Public ok (préfixés NEXT_PUBLIC_)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### 4 rôles à implémenter
| Rôle | KYC Min | Commission | Limites |
|---|---|---|---|
| **Freelance** | Niveau 3 | 20% (gratuit) → 8% (Agence) | Retrait après 48h escrow |
| **Client** | Niveau 2 | N/A | Paiements Stripe/CinetPay |
| **Agence** | Niveau 3 | 8% | Équipe + CRM + sous-marché |
| **Admin** | Système | 0% | Modération, KYC, litiges, analytics |

### 6 espaces distincts
```
FreelanceHigh
├── 🌐 Public      → / | /explorer | /services/[slug] | /blog | /tarifs
├── 🔐 Auth        → /inscription | /connexion | /onboarding | /2fa
├── 👨‍💻 Freelance    → /dashboard | /services | /commandes | /finances | /certifications
├── 💼 Client      → /client/dashboard | /client/projets | /client/recherche-ia
├── 🏢 Agence      → /agence/dashboard | /agence/equipe | /agence/crm
└── ⚙️  Admin       → /admin/dashboard | /admin/kyc | /admin/litiges
```

### Maquettes existantes (61 fichiers HTML)
```
/mnt/c/FreelanceHigh/
├── afriquefreelance_landing_page_1/        ← Landing
├── freelancer_dashboard_overview/          ← Dashboard freelance
├── tableau_de_bord_client/                 ← Dashboard client
├── admin_dashboard_global_stats/           ← Dashboard admin
├── marketplace_service_explorer_1-12/      ← 12 variantes marketplace
├── messagerie_temps_r_el_int_gr_e_1-2/    ← Messagerie temps réel
└── ...
```

**RÈGLE IMPÉRATIVE** : Avant de développer une page, **consulter la maquette correspondante** — la maquette a priorité sur toute spec textuelle.

### KYC — 4 niveaux (claims JWT)
```
Niveau 1 : Email vérifié       → Accès de base
Niveau 2 : Téléphone +2FA      → Envoyer offres, commander
Niveau 3 : Pièce d'identité    → Retirer fonds, publier services
Niveau 4 : Vérif professionnelle → Badge Elite, limites relevées
```

### Flux escrow (critique)
```
Client paie
  ↓ Fonds bloqués (Stripe hold OU wallet escrow_status = 'held')
  ↓ Commande livrée + validée
  ↓ Fonds libérés dans wallet freelance
  ↓ Retrait : Stripe Payout (international) OU CinetPay Mobile Money

Litige?
  ↓ escrow_status = 'disputed'
  ↓ Fonds gelés jusqu'à verdict admin
```

### Recherche — évolution par version
```
MVP–V1  : Postgres FTS (pg_trgm + tsvector + GIN index) — $0
V2      : Meilisearch sur Railway (~$15/mois) — sync BullMQ
V3      : pgvector + OpenAI embeddings — recherche sémantique hybride
```

### Temps réel — architecture hybride
```
Socket.io (Fastify)    → Chat, typing, présence, messagerie agence
Supabase Realtime      → Statuts commandes, dashboard admin
Redis adapter (jour 1) → Scalabilité horizontale
```

### Risques identifiés & mitigations
| Risque | Mitigation |
|---|---|
| CinetPay instable | Retry BullMQ + Flutterwave fallback (V1) |
| Stripe indisponible en AF | CinetPay Mobile Money retrait principal local |
| Coût OpenAI (V3) | Rate-limit par tier ; `gpt-4o-mini` défaut |
| RTL arabe mal géré | Classes `rtl:` Tailwind dès les premiers composants |
| Socket.io non-scalable | Redis adapter configuré jour 1 |

### Roadmap (20 mois)
| Version | Mois | Objectif |
|---|---|---|
| **MVP** | 1–3 | Vendre, acheter, encaisser. 3 rôles fonctionnels. |
| **V1** | 4–6 | Marketplace + matching + multi-devises + Mobile Money |
| **V2** | 7–10 | Messagerie temps réel + KYC complet + badges + rétention |
| **V3** | 11–15 | IA (contrats, certifications, recherche sémantique) |
| **V4** | 16–20 | PWA + Web3/crypto + API publique + affiliation |

---

## 📚 STRUCTURE DE FICHIERS (Par Défaut)

```
.claude/
├── CLAUDE.md              ← Ce fichier
├── tasks/
│   ├── todo.md            ← État actuel + plan
│   ├── lessons.md         ← Apprentissages cumulatifs
│   ├── context.md         ← Architecture + dépendances
│   ├── anti_patterns.md   ← Patterns à éviter
│   └── metrics.md         ← Historique performance
├── decisions/
│   └── [date]_decision.md ← Décisions importantes
├── logs/
│   └── [date]_session.md  ← Résumé des sessions
└── reference/
    ├── api_endpoints.md
    ├── system_arch.md
    └── setup_guide.md
```

---

## 🔄 WORKFLOW TYPIQUE (D'une Tâche)

```
[PLANIFICATION]
  tasks/todo.md: Ajouter tâche
  Analyser complexité
  Si complexe: Plan détaillé

[EXÉCUTION]
  Lancer sub-agents si nécessaire
  Cycle micro: Code → Vérif → Doc
  Documenter décisions

[VÉRIFICATION]
  Checklist de clôture
  Comparer vs critères succès
  Aller/No-go

[CLÔTURE]
  Marquer dans todo.md
  Ajouter leçons dans lessons.md
  Documenter logs

[PROCHAINE SESSION]
  Relire lessons.md (3 patterns clés)
  Appliquer immédiatement
```

---

## 🔧 COMMANDES FREELANCEHIGH

```bash
# ═══════════════════════════════════════════════════════════════
# DÉVELOPPEMENT
# ═══════════════════════════════════════════════════════════════

# Lancer tout le monorepo (Turborepo)
pnpm dev

# Développement sélectif
pnpm dev --filter=web                # Frontend seulement
pnpm dev --filter=api                # Backend seulement
pnpm dev --filter=web --filter=api   # Frontend + Backend

# ═══════════════════════════════════════════════════════════════
# BUILD & DEPLOY
# ═══════════════════════════════════════════════════════════════

pnpm build                           # Build complet Turborepo
pnpm build --filter=web              # Build frontend seulement

# ═══════════════════════════════════════════════════════════════
# BASE DE DONNÉES (packages/db)
# ═══════════════════════════════════════════════════════════════

pnpm --filter=db migrate:dev         # Nouvelle migration locale
pnpm --filter=db migrate:deploy      # Appliquer migrations prod
pnpm --filter=db generate            # Régénérer Prisma client
pnpm --filter=db studio              # Prisma Studio (GUI)
pnpm --filter=db seed                # Seed données test

# ═══════════════════════════════════════════════════════════════
# QUALITÉ CODE
# ═══════════════════════════════════════════════════════════════

pnpm lint                            # ESLint partout
pnpm typecheck                       # TypeScript check complet
pnpm format                          # Prettier format
pnpm format:check                    # Vérifier format sans appliquer

# ═══════════════════════════════════════════════════════════════
# TESTS
# ═══════════════════════════════════════════════════════════════

pnpm test                            # Tests unitaires
pnpm test:watch                      # Mode watch
pnpm test:e2e                        # Tests Playwright
pnpm test:e2e:ui                     # Playwright UI mode

# ═══════════════════════════════════════════════════════════════
# UTILITAIRES
# ═══════════════════════════════════════════════════════════════

pnpm clean                           # Nettoyer node_modules + builds
pnpm deps                            # Checker les dépendances obsolètes
```

### Variables d'environnement à setup

**Créer à la racine :** `.env.local` (jamais dans Git)

```bash
# ═════════════════════════════════════════════════════════════
# SUPABASE (Auth + DB + Storage + Realtime)
# ═════════════════════════════════════════════════════════════
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # ⚠️  SERVEUR UNIQUEMENT

# ═════════════════════════════════════════════════════════════
# REDIS (Upstash MVP → Railway V2+)
# ═════════════════════════════════════════════════════════════
REDIS_URL=redis://[user]:[password]@[host]:[port]

# ═════════════════════════════════════════════════════════════
# STRIPE (Paiements internationaux)
# ═════════════════════════════════════════════════════════════
STRIPE_SECRET_KEY=sk_... # ⚠️  SERVEUR UNIQUEMENT
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# ═════════════════════════════════════════════════════════════
# CINETPAY (Mobile Money 17 pays AF)
# ═════════════════════════════════════════════════════════════
CINETPAY_API_KEY=... # ⚠️  SERVEUR UNIQUEMENT
CINETPAY_SITE_ID=...

# ═════════════════════════════════════════════════════════════
# OPENAI (Contrats, certifications, recherche sémantique V3+)
# ═════════════════════════════════════════════════════════════
OPENAI_API_KEY=sk-... # ⚠️  SERVEUR UNIQUEMENT

# ═════════════════════════════════════════════════════════════
# RESEND (23 templates emails transactionnels)
# ═════════════════════════════════════════════════════════════
RESEND_API_KEY=re_... # ⚠️  SERVEUR UNIQUEMENT

# ═════════════════════════════════════════════════════════════
# CLOUDINARY (Images publiques — avatars, portfolio)
# ═════════════════════════════════════════════════════════════
CLOUDINARY_URL=cloudinary://[key]:[secret]@[cloud]

# ═════════════════════════════════════════════════════════════
# TWILIO / AFRICA'S TALKING (SMS 2FA, alertes sécurité)
# ═════════════════════════════════════════════════════════════
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...

# ═════════════════════════════════════════════════════════════
# MONITORING & ANALYTICS
# ═════════════════════════════════════════════════════════════
SENTRY_DSN=...
NEXT_PUBLIC_SENTRY_DSN=...
NEXT_PUBLIC_POSTHOG_KEY=...

# ═════════════════════════════════════════════════════════════
# ENVIRONNEMENT
# ═════════════════════════════════════════════════════════════
NODE_ENV=development  # development | staging | production
API_URL=http://localhost:3001
```

### Setup initial (première fois)

```bash
# 1. Installer pnpm (si besoin)
npm install -g pnpm@latest

# 2. Clone le repo
git clone [repo-url] freelancehigh && cd freelancehigh

# 3. Installer dépendances
pnpm install

# 4. Copier .env.local et remplir (voir au-dessus)
cp .env.example .env.local
# → Éditer .env.local avec vos clés

# 5. Setup DB locale
pnpm --filter=db migrate:dev

# 6. Lancer l'app
pnpm dev

# 7. Accès
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
# Prisma Studio: http://localhost:5555
```

---

## 🌍 CONVENTIONS FREELANCEHIGH

### TypeScript — Règles absolues

```typescript
// ✅ BON
interface User {
  id: string;
  email: string;
  kycLevel: KYCLevel; // Enum typé
  role: 'freelance' | 'client' | 'agence' | 'admin';
}

// ❌ MAUVAIS
const user: any = { ... };  // Jamais de any
const role: string = 'freelance';  // Types primitifs pas assez spécifiques
```

### État — Zustand vs React Query

```typescript
// ✅ Zustand — UI state local
const { currency, setCurrency, language, setLanguage } = useCurrencyStore();

// ✅ React Query — Server state
const { data: services, isLoading } = useServices({ freelanceId });

// ❌ MAUVAIS
const [services, setServices] = useState([]);  // Pas pour data serveur!
const [currency] = useQuery({ ... });  // Pas pour UI state local!
```

### i18n RTL — Dès le MVP

```tsx
// ✅ Classes Tailwind rtl: jour 1
<div className="ml-4 rtl:ml-0 rtl:mr-4">
  Contenu responsif RTL
</div>

// ✅ Layout HTML
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
```

### Composants shadcn/ui

```bash
# Avant de créer un nouveau composant :
# 1. Vérifier shadcn/ui library (boutons, modales, inputs, etc.)
pnpm dlx shadcn-ui@latest add button   # Ajouter composant existant

# 2. Customiser dans packages/ui/components/
# 3. Réutiliser dans apps/web
```

### Sécurité API — Clés jamais côté client

```typescript
// ❌ JAMAIS CÔTÉ CLIENT
export const STRIPE_KEY = 'sk_live_...';  // ⚠️  Exposé au monde!

// ✅ Server Action Next.js
'use server';
export async function chargeCard(formData) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Sûr
  // ...
}

// ✅ Route API (apps/api)
router.post('/stripe/charge', async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  // ...
});
```

### Emails — React Email templates

```typescript
// packages/ui/emails/WelcomeEmail.tsx
import { Html, Body, Text } from '@react-email/components';

export default function WelcomeEmail({ locale, userName }) {
  return (
    <Html dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Body>
        <Text>{locale === 'fr' ? `Bienvenue ${userName}!` : `Welcome ${userName}!`}</Text>
      </Body>
    </Html>
  );
}
```

### Prisma — Source de vérité

```prisma
// schema.prisma définit TOUT
model Service {
  id        String   @id @default(cuid())
  title     String
  freelance Freelance @relation(fields: [freelanceId], references: [id])
  freelanceId String
  searchVector String? @db.Unsupported("tsvector")  // FTS Postgres
}

// Types générés automatiquement dans Prisma Client
```

### Maquettes — Non-négociable

```
Avant de coder une page :
1. Localiser maquette dans /mnt/c/FreelanceHigh/[espace]/
2. Reproduire structure, hiérarchie, espacements EXACTEMENT
3. En cas de doute : la maquette a priorité
```

---

## ✅ CHECKLIST PRÉ-COMMIT

```markdown
## Avant chaque commit

- [ ] Code compilé sans erreur : `pnpm typecheck`
- [ ] Linting OK : `pnpm lint`
- [ ] Pas de secrets en dur (grep `.env` + API keys)
- [ ] Tests passent : `pnpm test`
- [ ] Migrations Prisma documentées
- [ ] Composants shadcn/ui réutilisés (pas de doublon)
- [ ] Maquettes respectées pour UI
- [ ] RLS Supabase activé si table exposée
- [ ] Variables d'env non exposées côté client
```

---

## 🚨 RÈGLES D'OR FREELANCEHIGH

```
1. JAMAIS clé API côté client                  → Variables d'env serveur
2. JAMAIS manipuler escrow directement côté client → Toujours via API
3. JAMAIS inventer un composant                → Vérifier shadcn/ui d'abord
4. JAMAIS modifier maquette sans validation   → La maquette = vérité
5. JAMAIS de any TypeScript                   → Types stricts partout
6. JAMAIS skip 2FA/KYC                        → Sécurité d'abord
7. JAMAIS oublier RTL                         → Classes rtl: jour 1
```

---

```
1. JAMAIS supposer → Toujours vérifier
2. JAMAIS forcer → Si bloqué, re-planifier
3. JAMAIS laisser un hack → Reconstruire proprement
4. JAMAIS marquer ✅ sans preuve → Tests/logs/validation
5. JAMAIS oublier une leçon → tasks/lessons.md
6. JAMAIS interrompre → Une question avant, pas pendant
7. JAMAIS sur-ingénieriser → Assez bon est assez bon
```

---

## 📝 TEMPLATE: NOUVELLE SESSION

```markdown
# Session du [DATE]

## État Initial
- Tâche principale: [X]
- Dépendances bloquantes: [Oui/Non]
- Leçons appliquées: [Lesquelles]

## Exécution
- Phase 1: [Résultat] - Status: [✅/🔄/❌]
- Phase 2: [Résultat] - Status: [✅/🔄/❌]

## Blocages
- [Blocage]: [Cause] - Action: [Escalade/Re-plan]

## Apprentissages
- [Nouvelle leçon]

## Prochaine Session
- [ ] Tâche: [X]
- [ ] Prérequis: [Y]
```

---

---

## 📝 TEMPLATE: NOUVELLE SESSION FREELANCEHIGH

```markdown
# Session du [DATE] — FreelanceHigh MVP

## État Initial
- **Tâche principale**: [Fonctionnalité clé]
- **Espace concerné**: [Public|Auth|Freelance|Client|Agence|Admin]
- **Maquette de référence**: [Lien fichier HTML]
- **Complexité**: [Triviale|Simple|Modérée|Complexe]
- **Dépendances bloquantes**: [API tiers? Migrations DB? Authentification?]
- **Leçons appliquées**: [Lesquelles de tasks/lessons.md]

## Exécution
### Phase 1: [Description]
- **Résultat attendu**: [Spécifique, mesurable]
- **Dépendances**: [Étapes précédentes]
- **Implémentation**:
  - [ ] Frontend composant/page
  - [ ] API route/tRPC procédure
  - [ ] Migration Prisma si DB changée
  - [ ] Tests
- **Status**: [✅ Done | 🔄 In Progress | ❌ Failed]
- **Leçons**: [Obstacles rencontrés]

### Phase 2: [Description]
- [Même format]

## Blocages
- **[Blocage]**: [Description] — **Cause**: [Analyse] — **Action**: [Escalade/Re-plan/Résolution]

## Validation Finale
- [ ] Code compilé : `pnpm typecheck`
- [ ] Linting : `pnpm lint`
- [ ] Maquette respectée : [Vérif visuelle]
- [ ] Tests passent : `pnpm test`
- [ ] Variables d'env correctes (pas de secrets exposés)
- [ ] Migrations Prisma appliquées
- [ ] RLS activé sur tables sensibles
- [ ] RTL classes ajoutées (ml- → rtl:mr-, etc.)

## Apprentissages
- [Nouvelle leçon] — Format: [Date] | Ce qui a mal tourné | Règle pour l'éviter

## Prochaine Session
- [ ] Tâche: [X]
- [ ] Maquette prep: [Localiser HTML]
- [ ] Prérequis: [Y]
```

---

## 📊 STRUCTURE RECOMMANDÉE (tasks/)

```
.claude/
├── CLAUDE.md                    ← Ce fichier
├── tasks/
│   ├── todo.md                  ← État des sprints (MVP phases)
│   ├── lessons.md               ← Erreurs + règles cumulées
│   ├── context.md               ← Stack technique (copie @ARCHITECTURE.md)
│   ├── anti_patterns.md         ← Pièges récurrents FreelanceHigh
│   ├── maquettes_checklist.md   ← Cartographie des 61 maquettes HTML
│   └── metrics.md               ← Performance, coût, temps
├── decisions/
│   └── [date]_[decision].md     ← Décisions techniques (ex: JWT custom claims)
├── logs/
│   └── [date]_session_[num].md  ← Résumé de chaque session
└── reference/
    ├── @PRD.md                  ← Copie du Product Requirements Document
    ├── @ARCHITECTURE.md         ← Copie du doc architecture
    ├── @API_TIERS.md            ← Stripe, CinetPay, OpenAI, Resend, etc.
    └── @MAQUETTES_URLS.md       ← URLs/chemins vers chaque maquette HTML
```

---

## 🎯 PRIORITÉS PENDANT LE MVP

```
MUST (Jour 1–3)
├── Setup monorepo + env locals
├── Auth (Supabase) + 2FA basique
├── Dashboard freelance (CRUD services)
├── Dashboard client (explorer + commander)
└── Escrow (Stripe) premier paiement

SHOULD (Semaine 1–2)
├── Mobile Money CinetPay
├── Messagerie simple (pas temps réel)
├── KYC niveaux 2–3
└── Notifications email (Resend)

COULD (Semaine 2–3)
├── Recherche FTS avancée
├── Temps réel Socket.io
├── IA contrats (OpenAI)
└── Analytics dashboard admin

WON'T (MVP = scope fixe)
├── PWA mobile (V4)
├── Web3/crypto (V4)
├── Matching IA (V3)
└── API publique (V4)
```

---

*Dernière mise à jour: 2026*  
*FreelanceHigh MVP — Framework adapté aux principes de Boris Cherny*  
*Documentation complète : [@PRD.md](./PRD.md) | [@ARCHITECTURE.md](./ARCHITECTURE.md)*