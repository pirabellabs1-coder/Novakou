import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";

/**
 * POST /api/formations/public/inquiries
 *
 * Body: {
 *   formationId? | productId? (au moins un),
 *   visitorName, visitorEmail, visitorPhone?,
 *   subject, message
 * }
 *
 * Un visiteur (connecte ou guest) pose une question sur une page produit.
 * Crée une ProductInquiry + envoie un email au vendeur (reply-to = email du
 * visiteur, donc le vendeur répond directement).
 */
function inquiryEmailHtml(params: {
  vendorFirstName: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  productTitle: string;
  subject: string;
  message: string;
  dashboardUrl: string;
}): string {
  const { vendorFirstName, visitorName, visitorEmail, visitorPhone, productTitle, subject, message, dashboardUrl } = params;
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:720px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,110,47,0.12);">
    <div style="background:linear-gradient(135deg,#006e2f,#22c55e);padding:32px;text-align:center;">
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">Novakou</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:11px;margin:6px 0 0;letter-spacing:2px;font-weight:600;">NOUVELLE QUESTION</p>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#111827;font-size:20px;font-weight:800;margin:0 0 14px;">Bonjour ${vendorFirstName},</h2>
      <p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0 0 20px;">
        <strong>${visitorName}</strong> vient de vous poser une question sur votre produit
        <strong style="color:#111827;">« ${productTitle} »</strong>.
      </p>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin:0 0 20px;">
        <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 6px;">Sujet</p>
        <p style="color:#111827;font-size:16px;font-weight:700;margin:0 0 16px;">${subject}</p>
        <p style="color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 6px;">Message</p>
        <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap;">${message}</p>
      </div>

      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin:0 0 20px;">
        <p style="color:#1e40af;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">Coordonnées visiteur</p>
        <p style="color:#111827;font-size:14px;margin:0 0 4px;"><strong>${visitorName}</strong></p>
        <p style="color:#1e3a8a;font-size:13px;margin:0 0 2px;">📧 ${visitorEmail}</p>
        ${visitorPhone ? `<p style="color:#1e3a8a;font-size:13px;margin:0;">📱 ${visitorPhone}</p>` : ""}
      </div>

      <p style="color:#4b5563;line-height:1.6;font-size:14px;margin:0 0 20px;">
        <strong>Répondez directement à ce mail</strong> — votre réponse arrive chez ${visitorName.split(" ")[0]}.
      </p>

      <div style="text-align:center;margin:24px 0;">
        <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#006e2f,#22c55e);color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:800;font-size:14px;">
          Ouvrir dans mon dashboard
        </a>
      </div>

      <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;">
        <p style="color:#4b5563;font-size:14px;margin:0 0 4px;">Cordialement,</p>
        <p style="color:#006e2f;font-size:15px;font-weight:800;margin:0;">L'équipe Novakou</p>
      </div>
    </div>
    <div style="padding:20px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#9ca3af;font-size:11px;margin:0;">© 2026 Novakou — Édité par Pirabel Labs</p>
    </div>
  </div>
</body></html>`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const {
      formationId, productId,
      visitorName, visitorEmail, visitorPhone,
      subject, message,
    } = body;

    if (!formationId && !productId) {
      return NextResponse.json({ error: "formationId ou productId requis" }, { status: 400 });
    }
    if (!visitorName || !visitorEmail || !subject || !message) {
      return NextResponse.json({ error: "visitorName, visitorEmail, subject et message requis" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmail)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    if (message.trim().length < 10) {
      return NextResponse.json({ error: "Message trop court (10 chars min)" }, { status: 400 });
    }

    // Trouve le vendeur
    let instructeurId: string | null = null;
    let productTitle = "";
    let shopId: string | null = null;
    if (formationId) {
      const f = await prisma.formation.findUnique({
        where: { id: formationId },
        select: {
          instructeurId: true, title: true, shopId: true,
          instructeur: { select: { user: { select: { email: true, name: true } } } },
        },
      });
      if (!f) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
      instructeurId = f.instructeurId;
      productTitle = f.title;
      shopId = f.shopId ?? null;

      // Send email to vendor
      if (f.instructeur?.user?.email) {
        const firstName = (f.instructeur.user.name || f.instructeur.user.email.split("@")[0]).split(" ")[0];
        resend.emails.send({
          from: FROM,
          to: f.instructeur.user.email,
          subject: `Question sur « ${f.title} » - ${visitorName}`,
          replyTo: visitorEmail,
          html: inquiryEmailHtml({
            vendorFirstName: firstName,
            visitorName, visitorEmail, visitorPhone,
            productTitle: f.title, subject, message,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com"}/vendeur/inquiries`,
          }),
        }).catch((e) => console.error("[inquiry email]", e?.message ?? e));
      }
    } else if (productId) {
      const p = await prisma.digitalProduct.findUnique({
        where: { id: productId },
        select: {
          instructeurId: true, title: true, shopId: true,
          instructeur: { select: { user: { select: { email: true, name: true } } } },
        },
      });
      if (!p) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
      instructeurId = p.instructeurId;
      productTitle = p.title;
      shopId = p.shopId ?? null;

      if (p.instructeur?.user?.email) {
        const firstName = (p.instructeur.user.name || p.instructeur.user.email.split("@")[0]).split(" ")[0];
        resend.emails.send({
          from: FROM,
          to: p.instructeur.user.email,
          subject: `Question sur « ${p.title} » - ${visitorName}`,
          replyTo: visitorEmail,
          html: inquiryEmailHtml({
            vendorFirstName: firstName,
            visitorName, visitorEmail, visitorPhone,
            productTitle: p.title, subject, message,
            dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com"}/vendeur/inquiries`,
          }),
        }).catch((e) => console.error("[inquiry email]", e?.message ?? e));
      }
    }

    if (!instructeurId) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 404 });

    const inquiry = await prisma.productInquiry.create({
      data: {
        instructeurId,
        shopId,
        formationId: formationId ?? null,
        productId: productId ?? null,
        visitorUserId: session?.user?.id ?? null,
        visitorName: String(visitorName).trim().slice(0, 120),
        visitorEmail: String(visitorEmail).trim().toLowerCase(),
        visitorPhone: visitorPhone ? String(visitorPhone).trim().slice(0, 40) : null,
        subject: String(subject).trim().slice(0, 200),
        message: String(message).trim().slice(0, 5000),
        status: "pending",
      },
    });

    // Notif in-app vendeur
    const vendor = await prisma.instructeurProfile.findUnique({
      where: { id: instructeurId },
      select: { userId: true },
    });
    if (vendor?.userId) {
      prisma.notification.create({
        data: {
          userId: vendor.userId,
          type: "MESSAGE",
          title: "Nouvelle question acheteur",
          message: `${visitorName} a posé une question sur « ${productTitle } »`,
          link: "/vendeur/inquiries",
        },
      }).catch(() => null);
    }

    return NextResponse.json({ data: { id: inquiry.id } }, { status: 201 });
  } catch (err) {
    console.error("[public/inquiries POST]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
