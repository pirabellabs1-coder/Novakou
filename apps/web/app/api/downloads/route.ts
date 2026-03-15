import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getSignedUrl, type StorageBucket } from "@/lib/supabase-storage";
import { invoiceStore } from "@/lib/dev/data-store";

const VALID_TYPES = ["invoice", "certificate", "delivery", "resource", "contract"] as const;
type DownloadType = (typeof VALID_TYPES)[number];

const TYPE_BUCKET_MAP: Record<DownloadType, StorageBucket> = {
  invoice: "contracts", // Invoices stored alongside contracts
  certificate: "contracts",
  delivery: "order-deliveries",
  resource: "agency-resources",
  contract: "contracts",
};

// GET /api/downloads?type=invoice&id=xxx — Generate a secure download URL
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type") as DownloadType;
    const id = url.searchParams.get("id");

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Type invalide. Types acceptes: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // Verify access based on type
    if (type === "invoice") {
      const invoice = invoiceStore.getById(id);
      if (!invoice) {
        return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
      }
      if (invoice.buyerId !== session.user.id && invoice.sellerId !== session.user.id && session.user.role !== "admin") {
        return NextResponse.json({ error: "Acces non autorise" }, { status: 403 });
      }
      // Redirect to PDF generation endpoint
      return NextResponse.json({
        downloadUrl: `/api/invoices/${invoice.id}/pdf`,
        filename: `FreelanceHigh-${invoice.invoiceNumber}.pdf`,
        type: "redirect",
      });
    }

    if (type === "certificate") {
      // Certificate downloads go through the formations API
      return NextResponse.json({
        downloadUrl: `/api/formations/${id}/certificate`,
        filename: `FreelanceHigh-Certificat.pdf`,
        type: "redirect",
      });
    }

    // For storage-based files, generate a signed URL
    const bucket = TYPE_BUCKET_MAP[type];
    const path = `${session.user.id}/${id}`;

    try {
      const signedUrl = await getSignedUrl(bucket, path);
      if (signedUrl) {
        return NextResponse.json({
          downloadUrl: signedUrl,
          type: "signed_url",
          expiresIn: 3600,
        });
      }
    } catch {
      // Storage not available
    }

    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  } catch (error) {
    console.error("[API /downloads GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
