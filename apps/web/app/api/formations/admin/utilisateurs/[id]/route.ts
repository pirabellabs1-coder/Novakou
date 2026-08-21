import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { UserStatus } from "@prisma/client";
import { createAuditLog } from "@/lib/admin/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session?.user || (role !== "admin" && role !== "ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // "suspend" | "activate" | "ban" | "make_admin"

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    let updated;
    if (action === "suspend") {
      updated = await prisma.user.update({
        where: { id },
        data: { status: "SUSPENDU" as UserStatus, suspendReason: body.reason ?? "Suspendu par l'admin" },
      });
    } else if (action === "activate") {
      updated = await prisma.user.update({
        where: { id },
        data: { status: "ACTIF" as UserStatus, suspendReason: null },
      });
    } else if (action === "ban") {
      updated = await prisma.user.update({
        where: { id },
        data: { status: "BANNI" as UserStatus, suspendReason: body.reason ?? "Banni par l'admin" },
      });
    } else if (action === "reset_2fa") {
      // ── RÉINITIALISATION DU 2FA — la porte de secours qui n'existait pas ──
      //
      // Premier cas réel (ticket du 2026-08-21) : un utilisateur a activé le
      // TOTP, changé de téléphone sans sauvegarder le secret, et s'est
      // retrouvé enfermé dehors définitivement — il n'existe ni codes de
      // secours, ni aucun autre chemin de récupération. La seule issue est
      // qu'un humain, ici, coupe le 2FA après avoir vérifié l'identité.
      //
      // JAMAIS pour un compte ADMIN : leur 2FA est obligatoire et non
      // contournable (règle fondateur). Désactiver celui d'un admin le
      // laisserait protégé par mot de passe seul — exactement la faille que
      // cette règle interdit. Un admin enfermé se traite hors application.
      if (user.role === "ADMIN") {
        return NextResponse.json(
          { error: "Le 2FA d'un compte ADMIN ne se réinitialise pas par cet écran — règle de sécurité." },
          { status: 403 },
        );
      }
      if (!user.twoFactorEnabled) {
        return NextResponse.json(
          { error: "Le 2FA n'est pas activé sur ce compte — rien à réinitialiser." },
          { status: 400 },
        );
      }
      updated = await prisma.user.update({
        where: { id },
        // Les trois champs, pas seulement le drapeau : un secret orphelin qui
        // traîne en base redeviendrait actif à la moindre régression.
        data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorVerifiedAt: null },
      });

      // L'utilisateur DOIT être prévenu : si ce n'est pas lui qui a demandé la
      // réinitialisation, ce courriel est sa seule chance de s'en apercevoir.
      if (user.email) {
        const { sendEmail, emailLayout } = await import("@/lib/email");
        sendEmail({
          to: user.email,
          subject: "Votre double authentification a été réinitialisée",
          html: emailLayout(`
            <h2 style="margin:0 0 12px">Double authentification réinitialisée</h2>
            <p style="margin:0 0 12px;color:#475569">
              À votre demande auprès du support, la double authentification (code
              Google Authenticator) de votre compte Novakou a été désactivée.
              Vous pouvez maintenant vous connecter avec votre e-mail et votre
              mot de passe, puis la réactiver depuis vos paramètres — nous vous
              le recommandons vivement.
            </p>
            <p style="margin:0;color:#b91c1c;font-weight:600">
              Vous n'êtes pas à l'origine de cette demande ? Changez votre mot de
              passe immédiatement et écrivez-nous à support@novakou.com.
            </p>
          `),
        }).catch((e) => console.error("[reset-2fa email]", e));
      }
    } else {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const actorId = (session.user as { id?: string }).id;
    if (actorId) {
      await createAuditLog({
        actorId,
        action: `user.${action}`,
        targetType: "user",
        targetId: id,
        targetUserId: id,
        details: { reason: body.reason ?? null, newStatus: updated.status },
      }).catch(() => null);
    }

    return NextResponse.json({ data: { id: updated.id, status: updated.status } });
  } catch (err) {
    console.error("[admin/users PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session?.user || (role !== "admin" && role !== "ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const actorId = (session.user as { id?: string }).id;
    if (id === actorId) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous supprimer vous-même" }, { status: 400 });
    }
    await prisma.user.delete({ where: { id } });

    if (actorId) {
      await createAuditLog({
        actorId,
        action: "user.deleted",
        targetType: "user",
        targetId: id,
        targetUserId: id,
      }).catch(() => null);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/users DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
