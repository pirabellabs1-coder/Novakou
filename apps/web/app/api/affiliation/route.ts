import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

// Affiliation data — tiers are reference data, user-specific data starts empty
const DEMO_AFFILIATION = {
  referralLink: "",
  currentTier: "bronze",
  totalReferrals: 0,
  totalEarnings: 0,
  conversionRate: 0,
  progressToNext: 0,
  nextTier: "argent",
  nextTierThreshold: 10,
  tiers: [
    {
      id: "bronze", name: "Bronze", range: "0-10 parrainages", icon: "emoji_events",
      gradient: "from-amber-700 to-amber-900", status: "current" as const, statusLabel: "Actuel",
      benefits: ["Commission standard", "Acces communaute"],
    },
    {
      id: "argent", name: "Argent", range: "11-50 parrainages", icon: "military_tech",
      gradient: "from-slate-300 to-slate-500", status: "locked" as const, statusLabel: "Verrouille",
      benefits: ["Commission +2%", "Support prioritaire"],
    },
    {
      id: "or", name: "Or", range: "51-100 parrainages", icon: "workspace_premium",
      gradient: "from-yellow-400 to-amber-600", status: "locked" as const, statusLabel: "Verrouille",
      benefits: ["Commission +5%", "Badge profil exclusif", "Webinaires VIP"],
    },
    {
      id: "ambassadeur", name: "Ambassadeur", range: "100+ parrainages", icon: "diamond",
      gradient: "from-cyan-300 to-blue-500", status: "locked" as const, statusLabel: "Verrouille",
      benefits: ["Recompenses Cash VIP", "Evenements physiques", "Conseil consultatif"],
    },
  ],
  rewards: [] as { id: string; reward: string; date: string; status: "verse" | "active" | "en_attente"; value: string }[],
  invitedFriends: [] as { id: string; name: string; date: string; gender: string; status: "active" | "pending" }[],
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }

  return NextResponse.json(DEMO_AFFILIATION);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }

  const body = await request.json();

  if (body.action === "invite") {
    return NextResponse.json({ success: true, message: `Invitation envoyee a ${body.email}` });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
