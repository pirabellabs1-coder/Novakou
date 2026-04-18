import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { sendEmail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV) return null;
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role?.toLowerCase() !== "admin" && !IS_DEV) return null;
  return session;
}

/**
 * POST — admin action: approve | reject. body { decision, note? }.
 * - decision="approve" → status=APPROVED + delete the user (cascade)
 * - decision="reject" → status=REJECTED with adminNote
 */
export async function POST(req: Request, { params }: Params) {
  const sess = await ensureAdmin();
  if (!sess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  let body: { decision?: "approve" | "reject"; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  if (body.decision !== "approve" && body.decision !== "reject")
    return NextResponse.json({ error: "decision invalide" }, { status: 400 });

  const dr = await prisma.accountDeletionRequest.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!dr) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  if (dr.status === "APPROVED" || dr.status === "REJECTED" || dr.status === "CANCELLED")
    return NextResponse.json(
      { error: "Demande déjà traitée" },
      { status: 400 },
    );
  // Doit avoir passé le cooldown pour être approuvée
  if (body.decision === "approve" && new Date() < dr.cooldownUntil)
    return NextResponse.json(
      { error: `Cooldown non terminé. Attendre jusqu'au ${dr.cooldownUntil.toLocaleString("fr-FR")}` },
      { status: 400 },
    );

  const adminId = (sess.user as { id?: string } | undefined)?.id ?? "admin";
  const note = (body.note ?? "").trim().slice(0, 1000) || null;

  if (body.decision === "reject") {
    await prisma.accountDeletionRequest.update({
      where: { id: dr.id },
      data: { status: "REJECTED", reviewedAt: new Date(), reviewedBy: adminId, adminNote: note },
    });
    if (dr.user?.email) {
      sendEmail({
        to: dr.user.email,
        subject: "Demande de suppression refusée — Novakou",
        html: `<div style="font-family:Manrope,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f7f9fb">
          <div style="background:linear-gradient(135deg,#006e2f,#22c55e);padding:24px;text-align:center;border-radius:12px">
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">Demande refusée</h1>
          </div>
          <div style="padding:24px;background:#fff;border:1px solid #f3f4f6;border-radius:12px;margin-top:8px">
            <p>Bonjour ${dr.user.name ?? ""},</p>
            <p>Votre demande de suppression de compte a été refusée par un administrateur.</p>
            ${note ? `<p><strong>Motif :</strong> ${note.replace(/</g, "&lt;")}</p>` : ""}
            <p>Votre compte reste actif. Si vous souhaitez plus d'informations, contactez le support.</p>
          </div>
        </div>`,
      }).catch(() => null);
    }
    return NextResponse.json({ data: { decision: "rejected" } });
  }

  // APPROVE → supprimer le compte (cascade Prisma efface tout)
  await prisma.accountDeletionRequest.update({
    where: { id: dr.id },
    data: {
      status: "APPROVED",
      reviewedAt: new Date(),
      reviewedBy: adminId,
      adminNote: note,
      completedAt: new Date(),
    },
  });

  if (dr.user?.email) {
    sendEmail({
      to: dr.user.email,
      subject: "Compte Novakou supprimé",
      html: `<div style="font-family:Manrope,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f7f9fb">
        <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:24px;text-align:center;border-radius:12px">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">Compte supprimé</h1>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #f3f4f6;border-radius:12px;margin-top:8px">
          <p>Bonjour ${dr.user.name ?? ""},</p>
          <p>Votre compte Novakou a été supprimé définitivement comme demandé.</p>
          <p>Toutes vos données (boutiques, produits, transactions historiques) ont été retirées de notre système.</p>
          <p>Merci d'avoir utilisé Novakou. À bientôt peut-être.</p>
        </div>
      </div>`,
    }).catch(() => null);
  }

  // Suppression réelle — onDelete: Cascade supprime tout ce qui dépend de User
  try {
    await prisma.user.delete({ where: { id: dr.userId } });
  } catch (err) {
    console.error("[admin/suppressions/approve] user.delete failed:", err);
    return NextResponse.json(
      { error: "Suppression impossible (contraintes DB). Voir les logs." },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { decision: "approved", deleted: true } });
}
