import { NextResponse } from "next/server";
import { Resend } from "resend";
import { storeOTP } from "@/lib/auth/otp";

/**
 * POST /api/auth/buyer/send-otp
 * Body : { email: string }
 *
 * Génère un OTP 6 chiffres, le stocke (10 min), l'envoie par email.
 * Destiné à l'espace acheteur (/acheteur/connexion).
 *
 * Note sécurité : on ne révèle PAS si l'email existe ou non dans la DB —
 * on envoie toujours l'OTP (l'authorize() gérera la création du compte si
 * c'est un guest qui vient d'acheter).
 */

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

function emailHtml(code: string, _email: string): string {
  return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:720px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,110,47,0.12);">
    <div style="background:linear-gradient(135deg,#006e2f,#22c55e);padding:36px 40px;text-align:center;">
      <div style="display:inline-block;width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,0.15);padding:12px;margin:0 auto 10px;">
        <div style="width:28px;height:28px;border-radius:8px;background:#ffffff;text-align:center;line-height:28px;color:#006e2f;font-weight:900;font-size:18px;">N</div>
      </div>
      <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0;">Novakou</h1>
    </div>
    <div style="padding:40px;">
      <p style="color:#111827;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Bonjour,
      </p>
      <p style="color:#4b5563;font-size:14px;line-height:1.7;margin:0 0 24px;">
        Voici votre code à usage unique pour accéder à votre espace Novakou :
      </p>
      <div style="background:#f9fafb;border:2px solid #e5e7eb;border-radius:12px;padding:28px;text-align:center;margin:0 0 24px;">
        <p style="color:#111827;font-family:'SF Mono','Monaco','Courier New',monospace;font-size:38px;font-weight:900;letter-spacing:10px;margin:0;line-height:1;">
          ${code}
        </p>
      </div>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 16px;">
        Ce code est valable pendant 10 minutes.
      </p>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 20px;">
        Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer
        ce message. Votre compte reste sécurisé tant que ce code n'est pas utilisé.
      </p>
      <p style="color:#4b5563;font-size:14px;margin:20px 0 0;">
        Cordialement,<br>
        L'équipe Novakou
      </p>
    </div>
    <div style="padding:20px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="color:#9ca3af;font-size:11px;margin:0;">© 2026 Novakou — Édité par Pirabel Labs</p>
    </div>
  </div>
</body></html>`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    // Génère + stocke OTP (10 min)
    const code = await storeOTP(email);

    // Envoie le mail (attente forcée pour logger les erreurs)
    try {
      const result = await resend.emails.send({
        from: FROM,
        to: email,
        subject: `Votre code de connexion Novakou`,
        html: emailHtml(code, email),
      });
      if ((result as { error?: unknown })?.error) {
        console.error("[buyer/send-otp] Resend error:", (result as { error: unknown }).error);
        return NextResponse.json(
          { error: "Impossible d'envoyer l'email. Vérifiez votre adresse ou réessayez." },
          { status: 500 }
        );
      }
    } catch (err) {
      console.error("[buyer/send-otp] Send failed:", err);
      return NextResponse.json(
        { error: "Envoi email échoué. Réessayez dans un instant." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Code envoyé par email",
      devCode: process.env.DEV_MODE === "true" ? code : undefined,
    });
  } catch (err) {
    console.error("[buyer/send-otp]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
