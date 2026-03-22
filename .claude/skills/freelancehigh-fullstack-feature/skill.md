# Skill: FreelanceHigh Full-Stack Feature Builder

End-to-end feature implementation: Schema → API → Store → Component → Page. Builds all layers in one pass.

## Trigger
Use when the user asks to implement a complete feature, add a new section, or build something that needs backend + frontend.

## Instructions

### Step 1: Feature specification
From the user's request, determine:
1. **What models/tables are needed** (check schema.prisma first)
2. **What API endpoints** (CRUD operations needed)
3. **What store state** (new store or extend existing)
4. **What UI pages/components** (check maquettes if available)
5. **What roles can access** (freelance/client/agence/admin)

### Step 2: Database schema (if needed)
Check `packages/db/prisma/schema.prisma` (2300+ lines).
If new model needed, add it following patterns:
```prisma
model NewEntity {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  // ... fields
  status    String   @default("ACTIF")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```
Then: `pnpm --filter=db migrate:dev --name add_new_entity`

### Step 3: Dev data store (ALWAYS before API)
Add to `apps/web/lib/dev/data-store.ts`:
1. Define the `StoredXxx` interface
2. Create the JSON file constant
3. Build the store object with CRUD methods
4. Export it

### Step 4: API routes
Create in `apps/web/app/api/<feature>/route.ts` following the dual-mode pattern.
Typical CRUD:
- **GET** — List/fetch with auth
- **POST** — Create with validation (Zod)
- **PATCH** — Update specific fields
- **DELETE** — Soft delete or hard delete

### Step 5: API client functions
Add to `apps/web/lib/api-client.ts`:
```typescript
export const xxxApi = {
  list: () => fetchApi<XxxData[]>("/api/xxx"),
  get: (id: string) => fetchApi<XxxData>(`/api/xxx/${id}`),
  create: (data: Record<string, unknown>) =>
    fetchApi<XxxData>("/api/xxx", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    fetchApi<XxxData>(`/api/xxx/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/xxx/${id}`, { method: "DELETE" }),
};
```
CRITICAL: If API returns `{ wrapper: data }`, unwrap in the client function.

### Step 6: Zustand store
Either extend existing store or create new in `apps/web/store/`.
Pattern:
```typescript
interface XxxState {
  items: XxxItem[];
  loading: boolean;
  syncItems: () => Promise<void>;
  createItem: (data: ...) => Promise<boolean>;
  // ...
}

export const useXxxStore = create<XxxState>()((set, get) => ({
  items: [],
  loading: false,
  syncItems: async () => {
    set({ loading: true });
    try {
      const data = await xxxApi.list();
      set({ items: data, loading: false });
    } catch { set({ loading: false }); }
  },
  // ...
}));
```

### Step 7: UI components and pages
Follow maquette-to-code skill for UI implementation.

### Step 8: Wire everything together
1. Page calls `store.syncXxx()` in useEffect
2. Store calls `xxxApi.list()` which fetches from API
3. API reads from devStore (dev) or Prisma (prod)
4. Data flows back to component for rendering

### Parallel execution strategy
- Read schema + maquette + existing similar features in PARALLEL
- Write API route + dev store in PARALLEL (they're independent)
- Write store + component AFTER API is defined (they depend on response shape)
