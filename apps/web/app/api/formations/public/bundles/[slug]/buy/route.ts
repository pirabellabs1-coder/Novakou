import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveActiveUserId } from "@/lib/formations/active-user";
import { initPayment as initMoneroo, isMonerooConfigured } from "@/lib/moneroo";
import { initPayment as initPayGenius, isPayGeniusConfigured } from "@/lib/paygenius";

type PaymentProvider = "moneroo" | "paygenius";
function resolveProvider(_raw: unknown): PaymentProvider {
  // PayGenius = fournisseur de paiement UNIQUE (Moneroo = repli dormant).
  return isPayGeniusConfigured() ? "paygenius" : "moneroo";
}

/**
 * POST /api/formations/public/bundles/[slug]/buy
 *
 * Initialise un checkout Moneroo pour acheter un bundle. Au paiement, le
 * webhook moneroo (`type: "bundle_purchase"`) crée la `ProductBundlePurchase`
 * et auto-enrolle l'acheteur sur chaque item du bundle (Enrollment +
 * DigitalProductPurchase).
 *
 * Body: vide.
 */
type Params = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const body = await request.json().catch(() => ({}));
    const provider: PaymentProvider = resolveProvider((body as { provider?: string }).provider);
    const discountCodeStr: string | null =
      typeof (body as { discountCode?: unknown }).discountCode === "string"
        ? (body as { discountCode: string }).discountCode.trim().toUpperCase() || null
        : null;
    const session = await getServerSession(authOptions);
    const userId = await resolveActiveUserId(session, {
      devFallback: IS_DEV ? "dev-apprenant-001" : undefined,
    });
    if (!userId) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour acheter un bundle", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }

    const bundle = await prisma.productBundle.findUnique({
      where: { slug },
      include: {
        items: { orderBy: { order: "asc" } },
        instructeur: { include: { user: { select: { id: true } } } },
      },
    });
    if (!bundle || !bundle.isActive) {
      return NextResponse.json({ error: "Bundle introuvable ou inactif" }, { status: 404 });
    }
    if (bundle.items.length === 0) {
      return NextResponse.json({ error: "Bundle vide" }, { status: 400 });
    }

    // Déjà acheté ?
    const existing = await prisma.productBundlePurchase.findFirst({
      where: { bundleId: bundle.id, userId },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Vous avez déjà acheté ce bundle", code: "ALREADY_PURCHASED" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (!user?.email) return NextResponse.json({ error: "Profil user incomplet" }, { status: 400 });

    const firstName = (user.name || user.email.split("@")[0]).split(" ")[0];
    const lastName = (user.name || "").split(" ").slice(1).join(" ") || "Acheteur";
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

    // Vérifier que le provider demandé est configuré
    const providerConfigured = provider === "paygenius" ? isPayGeniusConfigured() : isMonerooConfigured();
    if (!providerConfigured) {
      return NextResponse.json(
        { error: `Le provider ${provider} n'est pas configuré sur cette plateforme` },
        { status: 503 },
      );
    }

    // ── Discount code (optional) ────────────────────────────────────────
    // Valide et applique un code promo sur le prix bundle. Le rabais est
    // calculé ici ; le webhook créera le DiscountUsage post-fulfillment.
    const subTotal = Math.round(bundle.priceXof);
    let discountAmount = 0;
    let appliedDiscountCodeId: string | null = null;
    if (discountCodeStr) {
      const code = await prisma.discountCode.findUnique({ where: { code: discountCodeStr } });
      if (!code || !code.isActive) {
        return NextResponse.json({ error: "Code promo invalide ou expiré" }, { status: 400 });
      }
      if (code.expiresAt && code.expiresAt < new Date()) {
        return NextResponse.json({ error: "Code promo expiré" }, { status: 400 });
      }
      if (code.maxUses && code.usedCount >= code.maxUses) {
        return NextResponse.json({ error: "Code promo épuisé" }, { status: 400 });
      }
      // Per-user limit
      if (code.maxUsesPerUser != null) {
        const userPriorUses = await prisma.discountUsage.count({
          where: { discountId: code.id, userId },
        });
        if (userPriorUses >= code.maxUsesPerUser) {
          return NextResponse.json(
            { error: "Vous avez déjà utilisé ce code le nombre maximum de fois" },
            { status: 400 },
          );
        }
      }
      if (code.minOrderAmount && subTotal < code.minOrderAmount) {
        return NextResponse.json(
          { error: `Montant minimum requis : ${code.minOrderAmount} FCFA` },
          { status: 400 },
        );
      }
      // Compute discount
      if (code.discountType === "PERCENTAGE") {
        discountAmount = Math.round(subTotal * (code.discountValue / 100));
      } else {
        discountAmount = Math.min(code.discountValue, subTotal);
      }
      appliedDiscountCodeId = code.id;
      // Atomic claim global (maxUses) — best-effort ; le DiscountUsage sera créé
      // par le webhook avec la contrainte unique [discountId,userId,orderId]
      // qui empêche le double-comptage.
      if (code.maxUses) {
        const claimed = await prisma.discountCode.updateMany({
          where: { id: code.id, usedCount: { lt: code.maxUses } },
          data: { usedCount: { increment: 1 } },
        });
        if (claimed.count === 0) {
          return NextResponse.json({ error: "Code promo épuisé (concurrent)" }, { status: 400 });
        }
      }
    }
    const totalAmount = Math.max(0, subTotal - discountAmount);

    // ── Affiliate attribution ─────────────────────────────────────────────
    // Identique au pattern checkout/route.ts : on lit le cookie fh_ref,
    // on retrouve le profil affilié, et on propage le tout en metadata
    // pour que le webhook crée la commission.
    let affiliateProfileId = "";
    let affiliateCommissionRate = 0;
    try {
      const cookieStore = await cookies();
      const affCookie =
        cookieStore.get("fh_ref")?.value ?? cookieStore.get("fh_aff_code")?.value;
      if (affCookie) {
        const prof = await prisma.affiliateProfile.findUnique({
          where: { affiliateCode: affCookie },
          select: {
            id: true, status: true,
            program: { select: { commissionPct: true, isActive: true } },
          },
        });
        if (prof && prof.status === "ACTIVE" && prof.program.isActive) {
          affiliateProfileId = prof.id;
          affiliateCommissionRate = (prof.program.commissionPct ?? 0) / 100;
        }
      }
    } catch (err) {
      console.warn("[bundle/buy affiliate cookie]", err);
    }

    const sharedMeta = {
      type: "bundle_purchase",
      bundleId: bundle.id,
      userId,
      instructeurId: bundle.instructeurId,
      // Propagated for webhook → DiscountUsage create post-fulfillment
      discountCode: discountCodeStr ?? "",
      discountCodeId: appliedDiscountCodeId ?? "",
      discountAmount: String(discountAmount),
      bundleSubTotal: String(subTotal),
      // Affiliate
      affiliateProfileId,
      affiliateCommissionRate: String(affiliateCommissionRate),
    };
    const description = `Bundle : ${bundle.title}`;
    const returnUrl = `${APP_URL}/payment/return?provider=${provider}`;

    let checkoutUrl: string;
    let providerRefId: string;

    if (provider === "paygenius") {
      const pg = await initPayGenius({
        amount: totalAmount,
        currency: "XOF",
        description,
        customer: { email: user.email, name: `${firstName} ${lastName}`.trim() },
        return_url: returnUrl,
        metadata: sharedMeta,
      });
      checkoutUrl = pg.checkout_url;
      providerRefId = pg.reference;
    } else {
      const mnr = await initMoneroo({
        amount: totalAmount,
        currency: "XOF",
        description,
        customer: { email: user.email, first_name: firstName, last_name: lastName },
        return_url: returnUrl,
        metadata: sharedMeta,
      });
      checkoutUrl = mnr.checkout_url;
      providerRefId = mnr.id;
    }

    return NextResponse.json({
      data: {
        checkout_url: checkoutUrl,
        id: providerRefId,
        provider,
        subTotal,
        discountAmount,
        totalAmount,
      },
    });
  } catch (err) {
    console.error("[public/bundles/buy POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}
