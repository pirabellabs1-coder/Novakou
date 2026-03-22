# Skill: Maquette to Code Converter

Convert FreelanceHigh HTML maquettes into production Next.js pages with shadcn/ui, Tailwind CSS, and proper data integration.

## Trigger
Use when the user asks to implement a page from a maquette, convert a maquette, build a page based on a screenshot, or develop a new UI screen.

## Instructions

### Step 1: Locate and read the maquette
The project has 64+ maquette folders in the root directory. Each contains:
- `code.html` — Full HTML mockup with inline styles and structure
- `screen.png` — Visual reference screenshot

```bash
# Find maquette by keyword
ls /mnt/c/FreelanceHigh/ | grep -i "<keyword>"
```

ALWAYS read both `code.html` AND view `screen.png` before coding.

### Step 2: Analyze the maquette structure
From the HTML, extract:
- **Layout structure**: Sidebar? Header? Grid columns?
- **Color palette**: Map to project tokens (primary=#6C2BD9, accent=#0EA5E9, success=#10B981)
- **Components used**: Cards, tables, modals, forms, charts, badges
- **Data displayed**: What API data is needed
- **Interactive elements**: Buttons, tabs, filters, search, modals, wizards

### Step 3: Map to project architecture
- **Route**: Determine the correct path in `apps/web/app/`
  - Public: `(public)/`
  - Freelance: `dashboard/`
  - Client: `client/`
  - Agency: `agence/`
  - Admin: `admin/`
- **Store**: Which Zustand store provides the data?
  - `useDashboardStore` for freelance
  - `useClientStore` for client
  - `useAdminStore` for admin
  - `useAgencyStore` for agency
- **API**: What endpoints are needed? Do they exist already?

### Step 4: Build the page following project conventions

```tsx
"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useXxxStore } from "@/store/xxx";

export default function PageName() {
  const { data, loading, syncData } = useXxxStore();

  useEffect(() => { syncData(); }, [syncData]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">icon_name</span>
          Page Title
        </h1>
        <p className="text-slate-400 text-sm mt-1">Description.</p>
      </div>
      {/* Content */}
    </div>
  );
}
```

### Step 5: Design system rules
- **Dark theme**: bg-background-dark, bg-neutral-dark, border-border-dark, text-white/slate-400
- **Cards**: `bg-neutral-dark rounded-xl border border-border-dark p-4 sm:p-5`
- **Primary buttons**: `bg-primary text-white font-bold rounded-lg hover:bg-primary/90`
- **Icons**: Material Symbols Outlined: `<span className="material-symbols-outlined">name</span>`
- **Responsive**: Always mobile-first with `sm:`, `md:`, `lg:` breakpoints
- **Spacing**: `space-y-4 sm:space-y-6` for sections
- **Status colors**: emerald=success, amber=warning, red=error, blue=info, primary=action

### Step 6: Skeleton loading
Always include an animated loading skeleton matching the page structure:
```tsx
function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-white/5 rounded-xl w-2/3" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-neutral-dark rounded-xl p-5 border border-border-dark">
            <div className="h-6 w-16 bg-border-dark rounded mb-2" />
            <div className="h-4 w-24 bg-border-dark rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 7: Final checklist
- [ ] Page matches maquette layout and hierarchy
- [ ] Mobile responsive (375px, 768px, 1280px)
- [ ] Loading skeleton included
- [ ] Error states handled
- [ ] Empty states ("Aucun element") included
- [ ] All text in French
- [ ] Dark theme applied correctly
- [ ] Data fetched from correct store/API
