# Skill: FreelanceHigh Bug Hunter

Systematic debugging methodology for the FreelanceHigh codebase. Diagnoses bugs by following data flow from API → Store → Component.

## Trigger
Use when the user reports a bug, crash, error, or unexpected behavior on any page.

## Instructions

### Step 1: Classify the bug type
Read the user's description and classify:
- **CRASH**: Page won't load / white screen / TypeError
- **DATA**: Wrong data shown / data missing / not persisting
- **UI**: Visual glitch / layout broken / responsive issue
- **AUTH**: Can't login / wrong role / session issues
- **KYC**: Level not updating / banner stuck / documents not showing
- **API**: 400/401/403/404/500 errors
- **CSP**: "Content blocked" / iframe blocked / media blocked
- **PAYMENT**: Payment fails / escrow issues

### Step 2: Trace the data flow (ALWAYS do this)
For any bug, trace the FULL chain:

1. **Database/Store** → Check `packages/db/prisma/schema.prisma` for the model
2. **API Route** → Read `apps/web/app/api/<route>/route.ts`
   - Check IS_DEV vs production code path
   - Check response shape: `{ data }` wrapper or direct
3. **API Client** → Read `apps/web/lib/api-client.ts` for the fetch function
   - CRITICAL: Check if response unwrapping matches API shape
   - Common bug: API returns `{ profile: {...} }` but client expects `{...}` directly
4. **Store** → Read `apps/web/store/<store>.ts`
   - Check how API response is mapped to store state
   - Check if arrays have safe defaults (never undefined)
5. **Component** → Read the page/component
   - Check for `.map()` on potentially undefined arrays
   - Check for optional chaining on nested objects

### Step 3: Known bug patterns in this project

#### Pattern A: Response shape mismatch
API returns `{ wrapper: data }` but client does `fetchApi<Data>()` expecting raw data.
**Fix**: Update api-client.ts to unwrap, or fix the API to return raw.

#### Pattern B: Arrays undefined → .map() crash
Prisma JSON fields (skills, languages, education, links) can be `null`.
**Fix**: Always `|| []` in API response AND `Array.isArray(x) ? x : []` in component.

#### Pattern C: KYC level not refreshing
JWT has 5-min cache. `session.update()` triggers refresh but cache may interfere.
**Fix**: KycRequiredBanner also calls `/api/kyc` directly to get fresh level.

#### Pattern D: CSP blocking content
`next.config.ts` has strict CSP in production.
**Fix**: Add domains to `frame-src`, `media-src`, `img-src` as needed.

#### Pattern E: Dev mode vs Production divergence
Dev stores may have different data shape than Prisma models.
**Fix**: Compare `data-store.ts` types with `schema.prisma` models.

#### Pattern F: Auth callback ordering
NextAuth callbacks: signIn → jwt → session. User object only available in first jwt call.
**Fix**: Check `trigger === "update"` path in jwt callback.

### Step 4: Quick diagnostic commands
```bash
# Find the API route for a page
grep -r "fetch.*api/" apps/web/app/<page-path>/ --include="*.tsx"

# Find store used by a page
grep -r "useStore\|useDashboardStore\|useAdminStore\|useClientStore" apps/web/app/<page-path>/

# Check API response shape
grep -A5 "return NextResponse.json" apps/web/app/api/<route>/route.ts

# Find all .map() calls that might crash
grep -n "\.map(" apps/web/app/<page-path>/page.tsx
```

### Step 5: Fix methodology
1. Fix the ROOT CAUSE (usually API shape or missing null checks)
2. Add defensive defaults at EVERY layer (API + store + component)
3. Never just add `?.` without understanding WHY it's undefined
4. Test both IS_DEV and production code paths mentally
5. Check if the same bug pattern exists in other similar routes/pages
