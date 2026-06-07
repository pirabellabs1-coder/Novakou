import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !["admin", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { id } = await params;

  // Bureau session 4 (P0 Amélie) — sécurité reset password.
  // Avant : retournait `tempPassword` en CLAIR dans la réponse JSON, ce
  // qui exposait le mot de passe dans : l'historique HTTP du navigateur
  // admin, les breadcrumbs Sentry, les extensions navigateur, les logs
  // Vercel function output. Risque RGPD + sécurité majeur.
  // Maintenant : on génère le password, on le hash, mais on l'envoie
  // par EMAIL à l'utilisateur ciblé (via Resend) au lieu de le retourner.
  // L'admin voit juste "Email de reset envoyé à user@example.com".
  const tempPassword = crypto.randomBytes(6).toString("base64url").slice(0, 12) + "!A1";
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  let targetEmail: string | null = null;
  let targetName: string | null = null;

  try {
    const { prisma } = await import("@freelancehigh/db");
    const updated = await prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: { email: true, name: true },
    });
    targetEmail = updated.email;
    targetName = updated.name;

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "reset_password",
        targetUserId: id,
      },
    });
  } catch (err) {
    console.error("[reset-password] Prisma update failed:", err);
    return NextResponse.json({ error: "Mise à jour DB échouée" }, { status: 500 });
  }

  if (!targetEmail) {
    return NextResponse.json({ error: "User cible introuvable" }, { status: 404 });
  }

  // Envoi du temp password par email — best-effort, on n'expose pas le
  // password dans la réponse même si l'envoi échoue (sécurité > UX
  // admin). Admin verra un statut "envoi échoué" et pourra retry.
  let emailSent = false;
  if (resend) {
    try {
      await resend.emails.send({
        from: FROM,
        to: targetEmail,
        subject: "Réinitialisation de votre mot de passe Novakou",
        html: `
          <p>Bonjour ${targetName ?? ""},</p>
          <p>Un administrateur Novakou a réinitialisé votre mot de passe.</p>
          <p>Votre mot de passe temporaire est : <strong style="font-family:monospace;background:#f3f4f6;padding:6px 12px;border-radius:4px;">${tempPassword}</strong></p>
          <p><strong>Important :</strong> connectez-vous immédiatement et changez ce mot de passe depuis Mon profil → Sécurité.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, contactez immédiatement support@novakou.com.</p>
          <p>— L'équipe Novakou</p>
        `,
      });
      emailSent = true;
    } catch (err) {
      console.error("[reset-password] Resend send failed:", err);
    }
  }

  return NextResponse.json({
    message: emailSent
      ? `Email de réinitialisation envoyé à ${targetEmail}`
      : `Mot de passe réinitialisé mais l'envoi de l'email a échoué. Veuillez contacter l'utilisateur ${targetEmail} manuellement.`,
    emailSent,
    targetEmail,
  });
}
