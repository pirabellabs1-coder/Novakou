import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";
import { EmailSequenceTrigger } from "@prisma/client";

import { getInstructeurId as _gii } from "@/lib/formations/instructeur";
async function getProfileId(userId: string) { return _gii(userId); }

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const _ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!_ctx) return NextResponse.json({ error: "Impossible de résoudre votre session. Déconnectez-vous et reconnectez-vous." }, { status: 401 });
    const pid = _ctx.instructeurId;

    const body = await request.json();
    const { name, description, trigger } = body;

    if (!name || !trigger) return NextResponse.json({ error: "Nom et déclencheur requis" }, { status: 400 });

    const sequence = await prisma.emailSequence.create({
      data: { instructeurId: pid, shopId: activeShopId,
        name: name.trim(),
        description: description?.trim() || null,
        trigger: trigger as EmailSequenceTrigger,
        isActive: false,
      },
    });

    return NextResponse.json({ data: sequence });
  } catch (err) {
    console.error("[sequences POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
