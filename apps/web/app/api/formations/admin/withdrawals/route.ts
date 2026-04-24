import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

/**
 * GET /api/formations/admin/withdrawals?status=&role=
 *
 * Liste toutes les demandes de retrait vendeur/mentor.
 * status  : EN_ATTENTE | TRAITE | REFUSE | all  (défaut: all)
 * role    : vendor | mentor | all               (défaut: all)
 *
 * Admin only.
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionRole = session?.user?.role?.toString().toUpperCase();
    if (!session?.user || (sessionRole !== "ADMIN" && !IS_DEV)) {
      return NextResponse.json({ error: "Accès refusé — admin requis." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "all";
    const roleFilter = searchParams.get("role") ?? "all";

    const where: Record<string, unknown> = {};
    if (status !== "all") where.status = status;
    if (roleFilter === "mentor") where.method = { endsWith: "_mentor" };
    if (roleFilter === "vendor") where.NOT = { method: { endsWith: "_mentor" } };

    const withdrawals = await prisma.instructorWithdrawal.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }], // EN_ATTENTE en premier
      take: 200,
      include: {
        instructeur: {
          select: {
            user: { select: { id: true, name: true, email: true, image: true, kyc: true } },
          },
        },
      },
    });

    const normalized = withdrawals.map((w) => ({
      id: w.id,
      amount: w.amount,
      method: w.method.replace(/_mentor$/, ""),
      role: w.method.endsWith("_mentor") ? "mentor" : "vendor",
      status: w.status,
      refusedReason: w.refusedReason,
      accountDetails: w.accountDetails,
      processedAt: w.processedAt,
      createdAt: w.createdAt,
      user: {
        id: w.instructeur.user.id,
        name: w.instructeur.user.name,
        email: w.instructeur.user.email,
        image: w.instructeur.user.image,
        kyc: w.instructeur.user.kyc,
      },
    }));

    const summary = {
      total: normalized.length,
      pending: normalized.filter((w) => w.status === "EN_ATTENTE").length,
      processed: normalized.filter((w) => w.status === "TRAITE").length,
      refused: normalized.filter((w) => w.status === "REFUSE").length,
      pendingAmount: normalized
        .filter((w) => w.status === "EN_ATTENTE")
        .reduce((s, w) => s + w.amount, 0),
    };

    return NextResponse.json({ data: normalized, summary });
  } catch (err) {
    console.error("[admin/withdrawals GET]", err);
    return NextResponse.json(
      { data: [], summary: null, error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}
