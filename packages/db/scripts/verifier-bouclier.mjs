#!/usr/bin/env node
/**
 * Vérifie les portiers du Bouclier (supabase/bouclier.sql) contre la VRAIE base.
 *
 * Utilisation (depuis packages/db) :
 *   node --env-file=../../.env.local scripts/verifier-bouclier.mjs
 *
 * Un portier plus strict que sa route = du travail jamais fait (vente payée
 * non livrée, versement jamais lancé), et rien ne le signale. Chaque cas
 * ci-dessous fabrique une situation dans une transaction ANNULÉE — rien n'est
 * écrit en base, aucun réveil ne part (la file de pg_net est annulée avec) —
 * et vérifie que le portier s'ouvre ou reste fermé comme sa route le ferait.
 *
 * À relancer après toute migration Prisma qui touche une table citée dans
 * bouclier.sql, et après toute modification d'un portier ou d'une route cron.
 */

import { PrismaClient } from "@prisma/client";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("[verifier-bouclier] Ni DIRECT_URL ni DATABASE_URL.");
  process.exit(1);
}
const prisma = new PrismaClient({ datasources: { db: { url } } });

const ANNULATION = new Error("annulation volontaire");
const ilYa = (minutes) => new Date(Date.now() - minutes * 60_000);
let echecs = 0;

async function cas(nom, preparer, portier, attendu) {
  let obtenu;
  try {
    await prisma.$transaction(async (tx) => {
      await preparer(tx);
      obtenu = (await tx.$queryRawUnsafe(`select ${portier} as v`))[0].v;
      throw ANNULATION;
    });
  } catch (e) {
    if (e !== ANNULATION) {
      obtenu = `ERREUR ${e instanceof Error ? e.message.split("\n").pop() : e}`;
    }
  }
  const ok = attendu === "ERREUR" ? String(obtenu).startsWith("ERREUR") : obtenu === attendu;
  if (!ok) echecs++;
  console.log(`${ok ? "ok    " : "ÉCHEC "} ${nom.padEnd(62)} ${portier} = ${obtenu}`);
}

try {
  const instructeur = await prisma.instructeurProfile.findFirst({ select: { id: true } });
  const utilisateur = await prisma.user.findFirst({ select: { id: true } });
  const affilie = await prisma.affiliateProfile.findFirst({ select: { id: true, userId: true } });
  if (!instructeur || !utilisateur) throw new Error("base vide : aucun instructeur / utilisateur pour les cas");

  const vente = (tx, d) => tx.checkoutAttempt.create({ data: { amount: 1000, ...d } });
  const retrait = (tx, d) =>
    tx.instructorWithdrawal.create({
      data: { instructeurId: instructeur.id, amount: 1000, method: "test", accountDetails: {}, ...d },
    });
  // Les portiers d'agents comparent au dernier passage : on en simule un, SEUL
  // (les vrais passages sont effacés dans la transaction annulée — sinon le
  // résultat dépendrait de l'heure du dernier passage réel de l'agent).
  const passage = async (tx, cle, minutes) => {
    await tx.agentRun.deleteMany({ where: { agentKey: cle } });
    await tx.agentRun.create({ data: { agentKey: cle, startedAt: ilYa(minutes), finishedAt: ilYa(minutes - 1) } });
  };
  const agentActif = (tx, cle) =>
    tx.aiAgent.upsert({ where: { key: cle }, update: { enabled: true }, create: { key: cle, name: cle, enabled: true } });

  // ── Ventes (collect-reconcile, alerte-ventes-bloquees) ──
  await cas("vente STARTED avec réf, 3 min", (tx) => vente(tx, { status: "STARTED", providerRef: "t", createdAt: ilYa(3) }), "bouclier.encaissements_ouverts(true)", true);
  await cas("vente ABANDONED avec réf, 3 jours (rattrapage horaire)", (tx) => vente(tx, { status: "ABANDONED", providerRef: "t", createdAt: ilYa(4320) }), "bouclier.encaissements_ouverts(false)", true);
  await cas("vente sans réf fournisseur (rien à interroger)", (tx) => vente(tx, { status: "STARTED", createdAt: ilYa(3) }), "bouclier.encaissements_ouverts(true)", false);
  await cas("vente verification_impossible", (tx) => vente(tx, { status: "STARTED", providerRef: "t", failureCode: "verification_impossible", createdAt: ilYa(3) }), "bouclier.encaissements_ouverts(true)", false);
  await cas("vente bloquée depuis 20 min", (tx) => vente(tx, { status: "STARTED", providerRef: "t", createdAt: ilYa(20) }), "bouclier.ventes_bloquees()", true);
  await cas("vente de 5 min (trop récente pour alerter)", (tx) => vente(tx, { status: "STARTED", providerRef: "t", createdAt: ilYa(5) }), "bouclier.ventes_bloquees()", false);

  // ── Versements (auto-payout, payout-reconcile) ──
  await cas("retrait non envoyé, 15 min", (tx) => retrait(tx, { createdAt: ilYa(15) }), "bouclier.retraits_a_envoyer(true)", true);
  await cas("retrait non envoyé, 5 min (délai de grâce)", (tx) => retrait(tx, { createdAt: ilYa(5) }), "bouclier.retraits_a_envoyer(true)", false);
  if (affilie) {
    const retraitAffilie = (tx, d) =>
      tx.affiliateWithdrawal.create({
        data: { affiliateId: affilie.id, userId: affilie.userId, amount: 1000, method: "test", accountDetails: {}, ...d },
      });
    await cas("retrait affilié non envoyé, 15 min", (tx) => retraitAffilie(tx, { createdAt: ilYa(15) }), "bouclier.retraits_a_envoyer(true)", true);
    await cas("retrait affilié coupé en plein envoi (jamais relancé seul)", (tx) => retraitAffilie(tx, { createdAt: ilYa(15), envoiDemarreLe: ilYa(14) }), "bouclier.retraits_a_envoyer(true)", false);
  }
  await cas("retrait non envoyé, 5 h (repris chaque heure)", (tx) => retrait(tx, { createdAt: ilYa(300) }), "bouclier.retraits_a_envoyer(false)", true);
  await cas("versement PawaPay envoyé, 2 jours", (tx) => retrait(tx, { paymentRef: "t", paymentProvider: "pawapay", createdAt: ilYa(2880) }), "bouclier.versements_a_verifier()", true);
  await cas("versement FeexPay envoyé, 20 min", (tx) => retrait(tx, { paymentRef: "t", paymentProvider: "feexpay", createdAt: ilYa(20) }), "bouclier.versements_a_verifier()", true);
  await cas("versement manuel (hors passerelles)", (tx) => retrait(tx, { paymentRef: "t", paymentProvider: "manual", createdAt: ilYa(20) }), "bouclier.versements_a_verifier()", false);

  // ── Agents ──
  await cas("KYC déposé après le dernier passage", async (tx) => {
    await agentActif(tx, "kyc_verification");
    await passage(tx, "kyc_verification", 30);
    await tx.kycRequest.create({ data: { userId: utilisateur.id, requestedLevel: 2, currentLevel: 1, documentType: "test", createdAt: ilYa(20) } });
  }, "bouclier.kyc_nouveaux()", true);
  await cas("KYC déjà vu par le dernier passage", async (tx) => {
    await agentActif(tx, "kyc_verification");
    await tx.kycRequest.create({ data: { userId: utilisateur.id, requestedLevel: 2, currentLevel: 1, documentType: "test", createdAt: ilYa(40) } });
    await passage(tx, "kyc_verification", 30);
  }, "bouclier.kyc_nouveaux()", false);
  await cas("KYC arrivé PENDANT un passage (lu avant son arrivée)", async (tx) => {
    await agentActif(tx, "kyc_verification");
    // passage commencé il y a 30 min, fini il y a 29 min ; dossier arrivé entre les deux
    await passage(tx, "kyc_verification", 30);
    await tx.kycRequest.create({ data: { userId: utilisateur.id, requestedLevel: 2, currentLevel: 1, documentType: "test", createdAt: ilYa(29.5) } });
  }, "bouclier.kyc_nouveaux()", true);
  await cas("agent KYC désactivé (recordRun ne ferait rien)", async (tx) => {
    await tx.aiAgent.upsert({ where: { key: "kyc_verification" }, update: { enabled: false }, create: { key: "kyc_verification", name: "kyc", enabled: false } });
    await tx.kycRequest.create({ data: { userId: utilisateur.id, requestedLevel: 2, currentLevel: 1, documentType: "test" } });
  }, "bouclier.kyc_nouveaux()", false);
  await cas("nouveau retrait → agent anti-fraude", async (tx) => {
    await agentActif(tx, "fraud_detection");
    await passage(tx, "fraud_detection", 10);
    await retrait(tx, { createdAt: ilYa(2) });
  }, "bouclier.retraits_nouveaux()", true);

  // ── Un portier qui plante réveille quand même (au lieu de tout arrêter) ──
  await cas("portier en erreur → réveil de secours", () => null,
    "bouclier.reveiller_si('bouclier.portier_inexistant()', '/api/cron/collect-reconcile') is not null", true);
  await cas("portier fermé → aucun réveil", () => null,
    "bouclier.reveiller_si('false', '/api/cron/collect-reconcile') is null", true);
  await cas("chemin hors domaine refusé", () => null,
    "bouclier.reveiller('@ailleurs.example/')", "ERREUR");
} catch (e) {
  echecs++;
  console.error("[verifier-bouclier]", e instanceof Error ? e.message : e);
} finally {
  await prisma.$disconnect();
}

console.log(echecs === 0 ? "\nTous les portiers sont fidèles." : `\n${echecs} cas en échec.`);
process.exitCode = echecs === 0 ? 0 : 1;
