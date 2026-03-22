# Skill: FreelanceHigh API Route Builder

Build new API routes following the project's exact dual-mode pattern (IS_DEV + Prisma production).

## Trigger
Use when the user asks to create a new API endpoint, add a route, build an API, or implement backend logic for a feature.

## Instructions

### Step 1: Determine the route structure
- Read the user's request to identify: HTTP method(s), path, auth requirements, role restrictions
- Check if a similar route exists: `find apps/web/app/api/ -name "route.ts" | grep <similar>`
- If extending an existing route, read it first

### Step 2: Follow the EXACT project pattern
Every API route in this project follows this skeleton:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
// Import relevant dev stores
import { someStore } from "@/lib/dev/data-store";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }
    // Optional: role check
    // if (session.user.role !== "admin") {
    //   return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    // }

    if (IS_DEV) {
      // Dev mode: use in-memory stores from @/lib/dev/data-store
      const data = someStore.getByUser(session.user.id);
      return NextResponse.json(data);
    }

    // Production: Prisma
    const data = await prisma.someModel.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API /route-name GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la recuperation" },
      { status: 500 }
    );
  }
}
```

### Step 3: Validation rules
- Use Zod for input validation on POST/PATCH
- Always validate auth via `getServerSession(authOptions)`
- Admin routes: check `session.user.role !== "admin"` → 403
- Never expose internal errors to client
- Error messages in French (without accents in code: "Non authentifie")
- Console logs: `[API /route-name METHOD]`

### Step 4: Dev mode data stores
Available stores in `@/lib/dev/data-store`:
- `serviceStore`, `orderStore`, `reviewStore`, `profileStore`
- `notificationStore`, `kycRequestStore`, `kycPersonalInfoStore`
- `conversationStore`, `transactionStore`, `contactStore`
- `getCategoryName()`, `getSubCategoryName()`

User store: `import { devStore } from "@/lib/dev/dev-store"`

### Step 5: Production Prisma models
Check `packages/db/prisma/schema.prisma` for available models and fields.
Always cast prisma if using fields not yet in TS types:
```typescript
const prisma = _prisma as any;
```

### Step 6: Dynamic route params (Next.js 15 pattern)
```typescript
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

### Step 7: Audit logging for admin actions
```typescript
import { createAuditLog } from "@/lib/admin/audit";
await createAuditLog({
  actorId: session.user.id,
  action: "action.name",
  targetUserId: userId,
  details: { key: value },
});
```

### Step 8: Event emission for notifications
```typescript
import { emitEvent } from "@/lib/events/dispatcher";
emitEvent("event.name", { userId, ... }).catch(console.error);
```
