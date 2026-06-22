import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/push/unsubscribe — supprime un abonnement Web Push par endpoint
 * (v2 Phase 4). Pas d'auth requise : l'endpoint est un secret suffisant et on
 * ne fait que retirer un appareil.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const endpoint: string | undefined = body?.endpoint;
    if (!endpoint) return NextResponse.json({ error: "endpoint requis" }, { status: 400 });

    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/unsubscribe]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
