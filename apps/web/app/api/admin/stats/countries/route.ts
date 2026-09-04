import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { toIso2, countryName } from "@/lib/tracking/geo";

/**
 * GET /api/admin/stats/countries
 *
 * Répartition des comptes PAR PAYS : total utilisateurs, vendeurs (avec profil
 * instructeur), acheteurs (au moins un achat/inscription). Les valeurs `country`
 * hétérogènes (code ISO « CI » ou nom « Côte d'Ivoire ») sont normalisées en
 * code ISO-2 et fusionnées ; sans pays → « Inconnu ».
 */
type Row = { code: string; name: string; users: number; vendors: number; buyers: number };

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    const check = requireAdminPermission(session, "users.view");
    if (!check.allowed) return check.errorResponse!;

    const [usersG, vendorsG, buyersG] = await Promise.all([
      prisma.user.groupBy({ by: ["country"], _count: { _all: true } }),
      prisma.user.groupBy({
        by: ["country"],
        where: { instructeurProfile: { isNot: null } },
        _count: { _all: true },
      }),
      prisma.user.groupBy({
        by: ["country"],
        where: { OR: [{ enrollments: { some: {} } }, { productPurchases: { some: {} } }] },
        _count: { _all: true },
      }),
    ]);

    const map = new Map<string, Row>();
    const bump = (raw: string | null, field: "users" | "vendors" | "buyers", n: number) => {
      const code = toIso2(raw) ?? "??";
      let e = map.get(code);
      if (!e) {
        e = { code, name: code === "??" ? "Inconnu" : countryName(code), users: 0, vendors: 0, buyers: 0 };
        map.set(code, e);
      }
      e[field] += n;
    };
    for (const g of usersG) bump(g.country, "users", g._count._all);
    for (const g of vendorsG) bump(g.country, "vendors", g._count._all);
    for (const g of buyersG) bump(g.country, "buyers", g._count._all);

    const data = [...map.values()].sort((a, b) => b.users - a.users);
    const totals = data.reduce(
      (t, r) => ({ users: t.users + r.users, vendors: t.vendors + r.vendors, buyers: t.buyers + r.buyers }),
      { users: 0, vendors: 0, buyers: 0 },
    );
    return NextResponse.json({ data, totals });
  } catch (err) {
    console.error("[admin/stats/countries]", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
