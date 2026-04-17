import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { sendKycApprovedEmail, sendKycRefusedEmail } from "@/lib/email/kyc";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/formations/admin/kyc/[id]
 * Body: { action: "approve" | "refuse", refuseReason?: string }
 * - approve → sets user.kyc to requestedLevel, status APPROUVE
 * - refuse → status REFUSE with reason
 */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toString().toUpperCase();
    if (!session?.user || role !== "ADMIN") {
      return NextResponse.json({ error: "Accès admin requis" }, { status: 403 });
    }

    const body = await request.json();
    const { action, refuseReason } = body as { action?: string; refuseReason?: string };

    if (!action || !["approve", "refuse"].includes(action)) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const kyc = await prisma.kycRequest.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, name: true, kyc: true } } },
    });
    if (!kyc) return NextResponse.json({ error: "Demande KYC introuvable" }, { status: 404 });
    if (kyc.status !== "EN_ATTENTE") {
      return NextResponse.json({ error: "Cette demande a déjà été traitée" }, { status: 400 });
    }

    const now = new Date();
    if (action === "approve") {
      // Vérifie si l'utilisateur a un MentorProfile (pour auto-set isVerified)
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: kyc.userId },
        select: { id: true },
      });

      const tx: Array<Promise<unknown>> = [
        prisma.kycRequest.update({
          where: { id },
          data: {
            status: "APPROUVE",
            reviewedBy: session.user.id,
            reviewedAt: now,
          },
        }) as unknown as Promise<unknown>,
        prisma.user.update({
          where: { id: kyc.userId },
          data: { kyc: Math.max(kyc.user.kyc ?? 0, kyc.requestedLevel) },
        }) as unknown as Promise<unknown>,
      ];
      if (mentorProfile) {
        tx.push(
          prisma.mentorProfile.update({
            where: { id: mentorProfile.id },
            data: { isVerified: true },
          }) as unknown as Promise<unknown>,
        );
      }
      await Promise.all(tx);

      const isPro = kyc.requestedLevel >= 4;
      await prisma.notification.create({
        data: {
          userId: kyc.userId,
          type: "ORDER",
          title: isPro ? "Certification pro validée ✓" : "Identité vérifiée ✓",
          message: isPro
            ? "Votre certification professionnelle a été approuvée. Le badge Elite est maintenant affiché sur votre profil public."
            : "Votre identité a été vérifiée. Vous pouvez désormais demander un retrait de vos gains.",
          link: isPro ? "/formations/mentor/profil" : "/formations/mentor/finances",
        },
      }).catch(() => null);

      if (kyc.user.email) {
        await sendKycApprovedEmail({
          userEmail: kyc.user.email,
          userName: kyc.user.name ?? kyc.user.email.split("@")[0],
          level: kyc.requestedLevel,
        }).catch((e) => console.warn("[kyc approve email]", e));
      }

      return NextResponse.json({ data: { id, status: "APPROUVE", newLevel: kyc.requestedLevel } });
    }

    // refuse
    if (!refuseReason || refuseReason.trim().length < 10) {
      return NextResponse.json({ error: "Motif de refus obligatoire (10 caractères minimum)" }, { status: 400 });
    }
    await prisma.kycRequest.update({
      where: { id },
      data: {
        status: "REFUSE",
        reviewedBy: session.user.id,
        reviewedAt: now,
        refuseReason: refuseReason.trim(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: kyc.userId,
        type: "ORDER",
        title: "KYC refusé",
        message: `Votre vérification d'identité a été refusée. Motif : ${refuseReason.trim()}. Vous pouvez soumettre une nouvelle demande.`,
        link: "/formations/kyc",
      },
    }).catch(() => null);

    if (kyc.user.email) {
      await sendKycRefusedEmail({
        userEmail: kyc.user.email,
        userName: kyc.user.name ?? kyc.user.email.split("@")[0],
        refuseReason: refuseReason.trim(),
      }).catch((e) => console.warn("[kyc refuse email]", e));
    }

    return NextResponse.json({ data: { id, status: "REFUSE" } });
  } catch (err) {
    console.error("[admin/kyc PATCH]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Erreur serveur", detail: msg }, { status: 500 });
  }
}
