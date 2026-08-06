import { NextResponse } from "next/server";
import { lireTaux } from "@/lib/currency/taux-store";

/**
 * Taux courants, pour que le navigateur affiche les MÊMES prix que ceux qui
 * seront debités. Sans ce point d'entrée, une correction faite en admin ne
 * s'appliquerait qu'au paiement : le visiteur lirait un prix, en paierait un
 * autre — le défaut le plus sûr pour perdre un acheteur au dernier écran.
 *
 * Public : un taux de change n'est pas un secret, il est deja lisible dans le
 * prix affiche.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { data: { taux: await lireTaux() } },
    // Une minute de cache : assez pour ne pas frapper la base a chaque page,
    // assez court pour qu'une correction se propage vite.
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
