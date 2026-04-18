import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";

/** GET — returns { enabled } for the current session's user. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ enabled: false }, { status: 401 });
  }

  try {
    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const { devStore } = await import("@/lib/dev/dev-store");
      const u = devStore.findById(session.user.id) as unknown as
        | (Record<string, unknown> & { twoFactorEnabled?: boolean })
        | undefined;
      return NextResponse.json({ enabled: !!u?.twoFactorEnabled });
    }
    const { prisma } = await import("@/lib/prisma");
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true },
    });
    return NextResponse.json({ enabled: !!u?.twoFactorEnabled });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}
