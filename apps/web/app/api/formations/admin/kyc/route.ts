import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { resolveKycDocumentUrl } from "@/lib/kyc-documents";

/**
 * GET /api/admin/kyc?scope=pending|history|all
 * Admin-only. Returns KYC requests.
 *
 * Le champ `documentUrl` est résolu en signed URL Supabase fraîche (TTL 1h)
 * à chaque appel : la valeur stockée en DB peut être un PATH (ex:
 * `userId/timestamp.jpg`) ou une signed URL expirée — dans tous les cas on
 * regénère. Sans cette résolution, le frontend rend `<img src="path">` →
 * URL relative à `/admin/kyc` → 404 "Page introuvable".
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toString().toUpperCase();
    if (!session?.user || role !== "ADMIN") {
      return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });
    }

    const url = new URL(request.url);
    const scope = url.searchParams.get("scope") ?? "pending";

    const userSelect = {
      id: true,
      name: true,
      email: true,
      image: true,
      kyc: true,
      role: true,
      formationsRole: true,
    } as const;

    const pendingRaw =
      scope === "history"
        ? []
        : await prisma.kycRequest.findMany({
            where: { status: "EN_ATTENTE" },
            orderBy: { createdAt: "asc" },
            include: {
              user: { select: { ...userSelect, createdAt: true } },
            },
          });

    const historyRaw =
      scope === "pending"
        ? []
        : await prisma.kycRequest.findMany({
            where: { status: { in: ["APPROUVE", "REFUSE"] } },
            orderBy: { reviewedAt: "desc" },
            take: 100,
            include: {
              user: { select: userSelect },
            },
          });

    // Helper : résout documentUrl en signed URL fraîche pour chaque request.
    const resolve = async <T extends { documentUrl: string | null }>(items: T[]) =>
      Promise.all(
        items.map(async (item) => ({
          ...item,
          documentUrl: item.documentUrl ? await resolveKycDocumentUrl(item.documentUrl) : null,
        })),
      );

    const [pending, history] = await Promise.all([resolve(pendingRaw), resolve(historyRaw)]);

    const [pendingCount, historyCount] = await Promise.all([
      prisma.kycRequest.count({ where: { status: "EN_ATTENTE" } }),
      prisma.kycRequest.count({ where: { status: { in: ["APPROUVE", "REFUSE"] } } }),
    ]);

    return NextResponse.json({
      data: scope === "history" ? history : scope === "all" ? { pending, history } : pending,
      counts: { pending: pendingCount, history: historyCount },
    });
  } catch (err) {
    console.error("[admin/kyc GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
