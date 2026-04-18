import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { initPayment, isMonerooConfigured } from "@/lib/moneroo";
import crypto from "crypto";

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
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Email invalide" }, { status: 400 });
      }
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: body.guestName?.trim() || email.split("@")[0],
            passwordHash: crypto.randomBytes(32).toString("hex"),
            role: "FREELANCE",
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
            select: { id: true, title: true, price: true },
          })
        : Promise.resolve([]),
      productIds.length > 0
        ? prisma.digitalProduct.findMany({
            where: { id: { in: productIds }, status: "ACTIF" },
            select: { id: true, title: true, price: true },
          })
        : Promise.resolve([]),
    ]);

    let subTotal = formations.reduce((s, f) => s + f.price, 0) + products.reduce((s, p) => s + p.price, 0);

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

    // Free order? Skip Moneroo, complete immediately.
    if (totalAmount === 0) {
      return NextResponse.json({
        data: {
          free: true,
          checkout_url: `/payment/return?free=1&items=${formationIds.length + productIds.length}`,
          internalRef: `free:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
        },
      });
    }

    // App URL for return redirects (used in both mock and real Moneroo flows)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // If Moneroo is not configured (e.g. dev mode without keys), simulate a successful payment
    if (!isMonerooConfigured()) {
      const internalRef = `dev:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
      const mockUrl = new URL("/payment/return", appUrl);
      mockUrl.searchParams.set("mock", "1");
      mockUrl.searchParams.set("ref", internalRef);
      if (formationIds.length > 0) mockUrl.searchParams.set("fids", formationIds.join(","));
      if (productIds.length > 0) mockUrl.searchParams.set("pids", productIds.join(","));
      if (appliedCode) mockUrl.searchParams.set("code", appliedCode);
      if (userId) mockUrl.searchParams.set("uid", userId);
      return NextResponse.json({
        data: {
          mock: true,
          checkout_url: mockUrl.pathname + mockUrl.search,
          internalRef,
          amount: totalAmount,
          subTotal,
          discountAmount,
          appliedCode,
        },
      });
    }

    // Init real Moneroo payment
    const internalRef = `mnr:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const fName = userName ?? userEmail?.split("@")[0] ?? "Apprenant";
    const [first, ...rest] = fName.split(" ");
    const last = rest.join(" ") || first;

    // Phone number from body — required for Mobile Money methods
    const phoneRaw: string | undefined = body.phone?.toString().replace(/\s/g, "") || undefined;

    const moneroo = await initPayment({
      amount: totalAmount,
      currency: "XOF", // FCFA West Africa CFA franc
      description: `Achat Novakou — ${formations.length + products.length} produit(s)`,
      customer: {
        email: userEmail!,
        first_name: first || "Apprenant",
        last_name: last || "—",
        phone: phoneRaw,
      },
      return_url: `${appUrl}/payment/return?ref=${encodeURIComponent(internalRef)}`,
      metadata: {
        // Type discriminator lu par /api/webhooks/moneroo pour router le fulfillment
        type: "formations_checkout",
        sessionRef: internalRef,
        userId,
        formationIds: formationIds.join(","),
        productIds: productIds.join(","),
        discountCode: appliedCode ?? "",
        internalRef,
      },
    });

    return NextResponse.json({
      data: {
        checkout_url: moneroo.checkout_url,
        moneroo_id: moneroo.id,
        internalRef,
        amount: totalAmount,
        subTotal,
        discountAmount,
        appliedCode,
      },
    });
  } catch (err) {
    console.error("[payment/init]", err);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: "Échec d'initialisation du paiement", message }, { status: 500 });
  }
}
