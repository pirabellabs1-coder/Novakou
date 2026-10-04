import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/cron/auth";
import { notifyAdmins } from "@/lib/admin/notify";
import { notifyAdmins as alerterAdmins } from "@/lib/agents/notify";

/**
 * GET /api/cron/garde-conso — chaque matin (pg_cron, packages/db/supabase/bouclier.sql)
 *
 * VOIR VENIR LE PLAFOND DU PLAN GRATUIT AVANT LA COUPURE.
 *
 * Sur le plan Hobby, Vercel ne facture pas un dépassement : il SUSPEND le
 * projet. Le 2026-10-04, l'ancien compte consommait 4 fois les invocations et
 * 18 fois le temps CPU que permet Hobby — au même rythme, le nouveau compte
 * aurait été coupé en deux jours, sans préavis. Cette garde lit la
 * consommation des 30 derniers jours, projette le rythme de la dernière
 * semaine, et alerte (Telegram + e-mail + cloche admin) bien avant le seuil.
 *
 * Elle surveille aussi le Bouclier lui-même : un réveil de tâche planifiée qui
 * échoue (401 après un changement de CRON_SECRET, 500 d'une route) ne se
 * verrait nulle part ailleurs.
 *
 * ⚠️ L'API d'usage ouverte au plan Hobby ne donne NI le temps CPU actif NI le
 * Fast Origin Transfer — les deux postes les plus serrés. Les invocations et
 * la mémoire provisionnée (GB-heures) en sont les meilleurs indicateurs
 * disponibles ; le tableau de bord Vercel reste la référence pour le CPU.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Allocations Hobby (vercel.com/docs/limits, relu le 2026-10-04), par 30 jours. */
const PLAFONDS = {
  invocations: 1_000_000,
  gbHeures: 360,
  transfertGo: 100,
} as const;

/** Part du plafond (consommée OU projetée) à partir de laquelle on prévient. */
const SEUIL_ALERTE = 0.7;
const SEUIL_CRITIQUE = 0.9;

/** Une alerte par sujet et par 24 h : la garde tourne une fois par jour. */
const SILENCE_H = 20;

interface LigneUsage {
  date: string;
  function_invocation_successful_count?: number;
  function_invocation_error_count?: number;
  function_invocation_timeout_count?: number;
  function_execution_successful_gb_hours?: number;
  function_execution_error_gb_hours?: number;
  function_execution_timeout_gb_hours?: number;
  bandwidth_outgoing_bytes?: number;
  request_hit_count?: number;
  request_miss_count?: number;
}

interface Totaux {
  invocations: number;
  gbHeures: number;
  transfertGo: number;
  requetes: number;
  servisParLeCache: number;
}

function totaliser(lignes: LigneUsage[]): Totaux {
  const t: Totaux = { invocations: 0, gbHeures: 0, transfertGo: 0, requetes: 0, servisParLeCache: 0 };
  for (const l of lignes) {
    t.invocations +=
      (l.function_invocation_successful_count ?? 0) +
      (l.function_invocation_error_count ?? 0) +
      (l.function_invocation_timeout_count ?? 0);
    t.gbHeures +=
      (l.function_execution_successful_gb_hours ?? 0) +
      (l.function_execution_error_gb_hours ?? 0) +
      (l.function_execution_timeout_gb_hours ?? 0);
    t.transfertGo += (l.bandwidth_outgoing_bytes ?? 0) / 1e9;
    t.requetes += (l.request_hit_count ?? 0) + (l.request_miss_count ?? 0);
    t.servisParLeCache += l.request_hit_count ?? 0;
  }
  return t;
}

async function lireUsage(depuis: Date, jusqua: Date): Promise<LigneUsage[]> {
  const jeton = process.env.VERCEL_API_TOKEN;
  const equipe = process.env.VERCEL_TEAM_ID;
  if (!jeton || !equipe) throw new Error("VERCEL_API_TOKEN ou VERCEL_TEAM_ID absent");
  const url =
    `https://api.vercel.com/v2/usage?teamId=${equipe}&type=requests` +
    `&from=${depuis.toISOString()}&to=${jusqua.toISOString()}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${jeton}` }, cache: "no-store" });
  if (!r.ok) throw new Error(`API d'usage Vercel : HTTP ${r.status} ${(await r.text()).slice(0, 160)}`);
  const corps = (await r.json()) as { data?: LigneUsage[] };
  return corps.data ?? [];
}

async function dejaAlerte(prefixe: string): Promise<boolean> {
  const r = await prisma.notification
    .findFirst({
      where: { type: "SYSTEM", title: { startsWith: prefixe }, createdAt: { gte: new Date(Date.now() - SILENCE_H * 3600_000) } },
      select: { id: true },
    })
    .catch(() => null);
  return Boolean(r);
}

async function alerter(titre: string, message: string) {
  if (await dejaAlerte(titre)) return false;
  // Cloche admin (sert aussi de mémoire pour le silence de 20 h) puis
  // Telegram + e-mail : une coupure Vercel n'attend pas qu'on ouvre l'admin.
  await notifyAdmins({ title: titre, message, link: "/admin/dashboard" });
  await alerterAdmins({ subject: titre, body: message });
  return true;
}

const pct = (x: number) => `${Math.round(x * 100)} %`;

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const maintenant = new Date();
  const il30j = new Date(maintenant.getTime() - 30 * 86_400_000);
  const il7j = new Date(maintenant.getTime() - 7 * 86_400_000);

  const alertes: string[] = [];
  let conso: Record<string, unknown> | null = null;

  // ── 1. Consommation Vercel ───────────────────────────────────────────────
  try {
    const lignes = await lireUsage(il30j, maintenant);
    const sur30j = totaliser(lignes);
    const sur7j = totaliser(lignes.filter((l) => new Date(l.date) >= il7j));
    // Projection : le rythme des 7 derniers jours tenu pendant 30 jours. Plus
    // juste que le cumul pour un compte récent ou qui vient d'être allégé.
    const projete = {
      invocations: (sur7j.invocations / 7) * 30,
      gbHeures: (sur7j.gbHeures / 7) * 30,
      transfertGo: (sur7j.transfertGo / 7) * 30,
    };

    const postes = (Object.keys(PLAFONDS) as (keyof typeof PLAFONDS)[]).map((cle) => ({
      cle,
      consomme: sur30j[cle] / PLAFONDS[cle],
      projete: projete[cle] / PLAFONDS[cle],
    }));
    const pire = postes.reduce((a, b) => (Math.max(b.consomme, b.projete) > Math.max(a.consomme, a.projete) ? b : a));
    const niveau = Math.max(pire.consomme, pire.projete);

    conso = {
      sur30j: { ...sur30j, gbHeures: +sur30j.gbHeures.toFixed(2), transfertGo: +sur30j.transfertGo.toFixed(2) },
      projection30j: {
        invocations: Math.round(projete.invocations),
        gbHeures: +projete.gbHeures.toFixed(2),
        transfertGo: +projete.transfertGo.toFixed(2),
      },
      partDuPlafond: Object.fromEntries(postes.map((p) => [p.cle, { consomme: pct(p.consomme), projete: pct(p.projete) }])),
      partServieParLeCache: sur30j.requetes ? pct(sur30j.servisParLeCache / sur30j.requetes) : null,
    };

    if (niveau >= SEUIL_ALERTE) {
      const critique = niveau >= SEUIL_CRITIQUE;
      const titre = critique ? "Consommation Vercel CRITIQUE" : "Consommation Vercel élevée";
      const detail = postes
        .map((p) => `${p.cle} : ${pct(p.consomme)} consommé, ${pct(p.projete)} au rythme actuel`)
        .join(" · ");
      const envoye = await alerter(
        titre,
        `Plan Hobby : au-delà de 100 %, Vercel SUSPEND le site. ${detail}. ` +
          (critique ? "Agir aujourd'hui (passage en Pro ou allègement)." : "À surveiller cette semaine."),
      );
      if (envoye) alertes.push(titre);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    conso = { erreur: message };
    // Jeton révoqué ou expiré : la garde serait aveugle sans le dire.
    if (await alerter("Garde de consommation aveugle", `Lecture de l'usage Vercel impossible : ${message}`)) {
      alertes.push("Garde de consommation aveugle");
    }
  }

  // ── 2. Santé du Bouclier (tâches planifiées) ────────────────────────────
  const reveils = await prisma
    .$queryRaw<{ chemin: string; total: number; echecs: number; dernier_echec: string | null }[]>`
      select chemin,
             count(*)::int as total,
             count(*) filter (where statut >= 400 or erreur is not null)::int as echecs,
             max(coalesce(statut::text, '') || ' ' || coalesce(erreur, '')) filter (where statut >= 400 or erreur is not null) as dernier_echec
        from bouclier.reveil
       where le >= now() - interval '24 hours'
       group by chemin
       order by total desc`
    .catch(() => null);

  const enEchec = (reveils ?? []).filter((r) => r.echecs > 0);
  if (enEchec.length > 0) {
    const titre = "Tâches planifiées en échec";
    const detail = enEchec.map((r) => `${r.chemin} : ${r.echecs}/${r.total} (${(r.dernier_echec ?? "").trim().slice(0, 80)})`).join(" · ");
    if (await alerter(titre, `Sur 24 h : ${detail}. Un 401 signale un CRON_SECRET désaligné avec le coffre Supabase.`)) {
      alertes.push(titre);
    }
  }

  return NextResponse.json({
    ok: true,
    conso,
    bouclier: reveils
      ? { reveils24h: reveils.reduce((s, r) => s + r.total, 0), parTache: reveils }
      : { erreur: "journal bouclier.reveil illisible" },
    alertes,
  });
}
