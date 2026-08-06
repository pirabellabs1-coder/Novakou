import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { IS_DEV } from "@/lib/env";
import { OPERATORS, PROVIDERS } from "@/lib/payments/registry";
import { activeProviders } from "@/lib/payments/gateways";

/**
 * GET /api/formations/admin/gateway-coverage   (admin uniquement)
 *
 * Ce que CHAQUE passerelle sait faire, opérateur par opérateur, dans les deux
 * sens. Jusqu'ici la réponse n'existait nulle part : il fallait lire le
 * registre à la main pour savoir qui reversait au Ghana, ou combien de pays
 * ne tenaient qu'à une seule passerelle.
 *
 * `active` distingue ce qui est DÉCLARÉ de ce qui est réellement utilisable :
 * une route inscrite dans une passerelle éteinte n'encaisse rien, et cette
 * nuance est précisément celle qu'on veut voir avant de retirer un
 * fournisseur.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  // Casse non garantie en base : comparer la valeur brute refusait l'acces a
  // de vrais administrateurs.
  const role = session?.user?.role?.toString().toUpperCase();
  if (!session?.user || (role !== "ADMIN" && !IS_DEV)) {
    return NextResponse.json({ error: "Accès refusé — admin requis." }, { status: 403 });
  }

  const [actifsCollect, actifsPayout] = await Promise.all([
    activeProviders("collect"),
    activeProviders("payout"),
  ]);

  type Ligne = { operateur: string; label: string; pays: string; devise: string; code: string };
  const parPasserelle: Record<string, { collect: Ligne[]; payout: Ligne[] }> = {};
  for (const p of PROVIDERS) parPasserelle[p.id] = { collect: [], payout: [] };

  // Pays dépendant d'UNE SEULE passerelle : c'est l'information qui manque le
  // plus au moment d'en retirer une. Un pays à passerelle unique tombe
  // entièrement si elle s'éteint.
  const passerellesParPays: Record<string, Set<string>> = {};

  for (const [cle, op] of Object.entries(OPERATORS)) {
    for (const sens of ["collect", "payout"] as const) {
      for (const [fournisseur, route] of Object.entries(op[sens])) {
        parPasserelle[fournisseur] ??= { collect: [], payout: [] };
        parPasserelle[fournisseur][sens].push({
          operateur: cle,
          label: op.label,
          pays: op.country,
          devise: op.currency,
          code: route.code,
        });
      }
    }
    if (op.country && Object.keys(op.collect).length > 0) {
      (passerellesParPays[op.country] ??= new Set());
      for (const f of Object.keys(op.collect)) passerellesParPays[op.country].add(f);
    }
  }

  const passerelles = PROVIDERS.map((p) => ({
    id: p.id,
    label: p.label,
    directionsDeclarees: p.directions,
    actifEncaissement: actifsCollect.includes(p.id),
    actifVersement: actifsPayout.includes(p.id),
    encaissement: parPasserelle[p.id].collect.sort((a, b) => a.pays.localeCompare(b.pays)),
    versement: parPasserelle[p.id].payout.sort((a, b) => a.pays.localeCompare(b.pays)),
  }));

  const paysFragiles = Object.entries(passerellesParPays)
    .filter(([, set]) => set.size === 1)
    .map(([pays, set]) => ({ pays, passerelle: [...set][0] }))
    .sort((a, b) => a.pays.localeCompare(b.pays));

  return NextResponse.json({
    data: {
      passerelles,
      /** Pays qui tomberaient entièrement si leur unique passerelle s'éteignait. */
      paysFragiles,
      totalPays: Object.keys(passerellesParPays).length,
    },
  });
}
