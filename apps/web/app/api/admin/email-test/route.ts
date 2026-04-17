// POST /api/admin/email-test — Test email delivery (admin only)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { z } from "zod";

const schema = z.object({
  to: z.string().email("Email invalide"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await req.json();
    const { to } = schema.parse(body);

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Domain contact@novakou.com is verified
    const from = process.env.EMAIL_FROM || "Novakou <contact@novakou.com>";
    const domainVerified = from.includes("novakou.com");

    const result = await resend.emails.send({
      from,
      to,
      subject: "Test Email — Novakou",
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:40px;">
          <h1 style="color:#6C2BD9;">Novakou — Test Email</h1>
          <p>Cet email confirme que l'infrastructure d'envoi fonctionne correctement.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
          <p style="color:#6b7280;font-size:12px;">
            Envoyé depuis: ${from}<br>
            Domaine vérifié: ${domainVerified ? "Oui" : "Non (sandbox)"}<br>
            Date: ${new Date().toISOString()}
          </p>
        </div>
      `,
    });

    if (result.error) {
      return NextResponse.json({
        success: false,
        error: result.error,
        from,
        domainVerified,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      emailId: result.data?.id,
      from,
      domainVerified,
      sentTo: to,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    console.error("[POST /api/admin/email-test]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
