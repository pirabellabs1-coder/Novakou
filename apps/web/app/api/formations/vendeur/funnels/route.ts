import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import { resolveVendorContext } from "@/lib/formations/active-user";
import { getActiveShopId } from "@/lib/formations/active-shop";
import { getOrCreateInstructeur } from "@/lib/formations/instructeur";

async function getInstructeur(userId: string) {
  return getOrCreateInstructeur(userId);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/**
 * GET /api/vendeur/funnels
 * Returns all funnels for the authenticated instructeur.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const inst = await getInstructeur(userId);
    if (!inst) return NextResponse.json({ data: [] });

    // Scope by active shop (optionnel — sans cookie, retourne tous les funnels du vendeur)
    const activeShopId = await getActiveShopId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });

    const funnels = await prisma.salesFunnel.findMany({
      where: { instructeurId: inst.id, ...(activeShopId ? { shopId: activeShopId } : {}) },
      orderBy: { updatedAt: "desc" },
      include: {
        steps: { orderBy: { stepOrder: "asc" } },
        _count: { select: { events: true } },
      },
    });

    return NextResponse.json({ data: funnels });
  } catch (err) {
    console.error("[vendeur/funnels GET]", err);
    return NextResponse.json({ data: [], error: err instanceof Error ? err.message : String(err) });
  }
}

/**
 * POST /api/vendeur/funnels
 * Create a new funnel (with default LANDING step).
 *
 * Body: { name: string, productId?: string, formationId?: string }
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user && !IS_DEV)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    // Resolve the real active user (by id OR email fallback) + upsert instructeur profile
    const ctx = await resolveVendorContext(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    if (!ctx) {
      return NextResponse.json(
        { error: "Impossible de résoudre votre session. Déconnectez-vous et reconnectez-vous." },
        { status: 401 }
      );
    }
    const activeShopId = await getActiveShopId(session, {
      devFallback: IS_DEV ? "dev-instructeur-001" : undefined,
    });
    const inst = { id: ctx.instructeurId };

    const body = await request.json();
    const { name, productId, formationId } = body as {
      name?: string;
      productId?: string;
      formationId?: string;
    };

    if (!name || name.trim().length < 3) {
      return NextResponse.json({ error: "Nom requis (min 3 caractères)" }, { status: 400 });
    }

    // Generate unique slug
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 0;
    while (await prisma.salesFunnel.findUnique({ where: { slug } })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // Default theme + default landing step blocks
    const defaultTheme = {
      primaryColor: "#006e2f",
      accentColor: "#22c55e",
      textColor: "#191c1e",
      bgColor: "#f7f9fb",
      font: "Manrope",
    };

    const defaultBlocks = [
      {
        id: "hero",
        type: "hero",
        data: {
          badge: "Offre limitée",
          headline: "Transformez vos compétences en revenus",
          subheadline: "La formation qui a déjà aidé +1 000 freelances à doubler leur chiffre d'affaires.",
          ctaText: "Je veux accéder maintenant",
          imageUrl: "",
        },
      },
      {
        id: "features",
        type: "features",
        data: {
          title: "Ce que vous allez apprendre",
          items: [
            { icon: "check_circle", title: "Méthodes éprouvées", desc: "Des stratégies qui fonctionnent vraiment." },
            { icon: "rocket_launch", title: "Résultats rapides", desc: "Les premiers effets en 7 jours." },
            { icon: "support_agent", title: "Support prioritaire", desc: "Notre équipe répond en 24h." },
          ],
        },
      },
      {
        id: "countdown",
        type: "countdown",
        data: {
          title: "L'offre se termine dans...",
          endsInHours: 48,
          subtitle: "Après cette date, le prix passera à son tarif normal.",
        },
      },
      {
        id: "testimonials",
        type: "testimonials",
        data: {
          title: "Ils ont déjà transformé leur business",
          items: [
            { name: "Aminata Diallo", role: "Formatrice · Dakar", text: "J'ai doublé mes revenus en 3 mois. Cette formation a changé ma vie professionnelle.", rating: 5 },
            { name: "Jean-Baptiste Kouassi", role: "Freelance · Abidjan", text: "Concret, clair, et surtout applicable immédiatement. Je recommande à 100%.", rating: 5 },
          ],
        },
      },
      {
        id: "faq",
        type: "faq",
        data: {
          title: "Questions fréquentes",
          items: [
            { q: "Combien de temps ai-je accès au contenu ?", a: "À vie. Tous les contenus sont accessibles sans limite de temps." },
            { q: "Puis-je demander un remboursement ?", a: "Oui, remboursement garanti pendant 14 jours si vous n'êtes pas satisfait." },
          ],
        },
      },
      {
        id: "cta",
        type: "cta",
        data: {
          headline: "Prêt à passer à l'action ?",
          subheadline: "Rejoignez les centaines de créateurs qui ont déjà fait le choix de se former.",
          ctaText: "Commencer maintenant",
        },
      },
    ];

    const funnel = await prisma.salesFunnel.create({
      data: { instructeurId: inst.id, shopId: activeShopId,
        name: name.trim(),
        slug,
        theme: defaultTheme,
        isActive: false,
        steps: {
          create: [
            {
              stepOrder: 1,
              stepType: "LANDING",
              title: "Landing Page",
              formationId: formationId ?? null,
              productId: productId ?? null,
              headlineFr: "Transformez vos compétences en revenus",
              ctaTextFr: "Je veux accéder maintenant",
              blocks: defaultBlocks,
            },
            {
              stepOrder: 2,
              stepType: "PRODUCT",
              title: "Checkout",
              formationId: formationId ?? null,
              productId: productId ?? null,
              headlineFr: "Finalisez votre commande",
              ctaTextFr: "Payer maintenant",
              blocks: [],
            },
            {
              stepOrder: 3,
              stepType: "UPSELL",
              title: "Offre spéciale",
              headlineFr: "Une dernière offre pour vous !",
              descriptionFr: "Ajoutez ce produit complémentaire à seulement -50% pour maximiser vos résultats.",
              ctaTextFr: "Oui, j'ajoute cette offre",
              discountPct: 50,
              blocks: [],
            },
            {
              stepOrder: 4,
              stepType: "THANK_YOU",
              title: "Merci !",
              headlineFr: "Félicitations ! 🎉",
              descriptionFr: "Votre achat est confirmé. Vous allez recevoir un email avec tous les détails d'accès.",
              ctaTextFr: "Accéder au contenu",
              blocks: [],
            },
          ],
        },
      },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });

    return NextResponse.json({ data: funnel });
  } catch (err) {
    console.error("[vendeur/funnels POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
