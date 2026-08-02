import { NextRequest, NextResponse } from "next/server";
import { paymentOptionsForCountry, availableCountries } from "@/lib/payments/gateways";

/**
 * GET /api/formations/public/payment-options            → pays disponibles
 * GET /api/formations/public/payment-options?country=ml → moyens de ce pays
 *
 * Alimente l'ÉCRAN UNIQUE de paiement : l'acheteur choisit son pays et voit
 * tous les moyens réellement encaissables, toutes passerelles confondues.
 *
 * Public (pas d'auth) : ne renvoie que des libellés et des codes d'opérateur —
 * jamais d'identifiant de passerelle. Le nom du fournisseur qui traitera le
 * paiement n'est pas exposé non plus : c'est un détail d'infrastructure, et
 * l'acheteur n'a pas à savoir par quel rail transite son argent.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const country = req.nextUrl.searchParams.get("country");

    if (!country) {
      const countries = await availableCountries();
      return NextResponse.json({ data: { countries } });
    }

    const options = await paymentOptionsForCountry(country);
    return NextResponse.json({
      data: {
        country: country.toLowerCase(),
        options: options.map((o) => ({
          code: o.code,
          label: o.label,
          family: o.family,
          currency: o.currency,
          // `hosted` indique que le moyen ouvre une page sécurisée du
          // fournisseur (cas de la carte) plutôt qu'une saisie chez nous.
          hosted: o.hosted,
        })),
      },
    });
  } catch (err) {
    console.error("[public/payment-options GET]", err);
    return NextResponse.json({ data: { countries: [], options: [] } });
  }
}
