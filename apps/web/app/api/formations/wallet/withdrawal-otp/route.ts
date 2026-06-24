import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { storeOTP } from "@/lib/auth/otp";
import { resend } from "@/lib/email/resend-client";
import { rateLimit } from "@/lib/api-rate-limit";
import { IS_DEV } from "@/lib/env";

const FROM = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";

/**
 * POST /api/formations/wallet/withdrawal-otp
 *
 * Envoie un code de confirmation à 6 chiffres PAR E-MAIL avant tout retrait.
 * Défense contre les retraits frauduleux depuis un compte compromis : même si
 * un attaquant a la session, il ne peut pas vider le portefeuille sans accès
 * à la boîte mail. Code valable 10 min, max 5 tentatives (cf. lib/auth/otp).
 */
function emailHtml(code: string): string {
  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#f5faf7;font-family:Arial,Helvetica,sans-serif;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4eae6">
    <div style="background:linear-gradient(135deg,#006e2f,#22c55e);padding:20px 24px"><span style="color:#fff;font-size:18px;font-weight:800">Novakou</span></div>
    <div style="padding:28px 24px">
      <h1 style="margin:0 0 8px;font-size:18px;color:#13241b">Confirmation de retrait</h1>
      <p style="margin:0 0 18px;font-size:14px;color:#5c647a;line-height:1.6">Voici votre code pour confirmer votre demande de retrait. Il expire dans 10 minutes.</p>
      <div style="text-align:center;background:#f0faf3;border:1px dashed #22c55e;border-radius:12px;padding:18px;margin-bottom:18px">
        <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#006e2f">${code}</span>
      </div>
      <p style="margin:0;font-size:12px;color:#8aa092;line-height:1.6">Si vous n'avez pas demandé de retrait, ignorez cet e-mail et changez votre mot de passe : quelqu'un connaît peut-être vos identifiants.</p>
    </div>
  </div></body></html>`;
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user?.email) {
      return NextResponse.json({ error: "Aucune adresse e-mail sur le compte" }, { status: 400 });
    }

    // Rate limit : max 3 codes / 15 min par utilisateur.
    const rl = rateLimit(`withdrawal-otp:${userId}`, 3, 15 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de demandes de code. Réessayez dans quelques minutes." },
        { status: 429 },
      );
    }

    const code = await storeOTP(user.email);

    if (!IS_DEV && resend) {
      try {
        await resend.emails.send({
          from: FROM,
          to: user.email,
          subject: "Code de confirmation de retrait — Novakou",
          html: emailHtml(code),
        });
      } catch (e) {
        console.error("[withdrawal-otp] email send failed", e);
        return NextResponse.json({ error: "Envoi de l'e-mail échoué. Réessayez." }, { status: 502 });
      }
    }

    // On masque l'e-mail dans la réponse (indice, sans le révéler entièrement)
    const [local, domain] = user.email.split("@");
    const masked = `${local.slice(0, 2)}***@${domain}`;
    return NextResponse.json({ ok: true, sentTo: masked });
  } catch (err) {
    console.error("[withdrawal-otp POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
