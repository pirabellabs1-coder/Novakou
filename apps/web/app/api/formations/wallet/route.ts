import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { computeHoldStatus, HOLD_PERIOD_HOURS } from "@/lib/formations/escrow";
import { resolveActiveUserId } from "@/lib/formations/active-user";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";
import { getActiveShopId } from "@/lib/formations/active-shop";
import { VENDOR_NET_RATE } from "@/lib/formations/constants";
import {
  getPayoutMethod,
  normalizeMsisdn,
  resolveLegacyMethod,
} from "@/lib/moneroo-payout-methods";

/**
 * GET /api/formations/wallet
 * Returns all wallet balances for the authenticated user across roles:
 * - vendor (instructor): sum of enrollments + product purchases × 90%, split into
 *   released (>24h) and pendingHold (<24h), minus previous vendor withdrawals
 * - mentor: sum of completed bookings × 90%, same 24h hold split, minus withdrawals
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
      // Multi-shop : per-shop wallet — filter sales by active shop's products
      const activeShopId = await getActiveShopId(session, {
        devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
      });

      // Multi-shop wallet :
      // On lit PlatformRevenue (qui contient déjà vendorAmount = brut - 10% - commission affilié)
      // → la part vendeur est exacte même quand un affilié est intervenu.
      const revenueRows = await prisma.platformRevenue.findMany({
        where: {
          instructeurId: inst.id,
          orderType: { in: ["formation", "product"] },
          ...(activeShopId ? { shopId: activeShopId } : {}),
        },
        select: {
          vendorAmount: true,
          grossAmount: true,
          affiliateAmount: true,
          createdAt: true,
        },
      });

      // computeHoldStatus s'applique sur le NET vendeur (vendorAmount), pas sur le brut
      // car le brut inclut la commission affilié qui ne revient pas au vendeur.
      const allSales = revenueRows.map((r) => ({
        paidAmount: r.vendorAmount, // déjà net pour le vendeur
        timestamp: r.createdAt,
      }));
      // computeHoldStatus retourne netReleased/netPending = paidAmount × VENDOR_NET_RATE (interne)
      // Or paidAmount EST DÉJÀ le net vendeur. On override le calcul.
      const HOLD_MS = 24 * 3_600_000;
      let grossReleased = 0;
      let grossPending = 0;
      const now = Date.now();
      for (const s of allSales) {
        const age = now - new Date(s.timestamp).getTime();
        if (age >= HOLD_MS) grossReleased += s.paidAmount;
        else grossPending += s.paidAmount;
      }
      const netReleased = grossReleased;
      const netPending = grossPending;

      // Subtract withdrawals — also filtered to the active shop
      const allVendorW = await prisma.instructorWithdrawal.findMany({
        where: {
          instructeurId: inst.id,
          NOT: { method: { endsWith: "_mentor" } },
          ...(activeShopId ? { shopId: activeShopId } : {}),
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
      //   "Gains nets"      = 90% des gains bruts
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

      const RATE = VENDOR_NET_RATE;
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
    let method: string = body.method;
    let accountDetails = body.accountDetails ?? {};
    const source: "vendor" | "mentor" = body.source === "mentor" ? "mentor" : "vendor";

    if (!amount || amount < 1000) {
      return NextResponse.json({ error: "Montant minimum : 1 000 FCFA" }, { status: 400 });
    }

    // Si la méthode ou les détails ne sont pas fournis, on utilise le compte
    // marqué « principal » dans les paramètres de paiement du vendeur
    // (/vendeur/parametres → Paiements → Comptes de retrait).
    if (source === "vendor" && (!method || !accountDetails || Object.keys(accountDetails).length === 0)) {
      try {
        const inst = await prisma.instructeurProfile.findUnique({
          where: { userId },
          select: { payoutMethods: true },
        });
        const methods = (inst?.payoutMethods as Array<{
          method: string;
          primary?: boolean;
          phone?: string;
          iban?: string;
          email?: string;
        }> | null) ?? [];
        const primary = methods.find((m) => m.primary) ?? methods[0];
        if (primary) {
          if (!method) method = primary.method;
          if (!accountDetails || Object.keys(accountDetails).length === 0) {
            accountDetails = {
              phone: primary.phone,
              iban: primary.iban,
              email: primary.email,
            };
          }
        }
      } catch { /* fall through */ }
    }

    if (!method) {
      return NextResponse.json(
        { error: "Méthode de retrait requise. Configurez un compte principal dans Paramètres → Paiements." },
        { status: 400 },
      );
    }

    // ── Normaliser la méthode vers un code Moneroo valide ────────────────────
    // Les anciens enregistrements utilisent "orange_money", "wave"... on les
    // résout selon le pays du user en "orange_money_ci" / "wave_sn" / etc.
    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true },
    });
    const userCountry = userInfo?.country ?? null;
    const monerooMethod = getPayoutMethod(method)
      ? method
      : resolveLegacyMethod(method, userCountry);
    if (monerooMethod) {
      method = monerooMethod;
      const def = getPayoutMethod(method);
      if (def) {
        // Normaliser les champs legacy (phone -> msisdn) + valider
        const details = accountDetails as Record<string, unknown>;
        // Si on reçoit "phone" legacy, on le convertit en msisdn
        if (!details.msisdn && (details.phone || details.phone_number)) {
          details.msisdn = normalizeMsisdn(String(details.phone ?? details.phone_number), method);
        }
        // Re-normaliser msisdn si present (digits only, sans +)
        if (details.msisdn) {
          details.msisdn = normalizeMsisdn(String(details.msisdn), method);
        }
        const missing = def.requiredFields.filter(
          (f) => !details[f] || !String(details[f]).trim(),
        );
        if (missing.length > 0) {
          return NextResponse.json(
            {
              error: `Coordonnées incomplètes pour ${def.label}. Champs manquants : ${missing.join(", ")}`,
              code: "MISSING_FIELDS",
              missingFields: missing,
            },
            { status: 400 },
          );
        }
        if (amount < def.minAmount) {
          return NextResponse.json(
            { error: `Montant minimum pour ${def.label} : ${def.minAmount} ${def.currency}` },
            { status: 400 },
          );
        }
        accountDetails = details;
      }
    }
    // Si method reste non reconnu (bank_transfer sans mapping exact), on laisse passer
    // — l'admin pourra traiter manuellement.

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

      // Multi-shop : compute available + record withdrawal scoped to the active shop
      const activeShopId = await getActiveShopId(session, {
        devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
      });

      // ── RESTRICTION OWNER : seul le propriétaire de la boutique peut retirer ──
      // Les collaborateurs (MANAGER, EDITOR) n'ont PAS accès aux retraits.
      if (activeShopId) {
        const { getShopRole } = await import("@/lib/formations/team");
        const role = await getShopRole(activeShopId, userId);
        if (role !== "OWNER") {
          return NextResponse.json(
            {
              error: "Seul le propriétaire de la boutique peut effectuer des retraits.",
              detail: `Votre rôle actuel est ${role ?? "non membre"}. Contactez le propriétaire de la boutique pour qu'il effectue le retrait.`,
              code: "NOT_OWNER",
            },
            { status: 403 },
          );
        }
      }

      // Lecture sur PlatformRevenue (vendorAmount = exact, déjà - 10% - affilié)
      const revenueRows = await prisma.platformRevenue.findMany({
        where: {
          instructeurId: inst.id,
          orderType: { in: ["formation", "product"] },
          ...(activeShopId ? { shopId: activeShopId } : {}),
        },
        select: { vendorAmount: true, createdAt: true },
      });
      const HOLD_MS = 24 * 3_600_000;
      const now = Date.now();
      let netReleased = 0;
      for (const r of revenueRows) {
        if (now - new Date(r.createdAt).getTime() >= HOLD_MS) netReleased += r.vendorAmount;
      }

      // Subtract previous withdrawals scoped to active shop
      const wAgg = await prisma.instructorWithdrawal.aggregate({
        where: {
          instructeurId: inst.id,
          NOT: { method: { endsWith: "_mentor" } },
          ...(activeShopId ? { shopId: activeShopId } : {}),
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

      // Deduplication: prevent double withdrawal within 2-minute window
      const recentDuplicate = await prisma.instructorWithdrawal.findFirst({
        where: {
          instructeurId: inst.id,
          amount,
          method,
          status: "EN_ATTENTE",
          createdAt: { gte: new Date(Date.now() - 2 * 60_000) },
        },
      });
      if (recentDuplicate) {
        return NextResponse.json(
          { error: "Une demande identique a été soumise il y a moins de 2 minutes. Patientez avant de réessayer.", existingId: recentDuplicate.id },
          { status: 409 }
        );
      }

      const withdrawal = await prisma.instructorWithdrawal.create({
        data: {
          instructeurId: inst.id,
          shopId: activeShopId,
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

      // Deduplication: prevent double mentor withdrawal within 2-minute window
      const recentDuplicate = await prisma.instructorWithdrawal.findFirst({
        where: {
          instructeurId: inst.id,
          amount,
          method: `${method}_mentor`,
          status: "EN_ATTENTE",
          createdAt: { gte: new Date(Date.now() - 2 * 60_000) },
        },
      });
      if (recentDuplicate) {
        return NextResponse.json(
          { error: "Une demande identique a été soumise il y a moins de 2 minutes.", existingId: recentDuplicate.id },
          { status: 409 }
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
