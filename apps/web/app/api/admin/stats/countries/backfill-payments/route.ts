import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { countryFromPhone, getOperator } from "@/lib/payments/registry";
import { toIso2 } from "@/lib/tracking/geo";

/**
 * POST /api/admin/stats/countries/backfill-payments
 *
 * Backfill du pays des comptes existants sans pays, à partir de leurs
 * TENTATIVES DE PAIEMENT — plus précis que l'IP pour des acheteurs Mobile
 * Money. Deux sources par tentative :
 *   1) le numéro E.164 (`visitorPhone`, +225… → CI)
 *   2) l'opérateur choisi (`paymentMethod` = « orange_ci » → CI)
 *
 * Lot borné, relançable jusqu'à épuisement. N'écrit JAMAIS par-dessus un pays
 * déjà renseigné (where country: null).
 */
const BATCH = 200;

/** Déduit un pays ISO-2 d'une tentative (numéro d'abord, opérateur ensuite). */
function countryFromAttempt(a: { visitorPhone: string | null; paymentMethod: string | null }): string | null {
  const fromPhone = toIso2(countryFromPhone(a.visitorPhone));
  if (fromPhone) return fromPhone;
  if (a.paymentMethod) {
    const op = getOperator(a.paymentMethod);
    const fromOp = toIso2(op?.country ?? null);
    if (fromOp) return fromOp;
  }
  return null;
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["admin", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    const check = requireAdminPermission(session, "users.view");
    if (!check.allowed) return check.errorResponse!;

    // Comptes sans pays QUI ONT une tentative exploitable (numéro/opérateur).
    // On restreint via la relation pour ne pas remplir le lot de non-acheteurs
    // (qui n'auraient jamais de pays et bloqueraient la progression du lot).
    const users = await prisma.user.findMany({
      where: {
        country: null,
        checkoutAttempts: {
          some: { OR: [{ visitorPhone: { not: null } }, { paymentMethod: { not: null } }] },
        },
      },
      select: { id: true, email: true },
      take: BATCH,
    });

    if (users.length === 0) {
      // Plus aucun compte dérivable depuis les paiements.
      const remaining = await prisma.user.count({ where: { country: null } });
      return NextResponse.json({ data: { treated: 0, updated: 0, remaining, done: true } });
    }

    let updated = 0;
    for (const u of users) {
      // Une tentative de CE compte (par userId) OU du même e-mail (invité),
      // qui porte un numéro ou un opérateur exploitable, la plus récente.
      const att = await prisma.checkoutAttempt.findFirst({
        where: {
          AND: [
            { OR: [{ userId: u.id }, ...(u.email ? [{ visitorEmail: u.email }] : [])] },
            { OR: [{ visitorPhone: { not: null } }, { paymentMethod: { not: null } }] },
          ],
        },
        orderBy: { createdAt: "desc" },
        select: { visitorPhone: true, paymentMethod: true },
      });
      if (!att) continue;
      const country = countryFromAttempt(att);
      if (!country) continue;
      const res = await prisma.user
        .updateMany({ where: { id: u.id, country: null }, data: { country } })
        .catch(() => ({ count: 0 }));
      updated += res.count;
    }

    const remaining = await prisma.user.count({ where: { country: null } });

    // Fin quand plus aucun compte sans pays, OU quand un lot n'a rien pu
    // déduire (updated === 0) : les comptes restants ne sont pas résolvables
    // depuis les paiements → inutile de reboucler à l'infini.
    return NextResponse.json({
      data: { treated: users.length, updated, remaining, done: remaining === 0 || updated === 0 },
    });
  } catch (err) {
    console.error("[admin/stats/countries/backfill-payments]", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
