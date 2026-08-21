import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storeOTP, PREFIXE_2FA_RESET } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/api-rate-limit";
import { sendEmail, emailLayout } from "@/lib/email";

/**
 * POST /api/auth/2fa-reset/request   Body : { email }
 *
 * RÉINITIALISATION DU 2FA EN LIBRE-SERVICE — étape 1 : prouver la boîte mail.
 *
 * Pourquoi ce flux existe : un utilisateur qui change de téléphone sans avoir
 * sauvegardé son secret TOTP était enfermé dehors DÉFINITIVEMENT — aucun code
 * de secours, aucun chemin de récupération (premier cas réel : ticket du
 * 2026-08-21). Le support pouvait le débloquer à la main ; ce flux le laisse
 * se débloquer seul, en prouvant qu'il possède l'adresse e-mail du compte.
 *
 * Choix de sécurité assumés :
 *  - Le mot de passe reste exigé à la connexion : réinitialiser le 2FA ne
 *    donne AUCUN accès à qui ne connaît pas le mot de passe. La preuve par
 *    e-mail remplace le facteur perdu, elle ne remplace pas le premier.
 *  - JAMAIS pour un compte ADMIN : leur 2FA est obligatoire et non
 *    contournable (règle fondateur). Un admin enfermé se traite hors
 *    application.
 *  - Réponse identique que le compte existe ou non : ce point d'entrée ne
 *    doit pas servir d'annuaire des comptes.
 *  - Le code est rangé sous une clé PRÉFIXÉE (« 2fa-reset: ») : un code émis
 *    pour la connexion acheteur — même table — ne peut pas être rejoué ici,
 *    ni l'inverse.
 */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { email?: string };
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "inconnu";
    const [parEmail, parIp] = await Promise.all([
      rateLimit(`2fa-reset-email:${email}`, 3, 15 * 60_000),
      rateLimit(`2fa-reset-ip:${ip}`, 6, 15 * 60_000),
    ]);
    if (!parEmail.allowed || !parIp.allowed) {
      return NextResponse.json(
        { error: "Trop de demandes. Réessayez dans 15 minutes." },
        { status: 429 },
      );
    }

    // La réponse est LA MÊME dans tous les cas — seul l'envoi diffère.
    const reponse = NextResponse.json({
      data: {
        message:
          "Si un compte avec double authentification existe pour cette adresse, un code vient d'y être envoyé.",
      },
    });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, twoFactorEnabled: true },
    });
    if (!user || !user.twoFactorEnabled || user.role === "ADMIN") {
      return reponse;
    }

    const code = await storeOTP(PREFIXE_2FA_RESET + email);
    await sendEmail({
      to: email,
      subject: "Réinitialisation de votre double authentification",
      html: emailLayout(`
        <h2 style="margin:0 0 12px">Réinitialiser votre double authentification</h2>
        <p style="margin:0 0 16px;color:#475569">
          Vous avez demandé à désactiver le code Google Authenticator de votre
          compte Novakou. Saisissez ce code pour confirmer :
        </p>
        <div style="background:#f9fafb;border:2px solid #e5e7eb;border-radius:12px;padding:24px;text-align:center;margin:0 0 16px">
          <span style="font-family:monospace;font-size:34px;font-weight:900;letter-spacing:8px;color:#111827">${code}</span>
        </div>
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px">Valable 10 minutes.</p>
        <p style="margin:0;color:#b91c1c;font-size:13px;font-weight:600">
          Vous n'avez rien demandé ? N'utilisez pas ce code et ignorez ce
          message : votre double authentification reste active.
        </p>
      `),
    });

    return reponse;
  } catch (err) {
    console.error("[2fa-reset/request]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
