import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { generateInvoicePDF } from "@/lib/pdf/invoice-template";
import { INVOICES } from "@/lib/demo-data";

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

    // Find invoice in demo data
    const invoice = INVOICES.find((inv) => inv.id === id);

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      );
    }

    const pdfBytes = generateInvoicePDF({
      id: invoice.id,
      date: invoice.date,
      amount: invoice.amount,
      description: invoice.description,
      status: invoice.status as "payee" | "en_attente",
      customerName: session.user.name || undefined,
      customerEmail: session.user.email || undefined,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="FreelanceHigh-${id}.pdf"`,
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
