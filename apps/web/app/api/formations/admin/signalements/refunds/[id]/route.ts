import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";

function refundDecisionHtml(firstName: string, formationTitle: string, amount: number, approved: boolean, note: string | null): string {
  const amountStr = new Intl.NumberFormat("fr-FR").format(Math.round(amount)) + " FCFA";
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:720px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,110,47,0.12);">
    <div style="background:linear-gradient(135deg,#006e2f,#22c55e);padding:32px;text-align:center;">
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0;">Novakou</h1>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 14px;">Bonjour ${firstName},</h2>
      <p style="color:#4b5563;line-height:1.7;font-size:15px;margin:0 0 20px;">
        Votre demande de remboursement concernant la formation <strong>« ${formationTitle} »</strong>
        a été ${approved ? "<span style='color:#006e2f;'>approuvée</span>" : "<span style='color:#93000a;'>refusée</span>"}.
      </p>
      ${approved ? `
      <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:20px;margin:0 0 20px;">
        <p style="color:#006e2f;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;margin:0 0 6px;">Montant remboursé</p>
        <p style="color:#006e2f;font-size:26px;font-weight:900;margin:0;">${amountStr}</p>
        <p style="color:#047857;font-size:12px;margin:8px 0 0;">Le remboursement sera traité sous 3 à 5 jours ouvrés via le moyen de paiement initial.</p>
      </div>` : ""}
      ${note ? `
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:0 0 20px;">
        <p style="color:#374151;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 6px;">Message de l'équipe</p>
        <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0;">${note}</p>
      </div>` : ""}
      <p style="color:#4b5563;line-height:1.7;font-size:14px;margin:0 0 20px;">
        Pour toute question, répondez simplement à ce mail.
      </p>
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb;">
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

/**
 * PATCH /api/formations/admin/signalements/refunds/[id]
 *
 * Body: { action: "approve" | "reject", note?: string }
 *
 * - approve : marque le RefundRequest en APPROVED, marque l'enrollment refundedAt,
 *             crée une Notification + envoie un email à l'apprenant.
 * - reject  : marque le RefundRequest en REJECTED avec note, envoie email.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (session?.user?.role && session.user.role !== "ADMIN" && !IS_DEV) {
      return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action: string = body.action;
    const note: string = typeof body.note === "string" ? body.note.trim() : "";

    const refund = await prisma.refundRequest.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, name: true } },
        enrollment: {
          select: {
            id: true,
            paidAmount: true,
            refundedAt: true,
            formation: { select: { title: true } },
          },
        },
      },
    });
    if (!refund) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }
    if (refund.status !== "PENDING") {
      return NextResponse.json({ error: "Déjà traitée" }, { status: 400 });
    }

    const adminId = session?.user?.id ?? null;

    if (action === "approve") {
      await prisma.$transaction([
        prisma.refundRequest.update({
          where: { id },
          data: {
            status: "APPROVED",
            adminNote: note || null,
            resolvedAt: new Date(),
            resolvedBy: adminId,
          },
        }),
        prisma.enrollment.update({
          where: { id: refund.enrollmentId },
          data: {
            refundedAt: new Date(),
          },
        }),
        prisma.notification.create({
          data: {
            userId: refund.userId,
            type: "PAYMENT",
            title: "Remboursement approuvé",
            message: `Votre demande de remboursement pour « ${refund.enrollment.formation.title} » a été acceptée.`,
            link: "/apprenant/mes-formations",
          },
        }),
      ]);

      // Email best-effort
      if (refund.user?.email) {
        const firstName = (refund.user.name || refund.user.email.split("@")[0]).split(" ")[0];
        resend.emails.send({
          from: FROM,
          to: refund.user.email,
          subject: `Remboursement approuvé — ${refund.enrollment.formation.title}`,
          html: refundDecisionHtml(firstName, refund.enrollment.formation.title, refund.amount, true, note || null),
        }).catch((e) => console.error("[refund approve email]", e?.message ?? e));
      }

      return NextResponse.json({ data: { approved: true } });
    }

    if (action === "reject") {
      await prisma.$transaction([
        prisma.refundRequest.update({
          where: { id },
          data: {
            status: "REJECTED",
            adminNote: note || null,
            resolvedAt: new Date(),
            resolvedBy: adminId,
          },
        }),
        prisma.notification.create({
          data: {
            userId: refund.userId,
            type: "PAYMENT",
            title: "Remboursement refusé",
            message: `Votre demande concernant « ${refund.enrollment.formation.title} » a été étudiée et refusée.`,
            link: "/apprenant/mes-formations",
          },
        }),
      ]);

      if (refund.user?.email) {
        const firstName = (refund.user.name || refund.user.email.split("@")[0]).split(" ")[0];
        resend.emails.send({
          from: FROM,
          to: refund.user.email,
          subject: `Décision — Demande de remboursement`,
          html: refundDecisionHtml(firstName, refund.enrollment.formation.title, refund.amount, false, note || null),
        }).catch((e) => console.error("[refund reject email]", e?.message ?? e));
      }

      return NextResponse.json({ data: { rejected: true } });
    }

    return NextResponse.json({ error: "Action invalide (approve | reject)" }, { status: 400 });
  } catch (err) {
    console.error("[admin/signalements/refunds PATCH]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
