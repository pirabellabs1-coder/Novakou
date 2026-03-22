# Skill: FreelanceHigh Page Builder

Rapidly create new Next.js pages with the project's exact conventions, store integration, and responsive dark theme.

## Trigger
Use when the user asks to create a new page, add a screen, or build a new section in any workspace.

## Instructions

### Step 1: Determine workspace and route
| Workspace | Path prefix | Store | Layout |
|-----------|-------------|-------|--------|
| Public | `(public)/` | none (fetch direct) | Navbar + Footer |
| Freelance | `dashboard/` | `useDashboardStore` | Dashboard sidebar |
| Client | `client/` | `useClientStore` | Client sidebar |
| Agency | `agence/` | `useAgencyStore` | Agency sidebar |
| Admin | `admin/` | `useAdminStore` | Admin sidebar |
| Formations | `formations/` | varies | Formations layout |

### Step 2: Check for maquette
```bash
ls /mnt/c/FreelanceHigh/ | grep -i "<page-name>"
```
If maquette exists, read `code.html` and view `screen.png`.

### Step 3: Page template
```tsx
"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
// Import the correct store for this workspace

export default function PageName() {
  // State & data fetching
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from API or store
    setLoading(false);
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">icon</span>
          Titre de la Page
        </h1>
        <p className="text-slate-400 text-sm mt-1">Sous-titre descriptif.</p>
      </div>

      {/* Stats cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        {/* StatCard components */}
      </div>

      {/* Main content */}
      <div className="bg-neutral-dark rounded-xl border border-border-dark p-4 sm:p-5">
        {/* Content */}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-white/5 rounded-xl w-2/3" />
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl" />)}
      </div>
      <div className="h-64 bg-white/5 rounded-xl" />
    </div>
  );
}
```

### Step 4: Common UI patterns used across the project

**Stat card:**
```tsx
<div className="bg-neutral-dark rounded-xl p-3 sm:p-4 lg:p-5 border border-border-dark">
  <div className="flex items-center gap-2 sm:gap-3 mb-2">
    <span className="material-symbols-outlined text-primary">icon</span>
    <p className="text-xl sm:text-2xl font-bold text-primary">{value}</p>
  </div>
  <p className="text-xs text-slate-500">Label</p>
</div>
```

**Tab navigation:**
```tsx
<div className="flex gap-2 border-b border-border-dark overflow-x-auto">
  {tabs.map(t => (
    <button key={t.key} onClick={() => setTab(t.key)}
      className={cn("px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap",
        tab === t.key ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-300"
      )}>
      {t.label}
    </button>
  ))}
</div>
```

**Empty state:**
```tsx
<div className="text-center py-16">
  <span className="material-symbols-outlined text-5xl text-slate-600">icon</span>
  <p className="text-slate-500 mt-2">Aucun element dans cette categorie</p>
</div>
```

**Action button pair:**
```tsx
<div className="flex gap-2">
  <button className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors">
    Approuver
  </button>
  <button className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors">
    Refuser
  </button>
</div>
```

### Step 5: Add to sidebar navigation
After creating the page, update the relevant sidebar:
- `components/dashboard/Sidebar.tsx`
- `components/admin/AdminSidebar.tsx`
- `components/agence/AgenceSidebar.tsx`
- `components/client/ClientSidebar.tsx`
