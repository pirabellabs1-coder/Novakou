import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { countSegmentRecipients, isValidSegment, SEGMENT_LABELS } from "@/lib/formations/admin-campaign-segments";

/**
 * GET /api/admin/campaigns/[id]/preview
 * Retourne le nombre de destinataires pour la campagne (utile avant envoi).
 *
 * Pour les campagnes sans id (preview à la volée pendant la rédaction),
 * accepte aussi ?segment=... en query.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role?.toLowerCase() !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  let segment: string | null = null;
  if (id === "new" || id === "draft") {
    const url = new URL(req.url);
    segment = url.searchParams.get("segment");
  } else {
    const campaign = await prisma.adminCampaign.findUnique({
      where: { id },
      select: { segment: true },
    });
    if (!campaign) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
    segment = campaign.segment;
  }

  if (!isValidSegment(segment)) {
    return NextResponse.json({ error: "Segment invalide" }, { status: 400 });
  }

  const count = await countSegmentRecipients(segment);
  return NextResponse.json({
    data: {
      segment,
      segmentLabel: SEGMENT_LABELS[segment],
      recipientCount: count,
    },
  });
}
