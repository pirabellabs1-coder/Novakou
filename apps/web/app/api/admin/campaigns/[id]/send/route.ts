import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { sendAdminCampaignBatch } from "@/lib/email/admin-campaign";
import { resolveSegmentRecipients, isValidSegment } from "@/lib/formations/admin-campaign-segments";

/**
 * POST /api/admin/campaigns/[id]/send
 * Envoie la campagne à tous les destinataires du segment.
 *
 * Idempotent : si status=sending ou sent, on rejette (éviter double envoi).
 * Envoie par lots de 10 avec delay 1.2s (rate-limit Resend Free tier).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role?.toLowerCase() !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const campaign = await prisma.adminCampaign.findUnique({ where: { id } });
  if (!campaign) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });

  if (campaign.status !== "draft") {
    return NextResponse.json(
      { error: `Cette campagne a déjà été envoyée (statut: ${campaign.status})` },
      { status: 400 }
    );
  }
  if (!isValidSegment(campaign.segment)) {
    return NextResponse.json({ error: "Segment invalide" }, { status: 400 });
  }

  // Marque "sending" pour éviter les doubles envois concurrents
  await prisma.adminCampaign.update({
    where: { id },
    data: { status: "sending" },
  });

  // Résout les destinataires
  const recipients = await resolveSegmentRecipients(campaign.segment);
  if (recipients.length === 0) {
    await prisma.adminCampaign.update({
      where: { id },
      data: { status: "failed", failedCount: 0 },
    });
    return NextResponse.json({ error: "Aucun destinataire dans ce segment" }, { status: 400 });
  }

  // Crée les AdminCampaignRecipient en bulk
  await prisma.adminCampaignRecipient.createMany({
    data: recipients.map((r) => ({
      campaignId: id,
      userId: r.id,
      email: r.email,
      status: "pending",
    })),
  });

  // Envoi par lots
  const batchResult = await sendAdminCampaignBatch({
    recipients: recipients.map((r) => ({ email: r.email, firstName: r.firstName })),
    subject: campaign.subject,
    htmlBody: campaign.htmlBody,
  });

  // Met à jour les recipients
  for (const r of batchResult.results) {
    await prisma.adminCampaignRecipient.updateMany({
      where: { campaignId: id, email: r.email },
      data: {
        status: r.ok ? "sent" : "failed",
        resendId: r.id || null,
        sentAt: r.ok ? new Date() : null,
      },
    }).catch(() => null);
  }

  // Met à jour la campagne
  const finalStatus = batchResult.failed === recipients.length ? "failed" : "sent";
  await prisma.adminCampaign.update({
    where: { id },
    data: {
      status: finalStatus,
      sentAt: new Date(),
      recipientCount: recipients.length,
      failedCount: batchResult.failed,
    },
  });

  return NextResponse.json({
    data: {
      sent: batchResult.sent,
      failed: batchResult.failed,
      total: recipients.length,
    },
  });
}
