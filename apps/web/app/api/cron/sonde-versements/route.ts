import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/cron/auth";
import { notifyAdmins } from "@/lib/admin/notify";
import { sendEmail, emailLayout } from "@/lib/email";
import { payoutFetch, isPayoutProxyConfigured } from "@/lib/payout/proxy-fetch";

/**
 * GET /api/cron/sonde-versements — toutes les heures
 *
 * VOIR UNE PANNE DE VERSEMENT AVANT QU'UN VENDEUR NE LA SUBISSE.
 *
 * Jusqu'ici, une panne du trajet de versement (proxy à IP fixe épuisé, IP
 * refusée par FeexPay) ne se découvrait qu'au premier retrait raté — douze
 * refus d'affilée en août avant que quiconque ne comprenne. Deux contrôles,
 * en lecture seule, sans le moindre mouvement d'argent :
 *
 *  1. LE TRAJET FEEXPAY répond-il depuis notre IP fixe ? Un appel sans clé à
 *     l'hôte de versement doit répondre 401 (« authentifiez-vous »). Un 403
 *     « IP not allowed » ou une erreur de connexion = le proxy est mort ou
 *     l'IP n'est plus whitelistée → alerte admin immédiate.
 *
 *  2. DES RETRAITS SONT-ILS BLOQUÉS depuis plus de 24 h ? Jamais envoyés
 *     (pas de référence fournisseur) ou envoyés sans confirmation. Alerte
 *     admin, et un mot au vendeur — une seule fois — pour tenir la promesse
 *     faite par e-mail : on le prévient, il n'a rien à refaire.
 *
 * Coût : ~24 requêtes proxy par jour, zéro si le proxy n'est pas configuré.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BLOQUE_APRES_H = 24;
/** Une alerte admin par sujet et par 6 h : au-delà, elle devient du bruit. */
const SILENCE_H = 6;

async function dejaAlerte(prefixe: string): Promise<boolean> {
  const r = await prisma.notification
    .findFirst({
      where: { type: "SYSTEM", title: { startsWith: prefixe }, createdAt: { gte: new Date(Date.now() - SILENCE_H * 3600_000) } },
      select: { id: true },
    })
    .catch(() => null);
  return Boolean(r);
}

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  // ── 1. Le trajet FeexPay ─────────────────────────────────────────────────
  let trajet: { ok: boolean; detail: string } = { ok: true, detail: "proxy non configuré — contrôle sauté" };
  if (isPayoutProxyConfigured()) {
    try {
      const r = await payoutFetch("https://api-v2.feexpay.me/api/payouts/status/public/sonde-novakou", {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const corps = (await r.text().catch(() => "")).slice(0, 200);
      const ipRefusee = r.status === 403 && /ip/i.test(corps);
      // 401/404/400 = la route existe et notre IP est acceptée : c'est le cas sain.
      trajet = ipRefusee
        ? { ok: false, detail: `HTTP 403 — ${corps}` }
        : r.status >= 500
          ? { ok: false, detail: `HTTP ${r.status} — FeexPay indisponible` }
          : { ok: true, detail: `HTTP ${r.status}` };
    } catch (err) {
      trajet = { ok: false, detail: `connexion impossible : ${err instanceof Error ? err.message : String(err)}` };
    }
    if (!trajet.ok && !(await dejaAlerte("Trajet de versement FeexPay"))) {
      await notifyAdmins({
        title: "Trajet de versement FeexPay en panne",
        message:
          `Sonde horaire : ${trajet.detail}. Les retraits FeexPay seront refusés tant que ce n'est pas corrigé ` +
          "(forfait du proxy à IP fixe, identifiants, ou liste blanche FeexPay).",
        link: "/admin/passerelles",
      });
    }
  }

  // ── 2. Retraits bloqués depuis plus de 24 h ──────────────────────────────
  const limite = new Date(Date.now() - BLOQUE_APRES_H * 3600_000);
  const [vendeurs, affilies] = await Promise.all([
    prisma.instructorWithdrawal.findMany({
      where: { status: "EN_ATTENTE", createdAt: { lte: limite } },
      select: { id: true, amount: true, method: true, createdAt: true, paymentRef: true, accountDetails: true, instructeur: { select: { user: { select: { email: true, name: true } } } } },
      take: 100,
    }),
    prisma.affiliateWithdrawal.findMany({
      where: { status: "EN_ATTENTE", createdAt: { lte: limite } },
      select: { id: true, amount: true, method: true, createdAt: true, paymentRef: true, accountDetails: true, affiliate: { select: { user: { select: { email: true, name: true } } } } },
      take: 100,
    }),
  ]);

  const bloques = [
    ...vendeurs.map((w) => ({ ...w, kind: "vendeur" as const, email: w.instructeur?.user?.email ?? null, nom: w.instructeur?.user?.name ?? null })),
    ...affilies.map((w) => ({ ...w, kind: "affilie" as const, email: w.affiliate?.user?.email ?? null, nom: w.affiliate?.user?.name ?? null })),
  ];

  let vendeursPrevenus = 0;
  if (bloques.length > 0) {
    const total = bloques.reduce((s, w) => s + w.amount, 0);
    if (!(await dejaAlerte("Retraits bloqués"))) {
      await notifyAdmins({
        title: `Retraits bloqués : ${bloques.length} depuis plus de 24 h (${Math.round(total)} FCFA)`,
        message: bloques
          .slice(0, 5)
          .map((w) => `${Math.round(w.amount)} F · ${w.method} · ${w.paymentRef ? "envoyé, non confirmé" : "jamais envoyé"}`)
          .join(" | "),
        link: "/admin/retraits-vendeurs",
      });
    }

    // Un mot au vendeur, UNE fois par retrait : la date d'envoi est notée dans
    // accountDetails (déjà JSON, déjà réservé à l'admin) — pas de migration.
    for (const w of bloques) {
      const details = (w.accountDetails ?? {}) as Record<string, unknown>;
      if (details._avisAttenteLe || !w.email) continue;
      const prenom = (w.nom ?? "").trim().split(/\s+/)[0] || "cher partenaire";
      const envoi = await sendEmail({
        to: w.email,
        subject: "Votre retrait Novakou est en cours de traitement",
        html: emailLayout(`
          <h2 style="margin:0 0 12px">Votre retrait est en cours de traitement</h2>
          <p style="margin:0 0 12px;color:#475569">Bonjour ${prenom},</p>
          <p style="margin:0 0 12px;color:#475569">
            Votre demande de retrait de <strong>${Math.round(w.amount)} FCFA</strong> prend plus de temps que prévu.
            Nous nous en occupons : votre argent est en sécurité sur votre solde, et vous n'avez rien à refaire.
            Nous vous préviendrons dès qu'il sera versé.
          </p>
          <p style="margin:0;color:#475569">Merci pour votre patience. — L'équipe Novakou</p>
        `),
      }).catch(() => ({ error: true }));
      if (!("error" in envoi && envoi.error)) {
        vendeursPrevenus++;
        const data = { accountDetails: { ...details, _avisAttenteLe: new Date().toISOString() } as never };
        if (w.kind === "vendeur") await prisma.instructorWithdrawal.update({ where: { id: w.id }, data }).catch(() => null);
        else await prisma.affiliateWithdrawal.update({ where: { id: w.id }, data }).catch(() => null);
      }
    }
  }

  return NextResponse.json({
    trajetFeexpay: trajet,
    retraitsBloques: bloques.length,
    vendeursPrevenus,
  });
}
