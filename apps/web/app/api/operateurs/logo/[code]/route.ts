import { NextResponse } from "next/server";
import { routeFor } from "@/lib/payments/registry";

/**
 * GET /api/operateurs/logo/{code} → logo officiel de l'opérateur.
 *
 * SERVI DEPUIS NOTRE DOMAINE, volontairement. Pointer les <img> directement
 * vers le CDN du fournisseur ferait dépendre l'écran de paiement d'un tiers :
 * s'il tombe ou renomme un fichier, l'acheteur voit des images cassées au
 * moment précis où il décide de payer.
 *
 * Ici, une indisponibilité renvoie 404 et le composant retombe sur sa pastille
 * — un repli discret plutôt qu'un trou visuel.
 */
export const dynamic = "force-dynamic";
export const revalidate = 86400;

/** Correspondance code interne → URL du logo, reconstruite une fois par heure. */
let cache: Record<string, string> = {};
let charge = 0;
const CACHE_MS = 3_600_000;

async function urlDuLogo(code: string): Promise<string | null> {
  if (Date.now() - charge > CACHE_MS) {
    try {
      const { activeConfiguration } = await import("@/lib/pawapay");
      const conf = await activeConfiguration();
      const parProvider = new Map(conf.filter((o) => o.logo).map((o) => [o.provider, o.logo!]));
      // On repasse par le registre : le code PawaPay n'est pas notre code
      // interne, et c'est le registre qui fait le lien — pas une convention
      // de nommage qu'on devinerait.
      const suivant: Record<string, string> = {};
      const { OPERATORS } = await import("@/lib/payments/registry");
      for (const cle of Object.keys(OPERATORS)) {
        const r = routeFor(cle, "pawapay", "collect");
        const logo = r?.code ? parProvider.get(r.code) : undefined;
        if (logo) suivant[cle] = logo;
      }
      cache = suivant;
      charge = Date.now();
    } catch {
      // PawaPay injoignable ou non configuré : on garde ce qu'on avait. Un
      // logo manquant ne doit jamais empêcher un paiement.
    }
  }
  return cache[code] ?? null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = await urlDuLogo(code.trim().toLowerCase());
  if (!url) return new NextResponse(null, { status: 404 });

  try {
    const amont = await fetch(url, { cache: "no-store" });
    if (!amont.ok) return new NextResponse(null, { status: 404 });
    const corps = await amont.arrayBuffer();
    return new NextResponse(corps, {
      headers: {
        "Content-Type": amont.headers.get("content-type") ?? "image/png",
        // Un logo d'opérateur ne change pas : on le met en cache longtemps
        // pour ne pas rappeler le fournisseur à chaque affichage.
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
