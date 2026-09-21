import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { appliquerDecisionKyc } from "@/lib/formations/kyc-decision";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/kyc/[id]
 * Body: { action: "approve" | "refuse", refuseReason?: string }
 *
 * Décision MANUELLE d'un admin — reste possible pour corriger ou traiter un
 * cas que l'agent autonome (`lib/agents/impl/kyc-verification.ts`) n'a pas
 * encore atteint. Les deux chemins partagent la même logique
 * (`appliquerDecisionKyc`) : même mise à jour du niveau KYC, même
 * notification, même e-mail — aucune divergence possible entre eux.
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toString().toUpperCase();
    if (!session?.user || role !== "ADMIN") {
      return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });
    }

    const body = await request.json();
    const { action, refuseReason } = body as { action?: string; refuseReason?: string };
    if (!action || !["approve", "refuse"].includes(action)) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const decision = await appliquerDecisionKyc({
      kycRequestId: id,
      action: action as "approve" | "refuse",
      refuseReason,
      decidePar: session.user.id,
    });

    if (!decision.ok) return NextResponse.json({ error: decision.erreur }, { status: 400 });
    return NextResponse.json({
      data:
        decision.statut === "APPROUVE"
          ? { id, status: "APPROUVE", newLevel: decision.nouveauNiveau }
          : { id, status: "REFUSE" },
    });
  } catch (err) {
    console.error("[admin/kyc PATCH]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Erreur serveur", detail: msg }, { status: 500 });
  }
}
