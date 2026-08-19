import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

/**
 * GET /api/formations/admin/tresorerie   (admin uniquement)
 *
 * UNE SEULE VUE SUR L'ARGENT : où il est, d'où il vient, par où il est passé.
 *
 * Trois questions auxquelles rien ne répondait d'un seul écran :
 *   1. Combien avons-nous RÉELLEMENT chez chaque passerelle ? — demandé aux
 *      passerelles elles-mêmes (PawaPay, FedaPay), jamais recalculé. FeexPay et
 *      Monetbil n'exposent pas de solde par API : on le dit, on n'invente pas.
 *   2. Quels encaissements ont eu lieu, et par quelle passerelle ? — la vente
 *      (PlatformRevenue) ne porte pas la passerelle ; on la retrouve dans la
 *      tentative de paiement, jointe par la référence interne.
 *   3. Quels versements sont partis, à qui, par quelle passerelle ? — retraits
 *      vendeurs/mentors, affiliés, plateforme, tous statuts.
 *
 * Paramètres : ?depuis=ISO&jusqu=ISO&passerelle=pawapay|feexpay|fedapay|…
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Mouvement = {
  id: string;
  date: string;
  sens: "entree" | "sortie";
  /** "vente" | "retrait_vendeur" | "retrait_mentor" | "retrait_affilie" | "retrait_plateforme" */
  type: string;
  montant: number;
  devise: string;
  passerelle: string;
  moyen: string | null;
  statut: string;
  reference: string | null;
  tiers: string | null;
  detail: string | null;
  /** Ventes : ventilation. */
  commission?: number;
  partVendeur?: number;
  partAffilie?: number;
};

function masque(email?: string | null): string | null {
  if (!email) return null;
  return email.replace(/^(.{3}).*(@.*)$/, "$1***$2");
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role?.toString().toUpperCase();
  if (!session?.user || (role !== "ADMIN" && !IS_DEV)) {
    return NextResponse.json({ error: "Accès refusé — admin requis." }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const jusqu = sp.get("jusqu") ? new Date(String(sp.get("jusqu"))) : new Date();
  const depuis = sp.get("depuis")
    ? new Date(String(sp.get("depuis")))
    : new Date(jusqu.getTime() - 30 * 24 * 3600 * 1000);
  const filtrePasserelle = (sp.get("passerelle") ?? "").trim().toLowerCase();

  // ── 1. SOLDES RÉELS chez les passerelles ────────────────────────────────
  // Interrogés en parallèle, chacun avec son propre échec : une passerelle
  // injoignable ne doit pas cacher les soldes des autres.
  const soldes: Array<{
    passerelle: string;
    disponible: boolean;
    lignes: Array<{ libelle: string; devise: string; solde: number }>;
    note: string | null;
  }> = [];

  const [pw, fd] = await Promise.allSettled([
    (async () => {
      const { isPawapayConfigured, soldesPortefeuilles } = await import("@/lib/pawapay");
      if (!(await isPawapayConfigured())) return { configure: false, lignes: [] };
      const l = await soldesPortefeuilles();
      return { configure: true, lignes: l.map((x) => ({ libelle: `${x.pays}${x.operateur ? " · " + x.operateur : ""}`, devise: x.devise, solde: x.solde })) };
    })(),
    (async () => {
      const { isFedapayConfigured, soldesCompte } = await import("@/lib/fedapay");
      if (!(await isFedapayConfigured())) return { configure: false, lignes: [] };
      const l = await soldesCompte();
      return { configure: true, lignes: l.map((x) => ({ libelle: x.mode, devise: "XOF", solde: x.solde })) };
    })(),
  ]);

  soldes.push(
    pw.status === "fulfilled"
      ? { passerelle: "pawapay", disponible: pw.value.configure, lignes: pw.value.lignes, note: pw.value.configure ? null : "non configurée" }
      : { passerelle: "pawapay", disponible: false, lignes: [], note: `injoignable : ${pw.reason instanceof Error ? pw.reason.message : String(pw.reason)}`.slice(0, 160) },
  );
  soldes.push(
    fd.status === "fulfilled"
      ? { passerelle: "fedapay", disponible: fd.value.configure, lignes: fd.value.lignes, note: fd.value.configure ? null : "non configurée" }
      : { passerelle: "fedapay", disponible: false, lignes: [], note: `injoignable : ${fd.reason instanceof Error ? fd.reason.message : String(fd.reason)}`.slice(0, 160) },
  );
  // Honnêteté sur ce qu'on ne sait pas lire.
  soldes.push({ passerelle: "feexpay", disponible: false, lignes: [], note: "aucun point d'entrée de solde dans leur API — consulter le tableau de bord FeexPay" });
  soldes.push({ passerelle: "monetbil", disponible: false, lignes: [], note: "aucun point d'entrée de solde dans leur API — consulter le tableau de bord Monetbil" });

  // ── 2. ENTRÉES : ventes, avec la passerelle retrouvée sur la tentative ──
  const ventes = await prisma.platformRevenue.findMany({
    where: { createdAt: { gte: depuis, lte: jusqu } },
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: {
      id: true, createdAt: true, orderType: true, grossAmount: true, commissionAmount: true,
      vendorAmount: true, affiliateAmount: true, paymentRef: true, currency: true, instructeurId: true,
    },
  });
  const refs = [...new Set(ventes.map((v) => v.paymentRef).filter((r): r is string => Boolean(r)))];
  // Une tentative par référence interne : c'est elle qui sait quelle passerelle
  // a encaissé, et par quel moyen.
  const tentatives = refs.length
    ? await prisma.checkoutAttempt.findMany({
        where: { OR: refs.map((r) => ({ metadata: { path: ["internalRef"], equals: r } })) },
        select: { paymentMethod: true, providerRef: true, visitorEmail: true, metadata: true },
      })
    : [];
  const parRef = new Map<string, (typeof tentatives)[number]>();
  for (const t of tentatives) {
    const m = (t.metadata ?? {}) as Record<string, unknown>;
    if (typeof m.internalRef === "string") parRef.set(m.internalRef, t);
  }
  const vendeurIds = [...new Set(ventes.map((v) => v.instructeurId).filter((x): x is string => Boolean(x)))];
  const vendeurs = vendeurIds.length
    ? await prisma.instructeurProfile.findMany({ where: { id: { in: vendeurIds } }, select: { id: true, user: { select: { email: true } } } })
    : [];
  const emailVendeur = new Map(vendeurs.map((v) => [v.id, v.user?.email ?? null]));

  const mouvements: Mouvement[] = [];
  for (const v of ventes) {
    const t = v.paymentRef ? parRef.get(v.paymentRef) : undefined;
    const meta = (t?.metadata ?? {}) as Record<string, unknown>;
    let passerelle = typeof meta.paymentProvider === "string" ? meta.paymentProvider : "";
    if (!passerelle) {
      // Sans tentative : une commande gratuite (free:) ou un ancien flux.
      passerelle = v.paymentRef?.startsWith("free:") ? "gratuit" : "inconnue";
    }
    mouvements.push({
      id: v.id,
      date: v.createdAt.toISOString(),
      sens: "entree",
      type: "vente",
      montant: v.grossAmount,
      devise: v.currency,
      passerelle,
      moyen: t?.paymentMethod ?? null,
      statut: "encaisse",
      reference: t?.providerRef ?? v.paymentRef ?? null,
      tiers: masque(t?.visitorEmail ?? null),
      detail: `${v.orderType} · vendeur ${masque(emailVendeur.get(v.instructeurId ?? "") ?? null) ?? "?"}`,
      commission: v.commissionAmount,
      partVendeur: v.vendorAmount,
      partAffilie: v.affiliateAmount,
    });
  }

  // ── 3. SORTIES : tous les versements ────────────────────────────────────
  const [rv, ra, rp] = await Promise.all([
    prisma.instructorWithdrawal.findMany({
      where: { createdAt: { gte: depuis, lte: jusqu } },
      orderBy: { createdAt: "desc" }, take: 1000,
      select: { id: true, createdAt: true, processedAt: true, amount: true, method: true, status: true, paymentProvider: true, paymentRef: true, errorMessage: true, instructeur: { select: { user: { select: { email: true } } } } },
    }),
    prisma.affiliateWithdrawal.findMany({
      where: { createdAt: { gte: depuis, lte: jusqu } },
      orderBy: { createdAt: "desc" }, take: 1000,
      select: { id: true, createdAt: true, processedAt: true, amount: true, method: true, status: true, paymentProvider: true, paymentRef: true, errorMessage: true, affiliate: { select: { user: { select: { email: true } } } } },
    }),
    prisma.platformPayout.findMany({
      where: { createdAt: { gte: depuis, lte: jusqu } },
      orderBy: { createdAt: "desc" }, take: 500,
      select: { id: true, createdAt: true, processedAt: true, amount: true, method: true, status: true, paymentProvider: true, paymentRef: true, errorMessage: true },
    }),
  ]);
  for (const w of rv) {
    mouvements.push({
      id: w.id, date: (w.processedAt ?? w.createdAt).toISOString(), sens: "sortie",
      type: w.method.endsWith("_mentor") ? "retrait_mentor" : "retrait_vendeur",
      montant: w.amount, devise: "XOF",
      passerelle: w.paymentProvider ?? (w.status === "TRAITE" ? "manuel" : "—"),
      moyen: w.method.replace(/_mentor$/, ""), statut: w.status, reference: w.paymentRef,
      tiers: masque(w.instructeur?.user?.email), detail: w.status === "REFUSE" ? (w.errorMessage ?? "").slice(0, 160) || null : null,
    });
  }
  for (const w of ra) {
    mouvements.push({
      id: w.id, date: (w.processedAt ?? w.createdAt).toISOString(), sens: "sortie", type: "retrait_affilie",
      montant: w.amount, devise: "XOF", passerelle: w.paymentProvider ?? (w.status === "TRAITE" ? "manuel" : "—"),
      moyen: w.method, statut: w.status, reference: w.paymentRef,
      tiers: masque(w.affiliate?.user?.email), detail: w.status === "REFUSE" ? (w.errorMessage ?? "").slice(0, 160) || null : null,
    });
  }
  for (const w of rp) {
    mouvements.push({
      id: w.id, date: (w.processedAt ?? w.createdAt).toISOString(), sens: "sortie", type: "retrait_plateforme",
      montant: w.amount, devise: "XOF", passerelle: w.paymentProvider ?? (w.status === "TRAITE" ? "manuel" : "—"),
      moyen: w.method, statut: w.status, reference: w.paymentRef, tiers: "plateforme",
      detail: w.status === "REFUSE" ? (w.errorMessage ?? "").slice(0, 160) || null : null,
    });
  }

  mouvements.sort((a, b) => (a.date < b.date ? 1 : -1));
  const filtres = filtrePasserelle
    ? mouvements.filter((m) => m.passerelle.toLowerCase() === filtrePasserelle)
    : mouvements;

  // ── 4. TOTAUX par passerelle : ce qui est entré, ce qui est sorti ───────
  const parPasserelle = new Map<string, { entrees: number; nbEntrees: number; commission: number; sorties: number; nbSorties: number; sortiesRefusees: number }>();
  for (const m of mouvements) {
    const k = m.passerelle;
    const g = parPasserelle.get(k) ?? { entrees: 0, nbEntrees: 0, commission: 0, sorties: 0, nbSorties: 0, sortiesRefusees: 0 };
    if (m.sens === "entree") { g.entrees += m.montant; g.nbEntrees += 1; g.commission += m.commission ?? 0; }
    else if (m.statut === "TRAITE") { g.sorties += m.montant; g.nbSorties += 1; }
    else if (m.statut === "REFUSE") { g.sortiesRefusees += 1; }
    parPasserelle.set(k, g);
  }

  return NextResponse.json({
    data: {
      periode: { depuis: depuis.toISOString(), jusqu: jusqu.toISOString() },
      soldes,
      totaux: [...parPasserelle.entries()].map(([passerelle, t]) => ({ passerelle, ...t })).sort((a, b) => b.entrees + b.sorties - (a.entrees + a.sorties)),
      mouvements: filtres.slice(0, 1500),
      nbMouvements: filtres.length,
    },
  });
}
