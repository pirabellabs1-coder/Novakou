import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { sendEmail, emailLayout } from "@/lib/email";

/**
 * POST /api/formations/admin/ai-vendor-message
 * Body: { vendorId: string, subject: string, message: string }
 *
 * Envoie un email au vendeur avec un message redige par Claude (Coach
 * vendeur). L'admin peut avoir edite le message avant envoi.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toString().toLowerCase();
    if (role !== "admin" && !IS_DEV) {
      return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });
    }

    const body = await request.json();
    const { vendorId, subject, message } = body as {
      vendorId?: string;
      subject?: string;
      message?: string;
    };

    if (!vendorId || !message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json({ error: "vendorId + message (min 10 chars) requis" }, { status: 400 });
    }

    const vendor = await prisma.instructeurProfile.findUnique({
      where: { id: vendorId },
      select: { user: { select: { email: true, name: true } } },
    });
    if (!vendor?.user?.email) {
      return NextResponse.json({ error: "Vendeur introuvable ou sans email" }, { status: 404 });
    }

    // Le message de Claude peut contenir du Markdown leger (gras, listes).
    // On le convertit en HTML simple pour un rendu propre.
    const htmlBody = escapeHtml(message.trim())
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\n\n/g, "</p><p style=\"margin:0 0 12px;\">")
      .replace(/\n/g, "<br/>");

    const html = emailLayout(`
      <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">${htmlBody}</p>
    `);

    await sendEmail({
      to: vendor.user.email,
      subject: subject?.trim() || "Un mot de l'equipe Novakou",
      html,
    });

    return NextResponse.json({
      ok: true,
      sentTo: vendor.user.email,
    });
  } catch (err) {
    console.error("[admin/ai-vendor-message POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c] ?? c));
}
