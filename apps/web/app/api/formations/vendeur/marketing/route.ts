import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const ctx = await resolveVendorContext(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    if (!ctx) return NextResponse.json({ data: null });
    const activeShopId = await getActiveShopId(session, { devFallback: IS_DEV ? "dev-instructeur-001" : undefined });
    const userId = ctx.userId;

    const profile = await getOrCreateInstructeur(userId);
    if (!profile) return NextResponse.json({ data: null });

    const pid = profile.id;

    const [discountCodes, popups, pixels, campaigns, affiliatePrograms, sequences, funnels] =
      await Promise.all([
        prisma.discountCode.findMany({
          where: { instructeurId: pid, ...(activeShopId ? { shopId: activeShopId } : {}) },
          select: { isActive: true, usedCount: true, revenue: true, totalDiscounted: true },
        }),
        prisma.smartPopup.findMany({
          where: { instructeurId: pid, ...(activeShopId ? { shopId: activeShopId } : {}) },
          select: { isActive: true, totalImpressions: true, totalClicks: true, totalConversions: true },
        }),
        prisma.marketingPixel.findMany({
          where: { instructeurId: pid, ...(activeShopId ? { shopId: activeShopId } : {}) },
          select: { type: true, isActive: true },
        }),
        prisma.campaignTracker.findMany({
          where: { instructeurId: pid, ...(activeShopId ? { shopId: activeShopId } : {}) },
          select: { isActive: true, totalClicks: true, totalConversions: true, totalRevenue: true },
        }),
        prisma.affiliateProgram.findMany({
          where: { instructeurId: pid, ...(activeShopId ? { shopId: activeShopId } : {}) },
          select: {
            isActive: true,
            affiliates: {
              select: { status: true, totalEarned: true },
            },
          },
        }),
        prisma.emailSequence.findMany({
          where: { instructeurId: pid, ...(activeShopId ? { shopId: activeShopId } : {}) },
          select: { isActive: true, totalEnrolled: true, totalCompleted: true },
        }),
        prisma.salesFunnel.findMany({
          where: { instructeurId: pid, ...(activeShopId ? { shopId: activeShopId } : {}) },
          select: { isActive: true, totalViews: true, totalConversions: true, totalRevenue: true },
        }),
      ]);

    // Discount codes stats
    const activeDiscounts = discountCodes.filter((d) => d.isActive).length;
    const totalDiscountUsed = discountCodes.reduce((s, d) => s + d.usedCount, 0);
    const discountRevenue = discountCodes.reduce((s, d) => s + d.revenue, 0);

    // Popups stats
    const activePopups = popups.filter((p) => p.isActive).length;
    const totalPopupImpressions = popups.reduce((s, p) => s + p.totalImpressions, 0);
    const totalPopupConversions = popups.reduce((s, p) => s + p.totalConversions, 0);
    const popupCR =
      totalPopupImpressions > 0
        ? Math.round((totalPopupConversions / totalPopupImpressions) * 100)
        : 0;

    // Pixels
    const configuredPixels = pixels.filter((p) => p.isActive).length;

    // Campaigns stats
    const activeCampaigns = campaigns.filter((c) => c.isActive).length;
    const totalCampaignClicks = campaigns.reduce((s, c) => s + c.totalClicks, 0);
    const totalCampaignConversions = campaigns.reduce((s, c) => s + c.totalConversions, 0);
    const campaignRevenue = campaigns.reduce((s, c) => s + c.totalRevenue, 0);

    // Affiliation stats
    const allAffiliates = affiliatePrograms.flatMap((p) => p.affiliates);
    const activeAffiliates = allAffiliates.filter((a) => a.status === "ACTIVE").length;
    const affiliateRevenue = allAffiliates.reduce((s, a) => s + a.totalEarned, 0);

    // Email sequences
    const activeSequences = sequences.filter((s) => s.isActive).length;
    const totalSeqEnrolled = sequences.reduce((s, seq) => s + seq.totalEnrolled, 0);

    // Funnels
    const activeFunnels = funnels.filter((f) => f.isActive).length;
    const funnelRevenue = funnels.reduce((s, f) => s + f.totalRevenue, 0);
    const funnelConversions = funnels.reduce((s, f) => s + f.totalConversions, 0);

    const totalMarketingRevenue =
      discountRevenue + campaignRevenue + affiliateRevenue + funnelRevenue;
    const activeTools =
      (activeDiscounts > 0 ? 1 : 0) +
      (activePopups > 0 ? 1 : 0) +
      (configuredPixels > 0 ? 1 : 0) +
      (activeCampaigns > 0 ? 1 : 0) +
      (activeAffiliates > 0 ? 1 : 0) +
      (activeSequences > 0 ? 1 : 0) +
      (activeFunnels > 0 ? 1 : 0);

    return NextResponse.json({
      data: {
        summary: {
          activeTools,
          totalMarketingRevenue,
          totalConversions: totalPopupConversions + totalCampaignConversions + funnelConversions,
        },
        discountCodes: {
          total: discountCodes.length,
          active: activeDiscounts,
          totalUsed: totalDiscountUsed,
          revenue: discountRevenue,
        },
        popups: {
          total: popups.length,
          active: activePopups,
          totalImpressions: totalPopupImpressions,
          totalConversions: totalPopupConversions,
          conversionRate: popupCR,
        },
        pixels: {
          total: pixels.length,
          configured: configuredPixels,
          types: pixels.map((p) => p.type),
        },
        campaigns: {
          total: campaigns.length,
          active: activeCampaigns,
          totalClicks: totalCampaignClicks,
          totalConversions: totalCampaignConversions,
          revenue: campaignRevenue,
        },
        affiliation: {
          hasProgram: affiliatePrograms.length > 0,
          totalAffiliates: allAffiliates.length,
          activeAffiliates,
          revenue: affiliateRevenue,
        },
        sequences: {
          total: sequences.length,
          active: activeSequences,
          totalEnrolled: totalSeqEnrolled,
        },
        funnels: {
          total: funnels.length,
          active: activeFunnels,
          totalConversions: funnelConversions,
          revenue: funnelRevenue,
        },
      },
    });
  } catch (err) {
    console.error("[vendeur/marketing]", err);
    return NextResponse.json({ data: null });
  }
}
