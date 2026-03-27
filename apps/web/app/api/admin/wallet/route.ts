import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

// GET /api/admin/wallet — Get admin wallet + transactions + payouts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const role = (session.user as Record<string, unknown>).role as string;
    if (role !== "admin" && role !== "ADMIN") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const section = searchParams.get("section"); // "transactions" | "payouts" | null (all)

    // Always use Prisma — admin wallet is critical financial data
    let wallet = await prisma.adminWallet.findFirst();
    if (!wallet) {
      wallet = await prisma.adminWallet.create({ data: {} });
    }

    const result: Record<string, unknown> = { wallet };

    if (!section || section === "transactions") {
      result.transactions = await prisma.adminTransaction.findMany({
        where: { adminWalletId: wallet.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    }

    if (!section || section === "payouts") {
      result.payouts = await prisma.adminPayout.findMany({
        where: { adminWalletId: wallet.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /admin/wallet GET]", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

// POST /api/admin/wallet — Create admin payout
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const role = (session.user as Record<string, unknown>).role as string;
    if (role !== "admin" && role !== "ADMIN") {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await request.json();
    const { amount, method } = body;

    if (!amount || amount <= 0 || !method) {
      return NextResponse.json({ error: "Montant et methode requis" }, { status: 400 });
    }

    // Always use Prisma
    let wallet = await prisma.adminWallet.findFirst();
    if (!wallet) {
      wallet = await prisma.adminWallet.create({ data: {} });
    }

    if (wallet.totalFeesReleased < amount) {
      return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
    }

    const payout = await prisma.adminPayout.create({
      data: {
        adminWalletId: wallet.id,
        amount,
        currency: "EUR",
        method,
        status: "PAYOUT_PENDING",
      },
    });

    return NextResponse.json({ payout }, { status: 201 });
  } catch (error) {
    console.error("[API /admin/wallet POST]", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
