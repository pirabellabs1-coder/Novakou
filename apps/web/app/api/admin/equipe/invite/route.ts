// POST /api/admin/equipe/invite — Invite admin team member by email

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { z } from "zod";
import { requireAdminPermission } from "@/lib/admin-permissions";

const inviteSchema = z.object({
  email: z.string().email("Email invalide"),
  name: z.string().min(2),
  adminRole: z.string().default("moderateur"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    const inviteCheck = requireAdminPermission(session, "team.manage");
    if (!inviteCheck.allowed) return inviteCheck.errorResponse;

    const body = await req.json();
    const { email, name, adminRole } = inviteSchema.parse(body);

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    // Domain support@novakou.com is verified
    const from = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";

    const result = await resend.emails.send({
      from,
      to: email,
      subject: `Vous êtes invité à rejoindre l'équipe admin de Novakou`,
      html: `
        <div style="max-width:720px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="background:linear-gradient(135deg,#6C2BD9,#8B5CF6);padding:32px 40px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0;">Novakou</h1>
          </div>
          <div style="padding:40px;background:#fff;">
            <h2 style="color:#111827;font-size:20px;margin:0 0 16px;">Bienvenue dans l'équipe, ${name} !</h2>
            <p style="color:#4b5563;line-height:1.6;">
              <strong>${session.user.name}</strong> vous invite à rejoindre l'équipe d'administration
              de Novakou en tant que <strong>${adminRole}</strong>.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${APP_URL}/inscription?invite=admin&role=${adminRole}&email=${encodeURIComponent(email)}"
                 style="display:inline-block;background:#6C2BD9;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
                Accepter et créer mon compte
              </a>
            </div>
            <p style="color:#9ca3af;font-size:13px;">
              Si vous n'attendiez pas cette invitation, ignorez cet email.
            </p>
          </div>
          <div style="padding:20px 40px;background:#f9fafb;text-align:center;border-radius:0 0 12px 12px;">
            <p style="color:#d1d5db;font-size:10px;">© 2026 Novakou</p>
          </div>
        </div>
      `,
    });

    if (result.error) {
      console.error("[INVITE ADMIN]", result.error);
      return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Invitation envoyée à ${email}`,
      emailId: result.data?.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    console.error("[POST /api/admin/equipe/invite]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
