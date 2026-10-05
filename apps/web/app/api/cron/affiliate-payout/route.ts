import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/cron/auth";
import { MIN_WITHDRAWAL_XOF } from "@/lib/payments/payout-catalog";
import { processAffiliateWithdrawalAuto } from "@/lib/payout/process-withdrawal";
import { decrireDestination, lireDestination, validerDestination } from "@/lib/payout/versement-mensuel-affilie";
import {
  sendRappelMoyenVersementEmail,
  sendVersementMensuelEmail,
  sendWithdrawalFailedEmail,
} from "@/lib/email/withdrawals";
import { notifyAdmins } from "@/lib/agents/notify";

/**
 * GET /api/cron/affiliate-payout — le 5 de chaque mois, 05:00 UTC
 * (pg_cron, packages/db/supabase/bouclier.sql).
 *
 * VERSEMENT MENSUEL AUTOMATIQUE DES AFFILIÉS.
 *
 * La page des commissions le promet (« versées automatiquement le 5 de chaque
 * mois »), et le planning appelait cette route depuis toujours — mais elle
 * n'existait pas : chaque mois, un 404, et aucun affilié payé sans le demander.
 *
 * Pour chaque affilié ACTIF dont les commissions validées et libres atteignent
 * le minimum de retrait :
 *   - aucun moyen de versement enregistré, ou moyen devenu inutilisable
 *     (réseau fermé…) → rappel par e-mail, rien n'est réservé ;
 *   - sinon → un retrait est créé et TOUTES ses commissions validées libres y
 *     sont réservées, exactement comme une demande manuelle, puis versé par
 *     le même moteur (processAffiliateWithdrawalAuto). Refus du fournisseur →
 *     retrait refusé et commissions libérées : l'argent reste dû, rien n'est
 *     perdu, l'admin est alerté.
 *
 * Idempotent sur le mois : un second passage ne reverse pas (référence
 * `affmens_<affilié>_<AAAA-MM>`). Un retrait déjà en attente n'est pas doublé.
 * `?simulation=1` : dit ce qui serait fait, sans rien écrire ni verser.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Au-delà de ce temps, on ne commence plus aucun affilié : il reste 30 s au
 * dernier versement pour aboutir avant la coupure à 60 s. Les suivants sont
 * repris par les passages de 05:20 et 05:40 (bouclier.sql) — l'idempotence du
 * mois écarte ceux déjà faits. Même coupé en plein appel, un versement ne
 * repart jamais deux fois (marqueur envoiDemarreLe, process-withdrawal.ts).
 */
const BUDGET_MS = 30_000;

type Issue =
  | "verse"
  | "envoye"
  | "en_attente"
  | "refuse"
  | "sans_moyen"
  | "moyen_invalide"
  | "deja_en_cours"
  | "deja_fait"
  | "prevu"
  | "erreur";

/**
 * Rappel « moyen de versement manquant », UNE fois par mois : la route passe
 * trois fois le 5, et l'affilié ne doit pas recevoir trois e-mails. La
 * notification sert à la fois de rappel dans l'espace et de mémoire.
 */
async function rappeler(
  userId: string,
  email: string,
  nom: string | null | undefined,
  solde: number,
  mois: string,
  motif: string,
) {
  const titre = `Versement mensuel ${mois} en attente`;
  const deja = await prisma.notification.findFirst({ where: { userId, title: titre }, select: { id: true } });
  if (deja) return;
  await prisma.notification
    .create({
      data: {
        userId,
        type: "PAYMENT",
        title: titre,
        message: `${solde} FCFA de commissions n'ont pas pu partir : ${motif} Choisissez votre moyen de versement.`.slice(0, 300),
        link: "/affilie/retraits",
      },
    })
    .catch(() => null);
  await sendRappelMoyenVersementEmail(email, nom, solde, motif);
}

interface Resultat {
  affilie: string;
  solde: number;
  issue: Issue;
  detail?: string;
}

const MOTIF_REFUS =
  "un incident technique de notre côté a empêché le versement. Vos gains restent disponibles " +
  "et notre équipe est prévenue.";

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const debut = Date.now();
  const simulation = new URL(request.url).searchParams.get("simulation") === "1";
  const maintenant = new Date();
  const mois = `${maintenant.getUTCFullYear()}-${String(maintenant.getUTCMonth() + 1).padStart(2, "0")}`;

  // Commissions validées et pas encore réservées par un retrait : la même
  // définition du « retirable » que la page Retraits.
  const soldes = await prisma.affiliateCommission.groupBy({
    by: ["affiliateId"],
    where: { status: "APPROVED", withdrawalId: null },
    _sum: { commissionAmount: true },
  });
  const soldeDe = new Map(
    soldes
      .map((s) => [s.affiliateId, Math.round(s._sum.commissionAmount ?? 0)] as const)
      .filter(([, montant]) => montant >= MIN_WITHDRAWAL_XOF),
  );

  const profils = soldeDe.size
    ? await prisma.affiliateProfile.findMany({
        where: { id: { in: [...soldeDe.keys()] }, status: "ACTIVE" },
        select: { id: true, userId: true, bankDetails: true, user: { select: { email: true, name: true } } },
      })
    : [];

  const resultats: Resultat[] = [];
  let reportes = 0;

  for (const [rang, profil] of profils.entries()) {
    if (Date.now() - debut > BUDGET_MS) {
      reportes = profils.length - rang;
      break;
    }
    const solde = soldeDe.get(profil.id) ?? 0;
    const email = profil.user?.email ?? "";
    const nom = profil.user?.name;
    const prefixe = `affmens_${profil.id}_${mois}`;

    try {
      const [dejaCeMois, enCours] = await Promise.all([
        prisma.affiliateWithdrawal.findFirst({ where: { affiliateId: profil.id, payoutRef: { startsWith: prefixe } }, select: { id: true } }),
        prisma.affiliateWithdrawal.findFirst({ where: { affiliateId: profil.id, status: "EN_ATTENTE" }, select: { id: true } }),
      ]);
      if (dejaCeMois) {
        resultats.push({ affilie: profil.id, solde, issue: "deja_fait" });
        continue;
      }
      // Un retrait en attente a ses propres commissions réservées ; on n'en
      // empile pas un second — le solde libre partira le mois prochain.
      if (enCours) {
        resultats.push({ affilie: profil.id, solde, issue: "deja_en_cours" });
        continue;
      }

      const enregistree = lireDestination(profil.bankDetails);
      if (!enregistree) {
        if (!simulation) {
          await rappeler(profil.userId, email, nom, solde, mois, "aucun moyen de versement n'est enregistré sur votre compte.");
        }
        resultats.push({ affilie: profil.id, solde, issue: "sans_moyen" });
        continue;
      }
      // Revalidé maintenant : un réseau peut avoir fermé depuis l'enregistrement.
      const v = validerDestination({
        method: enregistree.method,
        msisdn: enregistree.accountDetails.msisdn,
        country: enregistree.accountDetails.country,
      });
      if (!v.ok) {
        if (!simulation) {
          await rappeler(profil.userId, email, nom, solde, mois, `le moyen enregistré n'est plus utilisable (${v.erreur})`);
        }
        resultats.push({ affilie: profil.id, solde, issue: "moyen_invalide", detail: v.code });
        continue;
      }
      if (simulation) {
        resultats.push({ affilie: profil.id, solde, issue: "prevu", detail: decrireDestination(v.destination) });
        continue;
      }

      // Réservation atomique de TOUTES les commissions libres. Si une demande
      // manuelle en a réservé une entre-temps, tout est annulé : jamais deux
      // retraits sur la même commission.
      const retrait = await prisma.$transaction(async (tx) => {
        const commissions = await tx.affiliateCommission.findMany({
          where: { affiliateId: profil.id, status: "APPROVED", withdrawalId: null },
          select: { id: true, commissionAmount: true },
        });
        const total = Math.round(commissions.reduce((s, c) => s + c.commissionAmount, 0));
        if (total < MIN_WITHDRAWAL_XOF) return null;
        const w = await tx.affiliateWithdrawal.create({
          data: {
            affiliateId: profil.id,
            userId: profil.userId,
            amount: total,
            method: v.destination.method,
            accountDetails: v.destination.accountDetails,
            status: "EN_ATTENTE",
            payoutRef: `${prefixe}_${Date.now().toString(36)}`,
          },
        });
        const reservees = await tx.affiliateCommission.updateMany({
          where: { id: { in: commissions.map((c) => c.id) }, status: "APPROVED", withdrawalId: null },
          data: { withdrawalId: w.id },
        });
        if (reservees.count !== commissions.length) {
          throw new Error("commissions réservées entre-temps par une autre demande");
        }
        return w;
      });
      if (!retrait) {
        resultats.push({ affilie: profil.id, solde, issue: "deja_en_cours", detail: "solde réservé entre-temps" });
        continue;
      }

      const libelle = decrireDestination(v.destination);
      const r = await processAffiliateWithdrawalAuto(retrait.id);
      if (r.status === "REFUSED") {
        await sendWithdrawalFailedEmail(email, nom, retrait.amount, MOTIF_REFUS, "/affilie/retraits");
        resultats.push({ affilie: profil.id, solde: retrait.amount, issue: "refuse", detail: r.reason });
        continue;
      }
      await sendVersementMensuelEmail(email, nom, retrait.amount, libelle);
      resultats.push({
        affilie: profil.id,
        solde: retrait.amount,
        issue: r.status === "PAID" ? "verse" : r.status === "SENT" ? "envoye" : "en_attente",
        detail: "reason" in r ? r.reason : undefined,
      });
    } catch (err) {
      console.error("[affiliate-payout]", profil.id, err);
      resultats.push({ affilie: profil.id, solde, issue: "erreur", detail: err instanceof Error ? err.message : String(err) });
    }
  }

  const compte = (i: Issue) => resultats.filter((r) => r.issue === i).length;
  const total = (i: Issue[]) => resultats.filter((r) => i.includes(r.issue)).reduce((s, r) => s + r.solde, 0);
  const bilan = {
    // « versés » = confirmés par la passerelle ; « envoyés » = acceptés, la
    // confirmation arrivera par webhook ou cron/payout-reconcile.
    verses: compte("verse"),
    montantVerse: total(["verse"]),
    envoyes: compte("envoye"),
    montantEnvoye: total(["envoye"]),
    enAttente: compte("en_attente"),
    refuses: compte("refuse"),
    sansMoyen: compte("sans_moyen") + compte("moyen_invalide"),
    // Un retrait resté en attente bloque le versement du mois : à regarder.
    bloques: compte("deja_en_cours"),
    reportes,
    erreurs: compte("erreur"),
  };

  // L'admin voit le mois d'un coup d'œil — et surtout ce qui n'est pas parti.
  // Seulement s'il s'est passé quelque chose : les passages de 05:20 et 05:40
  // ne trouvent en général que des « déjà fait ».
  const actif = resultats.some((r) => r.issue !== "deja_fait" && r.issue !== "prevu");
  if (!simulation && actif) {
    await notifyAdmins({
      subject: `Versement mensuel affiliés ${mois}`,
      body:
        `${bilan.verses} versé(s) (${bilan.montantVerse} FCFA), ${bilan.envoyes} envoyé(s) (${bilan.montantEnvoye} FCFA), ` +
        `${bilan.enAttente} en attente, ${bilan.refuses} refusé(s), ${bilan.erreurs} en erreur, ` +
        `${bilan.bloques} bloqué(s) par un retrait déjà en attente, ${bilan.sansMoyen} sans moyen de versement (rappel envoyé)` +
        (bilan.reportes ? `, ${bilan.reportes} reporté(s) au passage suivant.` : "."),
      url: `${process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com"}/admin/affiliate-withdrawals`,
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, mois, simulation, eligibles: soldeDe.size, bilan, resultats });
}
