import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { generateInvoicePDF } from "@/lib/pdf/invoice-template";
import { invoiceStore } from "@/lib/dev/data-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;

    // Find invoice in store
    const invoice = invoiceStore.getById(id);

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      );
    }

    // Verifier que l'utilisateur est le buyer ou le seller
    if (invoice.buyerId !== session.user.id && invoice.sellerId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Acces non autorise" }, { status: 403 });
    }

    const pdfBytes = generateInvoicePDF({
      id: invoice.invoiceNumber,
      date: invoice.createdAt.slice(0, 10),
      amount: invoice.amount,
      description: invoice.description,
      status: invoice.status as "payee" | "en_attente",
      customerName: invoice.buyerName || session.user.name || undefined,
      customerEmail: invoice.buyerEmail || session.user.email || undefined,
    });

    return new NextResponse(new Uint8Array(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="FreelanceHigh-${invoice.invoiceNumber}.pdf"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("[API /invoices/[id]/pdf GET]", error);
    return NextResponse.json(
      { error: "Erreur lors de la generation de la facture" },
      { status: 500 }
    );
  }
}
