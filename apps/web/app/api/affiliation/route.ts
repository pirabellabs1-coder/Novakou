import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { headers } from "next/headers";
import fs from "fs";
import path from "path";

// ── Persistence ──
const DEV_DIR = path.join(process.cwd(), "lib", "dev");
const AFFILIATIONS_FILE = path.join(DEV_DIR, "affiliations.json");

function ensureDir() {
  if (!fs.existsSync(DEV_DIR)) fs.mkdirSync(DEV_DIR, { recursive: true });
}

interface StoredAffiliation {
  id: string;
  email: string;
  name: string;
  gender: string;
  date: string;
  status: "active" | "pending";
  message?: string;
}

function readAffiliations(): StoredAffiliation[] {
  try {
    if (!fs.existsSync(AFFILIATIONS_FILE)) return [];
    return JSON.parse(fs.readFileSync(AFFILIATIONS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeAffiliations(data: StoredAffiliation[]) {
  ensureDir();
  fs.writeFileSync(AFFILIATIONS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ── Tier logic ──
const TIERS = [
  {
    id: "bronze", name: "Bronze", range: "0-10 parrainages", icon: "emoji_events",
    gradient: "from-amber-700 to-amber-900", threshold: 0,
    benefits: ["Commission standard", "Acces communaute"],
  },
  {
    id: "argent", name: "Argent", range: "11-50 parrainages", icon: "military_tech",
    gradient: "from-slate-300 to-slate-500", threshold: 11,
    benefits: ["Commission +2%", "Support prioritaire"],
  },
  {
    id: "or", name: "Or", range: "51-100 parrainages", icon: "workspace_premium",
    gradient: "from-yellow-400 to-amber-600", threshold: 51,
    benefits: ["Commission +5%", "Badge profil exclusif", "Webinaires VIP"],
  },
  {
    id: "ambassadeur", name: "Ambassadeur", range: "100+ parrainages", icon: "diamond",
    gradient: "from-cyan-300 to-blue-500", threshold: 100,
    benefits: ["Recompenses Cash VIP", "Evenements physiques", "Conseil consultatif"],
  },
];

function computeTier(totalReferrals: number) {
  let currentTier = TIERS[0];
  for (const tier of TIERS) {
    if (totalReferrals >= tier.threshold) currentTier = tier;
  }
  const currentIdx = TIERS.indexOf(currentTier);
  const nextTier = currentIdx < TIERS.length - 1 ? TIERS[currentIdx + 1] : null;
  const nextThreshold = nextTier ? nextTier.threshold : currentTier.threshold;
  const progressRange = nextTier ? nextThreshold - currentTier.threshold : 1;
  const progressInRange = totalReferrals - currentTier.threshold;
  const progressToNext = nextTier ? Math.min(100, Math.round((progressInRange / progressRange) * 100)) : 100;

  return {
    currentTier: currentTier.id,
    nextTier: nextTier?.id || currentTier.id,
    nextTierThreshold: nextThreshold,
    progressToNext,
    tiers: TIERS.map((t) => {
      let status: "unlocked" | "current" | "locked";
      let statusLabel: string;
      if (t.id === currentTier.id) { status = "current"; statusLabel = "Actuel"; }
      else if (totalReferrals >= t.threshold) { status = "unlocked"; statusLabel = "Debloque"; }
      else { status = "locked"; statusLabel = "Verrouille"; }
      return { id: t.id, name: t.name, range: t.range, icon: t.icon, gradient: t.gradient, status, statusLabel, benefits: t.benefits };
    }),
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }

  const affiliations = readAffiliations();
  const totalReferrals = affiliations.length;
  const activeReferrals = affiliations.filter((a) => a.status === "active").length;
  const conversionRate = totalReferrals > 0 ? Math.round((activeReferrals / totalReferrals) * 100) : 0;
  const totalEarnings = activeReferrals * 5; // 5 EUR per active referral

  // Generate referral link from origin
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") || "http";
  const origin = `${proto}://${host}`;
  const referralLink = `${origin}/inscription?ref=${session.user.id}`;

  const tierData = computeTier(totalReferrals);

  // Compute rewards from active affiliations
  const rewards = affiliations
    .filter((a) => a.status === "active")
    .map((a) => ({
      id: "r-" + a.id,
      reward: `Bonus parrainage — ${a.name}`,
      date: a.date,
      status: "verse" as const,
      value: "5 EUR",
    }));

  const invitedFriends = affiliations.map((a) => ({
    id: a.id,
    name: a.name,
    date: new Date(a.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    gender: a.gender,
    status: a.status,
  }));

  return NextResponse.json({
    referralLink,
    ...tierData,
    totalReferrals,
    totalEarnings,
    conversionRate,
    rewards,
    invitedFriends,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }

  const body = await request.json();

  if (body.action === "invite") {
    const email = String(body.email || "").trim();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const affiliations = readAffiliations();

    // Check duplicate
    if (affiliations.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ error: "Cette personne a deja ete invitee" }, { status: 400 });
    }

    // Generate a display name from the email
    const namePart = email.split("@")[0].replace(/[._-]/g, " ");
    const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);

    const newAffiliation: StoredAffiliation = {
      id: "aff" + Date.now(),
      email,
      name,
      gender: "m",
      date: new Date().toISOString(),
      status: "pending",
      message: body.message || undefined,
    };

    affiliations.push(newAffiliation);
    writeAffiliations(affiliations);

    return NextResponse.json({ success: true, message: `Invitation envoyee a ${email}` });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
