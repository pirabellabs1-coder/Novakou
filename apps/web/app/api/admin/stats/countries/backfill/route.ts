import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { lookupIp } from "@/lib/auth/geo-lookup";

/**
 * POST /api/admin/stats/countries/backfill
 *
 * Backfill UNIQUE du pays des comptes existants sans pays, à partir de leur
 * dernière IP connue (`lastLoginIp`). Le géo-lookup (ipapi.co) est rate-limité
 * (~1k/j) : on traite un LOT borné par appel et on dédoublonne par IP. L'admin
 * peut relancer jusqu'à épuisement (la réponse indique le reste).
 */
const BATCH = 150;

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    const check = requireAdminPermission(session, "users.view");
    if (!check.allowed) return check.errorResponse!;

    // Comptes sans pays MAIS avec une IP connue (les autres sont irrécupérables ici).
    const users = await prisma.user.findMany({
      where: { country: null, lastLoginIp: { not: null } },
      select: { id: true, lastLoginIp: true },
      take: BATCH,
    });

    if (users.length === 0) {
      return NextResponse.json({ data: { treated: 0, updated: 0, remaining: 0, done: true } });
    }

    // Dédoublonnage par IP → un seul lookup par IP distincte.
    const ips = [...new Set(users.map((u) => u.lastLoginIp!).filter(Boolean))];
    const ipToCountry = new Map<string, string | null>();
    for (const ip of ips) {
      try {
        const geo = await lookupIp(ip);
        ipToCountry.set(ip, geo.country);
      } catch {
        ipToCountry.set(ip, null);
      }
    }

    let updated = 0;
    for (const u of users) {
      const country = u.lastLoginIp ? ipToCountry.get(u.lastLoginIp) : null;
      if (!country) continue;
      const res = await prisma.user
        .updateMany({ where: { id: u.id, country: null }, data: { country } })
        .catch(() => ({ count: 0 }));
      updated += res.count;
    }

    const remaining = await prisma.user.count({ where: { country: null, lastLoginIp: { not: null } } });

    return NextResponse.json({
      data: { treated: users.length, updated, remaining, done: remaining === 0 },
    });
  } catch (err) {
    console.error("[admin/stats/countries/backfill]", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
