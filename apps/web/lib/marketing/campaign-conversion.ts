import { prisma } from "@/lib/prisma";

/**
 * Crédite une conversion de campagne (lien UTM tracké via fh_campaign) après
 * un paiement réussi : +1 conversion, +revenu sur le CampaignTracker, et un
 * CampaignEvent de type "conversion".
 *
 * IMPORTANT — idempotence : l'appelant (webhook paiement) NE doit invoquer
 * cette fonction QUE lorsque le fulfillment a réellement créé de nouveaux
 * enregistrements (enrollments/purchases > 0). Les webhooks peuvent être
 * rejoués ; ce garde-fou côté appelant évite le double comptage.
 */
export async function creditCampaignConversion(
  slug: string,
  opts: { revenue: number; userId?: string | null },
): Promise<void> {
  if (!slug) return;
  try {
    const campaign = await prisma.campaignTracker.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!campaign) return;

    const revenue = Number.isFinite(opts.revenue) ? Math.max(0, opts.revenue) : 0;

    await prisma.$transaction([
      prisma.campaignTracker.update({
        where: { id: campaign.id },
        data: {
          totalConversions: { increment: 1 },
          totalRevenue: { increment: revenue },
        },
      }),
      prisma.campaignEvent.create({
        data: {
          campaignId: campaign.id,
          userId: opts.userId ?? null,
          eventType: "conversion",
          revenue,
        },
      }),
    ]);
  } catch (err) {
    // Analytics non-bloquant : ne jamais faire échouer un webhook de paiement.
    console.warn("[campaign conversion] échec crédit:", err);
  }
}
