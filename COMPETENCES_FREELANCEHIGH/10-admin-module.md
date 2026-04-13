# Skill: FreelanceHigh Admin Module Builder

Create complete admin management pages with data tables, filters, actions, modals, and audit logging.

## Trigger
Use when the user asks to create an admin page, add admin functionality, build a management panel, or implement admin CRUD.

## Instructions

### Step 1: Admin architecture
Admin pages live in `apps/web/app/admin/`. All use `useAdminStore` from `store/admin.ts`.

**Existing admin pages (18+):**
- `/admin/dashboard` — Global stats with charts
- `/admin/utilisateurs` — User management (suspend/ban/role)
- `/admin/services` — Service moderation (approve/refuse)
- `/admin/commandes` — Order management
- `/admin/kyc` — KYC verification queue
- `/admin/litiges` — Dispute resolution
- `/admin/finances` — Transactions, escrow
- `/admin/blog` — Content management
- `/admin/categories` — Category CRUD
- `/admin/plans` — Subscription plans
- `/admin/notifications` — Send notifications
- `/admin/analytics` — Traffic, revenue charts
- `/admin/configuration` — Platform settings
- `/admin/audit-log` — Admin action history
- `/admin/equipe` — Admin team management
- `/admin/formations/*` — Formations admin

### Step 2: Admin page template
```tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useToastStore } from "@/store/toast";
import { useAdminStore } from "@/store/admin";
import { cn } from "@/lib/utils";

export default function AdminModulePage() {
  const { addToast } = useToastStore();
  const { items, loading, syncItems, actionOnItem } = useAdminStore();

  useEffect(() => { syncItems(); }, [syncItems]);

  if (loading.items) return <ModuleSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
          Gestion des Items
        </h1>
        <p className="text-slate-400 text-sm mt-1">Description de la page admin.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {/* Stat cards */}
      </div>

      {/* Filters & tabs */}
      <div className="flex gap-2 border-b border-border-dark overflow-x-auto">
        {/* Tab buttons */}
      </div>

      {/* Data table / list */}
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="bg-neutral-dark rounded-xl border border-border-dark p-4 sm:p-5">
            {/* Item row with actions */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 3: Admin store pattern
Extend `store/admin.ts`:

```typescript
// Add to interface
items: AdminItem[];
syncItems: () => Promise<void>;
actionOnItem: (id: string, action: string) => Promise<boolean>;

// Add to store
syncItems: async () => {
  set({ loading: { ...get().loading, items: true } });
  try {
    const { items } = await fetchAdmin<{ items: AdminItem[] }>("/api/admin/items");
    set({
      items,
      loading: { ...get().loading, items: false },
      error: { ...get().error, items: null },
    });
  } catch (e) {
    set({
      loading: { ...get().loading, items: false },
      error: { ...get().error, items: (e as Error).message },
    });
  }
},

actionOnItem: async (id, action) => {
  try {
    await fetchAdmin(`/api/admin/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    });
    await get().syncItems();
    return true;
  } catch { return false; }
},
```

### Step 4: Admin API route pattern
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { createAuditLog } from "@/lib/admin/audit";

// ALWAYS check admin role
const session = await getServerSession(authOptions);
if (!session?.user?.id || session.user.role !== "admin") {
  return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
}

// ALWAYS create audit log for destructive actions
await createAuditLog({
  actorId: session.user.id,
  action: "module.action_name",
  targetUserId: targetId,
  details: { key: value },
});
```

### Step 5: Common admin UI patterns

**Action buttons with loading:**
```tsx
<button
  onClick={() => handleAction(item.id)}
  disabled={actionLoading === item.id}
  className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
>
  {actionLoading === item.id ? "..." : "Approuver"}
</button>
```

**Rejection modal with presets:**
```tsx
{rejectId && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-neutral-dark rounded-2xl p-6 w-full max-w-md border border-border-dark shadow-2xl">
      <h3 className="font-bold text-lg text-white mb-4">Motif de refus</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {PRESET_REASONS.map(r => (
          <button key={r} onClick={() => setReason(r)}
            className={cn("px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
              reason === r ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-border-dark text-slate-400"
            )}>{r}</button>
        ))}
      </div>
      <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-lg border border-border-dark bg-background-dark text-sm text-white" />
      <div className="flex gap-3 mt-4">
        <button onClick={() => setRejectId(null)} className="flex-1 py-2.5 border border-border-dark rounded-lg text-sm font-semibold text-slate-300">Annuler</button>
        <button onClick={handleRefuse} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold">Confirmer</button>
      </div>
    </div>
  </div>
)}
```

### Step 6: Add to admin sidebar
Update `components/admin/AdminSidebar.tsx` to add the new link.

### Step 7: Auto-refresh
The admin store supports auto-refresh via `DEFAULT_REFRESH_INTERVAL` (30s).
Use `lastRefreshedAt` to track freshness of each data section.
