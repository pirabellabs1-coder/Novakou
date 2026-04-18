import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveActiveUserId } from "@/lib/formations/active-user";
import { sendEmail } from "@/lib/email";

const COOLDOWN_HOURS = 72;

/** GET — current deletion request state for the authenticated user. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = await resolveActiveUserId(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!userId) return NextResponse.json({ data: null });

  const req = await prisma.accountDeletionRequest.findUnique({
    where: { userId },
    select: {
      id: true,
      reason: true,
      status: true,
      requestedAt: true,
      cooldownUntil: true,
      reviewedAt: true,
      adminNote: true,
      completedAt: true,
    },
  });

  return NextResponse.json({ data: req });
}

/** POST — create a new deletion request. body { reason }. */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = await resolveActiveUserId(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const reason = (body.reason ?? "").trim().slice(0, 2000);
  if (reason.length < 10) {
    return NextResponse.json(
      { error: "Veuillez préciser la raison (10 caractères minimum)" },
      { status: 400 },
    );
  }

  const existing = await prisma.accountDeletionRequest.findUnique({ where: { userId } });
  if (existing && (existing.status === "PENDING_COOLDOWN" || existing.status === "AWAITING_REVIEW")) {
    return NextResponse.json(
      { error: "Une demande est déjà en cours pour ce compte." },
      { status: 409 },
    );
  }

  const now = new Date();
  const cooldownUntil = new Date(now.getTime() + COOLDOWN_HOURS * 3_600_000);

  const created = await prisma.accountDeletionRequest.upsert({
    where: { userId },
    create: {
      userId,
      reason,
      status: "PENDING_COOLDOWN",
      requestedAt: now,
      cooldownUntil,
    },
    update: {
      reason,
      status: "PENDING_COOLDOWN",
      requestedAt: now,
      cooldownUntil,
      reviewedAt: null,
      reviewedBy: null,
      adminNote: null,
      completedAt: null,
    },
  });

  // Notifier l'utilisateur + l'admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (user?.email) {
    sendEmail({
      to: user.email,
      subject: "Demande de suppression de compte — Novakou",
      html: `<div style="font-family:Manrope,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f7f9fb">
        <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:24px;text-align:center;border-radius:12px">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">Suppression de compte demandée</h1>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #f3f4f6;border-radius:12px;margin-top:8px">
          <p style="color:#191c1e;line-height:1.6;margin:0 0 16px">Bonjour ${user.name ?? "vous"},</p>
          <p style="color:#5c647a;line-height:1.6;margin:0 0 16px">
            Nous avons bien reçu votre demande de suppression de compte. Conformément à notre politique :
          </p>
          <ul style="color:#5c647a;line-height:1.7;padding-left:20px">
            <li>Votre compte reste actif pendant <strong>${COOLDOWN_HOURS}h</strong> (jusqu'au <strong>${cooldownUntil.toLocaleString("fr-FR")}</strong>).</li>
            <li>Vous pouvez <strong>annuler la demande</strong> à tout moment dans vos paramètres pendant ce délai.</li>
            <li>À l'expiration, un administrateur Novakou examine la demande et confirme la suppression définitive.</li>
          </ul>
          <p style="color:#5c647a;line-height:1.6;margin:16px 0 0">
            Si vous n'êtes pas à l'origine de cette demande, connectez-vous immédiatement et changez votre mot de passe.
          </p>
        </div>
      </div>`,
    }).catch((e) => console.error("[deletion-request] user email error:", e));
  }

  // Notify admins (best-effort)
  const adminEmail = process.env.ADMIN_EMAIL || "contact@novakou.com";
  sendEmail({
    to: adminEmail,
    subject: `[ADMIN] Nouvelle demande de suppression — ${user?.email ?? userId}`,
    html: `<div style="font-family:Manrope,Arial,sans-serif">
      <h2 style="color:#191c1e">Demande de suppression — ${user?.name ?? user?.email ?? userId}</h2>
      <p><strong>Email :</strong> ${user?.email ?? "?"}</p>
      <p><strong>Raison :</strong></p>
      <blockquote style="border-left:3px solid #006e2f;padding-left:12px;color:#5c647a">${reason.replace(/</g, "&lt;")}</blockquote>
      <p>Cooldown jusqu'au <strong>${cooldownUntil.toLocaleString("fr-FR")}</strong>.</p>
      <p>Examiner sur <a href="https://novakou.com/admin/suppressions">/admin/suppressions</a></p>
    </div>`,
  }).catch((e) => console.error("[deletion-request] admin email error:", e));

  return NextResponse.json({ data: created });
}

/** DELETE — user cancels their deletion request (only allowed during cooldown). */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = await resolveActiveUserId(session, {
    devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
  });
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const existing = await prisma.accountDeletionRequest.findUnique({ where: { userId } });
  if (!existing) return NextResponse.json({ error: "Aucune demande active" }, { status: 404 });
  if (existing.status !== "PENDING_COOLDOWN") {
    return NextResponse.json(
      { error: "Cette demande ne peut plus être annulée (déjà transmise à l'admin)" },
      { status: 400 },
    );
  }

  await prisma.accountDeletionRequest.update({
    where: { userId },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ data: { cancelled: true } });
}
