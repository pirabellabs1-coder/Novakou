import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { classifyPaymentOrigin } from "@/lib/formations/payment-origin";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session?.user || (role !== "admin" && role !== "ADMIN")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") ?? "all"; // all, instructeurs, apprenants
    const search = searchParams.get("search") ?? "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    // ── Filtres par RÔLE RÉEL ──────────────────────────────────────────────
    // Un compte n'est pas « instructeur ou apprenant » : il peut vendre ET
    // acheter ET parrainer. On filtre donc sur l'existence du profil concerné,
    // sans supposer qu'un rôle en exclut un autre.
    if (filter === "vendeurs") where.instructeurProfile = { isNot: null };
    if (filter === "mentors") where.mentorProfile = { isNot: null };
    if (filter === "affilies") where.affiliateProfile = { isNot: null };
    if (filter === "clients") {
      where.OR = [
        ...(Array.isArray(where.OR) ? where.OR : []),
        { enrollments: { some: {} } },
        { productPurchases: { some: {} } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      take: 100,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        // Nécessaire au bouton « Réinitialiser 2FA » : sans lui, l'écran ne
        // peut pas savoir sur qui l'action a un sens.
        twoFactorEnabled: true,
        createdAt: true,
        instructeurProfile: {
          select: {
            id: true,
            status: true,
            totalEarned: true,
            formations: { select: { id: true } },
            digitalProducts: { select: { id: true } },
          },
        },
        mentorProfile: { select: { id: true } },
        affiliateProfile: { select: { id: true, affiliateCode: true } },
        enrollments: { select: { id: true, paidAmount: true, stripeSessionId: true } },
        productPurchases: { select: { id: true, paidAmount: true, stripeSessionId: true } },
      },
    });

    const enriched = users.map((u) => {
      // Ventilation par origine réelle : distingue un VRAI client payant d'un
      // compte qui n'a que des accès gratuits/offerts/test.
      const accesses = [...u.enrollments, ...u.productPurchases].map((a) => ({
        amount: a.paidAmount,
        origin: classifyPaymentOrigin(a.stripeSessionId, a.paidAmount),
      }));
      const paidAccesses = accesses.filter((a) => a.origin === "paid");
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        // ── RÔLES CUMULABLES ────────────────────────────────────────────────
        // Un même compte peut vendre, acheter, mentorer et parrainer. Les
        // ranger dans une case unique ferait disparaître les trois autres de
        // l'écran admin — c'est ce qui donnait « instructeur ou apprenant ».
        estVendeur: u.instructeurProfile !== null,
        estMentor: u.mentorProfile !== null,
        estAffilie: u.affiliateProfile !== null,
        estClient: u.enrollments.length + u.productPurchases.length > 0,
        estAdmin: u.role === "ADMIN",
        twoFactorEnabled: u.twoFactorEnabled,
        // Conservé pour ne pas casser un ancien appelant.
        isInstructor: u.instructeurProfile !== null,
        instructorStatus: u.instructeurProfile?.status ?? null,
        productsCount: (u.instructeurProfile?.formations.length ?? 0) + (u.instructeurProfile?.digitalProducts.length ?? 0),
        totalEarned: u.instructeurProfile?.totalEarned ?? 0,
        enrollmentsCount: u.enrollments.length,
        purchasesCount: u.productPurchases.length,
        totalSpent:
          u.enrollments.reduce((s, e) => s + e.paidAmount, 0) +
          u.productPurchases.reduce((s, p) => s + p.paidAmount, 0),
        // Vrai argent encaissé auprès de ce compte (préfixe passerelle).
        hasPaid: paidAccesses.length > 0,
        paidOrdersCount: paidAccesses.length,
        realSpent: paidAccesses.reduce((s, a) => s + a.amount, 0),
        freeAccessCount: accesses.length - paidAccesses.length,
      };
    });

    // Summary
    const [totalUsers, totalVendeurs, totalMentors, totalAffilies, totalClients] = await Promise.all([
      prisma.user.count(),
      prisma.instructeurProfile.count(),
      prisma.mentorProfile.count(),
      prisma.affiliateProfile.count(),
      // Un client, c'est quelqu'un qui a acquis quelque chose — pas
      // « quelqu'un qui n'est pas vendeur », ce qui comptait aussi les
      // comptes inscrits n'ayant jamais rien fait.
      prisma.user.count({
        where: { OR: [{ enrollments: { some: {} } }, { productPurchases: { some: {} } }] },
      }),
    ]);

    return NextResponse.json({
      data: enriched,
      summary: {
        totalUsers,
        totalVendeurs,
        totalMentors,
        totalAffilies,
        totalClients,
        // Anciens noms, conservés le temps que tout le monde bascule.
        totalInstructors: totalVendeurs,
        totalLearners: totalClients,
      },
    });
  } catch (err) {
    console.error("[admin/utilisateurs]", err);
    return NextResponse.json({ data: [], summary: { totalUsers: 0, totalInstructors: 0, totalLearners: 0 } });
  }
}
