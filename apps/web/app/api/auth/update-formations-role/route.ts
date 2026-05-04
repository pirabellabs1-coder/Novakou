// @ts-nocheck
// Legacy file with type drift - runtime behavior preserved, type checking skipped.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { z } from "zod";
import { IS_DEV, USE_PRISMA_FOR_DATA } from "@/lib/env";

const schema = z.object({
  formationsRole: z.enum(["apprenant", "instructeur"]),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Role invalide" }, { status: 400 });
    }

    const { formationsRole } = parsed.data;

    if (IS_DEV && !USE_PRISMA_FOR_DATA) {
      const { devStore } = await import("@/lib/dev/dev-store");
      devStore.update(session.user.id, { formationsRole } as Record<string, unknown>);
      return NextResponse.json({ success: true, formationsRole });
    }

    // Production: Prisma
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.user.update({
        where: { id: session.user.id },
        data: { formationsRole },
      });
    } catch (err) {
      console.error("[UPDATE_FORMATIONS_ROLE] Prisma error:", err);
      return NextResponse.json({ error: "Erreur base de donnees" }, { status: 500 });
    }

    return NextResponse.json({ success: true, formationsRole });
  } catch (err) {
    console.error("[UPDATE_FORMATIONS_ROLE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
