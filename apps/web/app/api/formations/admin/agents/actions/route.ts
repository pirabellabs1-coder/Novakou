import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

function isAdmin(session: { user?: ({ email?: string | null } & Record<string, unknown>) } | null): boolean {
  if (!session?.user) return false;
  const role = (session.user as Record<string, unknown>).role as string | undefined;
  if (role === "ADMIN" || role === "admin") return true;
  const email = (session.user.email || "").toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
  return !!adminEmail && email === adminEmail;
}

// PATCH — valider ou rejeter une action proposée par un agent.
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const actionId = String(body.actionId || "");
  const decision = String(body.decision || ""); // "approve" | "reject"
  if (!actionId || !["approve", "reject"].includes(decision)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const action = await prisma.agentAction.findUnique({ where: { id: actionId } });
  if (!action) return NextResponse.json({ error: "Action introuvable" }, { status: 404 });
  if (action.status !== "proposed") {
    return NextResponse.json({ error: "Action déjà traitée" }, { status: 409 });
  }

  const decidedBy = session?.user?.email ?? "admin";

  if (decision === "reject") {
    await prisma.agentAction.update({
      where: { id: actionId },
      data: { status: "rejected", decidedBy, decidedAt: new Date() },
    });
    return NextResponse.json({ ok: true, status: "rejected" });
  }

  // Approbation : marquée approuvée + horodatée. L'exécution concrète par type
  // (masquer un produit, décision KYC…) se fait via les outils admin dédiés ;
  // l'action sert de trace validée. (Exécution auto par type à venir.)
  await prisma.agentAction.update({
    where: { id: actionId },
    data: { status: "approved", decidedBy, decidedAt: new Date(), executedAt: new Date() },
  });
  return NextResponse.json({ ok: true, status: "approved" });
}
