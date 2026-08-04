import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { paymentOptionsForCountry, availableCountries } from "@/lib/payments/gateways";
import { isPayoutCountryDisabled, PAYOUT_DISABLED_MESSAGE } from "@/lib/payments/payout-catalog";

/**
 * GET /api/formations/payout-options            → pays où l'on peut retirer
 * GET /api/formations/payout-options?country=bj → moyens de retrait de ce pays
 *
 * Pendant du point de paiement, côté RETRAIT. Vendeurs, affiliés et mentors
 * voient exactement les moyens par lesquels l'argent peut réellement leur être
 * envoyé — et rien d'autre. Proposer un moyen qui échouera au moment du
 * versement, c'est promettre un paiement qu'on ne peut pas tenir.
 *
 * Réservé aux personnes CONNECTÉES, à la différence des moyens d'encaissement :
 * un acheteur anonyme a besoin de savoir comment payer, personne n'a besoin de
 * savoir par où nous versons.
 *
 * Comme à l'encaissement, on ne renvoie jamais le nom de la passerelle : c'est
 * un détail d'infrastructure, et le vendeur n'a pas à savoir par quel rail son
 * argent transite.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  }

  try {
    const country = req.nextUrl.searchParams.get("country");

    if (!country) {
      const pays = await availableCountries("payout");
      // Certains pays sont fermés au retrait par décision produit, même quand
      // une passerelle saurait techniquement y verser. On les écarte ici plutôt
      // que de laisser un vendeur demander un retrait qui sera refusé.
      return NextResponse.json({
        data: { countries: pays.filter((c) => !isPayoutCountryDisabled(c.code.toUpperCase())) },
      });
    }

    if (isPayoutCountryDisabled(country.toUpperCase())) {
      return NextResponse.json({
        data: { country: country.toLowerCase(), options: [], indisponible: PAYOUT_DISABLED_MESSAGE },
      });
    }

    const options = await paymentOptionsForCountry(country, "payout");
    return NextResponse.json({
      data: {
        country: country.toLowerCase(),
        options: options.map((o) => ({
          code: o.code,
          label: o.label,
          family: o.family,
          currency: o.currency,
          // Un versement part toujours sur un numéro : jamais de page hébergée.
          hosted: false,
        })),
      },
    });
  } catch (err) {
    console.error("[payout-options GET]", err);
    return NextResponse.json({ data: { countries: [], options: [] } });
  }
}
