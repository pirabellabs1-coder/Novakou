import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { SEGMENT_LABELS } from "@/lib/formations/admin-campaign-segments";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role?.toLowerCase() !== "admin") {
    return null;
  }
  return session.user;
}

/**
 * GET /api/admin/campaigns/[id]
 * Detail d'une campagne + ses destinataires (max 200 derniers).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const campaign = await prisma.adminCampaign.findUnique({
    where: { id },
    include: {
      recipients: {
        take: 200,
        orderBy: { sentAt: "desc" },
        select: {
          id: true,
          email: true,
          status: true,
          sentAt: true,
          openedAt: true,
          clickedAt: true,
          resendId: true,
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      ...campaign,
      segmentLabel: SEGMENT_LABELS[campaign.segment as keyof typeof SEGMENT_LABELS] || campaign.segment,
    },
  });
}

/**
 * DELETE /api/admin/campaigns/[id]
 * Supprime une campagne (uniquement brouillons).
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const campaign = await prisma.adminCampaign.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
  }
  if (campaign.status !== "draft") {
    return NextResponse.json(
      { error: "Seules les campagnes en brouillon peuvent être supprimées" },
      { status: 400 },
    );
  }

  await prisma.adminCampaign.delete({ where: { id } });

  return NextResponse.json({ data: { deleted: true } });
}
