## Context

The platform has a dual-mode data layer: `IS_DEV && !USE_PRISMA_FOR_DATA` gates dev-store usage, with Prisma as the production path. However, 18+ API routes were written without this gate — they always use dev-stores. On Vercel, these stores are ephemeral (reset every cold start), making these routes non-functional in production.

## Goals / Non-Goals

**Goals:**
- Every API route has a working Prisma path gated by `IS_DEV && !USE_PRISMA_FOR_DATA`
- No hardcoded demo data displayed to users (categories, availability, notification settings)
- Dashboard store initializes with empty/null state and loads everything from API
- All changes are backward-compatible with the existing dev-store path

**Non-Goals:**
- Removing the dev-store system entirely (still useful for local dev without DB)
- Adding new Prisma tables or schema changes
- Changing API response shapes (keep existing contracts)
- Performance optimization of Prisma queries (separate concern)

## Decisions

1. **Pattern: wrap existing dev-store code in IS_DEV guard, add Prisma else-block**
   Every route follows the same pattern:
   ```ts
   if (IS_DEV && !USE_PRISMA_FOR_DATA) {
     // existing dev-store code unchanged
   }
   // Production: Prisma
   const { prisma } = await import("@/lib/prisma");
   // ... Prisma query matching the dev-store logic
   ```

2. **Categories: static constant with DB override**
   Keep `CATEGORIES` as a fallback constant. Add `/api/public/categories` route that reads from Prisma `Category` table. CategoryBar fetches from API, falls back to static list.

3. **Dashboard store: lazy-load everything**
   Replace `DEMO_NOTIFICATION_SETTINGS` and `DEMO_AVAILABILITY` with empty arrays. The `syncFromApi()` function already handles loading these from the profile API.

4. **Invoices page: use API**
   Replace direct `INVOICES` import with `fetch("/api/invoices")` call.

## Risks / Trade-offs

- **Risk:** Some Prisma queries may fail if tables/columns don't exist yet → Mitigation: wrap in try/catch with empty-array fallback
- **Trade-off:** Routes become longer with dual paths → Acceptable; this is the established pattern across 67 existing routes
- **Risk:** Dev-store path becomes stale over time as Prisma path evolves → Acceptable; dev-store is convenience, not source of truth
