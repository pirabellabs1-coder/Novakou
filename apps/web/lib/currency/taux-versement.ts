import type { CodeDevise } from "@/lib/currency/rates";

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
 *   - ailleurs : TAUX DU JOUR (open.er-api.com, base XOF), ARRONDI VERS LE BAS
 *     à l'unité — on ne verse jamais plus que dû ;
 *   - garde-fous : taux de plus de 48 h refusé ; taux à plus de 10 % de la
 *     RÉFÉRENCE FIGÉE ci-dessous refusé (source corrompue, devise mal lue).
 *     La référence n'est PAS celle de l'admin : un réglage d'affichage ne doit
 *     pas pouvoir élargir ce qu'on accepte de verser.
 *
 * Deux sortes d'échec, deux suites :
 *   - TAUX_INDISPONIBLE (source muette, taux périmé ou incohérent) : temporaire,
 *     RIEN n'est envoyé et le retrait reste en attente — il sera repris ;
 *   - PAYOUTS_NOT_ALLOWED (devise sans référence, montant trop petit) :
 *     définitif, la passerelle est écartée proprement.
 */

const SOURCE = "https://open.er-api.com/v6/latest/XOF";
const CACHE_MS = 60 * 60_000;
const AGE_MAX_MS = 48 * 3600_000;
const ECART_MAX = 0.1;

/**
 * Unités de devise pour 1 FCFA — RELEVÉ du 2026-10-05 (open.er-api.com,
 * recoupé avec 1 € = 655,957 FCFA). À réviser tous les quelques mois : au-delà
 * de 10 % de dérive réelle, les versements de la devise se mettent en attente
 * (sans perte) jusqu'à la mise à jour de cette table.
 */
export const REFERENCE_VERSEMENT: Partial<Record<CodeDevise, number>> = {
  CDF: 3.97,
  KES: 0.2228,
  UGX: 6.82,
  RWF: 2.53,
  ZMW: 0.0339,
  SLE: 0.0423,
};

let cache: { taux: Record<string, number>; majLe: number; lu: number } | null = null;

async function tauxDuJour(): Promise<{ taux: Record<string, number>; majLe: number }> {
  if (cache && Date.now() - cache.lu < CACHE_MS) return cache;
  const r = await fetch(SOURCE, { cache: "no-store", signal: AbortSignal.timeout(6000) });
  if (!r.ok) throw new Error(`source de taux HTTP ${r.status}`);
  const j = (await r.json()) as { result?: string; rates?: Record<string, number>; time_last_update_unix?: number };
  if (j.result !== "success" || !j.rates || !j.time_last_update_unix) throw new Error("source de taux illisible");
  cache = { taux: j.rates, majLe: j.time_last_update_unix * 1000, lu: Date.now() };
  return cache;
}

export async function montantAVerser(
  montantFcfa: number,
  codeDevise: string | null | undefined,
): Promise<{ montant: number; devise: CodeDevise; taux: number }> {
  const code = (codeDevise ?? "").trim().toUpperCase() as CodeDevise;
  if (!Number.isFinite(montantFcfa) || montantFcfa <= 0) {
    throw new Error(`PAYOUTS_NOT_ALLOWED — montant à verser invalide : ${montantFcfa}`);
  }
  if (code === "XOF" || code === "XAF") return { montant: Math.round(montantFcfa), devise: code, taux: 1 };

  const reference = REFERENCE_VERSEMENT[code];
  if (!reference) throw new Error(`PAYOUTS_NOT_ALLOWED — aucune référence de change pour verser en « ${codeDevise ?? "vide"} »`);

  let lu: { taux: Record<string, number>; majLe: number };
  try {
    lu = await tauxDuJour();
  } catch (err) {
    throw new Error(`TAUX_INDISPONIBLE — taux du jour ${code} indisponible (${err instanceof Error ? err.message : err})`);
  }
  if (Date.now() - lu.majLe > AGE_MAX_MS) {
    throw new Error(`TAUX_INDISPONIBLE — taux ${code} périmé (mis à jour le ${new Date(lu.majLe).toISOString()})`);
  }
  const taux = lu.taux[code];
  if (!taux || !Number.isFinite(taux) || taux <= 0) throw new Error(`TAUX_INDISPONIBLE — aucun taux du jour pour ${code}`);
  if (Math.abs(taux - reference) / reference > ECART_MAX) {
    throw new Error(`TAUX_INDISPONIBLE — taux du jour ${code} incohérent (${taux} contre ${reference} de référence) : vérifier, puis réviser REFERENCE_VERSEMENT`);
  }
  const montant = Math.floor(montantFcfa * taux);
  if (montant < 1) throw new Error(`PAYOUTS_NOT_ALLOWED — ${montantFcfa} FCFA font moins d'une unité de ${code}`);
  return { montant, devise: code, taux };
}

/** Pour les tests : oublie le taux mis en cache. */
export function viderCacheTauxVersement(): void {
  cache = null;
}
