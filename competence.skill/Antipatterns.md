# 🚨 42 ANTI-PATTERNS FREELANCEHIGH — Détecteur Automatique

> Catalogue exhaustif des patterns dangereux, anti-patterns inévitables, et bugs prévisibles de FreelanceHigh  
> Chacun avec détection automatique, symptômes, et fix standard

---

## CATÉGORIE 1: SÉCURITÉ (12 patterns)

### ❌ PATTERN #1: API Key Exposure
**ID:** AKEY-001 | **Sévérité:** 🔴 CRITIQUE | **Impact:** Compromission complète

**Symptômes:**
```typescript
// ❌ MAUVAIS
export const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const apiKey = "sk_live_abc123";  // Hardcoded!
const config = { key: process.env.NEXT_PUBLIC_STRIPE };  // Exposé!
```

**Détection:**
```
Scan: Fichiers contenant "process.env" sans vérification NEXT_PUBLIC_
Action: Si process.env.STRIPE/OPENAI/CINETPAY/RESEND trouvé côté client → FAIL
```

**Fix:**
```typescript
// ✅ BON
// apps/api/routes/stripe.ts (SERVEUR)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// apps/web/lib/stripe.ts (CLIENT)
export const STRIPE_PUBLISHABLE = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
```

---

### ❌ PATTERN #2: 2FA Bypass
**ID:** 2FA-001 | **Sévérité:** 🔴 CRITIQUE | **Impact:** Accès non-autorisé

**Symptômes:**
```typescript
// ❌ MAUVAIS
if (user.kycLevel >= 3) {
  // Allow withdrawal — sans vérifier 2FA!
  return authorize();
}

// ❌ MAUVAIS
const enable2FA = false;  // Désactivé "temporairement"
```

**Détection:**
```
Scan: Routes financières sans 2FA check
Action: KYC3+ doit vérifier 2FA TOTP avant withdrawal/création service
```

**Fix:**
```typescript
// ✅ BON
async function validateWithdrawal(userId: string, totpToken: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  
  if (user.kycLevel < 3) throw new Error("KYC insufficient");
  
  // 1. Vérifier 2FA
  const isValid = await verify2FA(user.totpSecret, totpToken);
  if (!isValid) throw new Error("Invalid 2FA");
  
  // 2. Vérifier montant raisonnable
  if (amount > user.dailyWithdrawalLimit) throw new Error("Limit exceeded");
  
  // 3. Processus withdrawal
  return processWithdrawal(userId, amount);
}
```

---

### ❌ PATTERN #3: RLS Disabled
**ID:** RLS-001 | **Sévérité:** 🔴 CRITIQUE | **Impact:** Fuite données utilisateurs

**Symptômes:**
```sql
-- ❌ MAUVAIS
CREATE TABLE services (
  id UUID PRIMARY KEY,
  title VARCHAR,
  freelance_id UUID
  -- Pas de RLS policy!
);

-- ❌ MAUVAIS
ALTER TABLE services DISABLE ROW SECURITY;  -- Désactivé!
```

**Détection:**
```
Scan: Tables sensibles (services, commandes, users, transactions)
Action: DOIT avoir RLS activé + policies lues
```

**Fix:**
```sql
-- ✅ BON
ALTER TABLE services ENABLE ROW SECURITY;

-- Freelancers lisent/écrivent uniquement leurs services
CREATE POLICY "freelance_own_services"
  ON services
  FOR ALL
  USING (auth.uid() = freelance_id)
  WITH CHECK (auth.uid() = freelance_id);

-- Clients lisent services publics
CREATE POLICY "clients_read_published"
  ON services
  FOR SELECT
  USING (published = true);
```

---

### ❌ PATTERN #4: Escrow Manipulation Client-Side
**ID:** ESCR-001 | **Sévérité:** 🔴 CRITIQUE | **Impact:** Vol/Fraude

**Symptômes:**
```typescript
// ❌ MAUVAIS
const updateEscrow = async (amount: number) => {
  // Appelé directement depuis le client!
  await db.escrow.update({
    where: { orderId },
    data: { amount, status: "released" }
  });
};

// ❌ MAUVAIS
const releaseEscrow = () => {
  fetch('/api/escrow', {
    method: 'POST',
    body: JSON.stringify({ amount: 1000000, status: "released" })
  });
};
```

**Détection:**
```
Scan: Routes /api/escrow sans validation serveur
Action: JAMAIS accepter montant/status du client sans validation
```

**Fix:**
```typescript
// ✅ BON — Server Action
'use server';
export async function releaseEscrow(orderId: string, totpToken: string) {
  const user = await getCurrentUser();
  
  // 1. Vérifier 2FA
  if (!await verify2FA(user.totpSecret, totpToken)) {
    throw new Error("Invalid 2FA");
  }
  
  // 2. Récupérer depuis DB (jamais du client)
  const escrow = await db.escrow.findUnique({ where: { orderId } });
  if (!escrow) throw new Error("Escrow not found");
  
  // 3. Vérifier propriété
  if (escrow.freelanceId !== user.id) {
    throw new Error("Unauthorized");
  }
  
  // 4. Vérifier montant != débile
  if (escrow.amount === 0 || escrow.amount > 50000) {
    throw new Error("Invalid amount");
  }
  
  // 5. Release
  return await db.escrow.update({
    where: { orderId },
    data: { status: "released", releasedAt: new Date() }
  });
}
```

---

### ❌ PATTERN #5: Hardcoded Secrets
**ID:** HARD-001 | **Sévérité:** 🔴 CRITIQUE | **Impact:** Clés compromises

**Symptômes:**
```typescript
// ❌ MAUVAIS
const STRIPE_KEY = "sk_live_abc123def456";
const OPENAI_KEY = "sk-proj-xyz789";
const DB_PASSWORD = "postgres_super_secret_123";
```

**Détection:**
```
Scan: Regex pour patterns clés (sk_, sk-proj-, etc.)
Action: Git pre-commit hook → Fail si secrets trouvés
```

**Fix:**
```bash
# .env.local (JAMAIS dans Git)
STRIPE_SECRET_KEY=sk_live_xxx
OPENAI_API_KEY=sk-proj-xxx

# Code
const stripeKey = process.env.STRIPE_SECRET_KEY;
```

---

### ❌ PATTERN #6: No Rate Limiting
**ID:** RATE-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Brute force, DoS

**Symptômes:**
```typescript
// ❌ MAUVAIS
router.post('/api/login', async (req, res) => {
  // Aucune limite! 1000 tentatives/sec possible
  const user = await authenticate(req.body);
});
```

**Détection:**
```
Scan: Routes sensibles (login, 2FA, withdrawal) sans rate-limit
Action: Implémenter Redis-based rate limiter
```

**Fix:**
```typescript
// ✅ BON
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m")  // 5 attempts per minute
});

router.post('/api/login', async (req, res) => {
  const { success } = await ratelimit.limit(req.ip);
  if (!success) return res.status(429).send("Too many attempts");
  
  const user = await authenticate(req.body);
});
```

---

### ❌ PATTERN #7: Unencrypted Passwords
**ID:** PASS-001 | **Sévérité:** 🔴 CRITIQUE | **Impact:** Compromission comptes

**Symptômes:**
```typescript
// ❌ MAUVAIS
await db.user.create({
  email: "user@email.com",
  password: "plaintext_password_123"  // NO HASH!
});
```

**Détection:**
```
Scan: Passwords stockés sans bcrypt/argon2
Action: Supabase Auth gère ça automatiquement — ne JAMAIS stocker plaintext
```

**Fix:**
```typescript
// ✅ BON — Utiliser Supabase Auth
const { data, error } = await supabase.auth.signUp({
  email: "user@email.com",
  password: "secure_password_123"
});
// Supabase hash automatiquement avec bcrypt
```

---

### ❌ PATTERN #8: CORS Misconfigured
**ID:** CORS-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Requêtes cross-origin non-contrôlées

**Symptômes:**
```typescript
// ❌ MAUVAIS
app.use(cors({ origin: "*" }));  // Accept TOUT!
```

**Détection:**
```
Scan: CORS origin = "*" ou localhost en prod
Action: Spécifier domaines explicitement
```

**Fix:**
```typescript
// ✅ BON
const allowedOrigins = [
  "https://freelancehigh.com",
  "https://app.freelancehigh.com",
  "http://localhost:3000"  // Dev seulement
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  }
}));
```

---

### ❌ PATTERN #9: Missing Content Security Policy
**ID:** CSP-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** XSS, script injection

**Symptômes:**
```
<!-- ❌ MAUVAIS -->
<!-- Pas de CSP headers -->
```

**Détection:**
```
Scan: Response headers
Action: CSP header manquant → Warning
```

**Fix:**
```typescript
// ✅ BON — next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.cloudinary.com"
  }
];

module.exports = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  }
};
```

---

### ❌ PATTERN #10: No Input Validation
**ID:** INVAL-001 | **Sévérité:** 🔴 CRITIQUE | **Impact:** SQL injection, XSS

**Symptômes:**
```typescript
// ❌ MAUVAIS
const getService = async (req) => {
  const { id } = req.query;  // Pas de validation!
  return db.service.findUnique({ where: { id } });
};
```

**Détection:**
```
Scan: Paramètres utilisateur utilisés directement sans Zod/validation
Action: FAIL si pas de schema Zod validant
```

**Fix:**
```typescript
// ✅ BON — Utiliser Zod
import { z } from "zod";

const GetServiceSchema = z.object({
  id: z.string().uuid("Invalid ID format")
});

export const getService = protectedProcedure
  .input(GetServiceSchema)
  .query(async ({ input }) => {
    return db.service.findUnique({ where: { id: input.id } });
  });
```

---

### ❌ PATTERN #11: Missing SQL Injection Prevention
**ID:** SQLI-001 | **Sévérité:** 🔴 CRITIQUE | **Impact:** DB compromise

**Symptômes:**
```typescript
// ❌ MAUVAIS
const query = `SELECT * FROM users WHERE email = '${email}'`;
await db.$queryRaw(query);
```

**Détection:**
```
Scan: $queryRaw avec template strings
Action: Utiliser parameterized queries UNIQUEMENT
```

**Fix:**
```typescript
// ✅ BON
const users = await db.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`;
// SQL template literal automatiquement parameterized
```

---

### ❌ PATTERN #12: Weak JWT Secret
**ID:** JWT-001 | **Sévérité:** 🔴 CRITIQUE | **Impact:** Token forgery

**Symptômes:**
```typescript
// ❌ MAUVAIS
const secret = "supersecret";  // Trop court
const secret = "my-app-secret";  // Humain-readable
```

**Détection:**
```
Scan: JWT secret length < 32 chars
Action: FAIL si trop faible
```

**Fix:**
```typescript
// ✅ BON — Supabase gère JWTs
// Utiliser Supabase Auth (JWT généré par Supabase automatiquement)
// Secret = 256+ bits dans .env, JAMAIS en dur
const jwtSecret = process.env.JWT_SECRET;  // Min 32 chars random
```

---

## CATÉGORIE 2: ARCHITECTURE (8 patterns)

### ❌ PATTERN #13: State Management Confusion
**ID:** STATE-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Data stale, bugs concurrence

**Symptômes:**
```typescript
// ❌ MAUVAIS
// Client-side state pour data serveur
const [services, setServices] = useState([]);  // Services!

// Serveur state pour UI state
const [locale, setLocale] = useQuery({ ... });  // Currency!
```

**Détection:**
```
Scan: useState pour data API
      useQuery pour UI toggles
Action: Swap → useState pour UI, Query pour API data
```

**Fix:**
```typescript
// ✅ BON
// Zustand: UI state
const { currency, setCurrency } = useCurrencyStore();

// React Query: Server state
const { data: services } = useServices();
```

---

### ❌ PATTERN #14: Client Components Everywhere
**ID:** CSR-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** JS bundle bloated, perf dégradée

**Symptômes:**
```typescript
// ❌ MAUVAIS
'use client';
export default function HomePage() {
  return <Landing />;  // Landing page n'a besoin de client state!
}
```

**Détection:**
```
Scan: 'use client' sans hooks d'état ou événements
Action: Warning si 'use client' pas nécessaire
```

**Fix:**
```typescript
// ✅ BON — Server Component par défaut
export default function HomePage() {
  return <Landing />;
}

// 'use client' ONLY pour:
// - useState, useRef, useContext
// - onClick, onChange, etc
// - Hooks custom (useQuery)
```

---

### ❌ PATTERN #15: Missing Error Boundaries
**ID:** ERRBND-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** App crash sur erreur component

**Symptômes:**
```typescript
// ❌ MAUVAIS
export default function Dashboard() {
  return <ServiceList />;  // Pas de error boundary!
}
```

**Détection:**
```
Scan: Pages sans <Suspense fallback> ou <ErrorBoundary>
Action: Warning pour pages critiques
```

**Fix:**
```typescript
// ✅ BON
export default function Dashboard() {
  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      <Suspense fallback={<Skeleton />}>
        <ServiceList />
      </Suspense>
    </ErrorBoundary>
  );
}
```

---

### ❌ PATTERN #16: Infinite Loops in useEffect
**ID:** EFFECT-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Perf dégradée, crashes

**Symptômes:**
```typescript
// ❌ MAUVAIS
useEffect(() => {
  fetchServices();  // Pas de deps array!
}, []);

// ❌ MAUVAIS
useEffect(() => {
  setServices([...services]);  // Deps loop
}, [services]);
```

**Détection:**
```
Scan: useEffect sans deps array
      useEffect sur-chargé
Action: Warning + suggestion refactor
```

**Fix:**
```typescript
// ✅ BON
useEffect(() => {
  fetchServices();
}, [freelanceId]);  // Deps spécifiées

// OU React Query (mieux)
const { data: services } = useServices({ freelanceId });
```

---

### ❌ PATTERN #17: No TypeScript Types
**ID:** TYPES-001 | **Sévérité:** 🔴 CRITIQUE | **Impact:** Runtime errors, refactors impossible

**Symptômes:**
```typescript
// ❌ MAUVAIS
const service = any;
const getUserById = (id) => {  // Pas de types!
  return db.user.findUnique({ where: { id } });
};
```

**Détection:**
```
Scan: any, implicit any, untyped functions
Action: FAIL si 'any' trouvé (sauf commenté comme //@ts-ignore)
```

**Fix:**
```typescript
// ✅ BON
interface Service {
  id: string;
  title: string;
  freelanceId: string;
}

const getUserById = async (id: string): Promise<User | null> => {
  return db.user.findUnique({ where: { id } });
};
```

---

### ❌ PATTERN #18: Missing RTL Classes
**ID:** RTL-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Arabic/RTL languages broken

**Symptômes:**
```tsx
// ❌ MAUVAIS
<div className="ml-4">
  Sidebar
</div>

// ❌ MAUVAIS
<button className="text-left">
  Button
</button>
```

**Détection:**
```
Scan: Classes `ml-`, `mr-`, `text-left`, `text-right` sans `rtl:` variant
Action: Warning pour chaque instance
```

**Fix:**
```tsx
// ✅ BON
<div className="ml-4 rtl:ml-0 rtl:mr-4">
  Sidebar
</div>

<button className="text-left rtl:text-right">
  Button
</button>
```

---

### ❌ PATTERN #19: Component Prop Drilling
**ID:** DRILL-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Refactors difficiles, code fragile

**Symptômes:**
```typescript
// ❌ MAUVAIS
<GrandParent currency={currency} setCurrency={setCurrency}>
  <Parent currency={currency} setCurrency={setCurrency}>
    <Child currency={currency} setCurrency={setCurrency} />
  </Parent>
</GrandParent>
```

**Détection:**
```
Scan: Props répétées + 3 niveaux
Action: Warning → Utiliser Zustand store
```

**Fix:**
```typescript
// ✅ BON
// lib/store.ts
const useCurrencyStore = create(...);

// Tous les components
const { currency, setCurrency } = useCurrencyStore();
```

---

### ❌ PATTERN #20: Mixed Styling Approaches
**ID:** STYLE-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** CSS conflicts, maintenance difficile

**Symptômes:**
```tsx
// ❌ MAUVAIS
<div className="ml-4" style={{ marginRight: '1rem' }}>
  Mélange Tailwind + inline styles
</div>

// ❌ MAUVAIS
<div className={css.container}>  // CSS modules
  + className="p-4"  // Tailwind
</div>
```

**Détection:**
```
Scan: Mélange className + style/CSS modules/styled-components
Action: Warning → Utiliser Tailwind ONLY
```

**Fix:**
```tsx
// ✅ BON
<div className="ml-4 mr-4 p-4">
  Tailwind seulement
</div>
```

---

## CATÉGORIE 3: DATABASE (8 patterns)

### ❌ PATTERN #21: N+1 Query Problem
**ID:** N1-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Perf dégradée (1000% lent)

**Symptômes:**
```typescript
// ❌ MAUVAIS
const services = await db.service.findMany();
for (const service of services) {
  const freelancer = await db.freelancer.findUnique({  // 1 query par item!
    where: { id: service.freelanceId }
  });
}
```

**Détection:**
```
Scan: Queries dans loops
      findUnique dans map()
Action: Refactor → Utiliser include/select
```

**Fix:**
```typescript
// ✅ BON
const services = await db.service.findMany({
  include: { freelancer: true }  // 1 query total
});
```

---

### ❌ PATTERN #22: Missing Database Indexes
**ID:** INDEX-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Queries lentes, tableau de bord gelé

**Symptômes:**
```prisma
// ❌ MAUVAIS
model Service {
  id String @id
  title String
  freelanceId String  // Pas d'index!
  createdAt DateTime
}
```

**Détection:**
```
Scan: Colonnes dans WHERE/JOIN sans @db.Index
Action: Warning si query sur colonne non-indexée
```

**Fix:**
```prisma
// ✅ BON
model Service {
  id String @id
  title String
  freelanceId String
  freelancer Freelancer @relation(fields: [freelanceId], references: [id])
  createdAt DateTime
  
  @@index([freelanceId])  // Index pour recherches
  @@index([createdAt])    // Index pour tri chronologique
}
```

---

### ❌ PATTERN #23: Soft Delete Without Cleanup
**ID:** SOFTDEL-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Data duplication, confusion

**Symptômes:**
```typescript
// ❌ MAUVAIS
// User soft deleted mais:
// - Services toujours visibles
// - Commandes toujours actives
// - Portefeuille pas verrouillé
```

**Détection:**
```
Scan: Soft deletes sans cascade logic
Action: Warning si deletedAt pas utilisé partout
```

**Fix:**
```typescript
// ✅ BON
// Model
model User {
  deletedAt DateTime?
}

// Query par défaut
where: { deletedAt: null }

// Ou: soft delete automation
router.post('/users/:id/delete', async (req) => {
  await db.user.update({
    where: { id: req.params.id },
    data: {
      deletedAt: new Date(),
      services: { updateMany: { data: { published: false } } },
      orders: { updateMany: { data: { status: "cancelled" } } }
    }
  });
});
```

---

### ❌ PATTERN #24: No Audit Logs
**ID:** AUDIT-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** No accountability, compliance fail

**Symptômes:**
```
// Pas de trace qui a modifié quoi, quand
```

**Détection:**
```
Scan: Tables sensibles (users, transactions, orders) sans audit trail
Action: Warning → Ajouter createdBy, updatedBy, timestamps
```

**Fix:**
```typescript
// ✅ BON
model Service {
  id String @id
  title String
  createdBy String
  updatedBy String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
}

// On update
await db.service.update({
  where: { id },
  data: {
    title: newTitle,
    updatedBy: userId,
    updatedAt: new Date()
  }
});
```

---

### ❌ PATTERN #25: Circular Relations
**ID:** CIRC-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Infinite loops, query stack overflow

**Symptômes:**
```prisma
// ❌ MAUVAIS
model User {
  id String
  services Service[]
  favorites Favorite[]
}

model Service {
  id String
  freelance User
  favoredBy Favorite[]
}

model Favorite {
  id String
  user User
  service Service
}
// User → Service → Favorite → User (circular!)
```

**Détection:**
```
Scan: Relations sans explicit breaking point
Action: Utiliser select/include strategiquement pour break cycle
```

**Fix:**
```prisma
// ✅ BON — Break circular avec explicit select
const getUserWithServices = (userId: string) =>
  db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      services: {  // Services inclus
        select: {
          id: true,
          title: true,
          // ❌ Pas de freelance{} ici — break cycle!
        }
      }
    }
  });
```

---

### ❌ PATTERN #26: Missing Foreign Key Constraints
**ID:** FK-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Data orphaned, inconsistency

**Symptômes:**
```prisma
// ❌ MAUVAIS
model Service {
  id String
  freelanceId String  // Pas de FK constraint!
}
```

**Détection:**
```
Scan: Relations sans @relation(... references: [id])
Action: FAIL si FK pas déclaré
```

**Fix:**
```prisma
// ✅ BON
model Service {
  id String @id
  title String
  freelance Freelancer @relation(fields: [freelanceId], references: [id], onDelete: Cascade)
  freelanceId String
  
  @@index([freelanceId])
}
```

---

### ❌ PATTERN #27: No Column Constraints
**ID:** CONST-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Invalid data, data corruption

**Symptômes:**
```prisma
// ❌ MAUVAIS
model Order {
  id String
  amount Int  // Pas de MIN!
  status String  // Pas de enum!
  email String  // Pas d'unique!
}
```

**Détection:**
```
Scan: Colonnes sans @unique, @db.Char, enums, length validation
Action: Warning → Ajouter constraints
```

**Fix:**
```prisma
// ✅ BON
model Order {
  id String @id @default(cuid())
  amount Int @db.Int @positive  // > 0
  status Status @default(PENDING)  // Enum!
  email String @unique
  description String @db.VarChar(500)
  createdAt DateTime @default(now())
}

enum Status {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

---

### ❌ PATTERN #28: Unencrypted Sensitive Data
**ID:** ENCRYPT-001 | **Sévérité:** 🔴 CRITIQUE | **Impact:** Data breach

**Symptômes:**
```prisma
// ❌ MAUVAIS
model BankAccount {
  id String
  accountNumber String  // Plaintext IBAN!
  routingNumber String
}
```

**Détection:**
```
Scan: Colonnes sensibles (IBAN, card, SSN) sans encryption
Action: FAIL si données sensibles plaintext
```

**Fix:**
```typescript
// ✅ BON
// Utiliser Supabase pg_crypto extension
// Ou: encryption dans app
import { encrypt, decrypt } from './crypto';

const bankAccount = {
  accountNumber: encrypt(iban, encryptionKey),
  routingNumber: encrypt(routing, encryptionKey)
};

// Decrypt seulement quand nécessaire
const decrypted = decrypt(bankAccount.accountNumber, encryptionKey);
```

---

## CATÉGORIE 4: API & BUSINESS LOGIC (8 patterns)

### ❌ PATTERN #29: Missing Error Handling
**ID:** ERRHAND-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Vague error messages, debugging difficile

**Symptômes:**
```typescript
// ❌ MAUVAIS
const createService = async (title: string) => {
  const service = await db.service.create({ data: { title } });
  return service;  // Pas de try-catch!
};
```

**Détection:**
```
Scan: Routes sans try-catch ou error middleware
Action: Warning → Ajouter error handling explicite
```

**Fix:**
```typescript
// ✅ BON
const createService = protectedProcedure
  .input(z.object({ title: z.string().min(3) }))
  .mutation(async ({ input, ctx }) => {
    try {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      if (ctx.user.kycLevel < 3) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "KYC3 required" });
      }
      
      const service = await db.service.create({
        data: { title: input.title, freelanceId: ctx.user.id }
      });
      
      return service;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new TRPCError({ code: "CONFLICT", message: "Service already exists" });
      }
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  });
```

---

### ❌ PATTERN #30: Mismatch Spec vs Implementation
**ID:** SPEC-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** User confusion, feature incomplete

**Symptômes:**
```
PRD dit: "Freelancers can withdraw after 48h escrow hold"
Code fait: Withdraw immediate après paiement reçu
```

**Détection:**
```
Scan: Comparer code vs PRD requirements
Action: Manual review (hard to automate)
```

**Fix:**
```typescript
// ✅ BON
// Code
async function releaseEscrow(orderId: string) {
  const order = await db.order.findUnique({ where: { orderId } });
  const canRelease = new Date().getTime() - order.paidAt.getTime() > 48 * 60 * 60 * 1000;
  
  if (!canRelease) {
    throw new Error("Escrow locked for 48 hours");
  }
  
  return releaseEscrow(orderId);
}

// Tests
test("escrow locked for 48h", async () => {
  const order = await createOrder();
  const canRelease = await checkEscrowRelease(order.id);
  expect(canRelease).toBe(false);
  
  // Fast forward 48h
  vi.advanceTimersByTime(48 * 60 * 60 * 1000);
  expect(await checkEscrowRelease(order.id)).toBe(true);
});
```

---

### ❌ PATTERN #31: No Idempotency Keys
**ID:** IDEM-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Duplicate charges, double payouts

**Symptômes:**
```typescript
// ❌ MAUVAIS
router.post('/stripe/webhook', async (req) => {
  const charge = req.body;
  await db.transaction.create({ data: charge });  // Double création possible!
});
```

**Détection:**
```
Scan: Webhooks sans idempotency key checking
Action: FAIL pour paiements sans idempotency
```

**Fix:**
```typescript
// ✅ BON
router.post('/stripe/webhook', async (req) => {
  const idempotencyKey = req.body.id;  // Stripe event ID
  
  // Vérifier si déjà traité
  const exists = await db.webhookLog.findUnique({
    where: { idempotencyKey }
  });
  
  if (exists) {
    return res.json({ received: true });  // Idempotent!
  }
  
  // Traiter
  const result = await handleCharge(req.body);
  
  // Log pour prochaine fois
  await db.webhookLog.create({
    data: { idempotencyKey, result }
  });
  
  res.json({ received: true });
});
```

---

### ❌ PATTERN #32: No Request Logging
**ID:** LOG-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Debugging/audit trail impossible

**Symptômes:**
```
Pas de logs requis → API endpoint crash → Impossible de savoir pourquoi
```

**Détection:**
```
Scan: Routes sans logging middleware
Action: Warning → Ajouter contexte logs
```

**Fix:**
```typescript
// ✅ BON
const loggingMiddleware = (req, res, next) => {
  const start = Date.now();
  const { method, path, body } = req;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    logger.info({
      method,
      path,
      statusCode,
      duration,
      userId: req.user?.id,
      timestamp: new Date()
    });
  });
  
  next();
};

app.use(loggingMiddleware);
```

---

### ❌ PATTERN #33: Missing Pagination
**ID:** PAGING-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** OOM on large datasets, slow queries

**Symptômes:**
```typescript
// ❌ MAUVAIS
const getAllServices = async () => {
  return db.service.findMany();  // Retourne 10 000 items!
};
```

**Détection:**
```
Scan: findMany sans take/skip
Action: Warning → Ajouter pagination
```

**Fix:**
```typescript
// ✅ BON
const getServices = protectedProcedure
  .input(z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20)
  }))
  .query(async ({ input }) => {
    const skip = (input.page - 1) * input.limit;
    
    const [items, total] = await Promise.all([
      db.service.findMany({
        skip,
        take: input.limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.service.count()
    ]);
    
    return {
      items,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        pages: Math.ceil(total / input.limit)
      }
    };
  });
```

---

### ❌ PATTERN #34: No Request Validation
**ID:** VALID-001 | **Sévérité:** 🔴 CRITIQUE | **Impact:** XSS, SQL injection, crashes

*[Voir PATTERN #10]*

---

### ❌ PATTERN #35: Missing Webhooks Verification
**ID:** WEBHOOK-001 | **Sévérité:** 🔴 CRITIQUE | **Impact:** Fake webhooks processed

**Symptômes:**
```typescript
// ❌ MAUVAIS
router.post('/stripe/webhook', async (req) => {
  // Pas de signature verification!
  const charge = req.body;
  await processCharge(charge);
});
```

**Détection:**
```
Scan: Webhooks sans signature verification
Action: FAIL si signature Stripe/CinetPay pas vérifiée
```

**Fix:**
```typescript
// ✅ BON
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Maintenant c'est safe
  if (event.type === 'payment_intent.succeeded') {
    const charge = event.data.object;
    await processCharge(charge);
  }
  
  res.json({received: true});
});
```

---

## CATÉGORIE 5: FRONTEND UI/UX (4 patterns)

### ❌ PATTERN #36: Maquette Deviation
**ID:** MOCK-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** UX inconsistency, user confusion

**Symptômes:**
```
Maquette HTML: Layout 3 colonnes, espacements 16px
Code livré: Layout 2 colonnes, espacements 20px
```

**Détection:**
```
Scan: Visual regression contre maquettes HTML
      Layout diff > 5px → Warning
      Colors ≠ → FAIL
      Missing elements → FAIL
```

**Fix:**
```
1. Localiser maquette: /mnt/c/FreelanceHigh/[espace]/
2. Reproduire EXACTEMENT
3. Playwright screenshot test
4. Compare pixel-perfect
```

---

### ❌ PATTERN #37: Missing Loading States
**ID:** LOAD-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** User confusion, bad UX

**Symptômes:**
```tsx
// ❌ MAUVAIS
const [data] = useQuery({ ... });
return <div>{data.items.length}</div>  // No loader while fetching!
```

**Détection:**
```
Scan: useQuery sans isLoading état affiché
Action: Warning → Ajouter Skeleton/Loader
```

**Fix:**
```tsx
// ✅ BON
const { data, isLoading } = useQuery({ ... });

if (isLoading) return <Skeleton />;
return <div>{data.items.length}</div>;
```

---

### ❌ PATTERN #38: No Empty States
**ID:** EMPTY-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Confusing for users

**Symptômes:**
```tsx
// ❌ MAUVAIS
const items = [];
return <div>{items.map(...)}</div>  // Blank page!
```

**Détection:**
```
Scan: Lists sans empty state check
Action: Warning → Ajouter "No items" message
```

**Fix:**
```tsx
// ✅ BON
const { data } = useQuery({ ... });

if (data?.length === 0) {
  return <EmptyState message="No services yet. Create one!" />;
}

return <ServiceList items={data} />;
```

---

### ❌ PATTERN #39: Broken Responsive Design
**ID:** RESP-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Mobile users frustrated

**Symptômes:**
```
Desktop: ✅ Perfect
Tablet (768px): ⚠️ Content overlaps
Mobile (375px): 🚫 Unusable
```

**Détection:**
```
Scan: Playwright tests sur 3 breakpoints
      375px (mobile), 768px (tablet), 1280px (desktop)
Action: FAIL si layout broken sur un breakpoint
```

**Fix:**
```tsx
// ✅ BON
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} {...item} />
  ))}
</div>
```

---

## CATÉGORIE 6: TESTING (2 patterns)

### ❌ PATTERN #40: No Unit Tests
**ID:** TEST-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Refactors risky, regressions frequent

**Symptômes:**
```
Code livré: 0% test coverage
```

**Détection:**
```
Scan: Coverage < 80%
Action: FAIL si coverage < 80%
```

**Fix:**
```typescript
// ✅ BON
import { describe, it, expect } from 'vitest';
import { calculateCommission } from './commission';

describe('calculateCommission', () => {
  it('returns 20% for free plan', () => {
    expect(calculateCommission(100, 'free')).toBe(20);
  });
  
  it('returns 15% for pro plan', () => {
    expect(calculateCommission(100, 'pro')).toBe(15);
  });
  
  it('throws for invalid amount', () => {
    expect(() => calculateCommission(-1, 'pro')).toThrow();
  });
});

// Run: pnpm test
// Coverage: vitest --coverage
```

---

### ❌ PATTERN #41: No E2E Tests for Critical Flows
**ID:** E2E-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Production bugs, user frustration

**Symptômes:**
```
Auth flow, payment flow, escrow → Pas de test!
```

**Détection:**
```
Scan: Critical flows sans Playwright tests
Action: Warning → Ajouter E2E tests
```

**Fix:**
```typescript
// ✅ BON — tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('auth flow: signup → 2FA → dashboard', async ({ page }) => {
  // 1. Signup
  await page.goto('/inscription');
  await page.fill('input[name="email"]', 'test@email.com');
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.click('button:has-text("Sign Up")');
  
  // 2. Verify email
  expect(page).toHaveURL(/\/verification/);
  
  // 3. Setup 2FA
  const totp = generateTOTP(otpSecret);
  await page.fill('input[name="totp"]', totp);
  await page.click('button:has-text("Verify")');
  
  // 4. Redirected to dashboard
  expect(page).toHaveURL('/dashboard');
  expect(page.locator('h1')).toContainText('Dashboard');
});

// Run: pnpm test:e2e
```

---

## CATÉGORIE 7: DEPLOYMENT (1 pattern)

### ❌ PATTERN #42: No Deployment Checklist
**ID:** DEPLOY-001 | **Sévérité:** 🟡 MOYENNE | **Impact:** Prod incidents, downtime

**Symptômes:**
```
Deploy main branch → Oops, migrations pas appliquées
Deploy prod → Stripe keys wrong région → Payments fail
```

**Détection:**
```
Scan: Pre-deploy checklist missing
Action: Manual review — vérifier 15 items avant prod
```

**Fix:**
```markdown
# DEPLOYMENT CHECKLIST — Avant tout merge/deploy

## Code
- [ ] Branche à jour avec main
- [ ] Tous tests passent: `pnpm test && pnpm test:e2e`
- [ ] No linting errors: `pnpm lint`
- [ ] No TypeScript errors: `pnpm typecheck`
- [ ] No secrets in code: `git diff main | grep -E 'sk_|sk-proj-'`

## Database
- [ ] Migrations créées: `pnpm --filter=db migrate:dev`
- [ ] Migrations testées localement
- [ ] RLS policies vérifiées
- [ ] Backups en place

## Configuration
- [ ] .env correct pour prod
- [ ] API keys valides (Stripe, CinetPay, OpenAI, etc)
- [ ] Région Supabase = correcte (eu-central-1)

## Security
- [ ] 2FA working
- [ ] Rate limiting active
- [ ] CORS correct
- [ ] CSP headers present

## Monitoring
- [ ] Sentry DSN ok
- [ ] PostHog tracking ok
- [ ] Database logs enabled
- [ ] Alerts configurées

## Approval
- [ ] Code review ✅
- [ ] Founder approval si migration critique
- [ ] Rollback plan documenté

**Approuvé pour déployer:** [Date] [Person]
```

---

## 🔍 AUTO-SCAN RÉSUMÉ

La SKILL FreelanceHigh Pro scanne automatiquement ces 42 patterns:

```
SÉCURITÉ:      #1–#12 (12 patterns)
ARCHITECTURE:  #13–#20 (8 patterns)
DATABASE:      #21–#28 (8 patterns)
API/LOGIC:     #29–#35 (7 patterns)
FRONTEND:      #36–#39 (4 patterns)
TESTING:       #40–#41 (2 patterns)
DEPLOYMENT:    #42 (1 pattern)

TOTAL: 42 PATTERNS = 100% couverture FreelanceHigh ✅
```

---

*Créé pour FreelanceHigh — Détection automatique, fixes standard, qualité garantie*