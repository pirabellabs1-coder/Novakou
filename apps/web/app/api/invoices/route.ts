import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { invoiceStore } from "@/lib/dev/data-store";

// GET /api/invoices — Fetch user's invoices (both as buyer and seller)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const invoices = invoiceStore.getByUser(session.user.id);

    // Separate by role in the transaction
    const asBuyer = invoices.filter((inv) => inv.buyerId === session.user.id);
    const asSeller = invoices.filter((inv) => inv.sellerId === session.user.id);

    // Compute summary
    const totalPaid = asBuyer.reduce((sum, inv) => sum + inv.totalPaid, 0);
    const totalEarned = asSeller.reduce((sum, inv) => sum + inv.netAmount, 0);
    const totalCommissions = asSeller.reduce((sum, inv) => sum + inv.commission, 0);

    return NextResponse.json({
      invoices,
      asBuyer,
      asSeller,
      summary: {
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalEarned: Math.round(totalEarned * 100) / 100,
        totalCommissions: Math.round(totalCommissions * 100) / 100,
        count: invoices.length,
      },
    });
  } catch (error) {
    console.error("[API /invoices GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
