import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/cron/auth";
import { verifierFiche, type ProblemeFiche } from "@/lib/formations/product-quality";

/**
 * GET /api/cron/qualite-fiches
 *
 * PRÉVENIR LES VENDEURS DONT LA FICHE DESSERT LEUR PRODUIT.
 *
 * Les nouvelles fiches sont contrôlées à l'enregistrement. Mais celles publiées
 * AVANT ces règles ne le sont pas : titre de quatre mots, description vide,
 * vignette étirée. Le vendeur ne s'en rend pas compte — sur son écran, ça
 * passe — et il attribue ses ventes faibles au marché.
 *
 * Ce cron les repère et prévient chacun UNE fois, avec ce qu'il faut corriger.
 * On ne dépublie rien : ce sont leurs produits, et une fiche imparfaite qui
 * vend vaut mieux qu'un produit retiré sans préavis.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Au-delà, on sature la file d'e-mails pour rien : le reste passera demain. */
const MAX_PAR_PASSAGE = 40;

/** Une seule alerte par produit tous les 30 jours — au-delà c'est du harcèlement. */
const SILENCE_JOURS = 30;

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const produits = await prisma.digitalProduct.findMany({
    where: { status: "ACTIF" },
    orderBy: { createdAt: "desc" },
    take: MAX_PAR_PASSAGE,
    select: {
      id: true, title: true, description: true, price: true,
      thumbnail: true, banner: true, slug: true,
      instructeur: { select: { userId: true } },
    },
  });

  const depuis = new Date(Date.now() - SILENCE_JOURS * 24 * 3600_000);
  let prevenus = 0;
  const details: Array<{ produit: string; titre: string; problemes: ProblemeFiche[] }> = [];

  for (const p of produits) {
    const problemes = await verifierFiche({
      titre: p.title,
      description: p.description,
      prix: p.price,
      vignetteUrl: p.thumbnail,
      banniereUrl: p.banner,
    });
    if (problemes.length === 0) continue;

    details.push({ produit: p.id, titre: p.title, problemes });

    const userId = p.instructeur?.userId;
    if (!userId) continue;

    // Déjà prévenu récemment pour CE produit ? On se tait.
    const dejaVu = await prisma.notification
      .findFirst({
        where: { userId, type: "SYSTEM", link: `/vendeur/produits/${p.id}/editer`, createdAt: { gte: depuis } },
        select: { id: true },
      })
      .catch(() => null);
    if (dejaVu) continue;

    await prisma.notification
      .create({
        data: {
          userId,
          type: "SYSTEM",
          title: `Améliorez la fiche « ${p.title.slice(0, 40)} »`,
          // Le vendeur doit savoir QUOI corriger, pas seulement que ça cloche.
          message: problemes.map((x) => x.message).join(" ").slice(0, 500),
          link: `/vendeur/produits/${p.id}/editer`,
        },
      })
      .catch(() => null);
    prevenus++;
  }

  return NextResponse.json({
    examines: produits.length,
    aCorriger: details.length,
    vendeursPrevenus: prevenus,
    details,
  });
}
