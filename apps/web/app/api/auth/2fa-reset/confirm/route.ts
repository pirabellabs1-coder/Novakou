import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOTP, PREFIXE_2FA_RESET } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/api-rate-limit";
import { sendEmail, emailLayout } from "@/lib/email";
import { createAuditLog } from "@/lib/admin/audit";

/**
 * POST /api/auth/2fa-reset/confirm   Body : { email, code }
 *
 * RÉINITIALISATION DU 2FA EN LIBRE-SERVICE — étape 2 : le code reçu par
 * e-mail désactive le TOTP. L'utilisateur se reconnecte ensuite avec son mot
 * de passe seul, et réactive le 2FA depuis ses paramètres.
 *
 * Les garde-fous de l'étape 1 sont RÉÉVALUÉS ici — l'état du compte a pu
 * changer entre les deux appels, et une étape 2 qui ferait confiance à
 * l'étape 1 serait contournable en appelant celle-ci directement.
 */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { email?: string; code?: string };
    const email = String(body.email ?? "").trim().toLowerCase();
    const code = String(body.code ?? "").trim();
    if (!email || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Code invalide." }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "inconnu";
    // verifyOTP compte déjà 5 essais par code ; cette limite-ci empêche de
    // recommencer le cycle demande/essais en boucle depuis une même adresse.
    const rl = await rateLimit(`2fa-reset-confirm:${ip}`, 10, 15 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Trop d'essais. Réessayez dans 15 minutes." }, { status: 429 });
    }

    const verdict = await verifyOTP(PREFIXE_2FA_RESET + email, code);
    if (!verdict.valid) {
      return NextResponse.json({ error: verdict.error ?? "Code incorrect ou expiré." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, twoFactorEnabled: true },
    });
    // Mêmes règles qu'à la demande : pas de compte ADMIN, et rien à faire si
    // le 2FA n'est plus actif.
    if (!user || !user.twoFactorEnabled || user.role === "ADMIN") {
      return NextResponse.json({ error: "Ce compte ne permet pas cette opération." }, { status: 400 });
    }

    // Les trois champs, pas seulement le drapeau : un secret orphelin
    // redeviendrait actif à la moindre régression.
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorVerifiedAt: null },
    });

    // Trace d'audit : l'acteur est l'utilisateur lui-même — c'est ce qui
    // distingue, plus tard, un self-service d'une intervention du support.
    await createAuditLog({
      actorId: user.id,
      action: "user.2fa_reset_self",
      targetType: "user",
      targetId: user.id,
      targetUserId: user.id,
      details: { via: "code e-mail", ip },
    }).catch(() => null);

    // Confirmation par e-mail : si la demande ne venait pas du titulaire,
    // ce message est sa seule chance de s'en apercevoir.
    sendEmail({
      to: email,
      subject: "Votre double authentification a été désactivée",
      html: emailLayout(`
        <h2 style="margin:0 0 12px">Double authentification désactivée</h2>
        <p style="margin:0 0 12px;color:#475569">
          Suite à votre demande, le code Google Authenticator de votre compte
          Novakou a été désactivé. Connectez-vous avec votre e-mail et votre
          mot de passe, puis réactivez la double authentification depuis vos
          paramètres — nous vous le recommandons vivement.
        </p>
        <p style="margin:0;color:#b91c1c;font-weight:600">
          Vous n'êtes pas à l'origine de cette demande ? Changez votre mot de
          passe immédiatement et écrivez-nous à support@novakou.com.
        </p>
      `),
    }).catch((e) => console.error("[2fa-reset confirm email]", e));

    return NextResponse.json({
      data: {
        reset: true,
        message:
          "Double authentification désactivée. Reconnectez-vous avec votre mot de passe, puis réactivez-la depuis vos paramètres.",
      },
    });
  } catch (err) {
    console.error("[2fa-reset/confirm]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
