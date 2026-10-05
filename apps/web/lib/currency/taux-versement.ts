import { DEVISES, type CodeDevise } from "@/lib/currency/rates";
import { chargerTaux } from "@/lib/currency/taux-store";

/**
 * Montant à VERSER, dans la devise de l'opérateur — côté serveur uniquement.
 *
 * À l'encaissement, `montantAFacturer` arrondit VERS LE HAUT avec les taux du
 * site (relevés à la main, réglables en admin) : afficher un prix inférieur à
 * celui débité ferait perdre l'acheteur. Pour un VERSEMENT, les deux choix
 * seraient faux : 100 FCFA devenaient 30 KES (+32 %), et un taux vieux de deux
 * mois paie un montant que personne n'a décidé.
 *
 * Ici :
 *   - zone franc (XOF/XAF) : parité fixe, montant inchangé ;
 *   - ailleurs : TAUX DU JOUR (open.er-api.com, base XOF, mis à jour chaque
 *     jour), ARRONDI VERS LE BAS à l'unité — on ne verse jamais plus que dû ;
 *   - garde-fou : un taux du jour à plus de 25 % du taux de référence du site
 *     est tenu pour faux (source corrompue, devise mal lue) → aucun versement.
 *
 * Toute impossibilité lève une erreur préfixée PAYOUTS_NOT_ALLOWED : la
 * passerelle est sautée proprement, rien n'est envoyé.
 */

const SOURCE = "https://open.er-api.com/v6/latest/XOF";
const CACHE_MS = 60 * 60_000;
const ECART_MAX = 0.25;

let cache: { taux: Record<string, number>; le: number } | null = null;

async function tauxDuJour(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.le < CACHE_MS) return cache.taux;
  const r = await fetch(SOURCE, { cache: "no-store", signal: AbortSignal.timeout(6000) });
  if (!r.ok) throw new Error(`source de taux HTTP ${r.status}`);
  const j = (await r.json()) as { result?: string; rates?: Record<string, number> };
  if (j.result !== "success" || !j.rates) throw new Error("source de taux illisible");
  cache = { taux: j.rates, le: Date.now() };
  return j.rates;
}

export async function montantAVerser(
  montantFcfa: number,
  codeDevise: string | null | undefined,
): Promise<{ montant: number; devise: CodeDevise; taux: number }> {
  const code = (codeDevise ?? "").trim().toUpperCase() as CodeDevise;
  const devise = (DEVISES as Record<string, (typeof DEVISES)[CodeDevise] | undefined>)[code];
  if (!devise) throw new Error(`PAYOUTS_NOT_ALLOWED — devise de versement inconnue (« ${codeDevise ?? "vide"} »)`);
  if (!Number.isFinite(montantFcfa) || montantFcfa <= 0) throw new Error(`Montant à verser invalide : ${montantFcfa}`);
  if (code === "XOF" || code === "XAF") return { montant: Math.round(montantFcfa), devise: code, taux: 1 };

  let taux: number | undefined;
  try {
    taux = (await tauxDuJour())[code];
  } catch (err) {
    throw new Error(`PAYOUTS_NOT_ALLOWED — taux du jour indisponible pour ${code} (${err instanceof Error ? err.message : err})`);
  }
  if (!taux || !Number.isFinite(taux) || taux <= 0) {
    throw new Error(`PAYOUTS_NOT_ALLOWED — aucun taux du jour pour ${code}`);
  }
  await chargerTaux();
  const reference = devise.pourUnFcfa;
  if (Math.abs(taux - reference) / reference > ECART_MAX) {
    throw new Error(`PAYOUTS_NOT_ALLOWED — taux du jour ${code} incohérent (${taux} contre ${reference} de référence)`);
  }
  const montant = Math.floor(montantFcfa * taux);
  if (montant < 1) throw new Error(`PAYOUTS_NOT_ALLOWED — ${montantFcfa} FCFA font moins d'une unité de ${code}`);
  return { montant, devise: code, taux };
}
