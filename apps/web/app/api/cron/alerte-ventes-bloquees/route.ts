import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { estSondeDiagnostic } from "@/lib/payments/diagnostic-probe";
import { requireCronAuth } from "@/lib/cron/auth";
import { notifyAdmins } from "@/lib/admin/notify";
import { sendEmail, emailLayout, button, getAppUrl } from "@/lib/email";
import { reconcileCollectAttempt } from "@/lib/payments/reconcile-collect";

/**
 * GET /api/cron/alerte-ventes-bloquees
 *
 * PRÉVENIR AU LIEU D'ATTENDRE QU'UN ACHETEUR SE PLAIGNE.
 *
 * Le 2026-08-03, sept défauts de paiement se sont succédé — tous SILENCIEUX.
 * Aucune erreur serveur, aucun log rouge : juste des commandes qui n'arrivaient
 * pas. Le fondateur l'a appris parce qu'un acheteur lui a écrit.
 *
 * Ce cron cherche les ANOMALIES, pas les paiements en cours :
 *   • encaissé mais NON livré — le pire cas, l'acheteur a payé sans rien
 *     recevoir ;
 *   • encaissé sans rien de nouveau à livrer — argent sans contrepartie ;
 *   • fournisseur ininterrogeable — clé, en-tête ou format cassé, c'est un
 *     défaut de code qui bloquera TOUTES les ventes de cette passerelle.
 *
 * Une tentative simplement « en attente » n'alerte PAS : c'est le cas normal
 * d'un acheteur qui n'a pas encore validé sur son téléphone. Alerter dessus
 * noierait le signal et l'alerte finirait ignorée — ce qui revient à ne pas
 * en avoir.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** En dessous, une vente est simplement en cours de confirmation. */
const AGE_MINUTES = 15;

/** Fenêtre d'examen : au-delà, le fournisseur ne répond plus utilement. */
const FENETRE_HEURES = 72;

/** Une alerte par heure au maximum : au-delà, elle devient du bruit. */
const SILENCE_MINUTES = 60;

type Anomalie = {
  quand: string;
  montant: number;
  moyen: string | null;
  passerelle: string | null;
  reference: string | null;
  acheteur: string | null;
  probleme: string;
};

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const candidates = await prisma.checkoutAttempt.findMany({
    where: {
      status: { in: ["STARTED", "ABANDONED"] },
      providerRef: { not: null },
      createdAt: {
        gte: new Date(Date.now() - FENETRE_HEURES * 3600_000),
        lte: new Date(Date.now() - AGE_MINUTES * 60_000),
      },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const anomalies: Anomalie[] = [];

  for (const t of candidates) {
    // Une sonde de diagnostic n'est pas une vente : l'alerter reviendrait à
    // crier au loup à chaque contrôle de routine.
    if (estSondeDiagnostic(t)) continue;
    const meta = (t.metadata ?? {}) as Record<string, unknown>;
    const base = {
      quand: t.createdAt.toISOString(),
      montant: Math.round(t.amount),
      moyen: t.paymentMethod,
      passerelle: typeof meta.paymentProvider === "string" ? meta.paymentProvider : null,
      reference: t.providerRef,
      acheteur: t.visitorEmail,
    };

    try {
      // La réconciliation LIVRE au passage si le paiement est confirmé : on ne
      // se contente pas de constater, on répare avant d'alerter. L'alerte ne
      // part donc que sur ce qui résiste vraiment.
      const r = await reconcileCollectAttempt(t);

      if (r.status === "success" && !r.delivered) {
        anomalies.push({ ...base, probleme: `ENCAISSÉ MAIS NON LIVRÉ — ${r.reason ?? "cause inconnue"}` });
        continue;
      }
      if (r.delivered && r.reason) {
        // Livré, mais avec une réserve : typiquement « rien de nouveau », donc
        // de l'argent encaissé sans contrepartie.
        anomalies.push({ ...base, probleme: r.reason });
        continue;
      }
      // Un fournisseur qu'on n'arrive pas à interroger est un défaut de CODE :
      // il bloquera toutes les ventes de cette passerelle, pas seulement
      // celle-ci. À distinguer d'un simple « en attente ».
      if (r.status === "pending" && r.reason?.startsWith("Statut indisponible")) {
        anomalies.push({ ...base, probleme: r.reason });
      }
      if (r.status === "unknown" && r.reason) {
        anomalies.push({ ...base, probleme: r.reason });
      }
    } catch (err) {
      anomalies.push({
        ...base,
        probleme: `Erreur de réconciliation : ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  if (anomalies.length === 0) {
    return NextResponse.json({ examinees: candidates.length, anomalies: 0 });
  }

  // ── Anti-spam : une seule alerte par heure ────────────────────────────────
  const recente = await prisma.notification
    .findFirst({
      where: {
        type: "SYSTEM",
        title: { startsWith: "Ventes bloquées" },
        createdAt: { gte: new Date(Date.now() - SILENCE_MINUTES * 60_000) },
      },
      select: { id: true },
    })
    .catch(() => null);

  if (recente) {
    return NextResponse.json({ examinees: candidates.length, anomalies: anomalies.length, alerteEtouffee: true });
  }

  const total = anomalies.reduce((s, a) => s + a.montant, 0);
  const titre = `Ventes bloquées : ${anomalies.length} (${total} FCFA)`;
  const lien = "/api/formations/admin/ventes-bloquees";

  await notifyAdmins({
    title: titre,
    message: anomalies
      .slice(0, 5)
      .map((a) => `${a.montant} FCFA · ${a.moyen ?? "?"} · ${a.probleme}`)
      .join(" | ")
      .slice(0, 500),
    link: lien,
  });

  // Un e-mail en plus de la notification : le fondateur ne consulte pas son
  // panneau admin en continu, et c'est justement quand il ne regarde pas qu'il
  // faut le prévenir.
  //
  // ⚠️ `sendEmail` renvoie un FAUX SUCCÈS quand RESEND_API_KEY est absente : il
  // écrit dans les logs et fait comme si c'était parti. Une alerte qui croit
  // avoir prévenu sans avoir prévenu est pire que pas d'alerte du tout — on
  // vérifie donc explicitement, et on le dit.
  const posteConfigure = Boolean(process.env.RESEND_API_KEY);
  let emailsEnvoyes = 0;
  let destinataires = 0;
  try {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
    const lignes = anomalies
      .slice(0, 10)
      .map(
        (a) =>
          `<tr><td style="padding:8px 10px;border-bottom:1px solid #eee">${a.montant} FCFA</td>` +
          `<td style="padding:8px 10px;border-bottom:1px solid #eee">${a.moyen ?? "?"} · ${a.passerelle ?? "?"}</td>` +
          `<td style="padding:8px 10px;border-bottom:1px solid #eee">${a.acheteur ?? "-"}</td>` +
          `<td style="padding:8px 10px;border-bottom:1px solid #eee;color:#b91c1c">${a.probleme}</td></tr>`,
      )
      .join("");

    const html = emailLayout(`
      <h2 style="margin:0 0 12px">${anomalies.length} vente(s) bloquée(s)</h2>
      <p style="margin:0 0 16px;color:#475569">
        Ces paiements ne se sont pas conclus normalement. Un acheteur a peut-être
        payé sans rien recevoir — c'est le seul cas qui coûte de l'argent et de
        la confiance.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr style="text-align:left;color:#64748b">
          <th style="padding:8px 10px">Montant</th><th style="padding:8px 10px">Moyen</th>
          <th style="padding:8px 10px">Acheteur</th><th style="padding:8px 10px">Problème</th>
        </tr>
        ${lignes}
      </table>
      ${button("Voir le détail", `${getAppUrl()}${lien}`)}
      <p style="margin:16px 0 0;color:#94a3b8;font-size:12px">
        Une tentative simplement en attente de confirmation n'apparaît pas ici.
      </p>
    `);

    destinataires = admins.filter((a) => a.email).length;
    for (const a of admins) {
      if (!a.email) continue;
      const r = await sendEmail({ to: a.email, subject: titre, html });
      if (posteConfigure && !r.error) emailsEnvoyes++;
    }
    if (!posteConfigure) {
      console.error(
        "[alerte-ventes-bloquees] RESEND_API_KEY ABSENTE — l'alerte n'a été envoyée à PERSONNE par e-mail",
      );
    } else if (emailsEnvoyes === 0 && destinataires > 0) {
      console.error("[alerte-ventes-bloquees] aucun e-mail n'a pu partir malgré", destinataires, "destinataire(s)");
    }
  } catch (err) {
    // L'e-mail ne doit jamais faire échouer la détection.
    console.error("[alerte-ventes-bloquees] e-mail", err);
  }

  console.error("[alerte-ventes-bloquees]", { anomalies: anomalies.length, total });
  return NextResponse.json({
    examinees: candidates.length,
    anomalies: anomalies.length,
    total,
    // De quoi vérifier que l'alerte a RÉELLEMENT prévenu quelqu'un.
    email: { configure: posteConfigure, destinataires, envoyes: emailsEnvoyes },
    detail: anomalies,
  });
}
