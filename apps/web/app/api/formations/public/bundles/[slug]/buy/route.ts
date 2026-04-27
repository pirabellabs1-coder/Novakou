import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveActiveUserId } from "@/lib/formations/active-user";
import { initPayment as initMoneroo, isMonerooConfigured } from "@/lib/moneroo";
import { initPayment as initPayGenius, isPayGeniusConfigured } from "@/lib/paygenius";

type PaymentProvider = "moneroo" | "paygenius";
function resolveProvider(raw: unknown): PaymentProvider {
  return String(raw ?? "").toLowerCase() === "paygenius" ? "paygenius" : "moneroo";
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

    const sharedMeta = {
      type: "bundle_purchase",
      bundleId: bundle.id,
      userId,
      instructeurId: bundle.instructeurId,
    };
    const description = `Bundle : ${bundle.title}`;
    const returnUrl = `${APP_URL}/payment/return?provider=${provider}`;

    let checkoutUrl: string;
    let providerRefId: string;

    if (provider === "paygenius") {
      const pg = await initPayGenius({
        amount: Math.round(bundle.priceXof),
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
        amount: Math.round(bundle.priceXof),
        currency: "XOF",
        description,
        customer: { email: user.email, first_name: firstName, last_name: lastName },
        return_url: returnUrl,
        metadata: sharedMeta,
      });
      checkoutUrl = mnr.checkout_url;
      providerRefId = mnr.id;
    }

    return NextResponse.json({ data: { checkout_url: checkoutUrl, id: providerRefId, provider } });
  } catch (err) {
    console.error("[public/bundles/buy POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}
