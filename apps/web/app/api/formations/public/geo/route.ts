import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/formations/public/geo → { data: { country: "CI" | null } }
 *
 * Pays du VISITEUR, déduit de son adresse IP par l'infrastructure (Vercel pose
 * `x-vercel-ip-country` sur chaque requête ; `cf-ipcountry` couvre un éventuel
 * passage derrière Cloudflare). Sert de DÉFAUT au sélecteur de devise et à
 * l'écran de paiement : un Ivoirien voit d'emblée la Côte d'Ivoire et ses prix,
 * au lieu du Bénin pour tout le monde.
 *
 * Ce n'est qu'un défaut : le choix explicite du visiteur (mémorisé côté
 * navigateur) garde toujours la priorité. En local, sans en-tête, on renvoie
 * null et l'appelant garde son propre défaut.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const brut =
    req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? "";
  const country = /^[A-Za-z]{2}$/.test(brut.trim()) ? brut.trim().toUpperCase() : null;
  return NextResponse.json({ data: { country } });
}
