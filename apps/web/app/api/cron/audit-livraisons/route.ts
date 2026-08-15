import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/cron/auth";
import { notifyAdmins } from "@/lib/admin/notify";
import { sendEmail, emailLayout, getAppUrl } from "@/lib/email";
import { getStorageObjectPath, probeStorageObject, type StorageBucket } from "@/lib/supabase-storage";

/**
 * GET /api/cron/audit-livraisons
 *
 * UN ACHAT PAYÉ EST-IL ENCORE TÉLÉCHARGEABLE ?
 *
 * Le 2026-08-12, un audit manuel a trouvé un achat dont le fichier n'existait
 * plus dans Supabase : le vendeur avait remplacé son PDF, la ligne d'achat
 * pointait toujours sur l'ancien objet. Personne ne l'avait vu — et personne
 * ne l'aurait vu, parce que rien ne le cherchait. Le défaut ne se serait
 * manifesté qu'au clic d'un acheteur, c'est-à-dire trop tard.
 *
 * Ce cron refait cette vérification tous les jours :
 *   • un produit acheté sans AUCUN fichier rattaché ;
 *   • un fichier dont l'objet n'existe plus dans le bucket.
 *
 * Il ne signale QUE ces deux cas : un produit sans fichier mais qui est un
 * lien de paiement ou une redirection n'a rien à livrer, ce n'est pas une
 * anomalie.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Une alerte par jour au maximum : au-delà, elle devient du bruit. */
const SILENCE_HEURES = 20;

/**
 * Plafond d'achats examinés. Les fichiers étant portés par le PRODUIT, on
 * regroupe par produit avant de sonder : quelques centaines d'achats ne
 * représentent que quelques dizaines d'objets à vérifier.
 */
const MAX_ACHATS = 2000;

type Anomalie = {
  produit: string;
  produitId: string;
  vendeur: string | null;
  acheteurs: number;
  probleme: string;
};

export async function GET(request: NextRequest) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const achats = await prisma.digitalProductPurchase.findMany({
    orderBy: { createdAt: "desc" },
    take: MAX_ACHATS,
    select: {
      id: true,
      product: {
        select: {
          id: true,
          title: true,
          fileUrl: true,
          isPaymentLink: true,
          redirectUrl: true,
          instructeur: { select: { user: { select: { email: true } } } },
          files: { orderBy: { order: "asc" }, select: { name: true, url: true } },
        },
      },
    },
  });

  // Regroupement par produit : un même produit vendu cent fois ne doit pas
  // déclencher cent sondages identiques chez Supabase.
  type Groupe = { produit: NonNullable<(typeof achats)[number]["product"]>; acheteurs: number };
  const parProduit = new Map<string, Groupe>();
  for (const a of achats) {
    if (!a.product) continue;
    const g = parProduit.get(a.product.id);
    if (g) g.acheteurs += 1;
    else parProduit.set(a.product.id, { produit: a.product, acheteurs: 1 });
  }

  const anomalies: Anomalie[] = [];
  /** Fichiers qu'on n'a PAS pu vérifier — signalés dans le retour, jamais en alerte. */
  let indetermines = 0;

  for (const { produit, acheteurs } of parProduit.values()) {
    const base = {
      produit: produit.title,
      produitId: produit.id,
      vendeur: produit.instructeur?.user?.email ?? null,
      acheteurs,
    };

    const sources = produit.files?.length
      ? produit.files.map((f) => ({ nom: f.name, url: f.url }))
      : produit.fileUrl
        ? [{ nom: "fichier", url: produit.fileUrl }]
        : [];

    if (sources.length === 0) {
      // Rien à livrer par construction : un lien de paiement encaisse, une
      // redirection envoie ailleurs. Ce n'est pas un défaut de livraison.
      if (produit.isPaymentLink || produit.redirectUrl) continue;
      anomalies.push({ ...base, probleme: "aucun fichier rattaché au produit" });
      continue;
    }

    for (const s of sources) {
      const objet = getStorageObjectPath(s.url, "order-deliveries");
      // Chemin non résoluble (URL externe, ancien stockage local) : on ne peut
      // pas conclure, et crier au loup sur un doute finirait par faire ignorer
      // l'alerte entière.
      if (!objet) continue;
      // Seule une ABSENCE CERTAINE déclenche l'alerte. Un stockage injoignable
      // (réseau, jeton, panne) ne dit rien sur le fichier : le compter comme
      // manquant transformerait la moindre coupure en dizaines de fausses
      // alertes, et l'alerte finirait ignorée le jour où elle a raison.
      const etat = await probeStorageObject(objet.bucket as StorageBucket, objet.path);
      if (etat === "indetermine") indetermines++;
      if (etat === "absent") {
        anomalies.push({
          ...base,
          probleme: `fichier introuvable dans le stockage : « ${s.nom} »`,
        });
      }
    }
  }

  if (anomalies.length === 0) {
    return NextResponse.json({ produitsExamines: parProduit.size, anomalies: 0, indetermines });
  }

  // ── Anti-spam : une seule alerte par jour ─────────────────────────────────
  const recente = await prisma.notification
    .findFirst({
      where: {
        type: "SYSTEM",
        title: { startsWith: "Livraisons cassées" },
        createdAt: { gte: new Date(Date.now() - SILENCE_HEURES * 3600_000) },
      },
      select: { id: true },
    })
    .catch(() => null);

  const acheteursTouches = anomalies.reduce((s, a) => s + a.acheteurs, 0);
  const titre = `Livraisons cassées : ${anomalies.length} produit(s), ${acheteursTouches} acheteur(s)`;

  if (recente) {
    return NextResponse.json({
      produitsExamines: parProduit.size,
      anomalies: anomalies.length,
      indetermines,
      alerteEtouffee: true,
      detail: anomalies,
    });
  }

  await notifyAdmins({
    title: titre,
    message: anomalies
      .slice(0, 5)
      .map((a) => `${a.produit} — ${a.probleme}`)
      .join(" | ")
      .slice(0, 500),
    link: "/admin/produits",
  });

  // ⚠️ `sendEmail` renvoie un FAUX SUCCÈS sans RESEND_API_KEY : il journalise et
  // fait comme si c'était parti. Une alerte qui croit avoir prévenu sans avoir
  // prévenu est pire que pas d'alerte — on le vérifie et on le dit.
  const posteConfigure = Boolean(process.env.RESEND_API_KEY);
  let emailsEnvoyes = 0;
  let destinataires = 0;
  try {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
    const lignes = anomalies
      .slice(0, 15)
      .map(
        (a) =>
          `<tr><td style="padding:8px 10px;border-bottom:1px solid #eee">${a.produit}</td>` +
          `<td style="padding:8px 10px;border-bottom:1px solid #eee">${a.vendeur ?? "-"}</td>` +
          `<td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center">${a.acheteurs}</td>` +
          `<td style="padding:8px 10px;border-bottom:1px solid #eee;color:#b91c1c">${a.probleme}</td></tr>`,
      )
      .join("");

    const html = emailLayout(`
      <h2 style="margin:0 0 12px">${anomalies.length} produit(s) payé(s) mais non livrable(s)</h2>
      <p style="margin:0 0 16px;color:#475569">
        Ces produits ont été achetés, mais leur fichier n'est plus téléchargeable.
        L'acheteur voit une page « fichier indisponible » au lieu de son achat.
        Demandez au vendeur de redéposer le fichier, ou remboursez.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr style="text-align:left;color:#64748b">
          <th style="padding:8px 10px">Produit</th><th style="padding:8px 10px">Vendeur</th>
          <th style="padding:8px 10px">Acheteurs</th><th style="padding:8px 10px">Problème</th>
        </tr>
        ${lignes}
      </table>
      <p style="margin:16px 0 0;color:#94a3b8;font-size:12px">
        Contrôle quotidien de ${parProduit.size} produit(s) vendu(s) — ${getAppUrl()}
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
        "[audit-livraisons] RESEND_API_KEY ABSENTE — l'alerte n'a été envoyée à PERSONNE par e-mail",
      );
    }
  } catch (err) {
    console.error("[audit-livraisons] e-mail", err);
  }

  console.error("[audit-livraisons]", { anomalies: anomalies.length, acheteursTouches });
  return NextResponse.json({
    produitsExamines: parProduit.size,
    anomalies: anomalies.length,
    indetermines,
    acheteursTouches,
    email: { configure: posteConfigure, destinataires, envoyes: emailsEnvoyes },
    detail: anomalies,
  });
}
