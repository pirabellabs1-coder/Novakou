import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/formations/admin/kyc?scope=pending|history|all
 * Admin-only. Returns KYC requests.
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

    const pending =
      scope === "history"
        ? []
        : await prisma.kycRequest.findMany({
            where: { status: "EN_ATTENTE" },
            orderBy: { createdAt: "asc" },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  kyc: true,
                  role: true,
                  formationsRole: true,
                  createdAt: true,
                },
              },
            },
          });

    const history =
      scope === "pending"
        ? []
        : await prisma.kycRequest.findMany({
            where: { status: { in: ["APPROUVE", "REFUSE"] } },
            orderBy: { reviewedAt: "desc" },
            take: 100,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  kyc: true,
                  role: true,
                  formationsRole: true,
                },
              },
            },
          });

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
