import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";

/**
 * PATCH /api/formations/vendeur/inquiries/[id]
 *   Body: { action: "reply" | "close" | "reopen", reply?: string }
 *
 * - reply  : envoie la reponse par email au visiteur + status=replied
 * - close  : marque close sans reponse
 * - reopen : repasse a pending
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ error: "Profil introuvable" }, { status: 401 });

    const { id } = await params;
    const inquiry = await prisma.productInquiry.findFirst({
      where: { id, instructeurId: ctx.instructeurId },
      include: {
        formation: { select: { title: true } },
        product: { select: { title: true } },
      },
    });
    if (!inquiry) return NextResponse.json({ error: "Inquiry introuvable" }, { status: 404 });

    const body = await req.json();
    const action: string = body.action;

    if (action === "reply") {
      const reply: string = body.reply ?? "";
      if (!reply || reply.trim().length < 10) {
        return NextResponse.json({ error: "Réponse trop courte (10 chars min)" }, { status: 400 });
      }

      const productTitle = inquiry.formation?.title ?? inquiry.product?.title ?? "votre produit";
      const vendorUser = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { name: true, email: true },
      });
      const vendorName = vendorUser?.name || "Votre instructeur";

      // Email au visiteur
      resend.emails.send({
        from: FROM,
        to: inquiry.visitorEmail,
        subject: `Réponse à votre question sur « ${productTitle} »`,
        replyTo: vendorUser?.email,
        html: replyEmailHtml({
          visitorFirstName: inquiry.visitorName.split(" ")[0],
          vendorName,
          productTitle,
          originalSubject: inquiry.subject,
          originalMessage: inquiry.message,
          reply: reply.trim(),
        }),
      }).catch((e) => console.error("[inquiry reply email]", e?.message ?? e));

      await prisma.productInquiry.update({
        where: { id },
        data: {
          status: "replied",
          repliedAt: new Date(),
          reply: reply.trim(),
        },
      });

      return NextResponse.json({ data: { replied: true } });
    }

    if (action === "close") {
      await prisma.productInquiry.update({ where: { id }, data: { status: "closed" } });
      return NextResponse.json({ data: { closed: true } });
    }

    if (action === "reopen") {
      await prisma.productInquiry.update({ where: { id }, data: { status: "pending" } });
      return NextResponse.json({ data: { reopened: true } });
    }

    return NextResponse.json({ error: "Action invalide (reply|close|reopen)" }, { status: 400 });
  } catch (err) {
    console.error("[vendeur/inquiries PATCH]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

function replyEmailHtml(params: {
  visitorFirstName: string;
  vendorName: string;
  productTitle: string;
  originalSubject: string;
  originalMessage: string;
  reply: string;
}): string {
  const { visitorFirstName, vendorName, productTitle, originalSubject, originalMessage, reply } = params;
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:720px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,110,47,0.12);">
    <div style="background:linear-gradient(135deg,#006e2f,#22c55e);padding:32px;text-align:center;">
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">Novakou</h1>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#111827;font-size:20px;font-weight:800;margin:0 0 14px;">Bonjour ${visitorFirstName},</h2>
      <p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0 0 20px;">
        <strong>${vendorName}</strong> répond à votre question sur <strong>« ${productTitle} »</strong>.
      </p>

      <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:20px;margin:0 0 20px;">
        <p style="color:#006e2f;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 8px;">Réponse</p>
        <p style="color:#111827;font-size:15px;line-height:1.7;margin:0;white-space:pre-wrap;">${reply}</p>
      </div>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:0 0 20px;">
        <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px;">Votre question initiale</p>
        <p style="color:#374151;font-size:13px;font-weight:700;margin:0 0 8px;">${originalSubject}</p>
        <p style="color:#6b7280;font-size:12px;line-height:1.5;margin:0;font-style:italic;white-space:pre-wrap;">${originalMessage}</p>
      </div>

      <p style="color:#4b5563;line-height:1.6;font-size:14px;margin:0 0 20px;">
        <strong>Répondez directement à ce mail</strong> pour poursuivre la discussion.
      </p>

      <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;">
        <p style="color:#4b5563;font-size:14px;margin:0 0 4px;">Cordialement,</p>
        <p style="color:#006e2f;font-size:15px;font-weight:800;margin:0;">${vendorName}</p>
      </div>
    </div>
    <div style="padding:20px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#9ca3af;font-size:11px;margin:0;">© 2026 Novakou — Édité par Pirabel Labs</p>
    </div>
  </div>
</body></html>`;
}
