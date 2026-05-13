import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Resend } from "resend";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { emailLayout } from "@/lib/email";

const FROM = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const u = session?.user as { id?: string; role?: string } | undefined;
  if (u?.role !== "ADMIN" && u?.role !== "admin") return null;
  return u;
}

/** GET /api/formations/admin/tickets/[id] — full ticket */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await requireAdmin();
  if (!u) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const { id } = await ctx.params;

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

  return NextResponse.json({ data: ticket });
}

/** PATCH /api/formations/admin/tickets/[id] — reply / close / update notes */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await requireAdmin();
  if (!u) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const { id } = await ctx.params;

  const body = (await req.json().catch(() => ({}))) as {
    adminReply?: string;
    adminNotes?: string;
    status?: "NEW" | "AUTO_REPLIED" | "HUMAN_REPLIED" | "CLOSED";
    sendEmail?: boolean;
  };

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.adminReply !== undefined) {
    data.adminReply = body.adminReply;
    data.adminReplyAt = new Date();
    data.adminUserId = u.id ?? null;
    data.status = "HUMAN_REPLIED";
  }
  if (body.adminNotes !== undefined) data.adminNotes = body.adminNotes;
  if (body.status !== undefined) data.status = body.status;

  const updated = await prisma.supportTicket.update({ where: { id }, data });

  // Optionally send the admin reply by email
  if (body.sendEmail && body.adminReply && process.env.RESEND_API_KEY) {
    const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
    const html = emailLayout(`
      <h2 style="color:#111827;font-size:22px;margin:0 0 12px;">Bonjour ${escapeHtml(ticket.name)},</h2>
      <p style="color:#6b7280;font-size:13px;margin:0 0 18px;">Votre référence : <span style="font-family:monospace;font-weight:700;color:#006e2f;">${ticket.reference}</span></p>
      <div style="color:#111827;font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(body.adminReply)}</div>
      <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">— L'équipe Novakou</p>
    `);
    await resend.emails.send({
      from: FROM,
      to: ticket.email,
      subject: `Re: ${ticket.subject ?? "Votre demande"} — ${ticket.reference}`,
      replyTo: "support@novakou.com",
      html,
    }).catch((e) => console.warn("[admin/tickets] email", e));
  }

  return NextResponse.json({ data: updated });
}

/** DELETE /api/formations/admin/tickets/[id] — purge a ticket */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await requireAdmin();
  if (!u) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const { id } = await ctx.params;

  await prisma.supportTicket.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ data: { ok: true } });
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
