import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { computeHoldStatus, HOLD_PERIOD_HOURS } from "@/lib/formations/escrow";
import { resolveActiveUserId } from "@/lib/formations/active-user";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";

/**
 * GET /api/formations/wallet
 * Returns all wallet balances for the authenticated user across roles:
 * - vendor (instructor): sum of enrollments + product purchases × 95%, split into
 *   released (>24h) and pendingHold (<24h), minus previous vendor withdrawals
 * - mentor: sum of completed bookings × 95%, same 24h hold split, minus withdrawals
 * - affiliate: pendingEarnings
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    // Resolve the real user (by id or email fallback)
    const userId = await resolveActiveUserId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    // ── KYC status (pour bloquer les retraits + afficher banner dans UI) ──
    const kycUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { kyc: true },
    });
    const kycPending = await prisma.kycRequest.findFirst({
      where: { userId, status: "EN_ATTENTE" },
      select: { id: true, documentType: true, createdAt: true },
    });
    const kycStatus = {
      level: kycUser?.kyc ?? 0,
      verified: (kycUser?.kyc ?? 0) >= 2,
      pending: !!kycPending,
      pendingRequest: kycPending,
      requiredLevel: 2,
    };

    // ── Vendor wallet ──
    // 24h escrow hold: funds from recent sales (<24h) are on hold before being withdrawable.
    // Same behavior as the mentor escrow. See lib/formations/escrow.ts.
    const inst = await getOrCreateInstructeur(userId);
    let vendor = null;
    let vendorWithdrawals: Array<{
      id: string;
      amount: number;
      method: string;
      status: string;
      createdAt: Date;
      processedAt: Date | null;
      refusedReason: string | null;
    }> = [];
    if (inst) {
      // Fetch all paid sales for this vendor (enrollments + digital product purchases).
      // We use createdAt as the sale timestamp (Option A — no extra DB field).
      const [enrollments, productSales] = await Promise.all([
        prisma.enrollment.findMany({
          where: {
            formation: { instructeurId: inst.id },
            refundedAt: null,
          },
          select: { paidAmount: true, createdAt: true },
        }),
        prisma.digitalProductPurchase.findMany({
          where: { product: { instructeurId: inst.id } },
          select: { paidAmount: true, createdAt: true },
        }),
      ]);

      const allSales = [
        ...enrollments.map((e) => ({ paidAmount: e.paidAmount, timestamp: e.createdAt })),
        ...productSales.map((p) => ({ paidAmount: p.paidAmount, timestamp: p.createdAt })),
      ];
      const { grossReleased, grossPending, netReleased, netPending } =
        computeHoldStatus(allSales);

      // Subtract pending + treated withdrawals from the net released amount.
      // Vendor withdrawals are those WITHOUT `_mentor` suffix (mentor retraits use the suffix).
      const allVendorW = await prisma.instructorWithdrawal.findMany({
        where: {
          instructeurId: inst.id,
          NOT: { method: { endsWith: "_mentor" } },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          method: true,
          status: true,
          createdAt: true,
          processedAt: true,
          refusedReason: true,
        },
      });
      vendorWithdrawals = allVendorW.slice(0, 20);
      const withdrawnPending = allVendorW
        .filter((w) => w.status === "EN_ATTENTE")
        .reduce((s, w) => s + w.amount, 0);
      const withdrawnTreated = allVendorW
        .filter((w) => w.status === "TRAITE")
        .reduce((s, w) => s + w.amount, 0);
      const withdrawn = withdrawnPending + withdrawnTreated;

      // Only released funds can be withdrawn
      const available = Math.max(0, netReleased - withdrawn);

      vendor = {
        instructeurId: inst.id,
        // Historical cumulative field kept for compatibility
        totalEarned: inst.totalEarned,
        // New escrow-aware fields
        gross: grossReleased + grossPending,
        netEarned: netReleased + netPending,
        available,                         // retirable maintenant
        pendingHold: netPending,           // en attente 24h (net)
        holdPeriodHours: HOLD_PERIOD_HOURS, // pour afficher dans l'UI
        withdrawnPending,
        withdrawnTreated,
        withdrawn,                         // legacy alias = pending+treated
        currency: "XOF",
      };
    }

    // ── Mentor wallet ──
    const mentor = await prisma.mentorProfile.findUnique({ where: { userId } });
    let mentorWallet = null;
    let mentorWithdrawals: Array<{
      id: string;
      amount: number;
      method: string;
      status: string;
      refusedReason: string | null;
      processedAt: Date | null;
      createdAt: Date;
    }> = [];
    if (mentor) {
      // ── Semantique escrow (source unique de verite) ──
      //   "Gains bruts"     = sessions RELEASED uniquement (argent acquis, session terminee)
      //   "Gains nets"      = 95% des gains bruts
      //   "Fonds en attente"= sessions HELD (PENDING/CONFIRMED/COMPLETED pas encore liberes)
      //   "Solde dispo"     = netReleased - retraits
      //   "En dispute"      = sessions DISPUTED (bloquees, en attente admin)
      const allBookings = await prisma.mentorBooking.findMany({
        where: {
          mentorId: mentor.id,
          escrowStatus: { in: ["HELD", "RELEASED", "DISPUTED"] },
        },
        select: {
          paidAmount: true,
          escrowStatus: true,
          status: true,
          completedAt: true,
          escrowReleasedAt: true,
          updatedAt: true,
        },
      });

      const RATE = 0.95;
      const heldBookings = allBookings.filter((b) => b.escrowStatus === "HELD");
      const releasedBookings = allBookings.filter((b) => b.escrowStatus === "RELEASED");
      const disputedBookings = allBookings.filter((b) => b.escrowStatus === "DISPUTED");

      const grossPending = heldBookings.reduce((s, b) => s + b.paidAmount, 0);
      const grossReleased = releasedBookings.reduce((s, b) => s + b.paidAmount, 0);
      const grossDisputed = disputedBookings.reduce((s, b) => s + b.paidAmount, 0);
      const netPending = Math.round(grossPending * RATE);
      const netReleased = Math.round(grossReleased * RATE);
      const netDisputed = Math.round(grossDisputed * RATE);
      const completed = releasedBookings; // only truly acquired count

      // Mentor withdrawals live in InstructorWithdrawal with `_mentor` suffix on method
      const inst = await prisma.instructeurProfile.findUnique({ where: { userId } });
      let withdrawnPending = 0;
      let withdrawnTreated = 0;
      if (inst) {
        const allMentorW = await prisma.instructorWithdrawal.findMany({
          where: {
            instructeurId: inst.id,
            method: { endsWith: "_mentor" },
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            refusedReason: true,
            processedAt: true,
            createdAt: true,
          },
        });
        mentorWithdrawals = allMentorW;
        withdrawnPending = allMentorW
          .filter((w) => w.status === "EN_ATTENTE")
          .reduce((s, w) => s + w.amount, 0);
        withdrawnTreated = allMentorW
          .filter((w) => w.status === "TRAITE")
          .reduce((s, w) => s + w.amount, 0);
      }
      // Only released funds can be withdrawn
      const available = Math.max(0, netReleased - withdrawnPending - withdrawnTreated);

      mentorWallet = {
        mentorId: mentor.id,
        totalSessions: completed.length,
        // Gains reellement acquis (sessions RELEASED uniquement)
        gross: grossReleased,
        netEarned: netReleased,
        available,                          // retirable maintenant = netReleased - retraits
        // En attente (escrow HELD) : paye mais pas encore libere
        pendingHold: netPending,
        pendingGross: grossPending,
        pendingSessions: heldBookings.length,
        // Dispute (bloque en attente admin)
        disputedHold: netDisputed,
        disputedGross: grossDisputed,
        disputedSessions: disputedBookings.length,
        holdPeriodHours: HOLD_PERIOD_HOURS,
        withdrawnPending,
        withdrawnTreated,
        currency: "XOF",
      };
    }

    // ── Affiliate wallet ──
    const affiliateProfile = await prisma.affiliateProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        affiliateCode: true,
        totalClicks: true,
        totalConversions: true,
        totalEarned: true,
        pendingEarnings: true,
        status: true,
      },
    });

    return NextResponse.json({
      data: {
        vendor,
        vendorWithdrawals,
        mentor: mentorWallet,
        mentorWithdrawals,
        affiliate: affiliateProfile,
        kyc: kycStatus,
      },
    });
  } catch (err) {
    console.error("[wallet GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/formations/wallet
 * Request a withdrawal.
 *
 * Body: {
 *   amount: number,
 *   method: "orange_money" | "wave" | "mtn" | "moov" | "bank" | "paypal",
 *   accountDetails: { phone?, email?, iban?, bankName?, accountHolder? },
 *   source?: "vendor" | "mentor" (default "vendor")
 * }
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    // Resolve real user
    const userId = await resolveActiveUserId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json();
    const amount = Number(body.amount);
    const method: string = body.method;
    const accountDetails = body.accountDetails ?? {};
    const source: "vendor" | "mentor" = body.source === "mentor" ? "mentor" : "vendor";

    if (!amount || amount < 1000) {
      return NextResponse.json({ error: "Montant minimum : 1 000 FCFA" }, { status: 400 });
    }
    if (!method) {
      return NextResponse.json({ error: "Méthode de retrait requise" }, { status: 400 });
    }

    // ── KYC CHECK : obligatoire pour tout retrait (vendeur ou mentor) ──
    // Niveau 2 minimum requis (pièce d'identité vérifiée par admin)
    const kycUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { kyc: true },
    });
    const KYC_REQUIRED_LEVEL = 2;
    if (!kycUser || (kycUser.kyc ?? 0) < KYC_REQUIRED_LEVEL) {
      return NextResponse.json(
        {
          error: "Vérification KYC requise avant tout retrait",
          detail: "Vous devez soumettre vos documents d'identité et attendre la validation admin.",
          requiredLevel: KYC_REQUIRED_LEVEL,
          currentLevel: kycUser?.kyc ?? 0,
          action: "SUBMIT_KYC",
        },
        { status: 403 },
      );
    }

    if (source === "vendor") {
      const inst = await getOrCreateInstructeur(userId);
      if (!inst)
        return NextResponse.json({ error: "Profil vendeur introuvable" }, { status: 404 });

      // Recompute the released (withdrawable) net amount using the same 24h hold logic as GET.
      const [enrollments, productSales] = await Promise.all([
        prisma.enrollment.findMany({
          where: {
            formation: { instructeurId: inst.id },
            refundedAt: null,
          },
          select: { paidAmount: true, createdAt: true },
        }),
        prisma.digitalProductPurchase.findMany({
          where: { product: { instructeurId: inst.id } },
          select: { paidAmount: true, createdAt: true },
        }),
      ]);
      const { netReleased } = computeHoldStatus([
        ...enrollments.map((e) => ({ paidAmount: e.paidAmount, timestamp: e.createdAt })),
        ...productSales.map((p) => ({ paidAmount: p.paidAmount, timestamp: p.createdAt })),
      ]);

      // Subtract previous vendor withdrawals (without the `_mentor` suffix).
      const wAgg = await prisma.instructorWithdrawal.aggregate({
        where: {
          instructeurId: inst.id,
          NOT: { method: { endsWith: "_mentor" } },
          status: { in: ["EN_ATTENTE", "TRAITE"] },
        },
        _sum: { amount: true },
      });
      const available = Math.max(0, netReleased - (wAgg._sum.amount ?? 0));
      if (amount > available) {
        return NextResponse.json(
          { error: `Solde insuffisant. Disponible : ${Math.round(available)} FCFA (les ventes de moins de ${HOLD_PERIOD_HOURS}h sont en attente).` },
          { status: 400 }
        );
      }

      const withdrawal = await prisma.instructorWithdrawal.create({
        data: {
          instructeurId: inst.id,
          amount,
          method,
          accountDetails,
          status: "EN_ATTENTE",
        },
      });

      // In-app notification for the user
      await prisma.notification.create({
        data: {
          userId,
          type: "PAYMENT",
          title: "Demande de retrait enregistrée",
          message: `Votre retrait de ${Math.round(amount)} FCFA via ${method} est en cours de traitement (24-48h ouvrées).`,
          link: "/vendeur/transactions",
        },
      }).catch(() => null);

      return NextResponse.json({ data: withdrawal });
    }

    // Mentor withdrawal — reuse the same table tagging with method prefix
    if (source === "mentor") {
      const mentor = await prisma.mentorProfile.findUnique({ where: { userId } });
      if (!mentor)
        return NextResponse.json({ error: "Profil mentor introuvable" }, { status: 404 });

      // Need an instructeurProfile to write into the existing withdrawal table
      // (schema constraint). If user has none, create a stub.
      let inst = await prisma.instructeurProfile.findUnique({ where: { userId } });
      if (!inst) {
        inst = await prisma.instructeurProfile.create({
          data: { userId, status: "APPROUVE" },
        });
      }

      // 24h escrow hold: only sessions completed >24h ago are withdrawable.
      const completed = await prisma.mentorBooking.findMany({
        where: { mentorId: mentor.id, status: "COMPLETED" },
        select: { paidAmount: true, completedAt: true, updatedAt: true },
      });
      const { netReleased: available } = computeHoldStatus(
        completed.map((b) => ({
          paidAmount: b.paidAmount,
          timestamp: b.completedAt ?? b.updatedAt,
        }))
      );

      // Subtract previous mentor withdrawals (tagged with method having `_mentor` suffix)
      const wAgg = await prisma.instructorWithdrawal.aggregate({
        where: {
          instructeurId: inst.id,
          method: { endsWith: "_mentor" },
          status: { in: ["EN_ATTENTE", "TRAITE"] },
        },
        _sum: { amount: true },
      });
      const remaining = available - (wAgg._sum.amount ?? 0);

      if (amount > remaining) {
        return NextResponse.json(
          { error: `Solde mentor insuffisant. Disponible : ${remaining} FCFA (les séances terminées depuis moins de ${HOLD_PERIOD_HOURS}h sont en attente).` },
          { status: 400 }
        );
      }

      const withdrawal = await prisma.instructorWithdrawal.create({
        data: {
          instructeurId: inst.id,
          amount,
          method: `${method}_mentor`,
          accountDetails,
          status: "EN_ATTENTE",
        },
      });

      await prisma.notification.create({
        data: {
          userId,
          type: "PAYMENT",
          title: "Retrait mentor enregistré",
          message: `Votre retrait de ${Math.round(amount)} FCFA via ${method} est en cours de traitement.`,
          link: "/mentor/dashboard",
        },
      }).catch(() => null);

      return NextResponse.json({ data: withdrawal });
    }

    return NextResponse.json({ error: "Source invalide" }, { status: 400 });
  } catch (err) {
    console.error("[wallet POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
