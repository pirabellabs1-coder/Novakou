import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

const PLATFORM_COMMISSION_PCT = 40; // Platform-wide affiliate commission rate

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const profile = await prisma.affiliateProfile.findUnique({
      where: { userId },
      include: {
        program: { select: { id: true, name: true, commissionPct: true, isActive: true } },
        commissions: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { id: true, orderId: true, orderType: true, orderAmount: true, commissionAmount: true, status: true, createdAt: true, paidAt: true },
        },
      },
    });

    if (!profile) {
      // Not yet an affiliate
      return NextResponse.json({
        isAffiliate: false,
        commissionPct: PLATFORM_COMMISSION_PCT,
        profile: null,
      });
    }

    const commissionsByStatus = {
      total:    profile.commissions.reduce((s, c) => s + c.commissionAmount, 0),
      confirmed: profile.commissions.filter((c) => c.status === "APPROVED").reduce((s, c) => s + c.commissionAmount, 0),
      pending:  profile.commissions.filter((c) => c.status === "PENDING").reduce((s, c) => s + c.commissionAmount, 0),
      paid:     profile.paidEarnings,
    };

    return NextResponse.json({
      isAffiliate: true,
      commissionPct: profile.program?.commissionPct ?? PLATFORM_COMMISSION_PCT,
      profile: {
        id: profile.id,
        affiliateCode: profile.affiliateCode,
        status: profile.status,
        totalClicks: profile.totalClicks,
        totalConversions: profile.totalConversions,
        totalEarned: profile.totalEarned,
        pendingEarnings: profile.pendingEarnings,
        paidEarnings: profile.paidEarnings,
        conversionRate: profile.conversionRate,
      },
      commissions: profile.commissions,
      summary: commissionsByStatus,
    });
  } catch {
    return NextResponse.json({ isAffiliate: false, commissionPct: PLATFORM_COMMISSION_PCT, profile: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    // Check not already an affiliate
    const existing = await prisma.affiliateProfile.findUnique({ where: { userId } });
    if (existing) return NextResponse.json({ error: "Vous êtes déjà affilié", alreadyJoined: true }, { status: 409 });

    // Find or create a default affiliate program for this platform
    let program = await prisma.affiliateProgram.findFirst({ where: { isActive: true, applyToAll: true } });

    if (!program) {
      // Auto-create a platform-wide default program using the first available admin instructeur
      const adminInstructeur = await prisma.instructeurProfile.findFirst({
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (!adminInstructeur) {
        return NextResponse.json({
          error: "Aucun programme d'affiliation disponible pour le moment. Veuillez réessayer plus tard.",
        }, { status: 503 });
      }
      program = await prisma.affiliateProgram.create({
        data: {
          instructeurId: adminInstructeur.id,
          name: "Programme affiliation Novakou",
          description: "Programme d'affiliation par défaut de la plateforme. 40% de commission sur chaque vente.",
          commissionPct: 40,
          cookieDays: 30,
          isActive: true,
          autoApprove: true,
          applyToAll: true,
        },
      });
    }

    // Generate unique affiliate code from user name
    const userName = session?.user?.name ?? "USER";
    const baseCode = userName.replace(/\s+/g, "").toUpperCase().slice(0, 8);
    const code = `${baseCode}${Math.floor(Math.random() * 900 + 100)}`;

    const profile = await prisma.affiliateProfile.create({
      data: {
        userId,
        programId: program.id,
        affiliateCode: code,
        status: program.autoApprove ? "ACTIVE" : "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      profile: { id: profile.id, affiliateCode: profile.affiliateCode, status: profile.status },
      commissionPct: program.commissionPct,
      affiliateLink: `${process.env.NEXTAUTH_URL ?? ""}/?ref=${profile.affiliateCode}`,
    }, { status: 201 });
  } catch (err) {
    console.error("[affiliate POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
