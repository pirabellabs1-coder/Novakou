import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    // Only actually send the email if Resend is configured
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: "Novakou <contact@novakou.com>",
          to: "support@novakou.com",
          replyTo: email,
          subject: `[Contact] ${subject ?? "general"} — ${name}`,
          html: `
            <div style="font-family: 'Manrope', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f7f9fb;">
              <div style="background: white; border-radius: 16px; padding: 24px; border: 1px solid #eef0f3;">
                <div style="background: linear-gradient(135deg, #006e2f, #22c55e); width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-bottom: 16px;">NK</div>
                <h2 style="margin: 0 0 8px; color: #191c1e; font-size: 18px;">Nouveau message de contact</h2>
                <p style="margin: 0 0 20px; color: #5c647a; font-size: 13px;">Sujet : <strong>${subject ?? "general"}</strong></p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #5c647a; font-size: 12px; width: 80px;">De :</td><td style="padding: 6px 0; color: #191c1e; font-size: 13px;"><strong>${name}</strong></td></tr>
                  <tr><td style="padding: 6px 0; color: #5c647a; font-size: 12px;">Email :</td><td style="padding: 6px 0; color: #191c1e; font-size: 13px;">${email}</td></tr>
                </table>
                <div style="margin-top: 20px; padding: 16px; background: #f7f9fb; border-radius: 12px;">
                  <p style="margin: 0; color: #191c1e; font-size: 13px; white-space: pre-wrap; line-height: 1.6;">${message.replace(/</g, "&lt;")}</p>
                </div>
              </div>
              <p style="margin: 16px 0 0; text-align: center; color: #9ca3af; font-size: 11px;">Novakou — La plateforme qui élève votre carrière freelance</p>
            </div>
          `,
        });
      } catch (e) {
        console.warn("[contact] email send failed", e);
      }
    }

    return NextResponse.json({ data: { sent: true } });
  } catch (err) {
    console.error("[contact]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
