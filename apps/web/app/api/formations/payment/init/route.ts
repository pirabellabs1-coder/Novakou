import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { initPayment as initMoneroo, isMonerooConfigured } from "@/lib/moneroo";
import { initPayment as initPayGenius, isPayGeniusConfigured } from "@/lib/paygenius";
import { fulfillCheckout } from "@/lib/formations/fulfillment";
import { isAllowedBuyerEmail, ALLOWED_BUYER_EMAIL_MESSAGE } from "@/lib/email/allowed-buyer-email";
import { cookies } from "next/headers";
import crypto from "crypto";

type PaymentProvider = "moneroo" | "paygenius";

function resolveProvider(_raw: unknown): PaymentProvider {
  // Provider actif piloté par env PAYMENT_PROVIDER. Basculé sur Moneroo le
  // 2026-06-27 (settlement GeniusPay bloqué). Revenir à GeniusPay = PAYMENT_PROVIDER=paygenius.
  const _pref = (process.env.PAYMENT_PROVIDER || "moneroo").toLowerCase();
  if (_pref === "paygenius" && isPayGeniusConfigured()) return "paygenius";
  if (isMonerooConfigured()) return "moneroo";
  return isPayGeniusConfigured() ? "paygenius" : "moneroo";
}

/**
 * POST /api/formations/payment/init
 * Body: {
 *   formationIds?: string[],
 *   productIds?: string[],
 *   discountCode?: string,
 *   guestEmail?: string,
 *   guestName?: string,
 * }
 *
 * Initializes a Moneroo payment session, stores a pending order ref,
 * and returns the checkout_url to redirect the user.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    let userId = session?.user?.id ?? (IS_DEV ? "dev-apprenant-001" : null);
    let userEmail = session?.user?.email;
    let userName = session?.user?.name;

    // Guest checkout
    if (!userId && body.guestEmail) {
      const email = String(body.guestEmail).trim().toLowerCase();
      if (!isAllowedBuyerEmail(email)) {
        return NextResponse.json({ error: ALLOWED_BUYER_EMAIL_MESSAGE }, { status: 400 });
      }
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: body.guestName?.trim() || email.split("@")[0],
            passwordHash: crypto.randomBytes(32).toString("hex"),
            // Un acheteur invité est un client (apprenant), pas un freelance.
            // UserRole n'a pas APPRENANT — CLIENT est le mapping correct pour Novakou.
            role: "CLIENT",
            status: "ACTIF",
          },
        });
      }
      userId = user.id;
      userEmail = user.email;
      userName = user.name;
    }

    if (!userId) {
      return NextResponse.json({
        error: "Vous devez être connecté ou fournir un email pour acheter",
        requireAuth: true,
      }, { status: 401 });
    }

    if (!userEmail) {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
      userEmail = u?.email;
      userName = u?.name;
    }

    const formationIds: string[] = Array.isArray(body.formationIds) ? body.formationIds : [];
    const productIds: string[] = Array.isArray(body.productIds) ? body.productIds : [];

    if (formationIds.length === 0 && productIds.length === 0) {
      return NextResponse.json({ error: "Aucun produit dans la commande" }, { status: 400 });
    }

    // Compute total
    const [formations, products] = await Promise.all([
      formationIds.length > 0
        ? prisma.formation.findMany({
            where: { id: { in: formationIds }, status: "ACTIF" },
            select: {
              id: true, title: true, price: true, instructeurId: true, shopId: true,
              maxStudents: true, currentStudents: true, salesEndAt: true,
            },
          })
        : Promise.resolve([]),
      productIds.length > 0
        ? prisma.digitalProduct.findMany({
            where: { id: { in: productIds }, status: "ACTIF" },
            select: {
              id: true, title: true, price: true, instructeurId: true, shopId: true,
              maxBuyers: true, currentBuyers: true, salesCount: true, salesEndAt: true,
              isPaymentLink: true, allowCustomAmount: true,
            },
          })
        : Promise.resolve([]),
    ]);

    // ── Vérification disponibilité (date de fin + stock) ──────────────────
    // Refuser tôt avec un message clair plutôt que de laisser le checkout
    // créer un attempt et un appel provider pour rien. Ces deux limites
    // existent côté schéma : maxBuyers/maxStudents (Int? nullable) et
    // salesEndAt (DateTime? nullable). Null = pas de limite.
    const now = new Date();
    const blocked: string[] = [];
    for (const f of formations) {
      if (f.salesEndAt && f.salesEndAt <= now) blocked.push(`${f.title} — vente terminée`);
      else if (typeof f.maxStudents === "number" && f.maxStudents > 0 && (f.currentStudents ?? 0) >= f.maxStudents) {
        blocked.push(`${f.title} — places épuisées`);
      }
    }
    for (const p of products) {
      // Audit 2026-05-26 : la gate doit reposer sur la donnée la plus fiable.
      // currentBuyers peut avoir été seedé manuellement par le vendeur ;
      // salesCount est incrémenté par chaque achat réel. On prend le max
      // pour empêcher tout dépassement réel ET respecter un éventuel cap
      // anticipé par le vendeur.
      const sold = Math.max(p.currentBuyers ?? 0, p.salesCount ?? 0);
      if (p.salesEndAt && p.salesEndAt <= now) blocked.push(`${p.title} — vente terminée`);
      else if (typeof p.maxBuyers === "number" && p.maxBuyers > 0 && sold >= p.maxBuyers) {
        blocked.push(`${p.title} — stock épuisé`);
      }
    }
    if (blocked.length > 0) {
      return NextResponse.json(
        { error: `Achat impossible : ${blocked.join(", ")}` },
        { status: 410 }, // Gone — la ressource n'est plus disponible
      );
    }

    // ── Lien de paiement à PRIX LIBRE : montant choisi par l'acheteur ──────
    // Autorisé UNIQUEMENT pour une commande d'un seul produit isPaymentLink
    // + allowCustomAmount. Le montant devient le total ; il sera crédité tel
    // quel (vérifié par Moneroo) au fulfillment. Garde-fou strict : jamais pour
    // un produit normal (empêche un acheteur de sous-payer).
    let customAmount: number | null = null;
    if (
      formations.length === 0 && products.length === 1 &&
      products[0].isPaymentLink && products[0].allowCustomAmount
    ) {
      const amt = Math.round(Number(body.customAmount));
      if (!Number.isFinite(amt) || amt < 100) {
        return NextResponse.json(
          { error: "Le montant doit être d'au moins 100 FCFA." },
          { status: 400 },
        );
      }
      customAmount = amt;
    }

    const subTotal = customAmount ?? (formations.reduce((s, f) => s + f.price, 0) + products.reduce((s, p) => s + p.price, 0));

    // Apply discount code
    let discountAmount = 0;
    let appliedCode: string | null = null;
    const discountStr = body.discountCode?.trim().toUpperCase();
    if (discountStr) {
      const code = await prisma.discountCode.findUnique({ where: { code: discountStr } });
      if (code && code.isActive && (!code.expiresAt || code.expiresAt > new Date()) && (!code.maxUses || code.usedCount < code.maxUses)) {
        if (!code.minOrderAmount || subTotal >= code.minOrderAmount) {
          discountAmount = code.discountType === "PERCENTAGE"
            ? Math.round(subTotal * (code.discountValue / 100))
            : Math.min(code.discountValue, subTotal);
          appliedCode = code.code;
        }
      }
    }

    const totalAmount = Math.max(0, subTotal - discountAmount);

    // ── Affiliation : résolution du cookie fh_ref pour TOUTES les ventes ──
    // (avant, seule la branche "commande gratuite" le faisait → les ventes
    // PAYÉES via Moneroo ne créaient jamais de commission d'affiliation.)
    let affiliateProfile: { profileId: string; commissionRate: number } | null = null;
    try {
      const cookieStore = await cookies();
      const affCookie = cookieStore.get("fh_ref")?.value ?? cookieStore.get("fh_aff_code")?.value;
      if (affCookie) {
        const prof = await prisma.affiliateProfile.findUnique({
          where: { affiliateCode: affCookie },
          select: { id: true, status: true, userId: true, program: { select: { commissionPct: true, isActive: true } } },
        });
        // Un affilié ne peut pas toucher de commission sur son propre achat.
        if (prof && prof.status === "ACTIVE" && prof.program.isActive && prof.userId !== userId) {
          affiliateProfile = { profileId: prof.id, commissionRate: (prof.program.commissionPct ?? 0) / 100 };
        }
      }
    } catch (err) {
      console.warn("[payment/init affiliate cookie]", err);
    }

    // Free order? Skip Moneroo and fulfill the order immediately.
    // Anciennement on retournait juste une URL "/payment/return?free=1" qui se
    // contentait d'afficher un toast de succès — sans rien créer en base. Du
    // coup : pas d'enrollment / DigitalProductPurchase, pas d'email, pas de
    // notification, rien chez le vendeur ni dans l'admin. Maintenant on appelle
    // directement fulfillCheckout (la même fonction que le webhook Moneroo
    // utilise après un paiement réel).
    if (totalAmount === 0) {
      const sessionRef = `free:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

      try {
        const result = await fulfillCheckout({
          userId,
          formationIds,
          productIds,
          discountCodeStr: appliedCode ?? null,
          sessionRef,
          affiliate: affiliateProfile,
        });
        return NextResponse.json({
          data: {
            free: true,
            checkout_url: `/payment/return?free=1&items=${result.enrollments.length + result.purchases.length}`,
            internalRef: sessionRef,
            fulfilled: true,
            enrollments: result.enrollments.length,
            purchases: result.purchases.length,
          },
        });
      } catch (err) {
        console.error("[payment/init free fulfill]", err);
        const message = err instanceof Error ? err.message : "Finalisation échouée";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    // App URL for return redirects (used in both mock and real flows)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Choix du provider : "moneroo" (défaut) ou "paygenius"
    const provider = resolveProvider(body.provider);
    const providerConfigured = provider === "paygenius" ? isPayGeniusConfigured() : isMonerooConfigured();

    // Si le provider demandé n'est pas configuré (dev / clés manquantes),
    // on simule un paiement réussi via la page mock.
    if (!providerConfigured) {
      const internalRef = `dev:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
      const mockUrl = new URL("/payment/return", appUrl);
      mockUrl.searchParams.set("mock", "1");
      mockUrl.searchParams.set("ref", internalRef);
      mockUrl.searchParams.set("provider", provider);
      if (formationIds.length > 0) mockUrl.searchParams.set("fids", formationIds.join(","));
      if (productIds.length > 0) mockUrl.searchParams.set("pids", productIds.join(","));
      if (appliedCode) mockUrl.searchParams.set("code", appliedCode);
      if (userId) mockUrl.searchParams.set("uid", userId);
      return NextResponse.json({
        data: {
          mock: true,
          provider,
          checkout_url: mockUrl.pathname + mockUrl.search,
          internalRef,
          amount: totalAmount,
          subTotal,
          discountAmount,
          appliedCode,
        },
      });
    }

    // Init real payment via le provider sélectionné
    const refPrefix = provider === "paygenius" ? "pg" : "mnr";
    const internalRef = `${refPrefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const fName = userName ?? userEmail?.split("@")[0] ?? "Apprenant";
    const [first, ...rest] = fName.split(" ");
    const last = rest.join(" ") || "User";

    // Phone number from body — required for Mobile Money methods
    const phoneRaw: string | undefined = body.phone?.toString().replace(/\s/g, "") || undefined;

    // Identifier le vendeur principal (1er produit/formation de la commande).
    // Multi-vendeur : on trace sur le 1er ; le reste pourra etre attribue a la
    // completion via le fulfillment.
    const primaryInstructeurId =
      formations[0]?.instructeurId ?? products[0]?.instructeurId ?? null;
    const primaryShopId = formations[0]?.shopId ?? products[0]?.shopId ?? null;

    // Cree l'attempt AVANT l'appel provider pour pouvoir tracer meme un echec
    // d'init cote provider. Status STARTED → le webhook le passera a COMPLETED
    // ou FAILED selon le retour du provider.
    const attempt = await prisma.checkoutAttempt.create({
      data: {
        userId: userId,
        visitorEmail: userEmail?.toLowerCase() ?? null,
        visitorName: (userName ?? null) || `${first} ${last}`.trim() || null,
        visitorPhone: phoneRaw ?? null,
        instructeurId: primaryInstructeurId,
        shopId: primaryShopId,
        formationId: formations[0]?.id ?? null,
        productId: products[0]?.id ?? null,
        amount: totalAmount,
        currency: "XOF",
        paymentMethod: body.paymentMethod ?? null,
        status: "STARTED",
        metadata: {
          formationIds: formationIds,
          productIds: productIds,
          internalRef,
          discountCode: appliedCode ?? null,
          paymentProvider: provider,
        } as never,
      },
      select: { id: true },
    });

    // Metadata commune envoyée au provider (clés string/number/boolean uniquement)
    const providerMetadata = {
      type: "formations_checkout",
      sessionRef: internalRef,
      userId,
      formationIds: formationIds.join(","),
      productIds: productIds.join(","),
      discountCode: appliedCode ?? "",
      internalRef,
      attemptId: attempt.id,
      paymentProvider: provider,
      // Affiliation : le webhook lit ces clés pour créer la commission après paiement.
      affiliateProfileId: affiliateProfile?.profileId ?? "",
      affiliateCommissionRate: affiliateProfile?.commissionRate ?? 0,
    };

    const returnUrl = `${appUrl}/payment/return?ref=${encodeURIComponent(internalRef)}&attempt=${attempt.id}&provider=${provider}`;
    const description = `Achat Novakou — ${formations.length + products.length} produit(s)`;

    let providerId: string;
    let checkoutUrl: string;

    try {
      if (provider === "paygenius") {
        const pg = await initPayGenius({
          amount: Math.round(totalAmount),
          currency: "XOF",
          description,
          customer: {
            email: userEmail || "client@novakou.com",
            name: `${first || "Apprenant"} ${last}`.trim(),
            phone: phoneRaw,
          },
          return_url: returnUrl,
          metadata: providerMetadata,
        });
        providerId = pg.reference; // on stocke la `reference` (MTX-…) pour retrouver via /payments/{ref}
        checkoutUrl = pg.checkout_url;
      } else {
        const mnr = await initMoneroo({
          amount: Math.round(totalAmount),
          currency: "XOF",
          description,
          customer: {
            email: userEmail || "client@novakou.com",
            first_name: first || "Apprenant",
            last_name: last,
            phone: phoneRaw,
          },
          return_url: returnUrl,
          metadata: providerMetadata,
        });
        providerId = mnr.id;
        checkoutUrl = mnr.checkout_url;
      }
    } catch (err) {
      // Marque l'attempt en FAILED si l'init du provider échoue
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      await prisma.checkoutAttempt
        .update({
          where: { id: attempt.id },
          data: {
            status: "FAILED",
            failureReason: message.slice(0, 500),
            failureCode: `${provider}_init_failed`,
          },
        })
        .catch(() => null);
      console.error(`[payment/init:${provider}]`, err);
      return NextResponse.json(
        { error: `${provider === "paygenius" ? "PayGenius" : "Moneroo"}: ${message}` },
        { status: 500 },
      );
    }

    // Propager providerRef sur le CheckoutAttempt pour debug/correlation
    await prisma.checkoutAttempt.update({
      where: { id: attempt.id },
      data: { providerRef: providerId },
    });

    return NextResponse.json({
      data: {
        checkout_url: checkoutUrl,
        provider,
        // Champ historique conservé pour rétro-compat des clients existants
        moneroo_id: provider === "moneroo" ? providerId : undefined,
        provider_ref: providerId,
        internalRef,
        amount: totalAmount,
        subTotal,
        discountAmount,
        appliedCode,
        attemptId: attempt.id,
      },
    });
  } catch (err) {
    console.error("[payment/init]", err);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
