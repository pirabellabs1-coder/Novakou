import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { PLATFORM_COMMISSION_RATE } from "@/lib/formations/constants";

/**
 * POST /api/formations/admin/refund
 *
 * Admin-only endpoint to process refunds for enrollments, digital product
 * purchases, or mentor bookings.
 *
 * Body:
 *   {
 *     type: "enrollment" | "product" | "booking",
 *     id: string,         // enrollment ID, purchase ID, or booking ID
 *     reason: string,     // refund reason (min 10 chars)
 *     partial?: number    // optional partial refund amount (defaults to full)
 *   }
 *
 * What the refund does (atomically via prisma.$transaction):
 *   1. Validates admin session
 *   2. Finds the original transaction and verifies it hasn't been refunded
 *   3. Marks the record as refunded (status / flags)
 *   4. Creates a negative PlatformRevenue entry to reverse commission
 *   5. Reverses affiliate commission if any (status -> CANCELLED)
 *   6. Decrements vendor's totalEarned on InstructeurProfile
 *   7. Decrements studentsCount / salesCount / totalSessions
 *   8. Sends notifications to buyer and seller
 */
export async function POST(request: Request) {
  try {
    // ── Auth: admin only ──────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toString().toUpperCase();
    if (!session?.user || role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acces refuse - admin requis." },
        { status: 403 },
      );
    }
    const adminId = session.user.id as string;

    // ── Parse & validate body ─────────────────────────────────────────
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Corps de requete invalide." }, { status: 400 });
    }

    const { type, id, reason, partial } = body as {
      type?: string;
      id?: string;
      reason?: string;
      partial?: number;
    };

    if (!type || !["enrollment", "product", "booking"].includes(type)) {
      return NextResponse.json(
        { error: "Le champ 'type' est requis (enrollment | product | booking)." },
        { status: 400 },
      );
    }
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Le champ 'id' est requis." },
        { status: 400 },
      );
    }
    if (!reason || typeof reason !== "string" || reason.trim().length < 10) {
      return NextResponse.json(
        { error: "Le champ 'reason' est requis (10 caracteres minimum)." },
        { status: 400 },
      );
    }
    if (partial !== undefined && (typeof partial !== "number" || partial <= 0)) {
      return NextResponse.json(
        { error: "Le montant partiel doit etre un nombre positif." },
        { status: 400 },
      );
    }

    const trimmedReason = reason.trim();

    // ── Dispatch by type ──────────────────────────────────────────────
    if (type === "enrollment") {
      return handleEnrollmentRefund(id, trimmedReason, partial, adminId);
    }
    if (type === "product") {
      return handleProductRefund(id, trimmedReason, partial, adminId);
    }
    if (type === "booking") {
      return handleBookingRefund(id, trimmedReason, partial, adminId);
    }

    return NextResponse.json({ error: "Type inconnu." }, { status: 400 });
  } catch (err) {
    console.error("[admin/refund POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur." },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENROLLMENT REFUND
// ═══════════════════════════════════════════════════════════════════════════════

async function handleEnrollmentRefund(
  enrollmentId: string,
  reason: string,
  partialAmount: number | undefined,
  adminId: string,
) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      formation: {
        select: {
          id: true,
          title: true,
          instructeurId: true,
          instructeur: { select: { id: true, user: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  if (!enrollment) {
    return NextResponse.json({ error: "Inscription introuvable." }, { status: 404 });
  }
  if (enrollment.refundedAt) {
    return NextResponse.json(
      { error: "Cette inscription a deja ete remboursee." },
      { status: 400 },
    );
  }

  const originalAmount = enrollment.paidAmount;
  if (originalAmount <= 0) {
    return NextResponse.json(
      { error: "Inscription gratuite - rien a rembourser." },
      { status: 400 },
    );
  }

  const refundAmount = partialAmount ? Math.min(partialAmount, originalAmount) : originalAmount;
  const refundRatio = refundAmount / originalAmount;
  const isFullRefund = refundAmount >= originalAmount;

  // Find matching PlatformRevenue to compute exact reversal amounts
  const revenue = await prisma.platformRevenue.findFirst({
    where: { orderId: enrollmentId, orderType: "formation" },
  });

  const reversedCommission = revenue
    ? Math.round(revenue.commissionAmount * refundRatio)
    : Math.round(refundAmount * PLATFORM_COMMISSION_RATE);
  const reversedAffiliateAmount = revenue
    ? Math.round(revenue.affiliateAmount * refundRatio)
    : 0;
  const reversedVendorAmount = revenue
    ? Math.round(revenue.vendorAmount * refundRatio)
    : Math.round(refundAmount * (1 - PLATFORM_COMMISSION_RATE));

  // Find affiliate commission to reverse
  const affiliateCommission = await prisma.affiliateCommission.findFirst({
    where: { orderId: enrollmentId, orderType: "formation", status: { not: "CANCELLED" } },
  });

  const instructeurId = enrollment.formation.instructeurId;

  await prisma.$transaction(async (tx) => {
    // 1. Mark enrollment as refunded
    await tx.enrollment.update({
      where: { id: enrollmentId },
      data: {
        refundRequested: true,
        refundReason: reason,
        refundedAt: new Date(),
      },
    });

    // 2. Create RefundRequest record
    await tx.refundRequest.create({
      data: {
        userId: enrollment.userId,
        enrollmentId,
        amount: refundAmount,
        reason,
        status: "APPROVED",
        adminNote: `Remboursement ${isFullRefund ? "total" : "partiel"} par admin.`,
        resolvedAt: new Date(),
        resolvedBy: adminId,
      },
    });

    // 3. Create negative PlatformRevenue entry
    await tx.platformRevenue.create({
      data: {
        orderId: enrollmentId,
        orderType: "formation",
        grossAmount: -refundAmount,
        commissionRate: PLATFORM_COMMISSION_RATE,
        commissionAmount: -reversedCommission,
        vendorAmount: -reversedVendorAmount,
        affiliateId: revenue?.affiliateId ?? null,
        affiliateAmount: -reversedAffiliateAmount,
        paymentRef: `refund_${enrollmentId}`,
        currency: revenue?.currency ?? "XOF",
        instructeurId,
        shopId: revenue?.shopId ?? null,
      },
    });

    // 4. Decrement vendor's totalEarned
    await tx.instructeurProfile.update({
      where: { id: instructeurId },
      data: { totalEarned: { decrement: reversedVendorAmount } },
    });

    // 5. Decrement studentsCount on full refund
    if (isFullRefund) {
      await tx.formation.update({
        where: { id: enrollment.formation.id },
        data: { studentsCount: { decrement: 1 } },
      });
    }

    // 6. Reverse affiliate commission if exists
    if (affiliateCommission) {
      await tx.affiliateCommission.update({
        where: { id: affiliateCommission.id },
        data: { status: "CANCELLED" },
      });

      // If commission was already APPROVED (credited to pendingEarnings), decrement it
      if (affiliateCommission.status === "APPROVED") {
        await tx.affiliateProfile.update({
          where: { id: affiliateCommission.affiliateId },
          data: { pendingEarnings: { decrement: affiliateCommission.commissionAmount } },
        });
      }
      // If commission was PAID, decrement totalEarned + paidEarnings
      if (affiliateCommission.status === "PAID") {
        await tx.affiliateProfile.update({
          where: { id: affiliateCommission.affiliateId },
          data: {
            totalEarned: { decrement: affiliateCommission.commissionAmount },
            paidEarnings: { decrement: affiliateCommission.commissionAmount },
          },
        });
      }
    }

    // 7. Notifications
    // Notify buyer
    await tx.notification.create({
      data: {
        userId: enrollment.userId,
        type: "PAYMENT",
        title: "Remboursement confirme",
        message: `Votre inscription a "${enrollment.formation.title}" a ete remboursee (${Math.round(refundAmount)} FCFA${isFullRefund ? "" : " - partiel"}).`,
        link: "/apprenant/mes-formations",
      },
    });

    // Notify vendor
    const vendorUserId = enrollment.formation.instructeur?.user?.id;
    if (vendorUserId) {
      await tx.notification.create({
        data: {
          userId: vendorUserId,
          type: "PAYMENT",
          title: "Remboursement effectue",
          message: `L'inscription de ${enrollment.user.name ?? enrollment.user.email} a "${enrollment.formation.title}" a ete remboursee (${Math.round(reversedVendorAmount)} FCFA debites). Motif : ${reason}`,
          link: "/vendeur/transactions",
        },
      });
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      type: "enrollment",
      id: enrollmentId,
      refundAmount,
      originalAmount,
      isFullRefund,
      reversedCommission,
      reversedVendorAmount,
      reversedAffiliateAmount,
      affiliateReversed: !!affiliateCommission,
      buyer: enrollment.user.email,
      formation: enrollment.formation.title,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIGITAL PRODUCT REFUND
// ═══════════════════════════════════════════════════════════════════════════════

async function handleProductRefund(
  purchaseId: string,
  reason: string,
  partialAmount: number | undefined,
  _adminId: string,
) {
  const purchase = await prisma.digitalProductPurchase.findUnique({
    where: { id: purchaseId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      product: {
        select: {
          id: true,
          title: true,
          instructeurId: true,
          instructeur: { select: { id: true, user: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  if (!purchase) {
    return NextResponse.json({ error: "Achat introuvable." }, { status: 404 });
  }

  // DigitalProductPurchase has no refundedAt field in schema.
  // Check if a negative PlatformRevenue already exists for this purchase (idempotency guard).
  const existingRefundRevenue = await prisma.platformRevenue.findFirst({
    where: { orderId: purchaseId, orderType: "product", grossAmount: { lt: 0 } },
  });
  if (existingRefundRevenue) {
    return NextResponse.json(
      { error: "Cet achat a deja ete rembourse." },
      { status: 400 },
    );
  }

  const originalAmount = purchase.paidAmount;
  if (originalAmount <= 0) {
    return NextResponse.json(
      { error: "Achat gratuit - rien a rembourser." },
      { status: 400 },
    );
  }

  const refundAmount = partialAmount ? Math.min(partialAmount, originalAmount) : originalAmount;
  const refundRatio = refundAmount / originalAmount;
  const isFullRefund = refundAmount >= originalAmount;

  const revenue = await prisma.platformRevenue.findFirst({
    where: { orderId: purchaseId, orderType: "product", grossAmount: { gt: 0 } },
  });

  const reversedCommission = revenue
    ? Math.round(revenue.commissionAmount * refundRatio)
    : Math.round(refundAmount * PLATFORM_COMMISSION_RATE);
  const reversedAffiliateAmount = revenue
    ? Math.round(revenue.affiliateAmount * refundRatio)
    : 0;
  const reversedVendorAmount = revenue
    ? Math.round(revenue.vendorAmount * refundRatio)
    : Math.round(refundAmount * (1 - PLATFORM_COMMISSION_RATE));

  const affiliateCommission = await prisma.affiliateCommission.findFirst({
    where: { orderId: purchaseId, orderType: "product", status: { not: "CANCELLED" } },
  });

  const instructeurId = purchase.product.instructeurId;

  await prisma.$transaction(async (tx) => {
    // 1. Create negative PlatformRevenue entry
    await tx.platformRevenue.create({
      data: {
        orderId: purchaseId,
        orderType: "product",
        grossAmount: -refundAmount,
        commissionRate: PLATFORM_COMMISSION_RATE,
        commissionAmount: -reversedCommission,
        vendorAmount: -reversedVendorAmount,
        affiliateId: revenue?.affiliateId ?? null,
        affiliateAmount: -reversedAffiliateAmount,
        paymentRef: `refund_${purchaseId}`,
        currency: revenue?.currency ?? "XOF",
        instructeurId,
        shopId: revenue?.shopId ?? null,
      },
    });

    // 2. Decrement vendor's totalEarned
    await tx.instructeurProfile.update({
      where: { id: instructeurId },
      data: { totalEarned: { decrement: reversedVendorAmount } },
    });

    // 3. Decrement salesCount on full refund
    if (isFullRefund) {
      await tx.digitalProduct.update({
        where: { id: purchase.product.id },
        data: { salesCount: { decrement: 1 } },
      });
    }

    // 4. Revoke download access on full refund (set maxDownloads to 0)
    if (isFullRefund) {
      await tx.digitalProductPurchase.update({
        where: { id: purchaseId },
        data: { maxDownloads: 0 },
      });
    }

    // 5. Reverse affiliate commission
    if (affiliateCommission) {
      await tx.affiliateCommission.update({
        where: { id: affiliateCommission.id },
        data: { status: "CANCELLED" },
      });

      if (affiliateCommission.status === "APPROVED") {
        await tx.affiliateProfile.update({
          where: { id: affiliateCommission.affiliateId },
          data: { pendingEarnings: { decrement: affiliateCommission.commissionAmount } },
        });
      }
      if (affiliateCommission.status === "PAID") {
        await tx.affiliateProfile.update({
          where: { id: affiliateCommission.affiliateId },
          data: {
            totalEarned: { decrement: affiliateCommission.commissionAmount },
            paidEarnings: { decrement: affiliateCommission.commissionAmount },
          },
        });
      }
    }

    // 6. Notifications
    await tx.notification.create({
      data: {
        userId: purchase.userId,
        type: "PAYMENT",
        title: "Remboursement confirme",
        message: `Votre achat "${purchase.product.title}" a ete rembourse (${Math.round(refundAmount)} FCFA${isFullRefund ? "" : " - partiel"}).`,
        link: "/apprenant/produits",
      },
    });

    const vendorUserId = purchase.product.instructeur?.user?.id;
    if (vendorUserId) {
      await tx.notification.create({
        data: {
          userId: vendorUserId,
          type: "PAYMENT",
          title: "Remboursement effectue",
          message: `L'achat de ${purchase.user.name ?? purchase.user.email} pour "${purchase.product.title}" a ete rembourse (${Math.round(reversedVendorAmount)} FCFA debites). Motif : ${reason}`,
          link: "/vendeur/transactions",
        },
      });
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      type: "product",
      id: purchaseId,
      refundAmount,
      originalAmount,
      isFullRefund,
      reversedCommission,
      reversedVendorAmount,
      reversedAffiliateAmount,
      affiliateReversed: !!affiliateCommission,
      buyer: purchase.user.email,
      product: purchase.product.title,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MENTOR BOOKING REFUND
// ═══════════════════════════════════════════════════════════════════════════════

async function handleBookingRefund(
  bookingId: string,
  reason: string,
  partialAmount: number | undefined,
  adminId: string,
) {
  const booking = await prisma.mentorBooking.findUnique({
    where: { id: bookingId },
    include: {
      student: { select: { id: true, name: true, email: true } },
      mentor: {
        select: {
          id: true,
          userId: true,
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Reservation introuvable." }, { status: 404 });
  }
  if (booking.escrowStatus === "REFUNDED") {
    return NextResponse.json(
      { error: "Cette reservation a deja ete remboursee." },
      { status: 400 },
    );
  }

  // Cannot refund bookings that were never paid
  const refundableEscrowStates: string[] = ["HELD", "RELEASED"];
  if (!refundableEscrowStates.includes(booking.escrowStatus)) {
    return NextResponse.json(
      { error: `Impossible de rembourser - escrow status: ${booking.escrowStatus}.` },
      { status: 400 },
    );
  }

  const originalAmount = booking.paidAmount;
  if (originalAmount <= 0) {
    return NextResponse.json(
      { error: "Reservation gratuite - rien a rembourser." },
      { status: 400 },
    );
  }

  const refundAmount = partialAmount ? Math.min(partialAmount, originalAmount) : originalAmount;
  const isFullRefund = refundAmount >= originalAmount;

  // For bookings, PlatformRevenue is only created when escrow is RELEASED.
  // If escrow is still HELD, no PlatformRevenue exists yet.
  const revenue = await prisma.platformRevenue.findFirst({
    where: { orderId: bookingId, orderType: "mentor", grossAmount: { gt: 0 } },
  });

  const wasReleased = booking.escrowStatus === "RELEASED";
  let reversedCommission = 0;
  let reversedVendorAmount = 0;

  if (wasReleased && revenue) {
    // Funds were already released to mentor: need to claw back
    const refundRatio = refundAmount / originalAmount;
    reversedCommission = Math.round(revenue.commissionAmount * refundRatio);
    reversedVendorAmount = Math.round(revenue.vendorAmount * refundRatio);
  } else if (wasReleased) {
    // Released but no revenue record (shouldn't happen, but handle gracefully)
    reversedCommission = Math.round(refundAmount * PLATFORM_COMMISSION_RATE);
    reversedVendorAmount = Math.round(refundAmount * (1 - PLATFORM_COMMISSION_RATE));
  }
  // If still HELD, no vendor/commission amounts to reverse (funds never left escrow)

  await prisma.$transaction(async (tx) => {
    // 1. Update booking status
    await tx.mentorBooking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        escrowStatus: "REFUNDED",
        cancellationReason: reason,
        adminDecisionAt: new Date(),
        adminDecisionBy: adminId,
        adminDecisionOutcome: "refund_student",
        adminDecisionNote: `Remboursement admin ${isFullRefund ? "total" : "partiel"} : ${reason}`,
      },
    });

    // 2. If escrow was RELEASED, create negative PlatformRevenue to reverse
    if (wasReleased) {
      await tx.platformRevenue.create({
        data: {
          orderId: bookingId,
          orderType: "mentor",
          grossAmount: -refundAmount,
          commissionRate: PLATFORM_COMMISSION_RATE,
          commissionAmount: -reversedCommission,
          vendorAmount: -reversedVendorAmount,
          affiliateId: null,
          affiliateAmount: 0,
          paymentRef: `refund_${bookingId}`,
          currency: revenue?.currency ?? "XOF",
          instructeurId: null,
          shopId: null,
        },
      });
    }

    // 3. Decrement mentor stats on full refund
    if (isFullRefund) {
      await tx.mentorProfile.update({
        where: { id: booking.mentorId },
        data: { totalSessions: { decrement: 1 } },
      });
    }

    // 4. Notifications
    await tx.notification.create({
      data: {
        userId: booking.studentId,
        type: "PAYMENT",
        title: "Remboursement de session mentor",
        message: `Votre reservation de session mentor a ete remboursee (${Math.round(refundAmount)} FCFA${isFullRefund ? "" : " - partiel"}). Motif : ${reason}`,
        link: "/apprenant/sessions",
      },
    });

    const mentorUserId = booking.mentor.userId;
    await tx.notification.create({
      data: {
        userId: mentorUserId,
        type: "PAYMENT",
        title: "Session remboursee",
        message: `La session avec ${booking.student.name ?? booking.student.email} a ete remboursee par l'admin (${Math.round(refundAmount)} FCFA).${wasReleased ? ` ${Math.round(reversedVendorAmount)} FCFA debites de vos gains.` : ""} Motif : ${reason}`,
        link: "/mentor/rendez-vous",
      },
    });
  });

  return NextResponse.json({
    success: true,
    data: {
      type: "booking",
      id: bookingId,
      refundAmount,
      originalAmount,
      isFullRefund,
      wasReleased,
      reversedCommission,
      reversedVendorAmount,
      buyer: booking.student.email,
      mentorUserId: booking.mentor.userId,
    },
  });
}
