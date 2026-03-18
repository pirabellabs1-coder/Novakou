// GET /api/marketing/affiliate — List affiliate programs for the authenticated instructor
// POST /api/marketing/affiliate — Create/update affiliate program

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const DEV_MODE = process.env.DEV_MODE === "true" || process.env.NODE_ENV === "development";

// ── Types ────────────────────────────────────────────────────────────────────

interface AffiliateProgram {
  id: string;
  instructeurId: string;
  name: string;
  commissionPercent: number;
  cookieDays: number;
  isActive: boolean;
  minPayoutAmount: number;
  autoApprove: boolean;
  applyToAll: boolean;
  formationIds: string[];
  productIds: string[];
  totalAffiliates: number;
  totalClicks: number;
  totalConversions: number;
  totalPaidOut: number;
  affiliates: AffiliateProfileSummary[];
  createdAt: string;
  updatedAt: string;
}

interface AffiliateProfileSummary {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  affiliateCode: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  totalClicks: number;
  totalConversions: number;
  totalEarned: number;
  pendingEarnings: number;
  joinedAt: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────

function getMockProgram(): AffiliateProgram {
  return {
    id: "aff-prog-001",
    instructeurId: "inst-001",
    name: "Programme Affiliation Principal",
    commissionPercent: 25,
    cookieDays: 30,
    isActive: true,
    minPayoutAmount: 20,
    autoApprove: true,
    applyToAll: true,
    formationIds: [],
    productIds: [],
    totalAffiliates: 12,
    totalClicks: 3847,
    totalConversions: 142,
    totalPaidOut: 2380,
    affiliates: [
      {
        id: "aff-prof-001",
        userId: "user-aff-001",
        userName: "Aminata Diallo",
        userAvatar: "/images/avatars/default.png",
        affiliateCode: "AMINATA25",
        status: "ACTIVE",
        totalClicks: 1245,
        totalConversions: 58,
        totalEarned: 870,
        pendingEarnings: 145,
        joinedAt: "2025-11-15T10:00:00Z",
      },
      {
        id: "aff-prof-002",
        userId: "user-aff-002",
        userName: "Kofi Mensah",
        userAvatar: "/images/avatars/default.png",
        affiliateCode: "KOFI30",
        status: "ACTIVE",
        totalClicks: 987,
        totalConversions: 41,
        totalEarned: 615,
        pendingEarnings: 98,
        joinedAt: "2025-12-02T14:30:00Z",
      },
      {
        id: "aff-prof-003",
        userId: "user-aff-003",
        userName: "Fatou Sow",
        userAvatar: "/images/avatars/default.png",
        affiliateCode: "FATOU20",
        status: "ACTIVE",
        totalClicks: 756,
        totalConversions: 28,
        totalEarned: 420,
        pendingEarnings: 67,
        joinedAt: "2026-01-10T09:15:00Z",
      },
      {
        id: "aff-prof-004",
        userId: "user-aff-004",
        userName: "Ibrahim Traore",
        userAvatar: "/images/avatars/default.png",
        affiliateCode: "IBRAHIM15",
        status: "PENDING",
        totalClicks: 0,
        totalConversions: 0,
        totalEarned: 0,
        pendingEarnings: 0,
        joinedAt: "2026-03-12T16:45:00Z",
      },
      {
        id: "aff-prof-005",
        userId: "user-aff-005",
        userName: "Claire Dubois",
        userAvatar: "/images/avatars/default.png",
        affiliateCode: "CLAIRE25",
        status: "ACTIVE",
        totalClicks: 542,
        totalConversions: 12,
        totalEarned: 180,
        pendingEarnings: 45,
        joinedAt: "2026-02-05T11:00:00Z",
      },
      {
        id: "aff-prof-006",
        userId: "user-aff-006",
        userName: "Nadia Benali",
        userAvatar: "/images/avatars/default.png",
        affiliateCode: "NADIA20",
        status: "SUSPENDED",
        totalClicks: 317,
        totalConversions: 3,
        totalEarned: 45,
        pendingEarnings: 0,
        joinedAt: "2026-01-25T08:30:00Z",
      },
    ],
    createdAt: "2025-10-01T10:00:00Z",
    updatedAt: "2026-03-15T12:00:00Z",
  };
}

// ── In-memory store for dev mode ─────────────────────────────────────────────

let devProgramStore: AffiliateProgram | null = null;

function getDevProgram(): AffiliateProgram {
  if (!devProgramStore) {
    devProgramStore = getMockProgram();
  }
  return devProgramStore;
}

// ── GET — List affiliate programs ────────────────────────────────────────────

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (DEV_MODE) {
      const program = getDevProgram();
      return NextResponse.json({ programs: [program] });
    }

    // Production: query from Prisma
    // const instructeur = await prisma.instructeurProfile.findUnique({ where: { userId: session.user.id } });
    // const programs = await prisma.affiliateProgram.findMany({ where: { instructeurId: instructeur.id }, include: { affiliates: { include: { user: true } } } });
    return NextResponse.json({ programs: [] });
  } catch (error) {
    console.error("[GET /api/marketing/affiliate]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── POST — Create or update affiliate program ───────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      commissionPercent,
      cookieDays,
      isActive,
      autoApprove,
      applyToAll,
      formationIds,
      productIds,
      minPayoutAmount,
      // Actions on affiliates
      action,
      affiliateId,
    } = body;

    if (DEV_MODE) {
      const program = getDevProgram();

      // Handle affiliate approval/rejection/suspension
      if (action === "approve" && affiliateId) {
        const aff = program.affiliates.find((a) => a.id === affiliateId);
        if (aff) aff.status = "ACTIVE";
        return NextResponse.json({ success: true, program });
      }

      if (action === "reject" && affiliateId) {
        program.affiliates = program.affiliates.filter((a) => a.id !== affiliateId);
        program.totalAffiliates = program.affiliates.length;
        return NextResponse.json({ success: true, program });
      }

      if (action === "suspend" && affiliateId) {
        const aff = program.affiliates.find((a) => a.id === affiliateId);
        if (aff) aff.status = "SUSPENDED";
        return NextResponse.json({ success: true, program });
      }

      if (action === "reactivate" && affiliateId) {
        const aff = program.affiliates.find((a) => a.id === affiliateId);
        if (aff) aff.status = "ACTIVE";
        return NextResponse.json({ success: true, program });
      }

      // Update program settings
      if (name !== undefined) program.name = name;
      if (commissionPercent !== undefined) {
        program.commissionPercent = Math.min(50, Math.max(5, commissionPercent));
      }
      if (cookieDays !== undefined) program.cookieDays = cookieDays;
      if (isActive !== undefined) program.isActive = isActive;
      if (autoApprove !== undefined) program.autoApprove = autoApprove;
      if (applyToAll !== undefined) program.applyToAll = applyToAll;
      if (formationIds !== undefined) program.formationIds = formationIds;
      if (productIds !== undefined) program.productIds = productIds;
      if (minPayoutAmount !== undefined) program.minPayoutAmount = minPayoutAmount;
      program.updatedAt = new Date().toISOString();

      devProgramStore = program;
      return NextResponse.json({ success: true, program });
    }

    // Production: upsert via Prisma
    // const instructeur = await prisma.instructeurProfile.findUnique({ where: { userId: session.user.id } });
    // const program = await prisma.affiliateProgram.upsert({ ... });
    return NextResponse.json({ success: true, program: null });
  } catch (error) {
    console.error("[POST /api/marketing/affiliate]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
