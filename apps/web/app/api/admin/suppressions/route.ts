import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV) return null;
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role?.toLowerCase() !== "admin" && !IS_DEV) return null;
  return session;
}

/** GET — list pending/awaiting deletion requests for admin review. */
export async function GET(request: Request) {
  const ok = await ensureAdmin();
  if (!ok) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Auto-promote: PENDING_COOLDOWN dont le délai 72h est passé → AWAITING_REVIEW
  // (évite d'avoir à brancher un cron dédié sur Vercel Hobby plan)
  await prisma.accountDeletionRequest
    .updateMany({
      where: { status: "PENDING_COOLDOWN", cooldownUntil: { lte: new Date() } },
      data: { status: "AWAITING_REVIEW" },
    })
    .catch(() => null);

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "AWAITING_REVIEW";
  const allowed = ["PENDING_COOLDOWN", "AWAITING_REVIEW", "APPROVED", "REJECTED", "CANCELLED", "ALL"];
  if (!allowed.includes(status))
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });

  const where = status === "ALL"
    ? undefined
    : { status: status as "PENDING_COOLDOWN" | "AWAITING_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED" };

  const requests = await prisma.accountDeletionRequest.findMany({
    where,
    orderBy: { requestedAt: "desc" },
    take: 200,
    include: {
      user: {
        select: {
          id: true, email: true, name: true, role: true, formationsRole: true,
          createdAt: true, kyc: true,
        },
      },
    },
  });

  return NextResponse.json({ data: requests });
}
