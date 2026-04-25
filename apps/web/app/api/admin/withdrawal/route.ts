/**
 * GET  /api/admin/withdrawal   — liste des retraits admin + solde plateforme disponible
 * POST /api/admin/withdrawal   — créer une demande de retrait de la commission plateforme
 *
 * Règles :
 *   - Admin role uniquement (session.user.role === "ADMIN" ou ADMIN_EMAIL env match)
 *   - Solde disponible = somme des PlatformRevenue.commissionAmount - sommes déjà retirées
 *   - Méthodes acceptées : virement | mobile_money | paypal | wise
 *   - Minimum 1000 FCFA
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

const VALID_METHODS = ["virement", "mobile_money", "paypal", "wise"] as const;
const MIN_AMOUNT = 1000; // 1 000 FCFA minimum

function isAdminSession(session: Awaited<ReturnType<typeof getServerSession>>): boolean {
  if (!session?.user) return false;
  const role = (session.user as Record<string, unknown>).role as string | undefined;
  if (role === "ADMIN" || role === "admin") return true;
  const email = (session.user.email || "").toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
  if (adminEmail && email === adminEmail) return true;
  return false;
}

async function computeBalance(): Promise<{ total: number; paid: number; pending: number; available: number }> {
  const [totalAgg, paidAgg, pendingAgg] = await Promise.all([
    // Commission Novakou = 10 % de chaque vente (enregistré dans commissionAmount)
    prisma.platformRevenue.aggregate({ _sum: { commissionAmount: true } }),
    prisma.platformPayout.aggregate({
      where: { status: "TRAITE" },
      _sum: { amount: true },
    }),
    prisma.platformPayout.aggregate({
      where: { status: "EN_ATTENTE" },
      _sum: { amount: true },
    }),
  ]);
  const total = totalAgg._sum.commissionAmount ?? 0;
  const paid = paidAgg._sum.amount ?? 0;
  const pending = pendingAgg._sum.amount ?? 0;
  return {
    total,
    paid,
    pending,
    available: Math.max(0, total - paid - pending),
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session) && !IS_DEV) {
    return NextResponse.json({ error: "Admin requis" }, { status: 403 });
  }

  const [balance, withdrawals] = await Promise.all([
    computeBalance(),
    prisma.platformPayout.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  return NextResponse.json({ data: { balance, withdrawals } });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session) && !IS_DEV) {
    return NextResponse.json({ error: "Admin requis" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    amount?: number;
    method?: string;
    accountDetails?: Record<string, unknown>;
    note?: string;
  };

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT) {
    return NextResponse.json(
      { error: `Montant minimum : ${MIN_AMOUNT} FCFA` },
      { status: 400 }
    );
  }

  const method = String(body.method || "").toLowerCase();
  if (!VALID_METHODS.includes(method as typeof VALID_METHODS[number])) {
    return NextResponse.json(
      { error: `Méthode invalide. Acceptées : ${VALID_METHODS.join(", ")}` },
      { status: 400 }
    );
  }

  const details = body.accountDetails && typeof body.accountDetails === "object" ? body.accountDetails : {};
  if (Object.keys(details).length === 0) {
    return NextResponse.json({ error: "Coordonnées requises (IBAN, email, numéro…)" }, { status: 400 });
  }

  const balance = await computeBalance();
  if (amount > balance.available) {
    return NextResponse.json(
      { error: `Solde insuffisant. Disponible : ${Math.round(balance.available)} FCFA` },
      { status: 400 }
    );
  }

  const adminUserId = session?.user?.id ?? "unknown-admin";

  const payout = await prisma.platformPayout.create({
    data: {
      adminUserId,
      amount,
      method,
      accountDetails: details as object,
      status: "EN_ATTENTE",
      note: body.note?.toString().slice(0, 500) || null,
    },
  });

  // Audit log
  await prisma.auditLog
    .create({
      data: {
        action: "platform_payout_requested",
        targetType: "platform_payout",
        targetId: payout.id,
        details: { amount, method } as object,
      },
    })
    .catch(() => null);

  return NextResponse.json({ data: payout }, { status: 201 });
}
