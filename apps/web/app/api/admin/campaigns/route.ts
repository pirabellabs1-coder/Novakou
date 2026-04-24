import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { isValidSegment, SEGMENT_LABELS } from "@/lib/formations/admin-campaign-segments";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role?.toLowerCase() !== "admin") {
    return null;
  }
  return session.user;
}

/** GET /api/admin/campaigns — liste des campagnes */
export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const campaigns = await prisma.adminCampaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      subject: true,
      segment: true,
      status: true,
      sentAt: true,
      recipientCount: true,
      openedCount: true,
      clickedCount: true,
      failedCount: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    data: campaigns.map((c) => ({
      ...c,
      segmentLabel: SEGMENT_LABELS[c.segment as keyof typeof SEGMENT_LABELS] || c.segment,
    })),
  });
}

/** POST /api/admin/campaigns — créer un brouillon */
export async function POST(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let body: { subject?: string; htmlBody?: string; segment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const subject = (body.subject || "").trim();
  const htmlBody = (body.htmlBody || "").trim();
  const segment = (body.segment || "").trim();

  if (subject.length < 3 || subject.length > 200) {
    return NextResponse.json({ error: "Objet invalide (3-200 caractères)" }, { status: 400 });
  }
  if (htmlBody.length < 10) {
    return NextResponse.json({ error: "Contenu trop court" }, { status: 400 });
  }
  if (!isValidSegment(segment)) {
    return NextResponse.json(
      { error: "Segment invalide. Valeurs : all, vendors, mentors, learners" },
      { status: 400 }
    );
  }

  const campaign = await prisma.adminCampaign.create({
    data: {
      subject,
      htmlBody,
      segment,
      status: "draft",
      createdBy: user.id,
    },
  });

  return NextResponse.json({ data: campaign }, { status: 201 });
}
