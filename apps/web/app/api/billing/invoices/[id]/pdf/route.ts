import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { generateInvoicePDF } from "@/lib/pdf/invoice-template";

// GET /api/billing/invoices/[id]/pdf — Generate and download invoice PDF
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Determine invoice type from prefix
    if (id.startsWith("INV-")) {
      // Order invoice
      const orderId = id.replace("INV-", "").toLowerCase();
      const order = await prisma.order.findFirst({
        where: {
          id: { startsWith: orderId },
          OR: [{ clientId: userId }, { freelanceId: userId }],
        },
        include: {
          service: { select: { title: true } },
          client: { select: { name: true, email: true } },
          freelance: { select: { name: true } },
        },
      });

      if (!order) {
        return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
      }

      const pdf = generateInvoicePDF({
        id,
        date: (order.completedAt || order.updatedAt).toISOString(),
        amount: order.amount,
        description: order.service?.title || order.title || "Commande Novakou",
        status: "payee",
        customerName: order.client?.name || "",
        customerEmail: order.client?.email || "",
        commissionRate: order.platformFee ? Math.round(order.platformFee / order.amount * 100) : 20,
      });

      return new NextResponse(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="facture_${id}.pdf"`,
        },
      });
    }

    if (id.startsWith("BST-")) {
      // Boost invoice
      const boostId = id.replace("BST-", "").toLowerCase();
      const boost = await prisma.boost.findFirst({
        where: { id: { startsWith: boostId }, userId },
        include: { service: { select: { title: true } } },
      });

      if (!boost) {
        return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
      }

      const pdf = generateInvoicePDF({
        id,
        date: (boost.paidAt || boost.createdAt).toISOString(),
        amount: boost.totalCost,
        description: `Boost ${boost.type} - ${boost.service?.title || "Service"}`,
        status: "payee",
        customerName: session.user.name || "",
        customerEmail: session.user.email || "",
      });

      return new NextResponse(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="facture_${id}.pdf"`,
        },
      });
    }

    if (id.startsWith("ABO-")) {
      // Subscription invoice
      const paymentId = id.replace("ABO-", "").toLowerCase();
      const payment = await prisma.payment.findFirst({
        where: { id: { startsWith: paymentId }, payerId: userId, type: "abonnement" },
      });

      if (!payment) {
        return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
      }

      const pdf = generateInvoicePDF({
        id,
        date: payment.createdAt.toISOString(),
        amount: payment.amount,
        description: payment.description || "Abonnement Novakou",
        status: "payee",
        customerName: session.user.name || "",
        customerEmail: session.user.email || "",
      });

      return new NextResponse(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="facture_${id}.pdf"`,
        },
      });
    }

    return NextResponse.json({ error: "Format de facture non reconnu" }, { status: 400 });
  } catch (error) {
    console.error("[API /billing/invoices/[id]/pdf GET]", error);
    return NextResponse.json({ error: "Erreur generation PDF" }, { status: 500 });
  }
}
