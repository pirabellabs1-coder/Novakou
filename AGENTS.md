# AGENTS.md — Novakou Workflow Framework

> *Framework de workflow avancé pour Novakou, adapté du système de Boris Cherny (créateur de Codex)*
> **Produit :** Novakou — plateforme de vente de formations et de produits numériques (Afrique francophone + diaspora)
> **Positionnement :** l'équivalent francophone/africain de Gumroad, Systeme.io ou Kajabi
> **Statut :** MVP en production — espaces vendeur, apprenant, affilié et admin opérationnels

---

## ⚠️ NOTE DE LECTURE — HÉRITAGE « FreelanceHigh »

Ce dépôt s'est d'abord appelé **FreelanceHigh** (marketplace de services freelance). Le produit
a pivoté vers **Novakou** (vente de formations et de produits numériques). Le renommage n'est
pas terminé, et cela se voit dans le code :

| Où | État actuel |
|---|---|
| `package.json` (racine et `apps/web`) | encore `freelancehigh` / `@freelancehigh/web` |
| `.env.example` | `NEXT_PUBLIC_APP_NAME="FreelanceHigh"` (variable **plus lue** par le code) |
| Code applicatif | « Novakou » domine largement (~439 fichiers contre ~68) |
| `PRD.md`, `ARCHITECTURE.md`, `TECH_STACK_RAPPORT.md` | décrivent **FreelanceHigh**, pas le produit livré |

**Conséquence pratique :** les noms de packages pnpm restent `@freelancehigh/*` — c'est normal,
ne pas « corriger » au passage. En revanche, tout contenu visible par l'utilisateur dit **Novakou**.

Les rôles marketplace (`FREELANCE`, `CLIENT`, `AGENCE`) existent toujours dans le schéma Prisma
et cohabitent avec les rôles formations. Le code marketplace n'est pas mort : il est en sommeil.

---

## 📋 TABLE DES MATIÈRES
1. [Initialisation de Session](#initialisation-de-session)
2. [Framework de Workflow Avancé](#framework-de-workflow-avancé)
3. [Principes Fondamentaux](#principes-fondamentaux)
4. [Systèmes de Gestion](#systèmes-de-gestion)
5. [Patterns de Résolution](#patterns-de-résolution)
6. [Métriques et Validation](#métriques-et-validation)
7. [Contexte Projet Novakou](#contexte-projet-novakou)
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
- [ ] Vérifier l'état cognitif (contexte propre, pas de pollution)
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

> ⚠️ **Piège vérifié en conditions réelles :** un sous-agent chargé d'explorer le code peut
> recopier la documentation obsolète au lieu de lire les sources. Toujours exiger de lui
> qu'il **cite le fichier** de chaque affirmation, et recouper les conclusions sensibles
> (stack, versions, dépendances) contre `package.json` avant de les écrire quelque part.

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

✗ "La doc dit que le backend est Fastify"
✓ "Vérifié dans package.json: pas de Fastify, tout est en routes Next.js"
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

## 🎯 CONTEXTE PROJET NOVAKOU

### Ce que fait le produit

Novakou permet à un créateur (formateur, coach, designer) de **vendre des formations vidéo
et des produits numériques** à une audience africaine francophone, encaissée principalement
en **Mobile Money** et en **FCFA**.

Le créateur ouvre une boutique, y publie ses formations et produits, encaisse, et retire ses
gains. Des affiliés peuvent promouvoir ses produits contre commission. Les acheteurs suivent
leurs formations, obtiennent des certificats et discutent avec les formateurs.

### Architecture technique RÉELLE

```
Monorepo pnpm 9.15.9 + Turborepo
├── apps/web           → Next.js 15.5.12 App Router — TOUTE l'application
├── packages/db        → Prisma 5 (schema + 42 migrations + seeds)
├── packages/ui        → Composants React partagés
├── packages/types     → Types TypeScript partagés
└── packages/config    → ESLint + TypeScript configs
```

> **⚠️ IL N'Y A PAS DE `apps/api`.** Tout le backend vit dans les *route handlers* de
> Next.js sous `apps/web/app/api/**`. Ni Fastify, ni tRPC, ni Socket.io, ni BullMQ, ni
> ioredis ne sont installés. Ne pas en introduire sans décision explicite du fondateur.
> Les traitements récurrents passent par `apps/web/app/api/cron/**` (protégés par `CRON_SECRET`).

### Stack validée — NE PAS SUBSTITUER

#### Frontend
| Outil | Version | Rôle |
|---|---|---|
| **Next.js** | 15.5.12 | App Router + route handlers. `next dev --turbopack` |
| **React** | 19 | Server Components par défaut |
| **TypeScript** | strict | Pas de `any` |
| **Tailwind CSS** | 3.4 | Styles |
| **Zustand** | 5 | État UI local (devise, langue, modales) |
| **TanStack Query** | 5 | État serveur (requêtes, cache) |
| **next-intl** | 3 | i18n — `apps/web/messages/*.json` |

#### Backend & données
| Outil | Version | Rôle |
|---|---|---|
| **Route handlers Next.js** | — | Toute l'API, sous `apps/web/app/api/**` |
| **NextAuth** | 4.24 | Authentification (voir ci-dessous) |
| **Prisma** | 5 | ORM — `packages/db/prisma/schema.prisma` = source de vérité |
| **Supabase** | — | Postgres + **Storage uniquement** (PAS Supabase Auth) |
| **Upstash Redis** | REST | Cache / rate-limit (`UPSTASH_REDIS_REST_*`) |

#### Services externes
| Service | Rôle |
|---|---|
| **OpenRouter** | Point d'entrée **unique** de l'IA |
| **Resend** | Emails transactionnels |
| **Cloudinary** | Images publiques |
| **Sentry** | Suivi des erreurs |
| **Vercel** | Hébergement |
| **Meta / TikTok CAPI** | Tracking conversions côté serveur |

### Authentification — NextAuth, pas Supabase Auth

Config : `apps/web/lib/auth/config.ts`. Session **JWT** (30 jours d'inactivité max, rotation
quotidienne).

| Provider | Détail |
|---|---|
| **Credentials** | Email + mot de passe (≥10 car., 1 maj., 1 min., 1 chiffre). Rate-limit 15 min. |
| **Buyer OTP** | Code à 6 chiffres, valide 10 min — crée un compte « léger » pour un acheteur invité |
| **Google OAuth** | Actif seulement si `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` |
| **LinkedIn OAuth** | Actif seulement si `LINKEDIN_CLIENT_ID` + `LINKEDIN_CLIENT_SECRET` |

**2FA (TOTP, `otplib`)** — `apps/web/app/api/auth/setup-2fa/route.ts`.
Obligatoire et non contournable pour les comptes **ADMIN**. Le flux repose sur une preuve
serveur `twoFactorVerifiedAt` consommée une seule fois ; le middleware bloque les dashboards
tant que le JWT porte `tfaPending`.

> 🔴 **Dette connue :** `User.twoFactorSecret` est stocké **en clair** en base
> (`packages/db/prisma/schema.prisma`). À chiffrer.

### Rôles — trois couches distinctes

**1. Rôles marketplace** — `UserRole` dans `schema.prisma` (héritage FreelanceHigh, toujours actifs) :
`FREELANCE`, `CLIENT`, `AGENCE`, `ADMIN`. Défaut à l'inscription OAuth/invité : `CLIENT`.

**2. Rôles formations** — `User.formationsRole`, c'est ce qui pilote le produit actuel :
`apprenant`, `instructeur`, `mentor`, `affilie`.

**3. Sous-rôles admin** — `apps/web/lib/admin-permissions.ts` :
`super_admin` (défaut), `moderateur`, `validateur_kyc`, `analyste`, `support`, `financier`.

### KYC — 4 niveaux

Garde : `apps/web/lib/auth/kyc-guard.ts`. Route : `apps/web/app/api/formations/kyc/route.ts`.

```
Niveau 1 : aucun contrôle          → parcourir, créer un profil
Niveau 2 : identité vérifiée       → publier un service/formation, retirer des fonds
Niveau 3 : KYC complet             → débloque les actions de niveau 2
Niveau 4 : certification pro       → badge Elite, limites relevées (exige le niveau 2 validé)
```

- **Recto + verso + selfie sont obligatoires** pour toute demande.
- Exempt de KYC : `CLIENT` uniquement. Soumis au KYC : `FREELANCE`, `AGENCE`, `INSTRUCTEUR`.
- Statuts : `EN_ATTENTE` → `APPROUVE` | `REFUSE` (avec motif). Table `KycRequest`.
- Les pièces sont stockées dans **Supabase Storage**.

### Les espaces de l'application

```
apps/web/app/
├── (formations)              → 🌐 Public : /, /explorer, /formation/[slug], /produit/[slug],
│                                /checkout, /academie, /guides/[slug] (blog SEO),
│                                /bundle/[slug], /abonnement/[id], /aide/**, pages légales,
│                                /connexion, /inscription, /2fa
├── (formations-dashboard)/vendeur    → 🏪 Créateur : dashboard, formations, produits,
│                                boutiques (multi-domaines), commandes, finances, retraits,
│                                statistiques, automatisations, emails, avis, parcours,
│                                ai-studio, ai-coach, api-keys, parametres
├── (formations-dashboard)/apprenant  → 🎓 Acheteur : mes-formations, mes-produits, bundles,
│                                abonnements, certificats, progression, panier, depenses,
│                                mentorat, communaute, messages
├── (formations-dashboard)/admin      → ⚙️ Plateforme : utilisateurs, formations, produits,
│                                transactions, retraits, kyc, tickets, commissions,
│                                signalements, passerelles, taux, configuration, audit,
│                                analytics-funnel, emails, notifications, ai-assistant
├── (formations-affilie)/affilie      → 🤝 Affilié : dashboard, liens, commissions, retraits,
│                                performances, parametres
├── (paylink)/payer/[slug]    → 💳 Lien de paiement public (sans compte)
├── boutique/[slug]           → 🛍️ Vitrine boutique (+ /by-domain/[host] pour domaine custom)
├── f/[slug]                  → 🎯 Tunnel de vente (funnel) personnalisé
├── a/[code]                  → 📣 Vitrine publique d'un affilié (tracking commission)
├── acheteur, backoffice/[slug], admin-login/**  → portails de connexion dédiés
├── invitation/[code], payment/attente, maintenance
└── api/**                    → TOUT le backend (route handlers)
```

**Connexion admin** : `/admin-login/formations/[token]`, protégée par un token d'URL validé
côté serveur, puis email + mot de passe + TOTP.

### Paiements — registre unique de passerelles

Fichier maître : **`apps/web/lib/payments/registry.ts`** (~712 lignes, abondamment commenté).
Le lire avant toute intervention sur les paiements.

Le registre décrit, pour chaque opérateur Mobile Money, **qui sait encaisser** (`collect`) et
**qui sait reverser** (`payout`), avec le code natif de chaque fournisseur. ~44 opérateurs
couverts sur une vingtaine de pays.

| Passerelle | id | collect | payout | Variables |
|---|---|---|---|---|
| **FeexPay** | `feexpay` | ✓ | ✓ | `FEEXPAY_API_KEY`, `FEEXPAY_SHOP_ID` |
| **FedaPay** | `fedapay` | ✓ | ✓ | `FEDAPAY_SECRET_KEY` |
| **PawaPay** | `pawapay` | ✓ | ✓ | `PAWAPAY_API_TOKEN` |
| **Monetbil** | `monetbil` | ✓ | ✗ | `MONETBIL_SERVICE_KEY` |
| **iPay Money** | `ipaymoney` | ✓ | ✗ | `IPAYMONEY_SECRET_KEY`, `IPAYMONEY_WEBHOOK_SECRET` |

**Hors registre**, mais présents dans le code : **Stripe** (cartes), **Kkiapay** (widget de
checkout, cf. `CheckoutInner.tsx`, `PayerClient.tsx`), **CinetPay** et **PayGenius**
(routes + webhooks dédiés). Ne pas supposer qu'une passerelle du registre couvre ces cas.

#### 🔴 Règles absolues sur les paiements — argent réel

```
1. Moneroo est RETIRÉ — décision fondateur, définitive. Ne le réintroduire nulle part :
   ni passerelle, ni route, ni repli silencieux.
2. N'inscrire QUE des codes opérateur CONFIRMÉS par la doc du fournisseur.
   Pas de code = fournisseur SAUTÉ pour cet opérateur. On ne devine JAMAIS un routage :
   un code inventé envoie l'argent sur le mauvais réseau.
3. Un opérateur qu'aucune passerelle branchée ne couvre n'est PAS proposé —
   plutôt que renvoyé discrètement vers un tiers.
4. Les credentials en base sont chiffrés via PAYMENT_CREDENTIALS_KEY.
```

### IA — OpenRouter, point d'entrée unique

- **Passerelle :** `apps/web/lib/ai/openrouter.ts` — fonctions `chatIA()` / `chatIAOuNull()`
- **Modèle par défaut :** `anthropic/claude-sonnet-5`, surchargeable par `OPENROUTER_MODEL`
- **Quotas :** `apps/web/lib/ai/usages.ts` — 7 usages déclarés (`support`, `recherche`,
  `studio`, `tunnel`, `copilote`, `agent`, `redaction`). Modèle, température et `maxTokens`
  sont **imposés côté serveur** ; le navigateur ne choisit que l'usage.
  Plafond global : `AI_PLAFOND_QUOTIDIEN` (défaut 3000).
- **Seule exception :** la transcription vocale appelle Whisper directement chez OpenAI
  (`OPENAI_API_KEY`), OpenRouter n'exposant pas d'endpoint audio. C'est **volontaire**.
- `GROQ_API_KEY` / `GEMINI_API_KEY` sont des reliquats acceptés mais **plus appelés**.

---

## 🔧 COMMANDES NOVAKOU

> Toutes vérifiées dans les `package.json` du dépôt. **Si une commande n'est pas listée ici,
> elle n'existe pas** — ne pas l'inventer.

```bash
# ═══════════════════════════════════════════════════════════════
# DÉVELOPPEMENT (racine — Turborepo)
# ═══════════════════════════════════════════════════════════════
pnpm dev                                  # turbo run dev
pnpm dev -F @freelancehigh/web            # front seul (next dev --turbopack)

# ═══════════════════════════════════════════════════════════════
# QUALITÉ — les 3 commandes du garde-fou
# ═══════════════════════════════════════════════════════════════
pnpm lint                                 # next lint
pnpm typecheck                            # tsc --noEmit
pnpm build                                # next build

# ═══════════════════════════════════════════════════════════════
# TESTS — Playwright uniquement
# ═══════════════════════════════════════════════════════════════
pnpm -F @freelancehigh/web test:e2e       # 23 specs, apps/web/tests/
pnpm -F @freelancehigh/web test:e2e:ui    # mode interactif

# ═══════════════════════════════════════════════════════════════
# BASE DE DONNÉES (packages/db)
# ═══════════════════════════════════════════════════════════════
pnpm -F @freelancehigh/db migrate:dev     # nouvelle migration locale
pnpm -F @freelancehigh/db migrate:deploy  # appliquer en prod
pnpm -F @freelancehigh/db generate        # régénérer le client Prisma
pnpm -F @freelancehigh/db studio          # Prisma Studio (GUI)
pnpm -F @freelancehigh/db seed            # seed
pnpm -F @freelancehigh/db db:push         # sync schéma (DEV uniquement)

# ═══════════════════════════════════════════════════════════════
# SCRIPTS UTILITAIRES (scripts/ — 38 fichiers)
# ═══════════════════════════════════════════════════════════════
pnpm indexnow                             # soumission IndexNow (Bing, Yandex, Naver)
node scripts/seo-validate.mjs             # valide le JSON-LD (serveur doit tourner)
node scripts/smoke-test-api.mjs           # smoke test des endpoints
bash scripts/post-deploy-smoke.sh         # smoke test post-déploiement
```

### ⚠️ Pièges de commandes

```
✗ pnpm test          → remonte à `turbo run test`, mais AUCUN package ne définit
                       de script `test`. La commande ne lance RIEN.
                       → utiliser pnpm -F @freelancehigh/web test:e2e
✗ pnpm format        → n'existe pas
✗ pnpm format:check  → n'existe pas
✗ pnpm clean         → n'existe pas
✗ pnpm deps          → n'existe pas
✗ pnpm dev --filter=api → il n'y a pas d'app `api`
```

### Tests Playwright — config

`apps/web/playwright.config.ts` : `webServer` démarre `npx next dev -p 3450`
(baseURL `http://localhost:3450`, 180 s de marge). Trois profils : Desktop Chrome 1280×720,
Mobile Safari iPhone 13, Tablet 768×1024. En CI : 2 tentatives, 1 worker.

### CI GitHub Actions

| Workflow | Ce qu'il fait |
|---|---|
| `.github/workflows/ci.yml` | `lint` → `typecheck` → `build`, puis Playwright (chromium) sur PR et `main`. Rapport HTML archivé 14 j en cas d'échec. |
| `.github/workflows/seo.yml` | Build + démarrage prod, puis validation Schema.org sur 13 URLs clés (FAQPage, Article, breadcrumb, og:image, titres 25–65 car., descriptions 100–160 car.). **Sort en erreur et bloque le déploiement en cas de régression.** |

**Aucun hook Git actif** — `.git/hooks/` ne contient que des `.sample`. Rien ne vous
arrêtera automatiquement avant un commit : la checklist ci-dessous est donc à appliquer
à la main.

### Variables d'environnement

**Créer `.env.local` à la racine — jamais commité.**

> ⚠️ **`.env.example` est très incomplet** : une cinquantaine de variables lues par le code
> n'y figurent pas (toutes les passerelles de paiement, OpenRouter, Sentry, Upstash, VAPID,
> Telegram, tokens admin…). Il contient à l'inverse des variables mortes
> (`NEXT_PUBLIC_APP_NAME`, `STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_TURN_*`).
> **Se fier au code, pas à `.env.example`.**

```bash
# ── BASE DE DONNÉES ──────────────────────────────────────────
DATABASE_URL=                      # pool Postgres
DIRECT_URL=                        # connexion directe (migrations)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # ⚠️ SERVEUR UNIQUEMENT

# ── AUTH ─────────────────────────────────────────────────────
NEXTAUTH_URL=
NEXTAUTH_SECRET=                   # ⚠️ SERVEUR UNIQUEMENT
GOOGLE_CLIENT_ID= / GOOGLE_CLIENT_SECRET=
LINKEDIN_CLIENT_ID= / LINKEDIN_CLIENT_SECRET=

# ── PAIEMENTS ────────────────────────────────────────────────
FEEXPAY_API_KEY= / FEEXPAY_SHOP_ID=
FEDAPAY_SECRET_KEY= / FEDAPAY_ENVIRONMENT=
PAWAPAY_API_TOKEN=
MONETBIL_SERVICE_KEY= / MONETBIL_PAYOUT_URL=
IPAYMONEY_SECRET_KEY= / IPAYMONEY_WEBHOOK_SECRET=
STRIPE_SECRET_KEY= / STRIPE_WEBHOOK_SECRET=
CINETPAY_API_KEY= / CINETPAY_SITE_ID=
PAYGENIUS_API_KEY= / PAYGENIUS_API_SECRET= / PAYGENIUS_BASE_URL=
PAYGENIUS_PAYOUT_WALLET_ID= / PAYGENIUS_WEBHOOK_SECRET=
PAYMENT_CREDENTIALS_KEY=           # ⚠️ chiffre les credentials en base
PAYOUT_PROXY_URL= / AUTO_PAYOUT_DELAY_MINUTES=

# ── IA ───────────────────────────────────────────────────────
OPENROUTER_API_KEY=                # ⚠️ SERVEUR UNIQUEMENT
OPENROUTER_MODEL=                  # défaut: anthropic/claude-sonnet-5
AI_PLAFOND_QUOTIDIEN=              # défaut: 3000
OPENAI_API_KEY=                    # Whisper (transcription) uniquement

# ── EMAIL / MÉDIAS ───────────────────────────────────────────
RESEND_API_KEY= / RESEND_AUDIENCE_ID= / EMAIL_FROM=
CLOUDINARY_CLOUD_NAME= / CLOUDINARY_API_KEY= / CLOUDINARY_API_SECRET=

# ── INFRA / OBSERVABILITÉ ────────────────────────────────────
UPSTASH_REDIS_REST_URL= / UPSTASH_REDIS_REST_TOKEN=
SENTRY_DSN= / NEXT_PUBLIC_SENTRY_DSN= / SENTRY_AUTH_TOKEN=
SENTRY_ORG= / SENTRY_PROJECT=
VAPID_PRIVATE_KEY= / NEXT_PUBLIC_VAPID_PUBLIC_KEY= / VAPID_SUBJECT=
CRON_SECRET=                       # ⚠️ protège /api/cron/**

# ── ADMIN ────────────────────────────────────────────────────
ADMIN_EMAIL= / ADMIN_PASSWORD= / ADMIN_NAME= / ADMIN_ACCESS_TOKEN=
ADMIN_LOGIN_SLUG= / ADMIN_FORMATIONS_TOKEN= / ADMIN_MARKETPLACE_TOKEN=

# ── TRACKING ─────────────────────────────────────────────────
NEXT_PUBLIC_GA_ID=
META_PIXEL_ID= / META_CAPI_TOKEN= / META_TEST_EVENT_CODE=
TIKTOK_PIXEL_ID= / TIKTOK_CAPI_TOKEN=

# ── APP ──────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL= / NODE_ENV= / DEV_MODE= / LOG_LEVEL=
```

### Setup initial

```bash
npm install -g pnpm@9.15.9
git clone https://github.com/pirabellabs1-coder/Novakou.git && cd Novakou
pnpm install                                   # postinstall lance prisma generate
cp .env.example .env.local                     # PUIS compléter (voir avertissement ci-dessus)
pnpm -F @freelancehigh/db migrate:dev
pnpm dev                                       # → http://localhost:3000
```

---

## 🌍 CONVENTIONS NOVAKOU

### Langue du code

Le code de ce projet est **commenté et nommé en français** (`MODELE_DEFAUT`, `chatIAOuNull`,
`echec-messages.ts`). Respecter cette convention : un identifiant anglais au milieu détonne.
Les commentaires expliquent le **pourquoi**, pas le quoi — souvent avec la conséquence
métier en cas d'erreur. S'en inspirer.

### TypeScript — règles absolues

```typescript
// ✅ BON
interface Formation {
  id: string;
  titre: string;
  prix: number;
  devise: CodeDevise;              // type dédié, pas string
  statut: 'brouillon' | 'publie' | 'suspendu';
}

// ❌ MAUVAIS
const formation: any = { ... };    // jamais de any
const statut: string = 'publie';   // trop permissif
```

### État — Zustand vs TanStack Query

```typescript
// ✅ Zustand — état UI local
const { devise, setDevise } = useCurrencyStore();

// ✅ TanStack Query — état serveur
const { data: formations, isLoading } = useFormations({ boutiqueId });

// ❌ MAUVAIS
const [formations, setFormations] = useState([]);   // pas pour de la donnée serveur
```

### Server Components par défaut

React 19 + App Router : un composant est **serveur** sauf mention contraire.
N'ajouter `"use client"` que si le composant utilise réellement un hook d'état, un
gestionnaire d'événement ou une API navigateur.

> 📌 **Régression déjà survenue** : un `"use client"` posé par erreur sur un composant serveur
> de la page d'accueil avait fait disparaître les boutons Connexion et Inscription.

### Sécurité — clés jamais côté client

```typescript
// ❌ JAMAIS
export const CLE = 'sk_live_...';                    // exposé au monde

// ✅ Route handler (apps/web/app/api/**)
export async function POST(req: Request) {
  const cle = process.env.FEEXPAY_API_KEY;           // serveur, sûr
}
```

Toute variable préfixée `NEXT_PUBLIC_` **part dans le navigateur**. Aucun secret ne doit
porter ce préfixe.

### i18n

Traductions dans `apps/web/messages/*.json` (`fr`, `en`). Ne pas coder de texte en dur dans
les composants destinés à l'utilisateur.

### Prisma — source de vérité

`packages/db/prisma/schema.prisma` définit tout. Après modification :
`migrate:dev` en local, puis `generate`. Ne jamais éditer une migration déjà appliquée.

### Maquettes HTML

Le dépôt contient une soixantaine de dossiers de maquettes HTML à la racine
(`marketplace_service_explorer_1..12`, `tableau_de_bord_client`, `identit_visuelle_et_design_system`…).

> ⚠️ Elles datent en grande partie de l'époque **FreelanceHigh**. Elles restent utiles comme
> référence visuelle et pour le design system, mais elles **ne font plus autorité** sur les
> écrans Novakou (vendeur, apprenant, affilié). En cas de doute sur un écran existant,
> **le code en production fait foi, pas la maquette**.
>
> L'ancien chemin documenté `/mnt/c/FreelanceHigh/` n'existe pas : les maquettes sont
> à la racine du dépôt.

---

## ✅ CHECKLIST PRÉ-COMMIT

```markdown
- [ ] `pnpm typecheck`                          → aucune erreur
- [ ] `pnpm lint`                               → aucune erreur
- [ ] `pnpm build`                              → passe (la CI le refera)
- [ ] `pnpm -F @freelancehigh/web test:e2e`     → si le changement touche un parcours testé
      ⚠️ NE PAS utiliser `pnpm test` : ne lance rien
- [ ] Aucun secret en dur (grep les clés, vérifier qu'aucun secret n'est en NEXT_PUBLIC_)
- [ ] Migration Prisma générée et commitée si le schéma a changé
- [ ] Pas de `"use client"` ajouté sans raison réelle
- [ ] Textes utilisateur passés par next-intl, pas codés en dur
- [ ] Paiements touchés → codes opérateur confirmés par la doc du fournisseur, jamais devinés
- [ ] SEO touché (titres, meta, JSON-LD) → `node scripts/seo-validate.mjs` (le workflow SEO bloque sinon)
```

---

## 🚨 RÈGLES D'OR NOVAKOU

```
1. JAMAIS de clé API côté client            → serveur uniquement, jamais NEXT_PUBLIC_
2. JAMAIS deviner un code opérateur         → doc fournisseur ou on s'abstient (argent réel)
3. JAMAIS réintroduire Moneroo               → décision fondateur, définitive
4. JAMAIS de `any` TypeScript                → types stricts partout
5. JAMAIS contourner 2FA/KYC                 → obligatoires, admin non négociable
6. JAMAIS introduire Fastify/tRPC/Socket.io  → tout passe par les route handlers Next.js
7. JAMAIS se fier à .env.example             → le code est la référence
8. JAMAIS `pnpm test`                        → ne lance rien ; c'est `test:e2e`
```

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

## 📚 STRUCTURE DE FICHIERS (Par Défaut)

```
AGENTS.md                  ← Ce fichier (RACINE du dépôt)
CLAUDE.md                  ← Jumeau pour Claude Code — GARDER SYNCHRONISÉ
.codex/
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

> **`CLAUDE.md` et `AGENTS.md` sont des jumeaux** : contenu identique, seuls le titre et
> la mention de l'outil diffèrent. Toute modification de l'un doit être reportée sur l'autre,
> sinon Claude Code et Codex travaillent sur des consignes divergentes.

### Documentation du dépôt — fiabilité

| Fichier | Fiabilité |
|---|---|
| `CLAUDE.md` / `AGENTS.md` | ✅ à jour (ce document) |
| `V2_ROADMAP.md` | 🟡 le plus récent des docs produit |
| `RAPPORT_FINAL_NOVAKOU.md` | 🟡 parle bien de Novakou |
| `PRD.md`, `ARCHITECTURE.md`, `TECH_STACK_RAPPORT.md`, `DOCUMENTATION.md` | 🔴 décrivent **FreelanceHigh** — architecture Fastify/tRPC jamais construite. Contexte historique uniquement. |

**En cas de contradiction entre un document et le code : le code gagne.**

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

## 📝 TEMPLATE: NOUVELLE SESSION

```markdown
# Session du [DATE] — Novakou

## État Initial
- **Tâche principale**: [Fonctionnalité clé]
- **Espace concerné**: [Public | Vendeur | Apprenant | Affilié | Admin | Paiements | IA]
- **Complexité**: [Triviale | Simple | Modérée | Complexe]
- **Dépendances bloquantes**: [Passerelle tierce ? Migration Prisma ? Auth ?]
- **Leçons appliquées**: [Lesquelles de tasks/lessons.md]

## Exécution
### Phase 1: [Description]
- **Résultat attendu**: [Spécifique, mesurable]
- **Implémentation**:
  - [ ] Page / composant (Server Component par défaut)
  - [ ] Route handler sous app/api/**
  - [ ] Migration Prisma si le schéma change
  - [ ] Traductions dans messages/*.json
  - [ ] Test Playwright si parcours critique
- **Status**: [✅ Done | 🔄 In Progress | ❌ Failed]

## Blocages
- **[Blocage]**: [Description] — **Cause**: [Analyse] — **Action**: [Escalade/Re-plan]

## Validation Finale
- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] `pnpm -F @freelancehigh/web test:e2e` (si parcours touché)
- [ ] Aucun secret exposé, aucun NEXT_PUBLIC_ sensible
- [ ] Migrations Prisma commitées
- [ ] SEO validé si meta/JSON-LD touchés

## Apprentissages
- [Nouvelle leçon] — Format: [Date] | Ce qui a mal tourné | Règle pour l'éviter

## Prochaine Session
- [ ] Tâche: [X]
- [ ] Prérequis: [Y]
```

---

*Dernière mise à jour : 2026-08-17 — réécriture du contexte projet d'après le code réel*
*Documentation à jour : ce fichier. Les autres docs produit décrivent l'ancien projet FreelanceHigh.*
