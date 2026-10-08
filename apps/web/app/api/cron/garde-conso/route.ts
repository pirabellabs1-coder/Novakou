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
    // Réponse vide ou sans compteur d'invocations (format changé par Vercel) :
    // des totaux à zéro passeraient pour « tout va bien ». C'est un aveuglement.
    if (!lignes.some((l) => typeof l.function_invocation_successful_count === "number")) {
      throw new Error(`réponse sans données exploitables (${lignes.length} ligne(s))`);
    }
    const sur30j = totaliser(lignes);
    const recentes = lignes.filter((l) => new Date(l.date) >= il7j);
    const sur7j = totaliser(recentes);
    // Projection : le rythme récent tenu pendant 30 jours — plus juste que le
    // cumul pour un compte qui vient d'être allégé. Diviser par 7 jours pour un
    // compte qui n'en a que quelques heures écraserait le rythme réel : on
    // divise par la durée réellement observée (1 jour au minimum, pour ne pas
    // extrapoler une seule heure agitée).
    const premiere = Math.min(...recentes.map((l) => new Date(l.date).getTime()));
    const joursObserves = Math.min(7, Math.max(1, (maintenant.getTime() - premiere) / 86_400_000));
    const projete = {
      invocations: (sur7j.invocations / joursObserves) * 30,
      gbHeures: (sur7j.gbHeures / joursObserves) * 30,
      transfertGo: (sur7j.transfertGo / joursObserves) * 30,
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
      joursObserves: +joursObserves.toFixed(2),
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
  // Trois pannes possibles, invisibles partout ailleurs :
  //  - la route réveillée répond en erreur (401 après un changement de
  //    CRON_SECRET, 500…) → statut dans bouclier.reveil ;
  //  - un portier plante → il réveille quand même (bouclier.reveiller_si),
  //    motif « portier en erreur » ;
  //  - le passage pg_cron échoue avant tout réveil (secret absent du coffre…)
  //    → seule trace : cron.job_run_details.
  const echec = (r: { statut: number | null; erreur: string | null; motif: string }) =>
    (r.statut ?? 0) >= 400 || r.erreur !== null || r.motif.startsWith("portier en erreur");
  type LigneReveil = { chemin: string; motif: string; statut: number | null; erreur: string | null };
  const [reveils, passagesRates] = await Promise.all([
    prisma
      .$queryRaw<LigneReveil[]>`
        select chemin, motif, statut, erreur
          from bouclier.reveil
         where le >= now() - interval '24 hours'
         order by le desc`
      .catch(() => null),
    prisma
      .$queryRaw<{ tache: string; echecs: number; message: string | null }[]>`
        select j.jobname as tache,
               count(*)::int as echecs,
               (array_agg(d.return_message order by d.start_time desc))[1] as message
          from cron.job_run_details d
          join cron.job j using (jobid)
         where j.jobname like 'nk-%'
           and d.status = 'failed'
           and d.start_time >= now() - interval '24 hours'
         group by j.jobname`
      .catch(() => null),
  ]);

  const problemes: string[] = [];
  if (!reveils || !passagesRates) {
    problemes.push("journal du Bouclier illisible (bouclier.reveil ou cron.job_run_details)");
  }
  const parChemin = new Map<string, { total: number; echecs: number; dernier: string }>();
  for (const r of reveils ?? []) {
    const c = parChemin.get(r.chemin) ?? { total: 0, echecs: 0, dernier: "" };
    c.total++;
    if (echec(r)) {
      c.echecs++;
      // Lignes triées du plus récent au plus ancien : le premier échec vu est le dernier survenu.
      if (!c.dernier) c.dernier = [r.statut, r.erreur, r.motif.startsWith("portier") ? r.motif : null].filter(Boolean).join(" ");
    }
    parChemin.set(r.chemin, c);
  }
  for (const [chemin, c] of parChemin) {
    if (c.echecs > 0) problemes.push(`${chemin} : ${c.echecs}/${c.total} en échec (${c.dernier.slice(0, 100)})`);
  }
  for (const p of passagesRates ?? []) {
    problemes.push(`${p.tache} : ${p.echecs} passage(s) pg_cron échoué(s) (${(p.message ?? "").slice(0, 100)})`);
  }
  if (problemes.length > 0) {
    const titre = "Tâches planifiées en échec";
    const message =
      `Sur 24 h : ${problemes.join(" · ")}. Un 401 signale un CRON_SECRET désaligné avec le coffre Supabase ; ` +
      "un « portier en erreur » une colonne renommée (relire packages/db/supabase/bouclier.sql).";
    if (await alerter(titre, message)) alertes.push(titre);
  }

  // ── 3. Veille sécurité (24 h) ────────────────────────────────────────────
  // Ce qu'un attaquant laisse comme traces : rafales de connexions ratées
  // (bourrage d'identifiants), nouveaux administrateurs, changements de rôle,
  // retraits refusés en série. Un résumé par jour, une alerte si ça dépasse.
  const il24h = new Date(maintenant.getTime() - 86_400_000);
  const securite = await (async () => {
    try {
      const [echecs, emailsVises, parIp, succes, actions, nouveauxAdmins, retraitsRefuses] = await Promise.all([
        prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: il24h } } }),
        prisma.loginAttempt.findMany({ where: { success: false, createdAt: { gte: il24h } }, distinct: ["email"], select: { email: true } }),
        prisma.loginAttempt.groupBy({ by: ["ipAddress"], where: { success: false, createdAt: { gte: il24h } }, _count: { _all: true }, orderBy: { _count: { ipAddress: "desc" } }, take: 3 }),
        prisma.loginAttempt.count({ where: { success: true, createdAt: { gte: il24h } } }),
        prisma.auditLog.groupBy({ by: ["action"], where: { createdAt: { gte: il24h } }, _count: { _all: true } }),
        prisma.user.count({ where: { role: "ADMIN", OR: [{ createdAt: { gte: il24h } }, { auditLogsAsTarget: { some: { action: "user.role_changed", createdAt: { gte: il24h } } } }] } }),
        prisma.instructorWithdrawal.count({ where: { status: "REFUSE", createdAt: { gte: il24h } } }),
      ]);
      const parAction = Object.fromEntries(actions.map((a) => [a.action, a._count._all]));
      const topIps = parIp.map((p) => ({ ip: p.ipAddress ?? "?", n: p._count._all }));
      const bilan = {
        connexionsRatees: echecs,
        comptesVises: emailsVises.length,
        connexionsReussies: succes,
        ipLesPlusActives: topIps,
        nouveauxAdmins,
        changementsDeRole: parAction["user.role_changed"] ?? 0,
        suspensions: parAction["user.suspended"] ?? 0,
        signauxFraude: parAction["fraud.signal"] ?? 0,
        retraitsRefuses,
      };
      const bourrage = echecs >= 100 || emailsVises.length >= 25 || (topIps[0]?.n ?? 0) >= 50;
      if (bourrage) {
        const titre = "Rafale de connexions ratées";
        const msg = `${echecs} échecs sur ${emailsVises.length} comptes en 24 h (IP la plus active : ${topIps[0]?.ip ?? "?"} × ${topIps[0]?.n ?? 0}). Bourrage d'identifiants probable : vérifiez les comptes visés et envisagez de forcer des réinitialisations.`;
        if (await alerter(titre, msg)) alertes.push(titre);
      }
      if (nouveauxAdmins > 0) {
        const titre = "Nouvel administrateur détecté";
        const msg = `${nouveauxAdmins} compte(s) ADMIN créé(s) ou promu(s) en 24 h. Si ce n'est pas vous, retirez le rôle immédiatement (Admin → Utilisateurs) et changez vos secrets.`;
        if (await alerter(titre, msg)) alertes.push(titre);
      }
      return bilan;
    } catch (err) {
      return { erreur: err instanceof Error ? err.message : String(err) };
    }
  })();

  return NextResponse.json({
    ok: true,
    securite,
    conso,
    bouclier: {
      reveils24h: reveils?.length ?? null,
      parTache: Object.fromEntries(parChemin),
      passagesRates: passagesRates ?? null,
    },
    alertes,
  });
}
