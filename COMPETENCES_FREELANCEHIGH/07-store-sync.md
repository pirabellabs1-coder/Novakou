# Skill: FreelanceHigh Store & API Sync Builder

Create or extend Zustand stores with proper API synchronization, persistence, and safe defaults.

## Trigger
Use when adding new data to a store, creating a new store, or fixing store/API sync issues.

## Instructions

### Step 1: Identify which store to modify
| Store file | Workspace | Size |
|-----------|-----------|------|
| `store/dashboard.ts` | Freelance | 27KB — services, orders, profile, reviews, conversations |
| `store/client.ts` | Client | 25KB — projects, orders, favorites, finances |
| `store/admin.ts` | Admin | 26KB — all admin CRUD operations |
| `store/agency.ts` | Agency | 9KB — team, projects, services, finances |
| `store/messaging.ts` | All | 27KB — conversations, messages, typing |
| `store/platform-data.ts` | Global | 66KB — categories, countries, currencies |
| `store/service-wizard.ts` | Freelance/Agency | 7KB — service creation wizard state |
| `store/currency.ts` | Global | 1.5KB — selected currency |
| `store/locale.ts` | Global | 1.7KB — selected language |
| `store/toast.ts` | Global | 1.1KB — toast notifications |

### Step 2: Store creation pattern
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware"; // Only if data should persist

interface XxxState {
  items: ItemType[];
  loading: boolean;
  error: string | null;

  // Sync actions
  syncItems: () => Promise<void>;

  // CRUD actions
  createItem: (data: CreateData) => Promise<boolean>;
  updateItem: (id: string, data: Partial<ItemType>) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
}

export const useXxxStore = create<XxxState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      error: null,

      syncItems: async () => {
        set({ loading: true });
        try {
          const data = await xxxApi.list();
          // CRITICAL: Ensure arrays are never undefined
          set({
            items: Array.isArray(data) ? data : [],
            loading: false,
            error: null,
          });
        } catch (e) {
          set({ loading: false, error: (e as Error).message });
        }
      },

      createItem: async (data) => {
        try {
          const result = await xxxApi.create(data);
          set((s) => ({ items: [result, ...s.items] }));
          return true;
        } catch { return false; }
      },
      // ...
    }),
    {
      name: "freelancehigh-xxx-v1",
      partialize: (state) => ({
        items: state.items,
        // Only persist what should survive page reload
        // NEVER persist: loading, error
      }),
    }
  )
);
```

### Step 3: Critical rules

**NEVER let arrays be undefined in store state:**
```typescript
// BAD
items: data.items,

// GOOD
items: Array.isArray(data?.items) ? data.items : [],
```

**ALWAYS unwrap API responses correctly:**
```typescript
// If API returns { wrapper: data }
const res = await fetchApi<{ items: Item[] }>("/api/xxx");
set({ items: res.items || [] });

// If API returns data directly
const res = await fetchApi<Item[]>("/api/xxx");
set({ items: res || [] });
```

**Persist store version:**
Always include a version suffix in the store name: `"freelancehigh-xxx-v1"`.
Increment when changing the state shape to avoid stale localStorage.

**Loading state pattern:**
```typescript
syncItems: async () => {
  set({ loading: true });
  try {
    // ... fetch
    set({ items: data, loading: false, error: null });
  } catch (e) {
    set({ loading: false, error: (e as Error).message });
  }
},
```

### Step 4: API client integration
When creating store sync actions, ensure the corresponding API client functions exist in `lib/api-client.ts`.

CRITICAL BUG PATTERN: If the API returns `{ data: {...} }` but `fetchApi<T>` returns the whole object, the store gets `{ data: {...} }` instead of `{...}`. Always verify response shape matches.

### Step 5: Admin store pattern
The admin store uses a different pattern with Record-based loading:
```typescript
loading: Record<string, boolean>;
error: Record<string, string | null>;

syncXxx: async () => {
  set({ loading: { ...get().loading, xxx: true } });
  try {
    const data = await fetchAdmin<{ items: Item[] }>("/api/admin/xxx");
    set({
      items: data.items,
      loading: { ...get().loading, xxx: false },
      error: { ...get().error, xxx: null },
    });
  } catch (e) {
    set({
      loading: { ...get().loading, xxx: false },
      error: { ...get().error, xxx: (e as Error).message },
    });
  }
},
```
