/**
 * POST /api/formations/vendeur/checkout-attempts/[id]/send-email
 *
 * Le vendeur clique "Envoyer un email" sur un panier abandonné. On envoie
 * un mail de relance professionnel via Resend (pas de mailto: qui ne
 * marche pas sans client mail local). Marque l'attempt comme contacté.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

function escapeHtml(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function recoveryEmailHtml(opts: {
  visitorName: string | null;
  itemTitle: string;
  itemKind: "formation" | "produit";
  amount: number;
  recoveryUrl: string;
  vendorName: string;
}): string {
  const greeting = opts.visitorName
    ? `Bonjour ${escapeHtml(opts.visitorName)},`
    : `Bonjour,`;
  const fmtAmount = new Intl.NumberFormat("fr-FR").format(opts.amount) + " FCFA";
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,110,47,0.10);">
    <div style="background:linear-gradient(135deg,#006e2f,#22c55e);padding:32px 36px;text-align:center;">
      <div style="display:inline-block;width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.18);padding:10px;margin:0 auto 8px;">
        <div style="width:28px;height:28px;border-radius:8px;background:#fff;text-align:center;line-height:28px;color:#006e2f;font-weight:900;font-size:16px;">N</div>
      </div>
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">Novakou</h1>
    </div>
    <div style="padding:36px;">
      <p style="color:#111827;font-size:16px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Vous avez commencé une commande pour <strong style="color:#006e2f;">${escapeHtml(opts.itemTitle)}</strong> mais vous ne l'avez pas finalisée.
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Aucun paiement n'a été prélevé. Si vous souhaitez toujours obtenir cet${opts.itemKind === "formation" ? "te formation" : " article"}, voici votre lien de paiement sécurisé :
      </p>
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${opts.recoveryUrl}" style="display:inline-block;background:linear-gradient(135deg,#006e2f,#22c55e);color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-size:15px;font-weight:700;">
          Finaliser ma commande — ${fmtAmount}
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 8px;">
        Si vous avez rencontré un problème lors du paiement, répondez à cet email — ${escapeHtml(opts.vendorName)} se fera un plaisir de vous aider.
      </p>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
        Bonne journée,<br/>L'équipe ${escapeHtml(opts.vendorName)}
      </p>
    </div>
    <div style="padding:18px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#9ca3af;font-size:11px;margin:0;">© 2026 Novakou — Édité par Pirabel Labs</p>
    </div>
  </div>
</body></html>`;
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const ctx = await resolveVendorContext(session);
    if (!ctx) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    // Verify the attempt belongs to this vendor
    const attempt = await prisma.checkoutAttempt.findUnique({
      where: { id },
      select: {
        id: true,
        instructeurId: true,
        visitorEmail: true,
        visitorName: true,
        amount: true,
        formation: { select: { slug: true, title: true, instructeur: { select: { user: { select: { name: true } } } } } },
        product: { select: { slug: true, title: true, instructeur: { select: { user: { select: { name: true } } } } } },
      },
    });

    if (!attempt || attempt.instructeurId !== ctx.instructeurId) {
      return NextResponse.json({ error: "Tentative introuvable" }, { status: 404 });
    }

    if (!attempt.visitorEmail) {
      return NextResponse.json({ error: "Pas d'email visiteur enregistré" }, { status: 400 });
    }

    // Build recovery URL : direct checkout with the original product
    const recoverySlug = attempt.formation?.slug || attempt.product?.slug;
    const recoveryKind = attempt.formation ? "formation" : "produit";
    const recoveryUrl = recoverySlug
      ? `${APP_URL}/${recoveryKind}/${recoverySlug}`
      : `${APP_URL}/explorer`;

    const itemTitle = attempt.formation?.title || attempt.product?.title || "Votre achat";
    const vendorName =
      attempt.formation?.instructeur?.user?.name ||
      attempt.product?.instructeur?.user?.name ||
      "Votre vendeur";

    if (!process.env.RESEND_API_KEY) {
      // Dev mode : log + mark contacted, don't actually send
      console.log(`[checkout-attempt send-email DEV] would send to ${attempt.visitorEmail} for ${itemTitle}`);
    } else {
      const result = await resend.emails.send({
        from: FROM,
        to: attempt.visitorEmail,
        subject: `Finalisez votre commande — ${itemTitle}`,
        html: recoveryEmailHtml({
          visitorName: attempt.visitorName,
          itemTitle,
          itemKind: recoveryKind as "formation" | "produit",
          amount: attempt.amount,
          recoveryUrl,
          vendorName,
        }),
      });
      if ((result as { error?: unknown })?.error) {
        console.error("[checkout-attempt send-email] Resend error:", (result as { error: unknown }).error);
        return NextResponse.json(
          { error: "Email non envoyé (erreur fournisseur)" },
          { status: 502 },
        );
      }
    }

    // Mark contacted
    await prisma.checkoutAttempt.update({
      where: { id },
      data: { vendorContactedAt: new Date(), reminder1SentAt: new Date() },
    }).catch(() => null);

    return NextResponse.json({ ok: true, sentTo: attempt.visitorEmail });
  } catch (err) {
    console.error("[checkout-attempt send-email POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
