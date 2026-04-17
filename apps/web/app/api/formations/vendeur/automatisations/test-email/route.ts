import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";
import { sendEmail } from "@/lib/email";
import { sanitizeRichHtml } from "@/lib/sanitize-html";

/**
 * POST /api/vendeur/automatisations/test-email
 * Body: { subject, body, fromName?, replyTo? }
 * Sends the automation email template as a preview to the logged-in vendor.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    const activeShopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    }

    // Resolve recipient email
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { email: true, name: true },
    });
    const to = user?.email ?? session?.user?.email;
    if (!to) {
      return NextResponse.json({ error: "Aucune adresse email disponible" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const rawSubject = typeof body.subject === "string" ? body.subject : "";
    const rawBody = typeof body.body === "string" ? body.body : "";
    const fromName =
      typeof body.fromName === "string" && body.fromName.trim()
        ? body.fromName.trim()
        : "Novakou";

    if (!rawSubject.trim() || !rawBody.trim()) {
      return NextResponse.json({ error: "Sujet et corps requis" }, { status: 400 });
    }

    // Simple placeholder preview — fill variables with demo data
    const demo: Record<string, string> = {
      "customer.firstName": user?.name?.split(" ")[0] ?? "Sophie",
      "customer.lastName": user?.name?.split(" ").slice(1).join(" ") || "Martin",
      "customer.email": to,
      "customer.phone": "+33 6 12 34 56 78",
      "customer.country": "France",
      "product.id": "prod_demo_001",
      "product.title": "Formation Marketing Digital",
      "product.price": "49 EUR",
      "order.id": "ord_demo_001",
      "order.total": "49 EUR",
      "order.paidAt": new Date().toISOString(),
    };
    function replaceVars(text: string): string {
      return text.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, k) => demo[k] ?? `{{${k}}}`);
    }

    const subject = replaceVars(rawSubject);
    const html = sanitizeRichHtml(replaceVars(rawBody));

    const testBanner = `
      <div style="background:#006e2f;color:white;padding:10px 16px;border-radius:8px;margin-bottom:16px;font-family:system-ui,sans-serif;font-size:13px;">
        <strong>TEST</strong> — Aperçu de votre email d'automatisation (variables remplacées par des données démo).
      </div>
    `;

    await sendEmail({
      from: `${fromName} <no-reply@novakou.com>`,
      to,
      subject: `[TEST] ${subject}`,
      html: `${testBanner}${html}`,
    });

    return NextResponse.json({ success: true, to });
  } catch (err) {
    console.error("[test-email POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
