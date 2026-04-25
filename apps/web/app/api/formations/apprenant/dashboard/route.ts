import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const [enrollments, productPurchases, certificates, cartItems, mentorBookings] =
      await Promise.allSettled([
        prisma.enrollment.findMany({
          where: { userId },
          include: {
            formation: {
              select: {
                title: true,
                thumbnail: true,
                customCategory: true,
                level: true,
                duration: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.digitalProductPurchase.findMany({ where: { userId } }),
        prisma.certificate.findMany({ where: { userId } }),
        prisma.cartItem.findMany({ where: { userId } }),
        prisma.mentorBooking.findMany({
          where: {
            studentId: userId,
            status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
          },
          select: { status: true, paidAmount: true },
        }),
      ]);

    const enrollmentList   = enrollments.status      === "fulfilled" ? enrollments.value      : [];
    const productList      = productPurchases.status === "fulfilled" ? productPurchases.value : [];
    const certList         = certificates.status     === "fulfilled" ? certificates.value     : [];
    const cartList         = cartItems.status        === "fulfilled" ? cartItems.value        : [];
    const mentorBookingList = mentorBookings.status  === "fulfilled" ? mentorBookings.value   : [];

    // Compute stats
    const totalSpent =
      enrollmentList.reduce((a, e) => a + e.paidAmount, 0) +
      productList.reduce((a, p) => a + p.paidAmount, 0) +
      mentorBookingList
        .filter((b) => b.status === "COMPLETED" || b.status === "CONFIRMED")
        .reduce((a, b) => a + b.paidAmount, 0);

    const inProgress = enrollmentList.filter((e) => e.progress > 0 && e.progress < 100).length;
    const completed  = enrollmentList.filter((e) => e.completedAt !== null).length;

    // Weekly activity — last 7 days, count completed lessons per day
    let weeklyActivity: { day: string; minutesStudied: number }[] = [];
    try {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      });
      const progressRecords = await prisma.lessonProgress.findMany({
        where: {
          enrollment: { userId },
          completed: true,
          completedAt: { gte: days[0] },
        },
        select: { completedAt: true },
      });
      const labels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
      weeklyActivity = days.map((d, i) => {
        const count = progressRecords.filter((p) => {
          if (!p.completedAt) return false;
          return new Date(p.completedAt).toDateString() === d.toDateString();
        }).length;
        return {
          day: labels[d.getDay() === 0 ? 6 : d.getDay() - 1] ?? labels[i],
          minutesStudied: count * 15, // ~15 min per lesson as estimate
        };
      });
    } catch {
      weeklyActivity = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => ({
        day,
        minutesStudied: 0,
      }));
    }

    return NextResponse.json({
      user: {
        id: userId,
        name: session?.user?.name ?? "Utilisateur",
        email: session?.user?.email ?? "",
        image: session?.user?.image ?? null,
        formationsRole: (session?.user as Record<string, unknown>)?.formationsRole ?? "apprenant",
      },
      stats: {
        totalEnrollments: enrollmentList.length,
        inProgress,
        completed,
        totalProducts: productList.length,
        totalCertificates: certList.length,
        cartCount: cartList.length,
        mentorSessions: mentorBookingList.length,
        mentorSessionsUpcoming: mentorBookingList.filter(
          (b) => b.status === "PENDING" || b.status === "CONFIRMED",
        ).length,
        mentorSessionsCompleted: mentorBookingList.filter((b) => b.status === "COMPLETED").length,
        totalSpentXof: Math.round(totalSpent),
        totalSpentEur: Math.round(totalSpent / 655.957),
      },
      recentEnrollments: enrollmentList.slice(0, 3),
      weeklyActivity,
    });
  } catch (err) {
    console.error("[dashboard/route]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
