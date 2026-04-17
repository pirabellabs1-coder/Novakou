// POST /api/marketing/affiliate/join — A user joins an affiliate program
// Creates AffiliateProfile with unique code, returns the affiliate profile with generated link

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const DEV_MODE = process.env.DEV_MODE === "true" || process.env.NODE_ENV === "development";

// ── Types ────────────────────────────────────────────────────────────────────

interface AffiliateProfile {
  id: string;
  userId: string;
  programId: string;
  affiliateCode: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  totalClicks: number;
  totalConversions: number;
  totalEarned: number;
  pendingEarnings: number;
  affiliateLink: string;
  programName: string;
  commissionPercent: number;
  cookieDays: number;
  minPayoutAmount: number;
  createdAt: string;
}

// ── Code generator ───────────────────────────────────────────────────────────

function generateAffiliateCode(userName: string): string {
  const cleanName = userName
    .split(" ")[0]
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/g, "")
    .slice(0, 8);
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cleanName}${suffix}`;
}

function buildAffiliateLink(code: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
  return `${baseUrl}/?ref=${code}`;
}

// ── In-memory dev store ──────────────────────────────────────────────────────

const devProfiles = new Map<string, AffiliateProfile>();

// ── POST — Join an affiliate program ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await req.json();
    const { programId } = body;

    if (!programId) {
      return NextResponse.json(
        { error: "programId est requis" },
        { status: 400 }
      );
    }

    if (DEV_MODE) {
      // Check if user already joined
      const existingKey = `${session.user.id}-${programId}`;
      const existing = devProfiles.get(existingKey);
      if (existing) {
        return NextResponse.json({
          success: true,
          profile: existing,
          message: "Vous etes deja affilie a ce programme",
          alreadyJoined: true,
        });
      }

      const code = generateAffiliateCode(session.user.name || "USER");
      const link = buildAffiliateLink(code);

      const profile: AffiliateProfile = {
        id: `aff-prof-${Date.now().toString(36)}`,
        userId: session.user.id,
        programId,
        affiliateCode: code,
        status: "ACTIVE", // auto-approved for demo
        totalClicks: 0,
        totalConversions: 0,
        totalEarned: 0,
        pendingEarnings: 0,
        affiliateLink: link,
        programName: "Programme Affiliation Principal",
        commissionPercent: 25,
        cookieDays: 30,
        minPayoutAmount: 20,
        createdAt: new Date().toISOString(),
      };

      devProfiles.set(existingKey, profile);

      return NextResponse.json({
        success: true,
        profile,
        message: "Vous avez rejoint le programme d'affiliation avec succes !",
        alreadyJoined: false,
      });
    }

    // Production: Prisma logic
    // const existingProfile = await prisma.affiliateProfile.findUnique({ where: { userId: session.user.id } });
    // if (existingProfile) return NextResponse.json({ ... alreadyJoined });
    // const program = await prisma.affiliateProgram.findUnique({ where: { id: programId } });
    // const code = generateAffiliateCode(session.user.name);
    // const profile = await prisma.affiliateProfile.create({ data: { userId, programId, affiliateCode: code, status: program.autoApprove ? 'ACTIVE' : 'PENDING' } });
    return NextResponse.json({ success: true, profile: null });
  } catch (error) {
    console.error("[POST /api/marketing/affiliate/join]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
