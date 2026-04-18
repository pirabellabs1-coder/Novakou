/**
 * POST /api/support/ticket
 *
 * Réception d'un ticket support. Écrit dans AuditLog (trace permanente)
 * ET envoie un email à support@novakou.com avec tous les détails.
 *
 * Accepté par users authentifiés ET invités — un email valide est
 * toujours requis pour la réponse.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout, getAppUrl } from "@/lib/email";

const CATEGORIES = new Set([
  "paiement",
  "technique",
  "compte",
  "vendeur",
  "mentor",
  "apprenant",
  "rgpd",
  "autre",
]);

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const category = String(body.category ?? "autre").toLowerCase();
  const subject = String(body.subject ?? "").trim();
  const message = String(body.message ?? "").trim();
  const url = body.url ? String(body.url).slice(0, 500) : null;

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Nom requis (2 caractères min)" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (!CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
  }
  if (!subject || subject.length < 4) {
    return NextResponse.json({ error: "Objet requis (4 caractères min)" }, { status: 400 });
  }
  if (!message || message.length < 15 || message.length > 5000) {
    return NextResponse.json(
      { error: "Message requis (15 à 5000 caractères)" },
      { status: 400 },
    );
  }

  // User context (if logged in)
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  // Simple ticket reference for correspondence
  const ticketRef = `NK-${Date.now().toString(36).toUpperCase()}`;

  // 1. Audit log (durable trace)
  try {
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: "support_ticket_created",
        targetType: "support_ticket",
        targetId: ticketRef,
        details: {
          name,
          email,
          category,
          subject,
          message,
          url,
          userAgent: req.headers.get("user-agent") ?? null,
        } as object,
      },
    });
  } catch (err) {
    console.error("[support/ticket] audit log failed:", err);
  }

  // 2. Email to support team (fire and forget)
  const html = emailLayout(`
    <h2 style="color:#111827;font-size:20px;margin:0 0 12px;">Nouveau ticket support</h2>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:0 0 16px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr><td style="padding:6px 0;color:#6b7280;width:120px;">Référence</td><td style="color:#111827;font-weight:600;">${ticketRef}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;border-top:1px solid #e5e7eb;">Catégorie</td><td style="color:#111827;font-weight:600;border-top:1px solid #e5e7eb;">${escapeHtml(category)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;border-top:1px solid #e5e7eb;">Nom</td><td style="color:#111827;font-weight:600;border-top:1px solid #e5e7eb;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;border-top:1px solid #e5e7eb;">Email</td><td style="color:#111827;font-weight:600;border-top:1px solid #e5e7eb;">${escapeHtml(email)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;border-top:1px solid #e5e7eb;">User ID</td><td style="color:#111827;font-weight:600;border-top:1px solid #e5e7eb;font-family:monospace;">${userId ?? "invité"}</td></tr>
        ${url ? `<tr><td style="padding:6px 0;color:#6b7280;border-top:1px solid #e5e7eb;">URL</td><td style="color:#111827;font-weight:600;border-top:1px solid #e5e7eb;">${escapeHtml(url)}</td></tr>` : ""}
      </table>
    </div>
    <h3 style="color:#111827;font-size:14px;margin:0 0 6px;">${escapeHtml(subject)}</h3>
    <p style="color:#374151;font-size:13px;line-height:1.7;white-space:pre-wrap;margin:0 0 16px;">${escapeHtml(message)}</p>
    <p style="color:#9ca3af;font-size:11px;margin:16px 0 0;">Répondez directement à cet email — l'utilisateur recevra votre réponse à ${escapeHtml(email)}.</p>
  `);

  sendEmail({
    from: `Novakou Support <contact@novakou.com>`,
    to: "support@novakou.com",
    subject: `[${ticketRef}] ${category.toUpperCase()} — ${subject}`,
    html,
  }).catch((err) => console.error("[support/ticket] email failed:", err));

  // 3. Confirmation email to the user
  const ackHtml = emailLayout(`
    <h2 style="color:#111827;font-size:20px;margin:0 0 12px;">Nous avons bien reçu votre message 👍</h2>
    <p style="color:#4b5563;font-size:14px;line-height:1.7;margin:0 0 12px;">
      Bonjour ${escapeHtml(name.split(" ")[0])}, merci de nous avoir contactés. Notre équipe va
      examiner votre demande et vous répondre rapidement (généralement sous 24h ouvrées).
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin:16px 0;">
      <p style="margin:0;color:#6b7280;font-size:12px;">Votre référence de ticket :</p>
      <p style="margin:4px 0 0;color:#006e2f;font-size:18px;font-weight:800;font-family:monospace;">${ticketRef}</p>
    </div>
    <p style="color:#4b5563;font-size:13px;line-height:1.6;">
      En attendant, vous pouvez consulter notre <a href="${getAppUrl()}/aide" style="color:#006e2f;">centre d'aide</a> —
      la plupart des questions y trouvent une réponse immédiate.
    </p>
  `);
  sendEmail({
    to: email,
    subject: `[${ticketRef}] Votre demande est bien reçue — Novakou`,
    html: ackHtml,
  }).catch(() => null);

  return NextResponse.json({ success: true, reference: ticketRef });
}
