import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveCollectProviders, activeProviders } from "@/lib/payments/gateways";
import { resolveOperatorCode, getProvider, getOperator, countryFromPhone, currencyForOperator, type ProviderId } from "@/lib/payments/registry";
import { fulfillCheckout } from "@/lib/formations/fulfillment";
import { computeCheckoutDiscount } from "@/lib/formations/checkout-discount";
import { isAllowedBuyerEmail, ALLOWED_BUYER_EMAIL_MESSAGE } from "@/lib/email/allowed-buyer-email";
import { cookies } from "next/headers";
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
 * Encaisse via NOS passerelles (registre + passerelles activées).
 * Aucun agrégateur tiers : si personne ne couvre l'opérateur, on refuse.
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

    // ── PACK (bundle) ─────────────────────────────────────────────────────────
    // Un pack n'est rien d'autre qu'un ensemble de formations et de produits
    // vendus ensemble. On le développe ICI, côté serveur : le contenu et le
    // prix viennent de la base, jamais du navigateur. L'acheteur passe donc par
    // le même écran, le même encaissement et la même livraison que pour un
    // achat simple — au lieu du parcours séparé qui partait chez une passerelle
    // retirée.
    const bundleId = typeof body.bundleId === "string" ? body.bundleId.trim() : "";
    let bundlePrice: number | null = null;
    if (bundleId) {
      const bundle = await prisma.productBundle.findFirst({
        where: { id: bundleId, isActive: true },
        select: { id: true, priceXof: true, items: { select: { formationId: true, productId: true } } },
      });
      if (!bundle) {
        return NextResponse.json({ error: "Ce pack n'est plus disponible" }, { status: 404 });
      }
      for (const it of bundle.items) {
        if (it.formationId && !formationIds.includes(it.formationId)) formationIds.push(it.formationId);
        if (it.productId && !productIds.includes(it.productId)) productIds.push(it.productId);
      }
      if (formationIds.length === 0 && productIds.length === 0) {
        return NextResponse.json({ error: "Ce pack ne contient aucun élément" }, { status: 400 });
      }
      bundlePrice = bundle.priceXof;
    }

    // ── SÉANCE DE MENTORAT ────────────────────────────────────────────────────
    // La réservation existe déjà (créneau réservé, en attente de paiement). On
    // n'encaisse que son montant, relu en base. Ce parcours partait auparavant
    // sur la page hébergée d'une passerelle retirée ; il passe désormais par le
    // même écran que tout le reste.
    const mentorBookingId = typeof body.mentorBookingId === "string" ? body.mentorBookingId.trim() : "";
    let bookingPrice: number | null = null;
    if (mentorBookingId) {
      const booking = await prisma.mentorBooking.findFirst({
        where: { id: mentorBookingId, studentId: userId ?? undefined, status: "PAYMENT_PENDING" },
        select: { id: true, paidAmount: true },
      });
      if (!booking) {
        return NextResponse.json(
          { error: "Cette réservation n'est plus en attente de paiement." },
          { status: 404 },
        );
      }
      bookingPrice = Math.round(booking.paidAmount);
      if (bookingPrice < 100) {
        return NextResponse.json({ error: "Montant de séance invalide." }, { status: 400 });
      }
    }

    // ── ABONNEMENT ────────────────────────────────────────────────────────────
    // Le prix vient du plan, en base. L'accès aux contenus inclus est accordé à
    // la confirmation du paiement, avec la période et la facture.
    const membershipPlanId = typeof body.membershipPlanId === "string" ? body.membershipPlanId.trim() : "";
    let planPrice: number | null = null;
    if (membershipPlanId) {
      const plan = await prisma.subscriptionPlan.findFirst({
        where: { id: membershipPlanId, isActive: true },
        select: { id: true, price: true },
      });
      if (!plan) {
        return NextResponse.json({ error: "Cet abonnement n'est plus disponible" }, { status: 404 });
      }
      planPrice = Math.round(plan.price);
      if (planPrice < 100) {
        return NextResponse.json({ error: "Cet abonnement n'a pas de prix valide." }, { status: 400 });
      }
    }

    if (formationIds.length === 0 && productIds.length === 0 && !mentorBookingId && !membershipPlanId) {
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
              isPaymentLink: true, allowCustomAmount: true, redirectUrl: true,
            },
          })
        : Promise.resolve([]),
    ]);

    // ── Vérification disponibilité (date de fin + stock) ──────────────────
    // Refuser tôt avec un message clair plutôt que de laisser le checkout
    // créer un attempt et un appel provider pour rien.
    //
    // `salesEndAt` NE BLOQUE PLUS (décision fondateur 2026-08-03). Le compte à
    // rebours est un ressort d'urgence qui repart de lui-même à zéro ; le
    // laisser fermer la vente coupait les encaissements du jour au lendemain,
    // sans que personne s'en aperçoive. Seul un plafond d'acheteurs, posé
    // explicitement par le vendeur, ferme encore la vente.
    const blocked: string[] = [];
    for (const f of formations) {
      if (typeof f.maxStudents === "number" && f.maxStudents > 0 && (f.currentStudents ?? 0) >= f.maxStudents) {
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
      if (typeof p.maxBuyers === "number" && p.maxBuyers > 0 && sold >= p.maxBuyers) {
        blocked.push(`${p.title} — stock épuisé`);
      }
    }
    // ── Déjà possédé : refuser AVANT d'encaisser ─────────────────────────
    //
    // Sans cette garde, un acheteur pouvait payer une deuxième fois un produit
    // qu'il possède déjà : l'argent partait, la livraison ne créait rien (il
    // l'avait déjà), donc aucun revenu enregistré, aucun crédit vendeur — et
    // la tentative était tout de même marquée livrée. L'argent disparaissait
    // sans laisser la moindre trace.
    if (formationIds.length > 0 || productIds.length > 0) {
      const [dejaInscrit, dejaAchete] = await Promise.all([
        formationIds.length
          ? prisma.enrollment.findMany({
              where: { userId, formationId: { in: formationIds } },
              select: { formationId: true },
            })
          : Promise.resolve([]),
        productIds.length
          ? prisma.digitalProductPurchase.findMany({
              where: { userId, productId: { in: productIds } },
              select: { productId: true },
            })
          : Promise.resolve([]),
      ]);
      const possedes = new Set<string>([
        ...dejaInscrit.map((e) => e.formationId),
        ...dejaAchete.map((a) => a.productId),
      ]);
      if (possedes.size > 0) {
        const titres = [
          ...formations.filter((f) => possedes.has(f.id)).map((f) => f.title),
          ...products.filter((pr) => possedes.has(pr.id)).map((pr) => pr.title),
        ];
        // Tout le panier est déjà possédé : rien à vendre.
        if (possedes.size >= formationIds.length + productIds.length) {
          return NextResponse.json(
            {
              error: `Vous possédez déjà ${titres.join(", ")}. Retrouvez ${titres.length > 1 ? "vos achats" : "votre achat"} dans votre espace.`,
              code: "ALREADY_OWNED",
            },
            { status: 400 },
          );
        }
        blocked.push(`${titres.join(", ")} — déjà dans vos achats`);
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
    // quel (vérifié par la passerelle) au fulfillment. Garde-fou strict : jamais pour
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

    // Prix d'un pack : celui de la BASE, pas la somme de ses éléments (c'est
    // justement la remise qui fait le pack). Il vient du serveur, donc aucun
    // risque de sous-paiement — contrairement au montant libre ci-dessus, qui
    // reste réservé aux liens de paiement.
    if (bundlePrice != null) {
      if (bundlePrice < 100) {
        return NextResponse.json({ error: "Ce pack n'a pas de prix valide." }, { status: 400 });
      }
      customAmount = bundlePrice;
    }
    if (bookingPrice != null) customAmount = bookingPrice;
    if (planPrice != null) customAmount = planPrice;

    const subTotal = customAmount ?? (formations.reduce((s, f) => s + f.price, 0) + products.reduce((s, p) => s + p.price, 0));

    // ── Code promo (source unique : computeCheckoutDiscount) ──────────────
    // La MÊME fonction est rappelée au fulfillment → montant débité ici ==
    // montant réparti là-bas (déterministe). La remise ne porte QUE sur les
    // items du vendeur propriétaire du code et dans sa portée : jamais sur les
    // items d'un autre vendeur (fuite inter-vendeur fermée). Un lien de
    // paiement à prix libre n'accepte aucun code.
    let discountAmount = 0;
    let appliedCode: string | null = null;
    if (customAmount == null && body.discountCode) {
      const disc = await computeCheckoutDiscount(
        body.discountCode,
        userId,
        [
          ...formations.map((f) => ({ id: f.id, kind: "formation" as const, price: f.price, instructeurId: f.instructeurId })),
          ...products.map((p) => ({ id: p.id, kind: "product" as const, price: p.price, instructeurId: p.instructeurId })),
        ],
      );
      if (disc.applied) {
        discountAmount = disc.discountAmount;
        appliedCode = disc.code;
      }
    }

    const totalAmount = Math.max(0, subTotal - discountAmount);

    // ── Affiliation : résolution du cookie fh_ref pour TOUTES les ventes ──
    // (avant, seule la branche "commande gratuite" le faisait → les ventes
    // PAYÉES via la passerelle ne créaient jamais de commission d'affiliation.)
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

    // Free order? Skip la passerelle and fulfill the order immediately.
    // Anciennement on retournait juste une URL "/payment/return?free=1" qui se
    // contentait d'afficher un toast de succès — sans rien créer en base. Du
    // coup : pas d'enrollment / DigitalProductPurchase, pas d'email, pas de
    // notification, rien chez le vendeur ni dans l'admin. Maintenant on appelle
    // directement fulfillCheckout (la même fonction que le webhook la passerelle
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
          // Commande rendue gratuite par le code : on transmet le rabais exact
          // décidé ici pour que le fulfillment réparte le même montant.
          chargedDiscountAmount: discountAmount,
          bundleId: bundleId || null,
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

    // En développement sans aucune passerelle branchée, on simule un paiement
    // réussi via la page mock — sinon impossible de tester le parcours en local.
    // En production, l'absence de passerelle est traitée plus bas par un refus
    // explicite : on ne simule JAMAIS un encaissement réel.
    const provider = "novakou";
    const anyGatewayConfigured = (await activeProviders("collect")).length > 0;
    if (!anyGatewayConfigured && IS_DEV) {
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
    const refPrefix = "nk"; // référence interne Novakou
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
          // Trace du pack : la livraison des formations et produits se fait
          // déjà par les identifiants ci-dessus ; ceci sert à enregistrer
          // l'achat du pack lui-même (statistiques vendeur, avis, historique).
          bundleId: bundleId || null,
          // Séance de mentorat : à la confirmation du paiement, c'est la
          // réservation qui est confirmée, pas un contenu à livrer.
          mentorBookingId: mentorBookingId || null,
          membershipPlanId: membershipPlanId || null,
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
      // Montant net réellement débité + remise appliquée → le webhook
      // (assertAmountMatches) valide une commande REMISÉE sans la rejeter,
      // même si l'acheteur ferme l'onglet avant /payment/verify.
      totalAmount: Math.round(totalAmount),
      discountAmount: Math.round(discountAmount),
      internalRef,
      attemptId: attempt.id,
      paymentProvider: provider,
      // Affiliation : le webhook lit ces clés pour créer la commission après paiement.
      affiliateProfileId: affiliateProfile?.profileId ?? "",
      affiliateCommissionRate: affiliateProfile?.commissionRate ?? 0,
      // Lien de paiement intégré : URL de retour vers le site du vendeur après
      // paiement (la page /payment/return y redirige l'acheteur). Vide sinon.
      paylinkRedirectUrl:
        products.length === 1 && formations.length === 0 && products[0].isPaymentLink && products[0].redirectUrl
          ? products[0].redirectUrl
          : "",
    };

    const returnUrl = `${appUrl}/payment/return?ref=${encodeURIComponent(internalRef)}&attempt=${attempt.id}&provider=${provider}`;
    const description = `Achat Novakou — ${formations.length + products.length} produit(s)`;

    // ── ENCAISSEMENT PAR NOS PROPRES PASSERELLES ───────────────────────────
    //
    // Le registre désigne la passerelle ACTIVÉE qui sait encaisser l'opérateur
    // choisi. Il n'y a plus AUCUN repli vers un agrégateur tiers : si personne
    // ne couvre l'opérateur, on refuse clairement plutôt que de renvoyer
    // discrètement l'acheteur ailleurs (décision fondateur).
    //
    // Les écrans envoient un code GÉNÉRIQUE ("orange_money") ; le registre est
    // indexé par pays ("orange_ci"). D'où la traduction préalable.
    const chosenOperator =
      resolveOperatorCode(typeof body.paymentMethod === "string" ? body.paymentMethod : "", {
        country: typeof body.country === "string" ? body.country : null,
        phone: phoneRaw ?? null,
      }) ?? "";

    // Toutes les passerelles capables, par priorité — pas seulement la
    // première : si elle tombe, on bascule sur la suivante.
    const candidates = await resolveCollectProviders(chosenOperator);
    const resolved = candidates[0] ?? null;

    async function failAttempt(reason: string, code: string) {
      await prisma.checkoutAttempt
        .update({
          where: { id: attempt.id },
          data: { status: "FAILED", failureReason: reason.slice(0, 500), failureCode: code },
        })
        .catch(() => null);
    }

    if (!resolved) {
      // Distinguer les deux causes : sans numéro ni pays on ne PEUT pas savoir
      // quel opérateur viser — ce n'est pas la même chose qu'un opérateur connu
      // mais non couvert. Un message générique envoyait l'acheteur changer de
      // moyen alors qu'il lui manquait juste son numéro.
      if (!chosenOperator) {
        await failAttempt("Pays/opérateur indéterminé (numéro manquant)", "operator_unresolved");
        return NextResponse.json(
          {
            error:
              "Renseignez votre numéro de téléphone (avec le bon pays) pour continuer le paiement.",
            code: "OPERATOR_UNRESOLVED",
          },
          { status: 400 },
        );
      }
      await failAttempt(`Aucune passerelle n'encaisse « ${chosenOperator} »`, "no_gateway");
      return NextResponse.json(
        {
          error:
            "Ce moyen de paiement n'est pas disponible pour votre pays pour le moment. Choisissez-en un autre.",
          code: "NO_GATEWAY",
        },
        { status: 400 },
      );
    }

    // ── Passerelle à fenêtre (KkiaPay) ───────────────────────────────────
    // Le paiement s'ouvre dans une fenêtre posée sur NOTRE page. Seule la clé
    // PUBLIQUE part au navigateur ; la transaction est revérifiée côté serveur
    // avant toute livraison.
    //
    // C'est une FONCTION et non un bloc en ligne : une passerelle à fenêtre
    // doit pouvoir prendre le relais quand une passerelle serveur échoue.
    // Tant que c'était un aiguillage figé sur la première candidate, la panne
    // de FeexPay faisait échouer la vente alors que KkiaPay savait l'encaisser.
    async function reponseWidget(candidate: { provider: ProviderId; code: string }) {
      const { getKkiapayPublicKey, isKkiapayConfigured, isKkiapaySandbox } = await import("@/lib/kkiapay");
      if (candidate.provider !== "kkiapay" || !(await isKkiapayConfigured())) return null;
      return NextResponse.json({
        data: {
          mode: "widget",
          provider: candidate.provider,
          publicKey: await getKkiapayPublicKey(),
          // Bac à sable : la fenêtre et la vérification doivent viser le MÊME
          // environnement, sinon la transaction est introuvable à la vérif.
          sandbox: await isKkiapaySandbox(),
          paymentMethod: candidate.code, // "momo" | "card"
          // Pays de l'opérateur : la fenêtre s'y limite, sinon elle propose
          // tous ses marchés et l'acheteur peut choisir un opérateur qui n'est
          // pas le sien.
          country: (getOperator(chosenOperator)?.country ?? "").toUpperCase(),
          amount: Math.round(totalAmount),
          phone: phoneRaw ?? "",
          email: userEmail ?? "",
          name: `${first || "Client"} ${last}`.trim(),
          internalRef,
          attemptId: attempt.id,
          amountLabel: "XOF",
        },
      });
    }

    // ── Passerelle serveur : on débite, l'acheteur confirme sur son téléphone ──
    //
    // BASCULE. Si la première passerelle échoue, on tente la suivante capable
    // du même opérateur. C'est sûr : tant qu'aucune référence n'est revenue,
    // aucune demande n'est partie sur le téléphone de l'acheteur — il n'y a
    // donc aucun risque de double débit. Le 2026-08-02, l'API d'encaissement
    // de FeexPay a répondu 502 pendant des heures ; sans bascule, toutes les
    // ventes tombaient alors qu'une autre passerelle savait les traiter.
    let directRef: string | null = null;
    let usedProvider: ProviderId = resolved.provider;
    const failures: string[] = [];

    for (const candidate of candidates) {
      // Passerelle à fenêtre : on rend de quoi l'ouvrir et on s'arrête là.
      if (getProvider(candidate.provider)?.collectIntegration === "widget") {
        const r = await reponseWidget(candidate);
        if (r) return r;
        failures.push(`${candidate.provider} : fenêtre non configurée`);
        continue;
      }
      try {
        if (candidate.provider === "feexpay") {
          if (!phoneRaw) {
            await failAttempt("Numéro de téléphone manquant", "missing_phone");
            return NextResponse.json(
              { error: "Un numéro de téléphone est requis pour ce moyen de paiement." },
              { status: 400 },
            );
          }
          const { initCollect } = await import("@/lib/feexpay");
          const r = await initCollect({
            operator: chosenOperator,
            amount: Math.round(totalAmount),
            phoneNumber: phoneRaw,
            // Devise de l'opérateur, pas une constante : l'Afrique centrale est
            // en XAF. XOF et XAF ont la même parité, mais le fournisseur refuse
            // une transaction dont la devise ne correspond pas à son réseau.
            currency: currencyForOperator(chosenOperator) ?? "XOF",
            description,
            customId: internalRef,
            firstName: first || "Client",
            email: userEmail || undefined,
          });
          directRef = r.reference;
        } else if (candidate.provider === "fedapay") {
          const { initCollect } = await import("@/lib/fedapay");
          const r = await initCollect({
            operator: chosenOperator,
            amount: Math.round(totalAmount),
            currencyIso: currencyForOperator(chosenOperator) ?? "XOF",
            description,
            phoneNumber: phoneRaw ? `+${phoneRaw.replace(/\D/g, "")}` : undefined,
            countryIso: countryFromPhone(phoneRaw) ?? undefined,
            customer: {
              firstname: first || "Client",
              lastname: last,
              email: userEmail || "client@novakou.com",
            },
            merchantReference: internalRef,
            callbackUrl: returnUrl,
          });
          // FedaPay peut renvoyer une page hébergée (carte) plutôt qu'un push.
          if (r.redirectUrl) {
            await prisma.checkoutAttempt
              .update({
                where: { id: attempt.id },
                data: { providerRef: r.reference, metadata: { ...providerMetadata, paymentProvider: candidate.provider } as never },
              })
              .catch(() => null);
            return NextResponse.json({
              data: { checkout_url: r.redirectUrl, provider: candidate.provider, internalRef, attemptId: attempt.id },
            });
          }
          directRef = r.reference;
        } else if (candidate.provider === "ipaymoney") {
          const { initCollect } = await import("@/lib/ipaymoney");
          const r = await initCollect({
            paymentType: candidate.code, // "mobile" | "card"
            amount: Math.round(totalAmount),
            msisdn: phoneRaw ?? undefined,
            transactionId: internalRef,
            customerName: `${first || "Client"} ${last}`.trim(),
            country: getOperator(chosenOperator)?.country?.toUpperCase(),
            currency: currencyForOperator(chosenOperator) ?? "XOF",
          });
          // Carte : page sécurisée du fournisseur plutôt qu'un push téléphone.
          if (r.redirectUrl) {
            await prisma.checkoutAttempt
              .update({
                where: { id: attempt.id },
                data: { providerRef: r.reference, metadata: { ...providerMetadata, paymentProvider: candidate.provider } as never },
              })
              .catch(() => null);
            return NextResponse.json({
              data: { checkout_url: r.redirectUrl, provider: candidate.provider, internalRef, attemptId: attempt.id },
            });
          }
          directRef = r.reference;
        } else {
          failures.push(`${candidate.provider} : non implémentée`);
          continue;
        }
        usedProvider = candidate.provider;
        break;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        failures.push(`${candidate.provider} : ${message}`);
        console.error(`[payment/init:${candidate.provider}]`, err);
        // On tente la passerelle suivante — rien n'a été débité.
      }
    }

    if (!directRef) {
      const detail = failures.join(" | ") || "Aucune passerelle serveur disponible";
      await failAttempt(detail, "all_gateways_failed");
      return NextResponse.json(
        { error: "Le paiement n'a pas pu être lancé. Réessayez dans un instant.", detail },
        { status: 502 },
      );
    }

    // La passerelle retenue peut différer de la première : le suivi de statut
    // et la réconciliation doivent interroger CELLE qui a la transaction.
    await prisma.checkoutAttempt
      .update({
        where: { id: attempt.id },
        data: { metadata: { ...providerMetadata, paymentProvider: usedProvider } as never },
      })
      .catch(() => null);

    await prisma.checkoutAttempt
      .update({ where: { id: attempt.id }, data: { providerRef: directRef } })
      .catch(() => null);

    // Pas de page hébergée : l'acheteur confirme sur son téléphone, et notre
    // page d'attente suit le statut jusqu'à la livraison.
    return NextResponse.json({
      data: {
        checkout_url:
          `/payment/attente?ref=${encodeURIComponent(internalRef)}` +
          `&provider=${usedProvider}` +
          `&pid=${encodeURIComponent(directRef)}` +
          `&attempt=${attempt.id}`,
        provider: usedProvider,
        provider_ref: directRef,
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
