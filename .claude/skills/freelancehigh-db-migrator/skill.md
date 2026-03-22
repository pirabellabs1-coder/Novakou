# Skill: FreelanceHigh Database Migrator

Add/modify Prisma schema with proper migration, dev store sync, and API route updates.

## Trigger
Use when the user asks to add a database field, create a new table, modify the schema, or add a model.

## Instructions

### Step 1: Read current schema
```
packages/db/prisma/schema.prisma
```
The schema has 2300+ lines with 50+ models. Key models:
- User, FreelancerProfile, ClientProfile, AgencyProfile
- Service, ServiceMedia, ServiceOption, Category, SubCategory
- Order, OrderMessage, OrderFile, Review
- KycRequest, WalletTransaction, Notification, AuditLog
- Formation, Module, Lesson, Enrollment, Certificate (formations system)

### Step 2: Add schema changes
Follow existing patterns:
```prisma
model NewModel {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  title       String
  description String?
  status      String   @default("ACTIF")
  metadata    Json?    // For flexible data

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}
```

**Naming conventions:**
- Models: PascalCase
- Fields: camelCase
- Enums: UPPERCASE values
- Status fields: String with convention values (ACTIF, EN_ATTENTE, REFUSE, etc.)
- JSON fields for flexible data (avoid creating too many columns)

### Step 3: Add relation to User model
If the new model has a userId, add the reverse relation to User:
```prisma
model User {
  // ... existing fields
  newModels   NewModel[]
}
```

### Step 4: Generate migration
```bash
cd /mnt/c/FreelanceHigh && pnpm --filter=db migrate:dev --name descriptive_name
```

### Step 5: Regenerate Prisma client
```bash
pnpm --filter=db generate
```

### Step 6: Update dev data store
In `apps/web/lib/dev/data-store.ts`:

1. Add the interface:
```typescript
export interface StoredNewModel {
  id: string;
  userId: string;
  title: string;
  // ... fields matching Prisma model
  createdAt: string;
}
```

2. Add the JSON file name and store:
```typescript
const NEW_MODEL_FILE = "new-models.json";

export const newModelStore = {
  getAll(): StoredNewModel[] {
    return readJson<StoredNewModel[]>(NEW_MODEL_FILE, []);
  },
  getByUser(userId: string): StoredNewModel[] {
    return this.getAll().filter((m) => m.userId === userId);
  },
  getById(id: string): StoredNewModel | undefined {
    return this.getAll().find((m) => m.id === id);
  },
  create(data: Omit<StoredNewModel, "id" | "createdAt">): StoredNewModel {
    const all = this.getAll();
    const item: StoredNewModel = {
      ...data,
      id: `nm_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    all.unshift(item);
    writeJson(NEW_MODEL_FILE, all);
    return item;
  },
  update(id: string, updates: Partial<StoredNewModel>): StoredNewModel | null {
    const all = this.getAll();
    const idx = all.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updates };
    writeJson(NEW_MODEL_FILE, all);
    return all[idx];
  },
  delete(id: string): boolean {
    const all = this.getAll();
    const filtered = all.filter((m) => m.id !== id);
    if (filtered.length === all.length) return false;
    writeJson(NEW_MODEL_FILE, filtered);
    return true;
  },
};
```

3. Export the store at the top of the file

### Step 7: Verify both modes work
- Dev mode: data-store CRUD operations
- Production: Prisma queries in API routes
- BOTH must return the same response shape

### Critical: Prisma as any pattern
When adding new fields that aren't yet reflected in cached TS types:
```typescript
import { prisma as _prisma } from "@/lib/prisma";
const prisma = _prisma as any;
```
This avoids TS errors during the transition period after migration.
