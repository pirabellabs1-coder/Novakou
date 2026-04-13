# Skill: FreelanceHigh Deploy Validator

Pre-deployment validation that catches all common issues before pushing to Vercel.

## Trigger
Use AUTOMATICALLY after completing any significant code changes (3+ files modified). Also use when user asks to validate, check, verify, or prepare for deployment.

## Instructions

### Check 1: TypeScript compilation
```bash
cd /mnt/c/FreelanceHigh && npx tsc --noEmit --project apps/web/tsconfig.json 2>&1 | head -50
```
If errors, fix them before proceeding.

### Check 2: API response shape consistency
For every API route modified, verify:
1. The response shape in the route: `NextResponse.json({ wrapper: data })` or `NextResponse.json(data)`
2. The client function in `lib/api-client.ts` matches the shape
3. The store correctly unwraps the response

Common trap: Route returns `{ profile: {...} }` but client expects `{...}` directly.

### Check 3: Null safety on arrays
Search for `.map(` in modified files. Every `.map()` call must have a safe target:
```bash
grep -n "\.map(" <modified-files>
```
Ensure: `(data?.field || []).map(...)` or `Array.isArray(data.field) ? data.field.map(...) : []`

### Check 4: CSP headers (next.config.ts)
If any external URL was added (iframe, image, API, font), verify it's in the CSP:
- `frame-src` for iframes (YouTube, Vimeo, etc.)
- `img-src` for images (Cloudinary, external avatars)
- `connect-src` for API calls (Supabase, analytics)
- `media-src` for video/audio
- `font-src` for fonts

Also check `Permissions-Policy`:
- `camera=(self)` if KYC selfie is used
- Never `camera=()` which blocks all camera access

### Check 5: Auth & role guards
For every new/modified API route:
- Protected routes have `getServerSession(authOptions)` check
- Admin routes check `session.user.role !== "admin"` → 403
- Public routes skip auth check

### Check 6: Dev mode parity
For every modified API route, verify BOTH code paths:
- `if (IS_DEV)` path works with data stores
- Production path works with Prisma models
- Both return the SAME response shape

### Check 7: Prisma schema sync
If schema.prisma was modified:
```bash
pnpm --filter=db generate  # Regenerate client
```
Verify new fields are used in both dev stores AND API routes.

### Check 8: Store persistence
If Zustand store was modified, check `partialize` in `persist()`:
- New state fields that should persist must be listed
- Arrays must have safe defaults, not `undefined`

### Check 9: Missing imports
Quick scan for common missing imports in modified files:
```bash
grep -l "IS_DEV\|prisma\|getServerSession\|authOptions" <modified-files> | while read f; do
  head -20 "$f"
done
```

### Check 10: Build test
```bash
pnpm build --filter=@freelancehigh/web 2>&1 | tail -20
```
Must complete without errors. `eslint` and `typescript` errors are ignored during build (config in next.config.ts), but runtime errors will crash.

### Output format
Return a checklist:
```
[x] TypeScript: OK
[x] API shapes: Consistent
[x] Null safety: All .map() calls safe
[x] CSP: All external domains listed
[x] Auth guards: All routes protected
[x] Dev/Prod parity: Both paths return same shape
[ ] Build: FAILED — error in xyz
```
