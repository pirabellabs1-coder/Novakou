// AUDIT DES LIVRAISONS — un acheteur peut-il vraiment recuperer son fichier ?
//
// Pour chaque achat de produit numerique, on verifie deux choses que personne
// ne verifie aujourd'hui :
//   1. le produit a-t-il un fichier rattache (files[] ou fileUrl) ?
//   2. cet objet existe-t-il REELLEMENT dans Supabase Storage ?
//
// Un achat sans fichier, ou avec un chemin qui ne pointe sur rien, c'est de
// l'argent encaisse sans contrepartie — et rien dans l'application ne le
// signale : l'acheteur decouvre le probleme au moment du telechargement.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client");
const { createClient } = require("../node_modules/.pnpm/@supabase+supabase-js@2.99.1/node_modules/@supabase/supabase-js");

const p = new PrismaClient();
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const BUCKETS = [
  "kyc-documents", "order-deliveries", "agency-resources",
  "contracts", "message-attachments", "certificates",
];

function objetDe(valeur, bucketDefaut = "order-deliveries") {
  const raw = (valeur ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("/uploads/")) return { bucket: "LOCAL", path: raw };
  const nettoie = (b, v) => v.replace(/^\/+/, "").replace(new RegExp("^" + b + "/"), "");
  if (!/^https?:\/\//i.test(raw)) return { bucket: bucketDefaut, path: nettoie(bucketDefaut, raw) };
  try {
    const url = new URL(raw);
    const i = url.pathname.indexOf("/storage/v1/object/");
    if (i === -1) return { bucket: "EXTERNE", path: raw };
    const parts = url.pathname.slice(i + "/storage/v1/object/".length).split("/");
    const bi = parts.findIndex((x) => BUCKETS.includes(x));
    if (bi === -1) return { bucket: "EXTERNE", path: raw };
    const bucket = parts[bi];
    const chemin = parts.slice(bi + 1).join("/");
    return chemin ? { bucket, path: nettoie(bucket, decodeURIComponent(chemin)) } : null;
  } catch {
    return null;
  }
}

const cache = new Map();
async function existe(bucket, path) {
  const cle = bucket + "|" + path;
  if (cache.has(cle)) return cache.get(cle);
  const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, 60);
  const ok = Boolean(data?.signedUrl) && !error;
  cache.set(cle, ok);
  return ok;
}

const achats = await p.digitalProductPurchase.findMany({
  orderBy: { createdAt: "desc" },
  select: {
    id: true, createdAt: true, paidAmount: true, downloadCount: true,
    user: { select: { email: true } },
    product: {
      select: {
        id: true, title: true, fileUrl: true, isPaymentLink: true, redirectUrl: true,
        instructeur: { select: { user: { select: { email: true } } } },
        files: { orderBy: { order: "asc" }, select: { name: true, url: true } },
      },
    },
  },
});

console.log(`${achats.length} achat(s) de produit numerique en base.\n`);

const sansFichier = [];
const fichierManquant = [];
const horsSupabase = [];
let ok = 0;

for (const a of achats) {
  const pr = a.product;
  if (!pr) { sansFichier.push({ a, motif: "produit supprime" }); continue; }

  const sources = pr.files?.length
    ? pr.files.map((f) => ({ nom: f.name, url: f.url }))
    : pr.fileUrl
      ? [{ nom: "(fileUrl)", url: pr.fileUrl }]
      : [];

  if (sources.length === 0) {
    // Un lien de paiement ou un produit a URL externe n'a pas de fichier a
    // livrer : ce n'est pas une anomalie.
    if (pr.isPaymentLink || pr.redirectUrl) { ok++; continue; }
    sansFichier.push({ a, motif: "aucun fichier rattache au produit" });
    continue;
  }

  let tousOk = true;
  for (const s of sources) {
    const obj = objetDe(s.url);
    if (!obj) { tousOk = false; fichierManquant.push({ a, fichier: s.nom, detail: "chemin illisible" }); continue; }
    if (obj.bucket === "LOCAL" || obj.bucket === "EXTERNE") {
      horsSupabase.push({ a, fichier: s.nom, detail: `${obj.bucket} — ${obj.path.slice(0, 80)}` });
      continue;
    }
    if (!(await existe(obj.bucket, obj.path))) {
      tousOk = false;
      fichierManquant.push({ a, fichier: s.nom, detail: `${obj.bucket}/${obj.path}` });
    }
  }
  if (tousOk) ok++;
}

const ligne = (x) =>
  `${x.a.createdAt.toISOString().slice(0, 10)} | ${(x.a.product?.title ?? "?").slice(0, 40).padEnd(40)} | ` +
  `${String(x.a.paidAmount).padStart(6)} F | acheteur ${x.a.user?.email ?? "?"} | dl=${x.a.downloadCount}`;

console.log(`OK (fichier present et accessible) : ${ok}`);
console.log(`\nACHATS SANS AUCUN FICHIER (${sansFichier.length}) :`);
sansFichier.forEach((x) => console.log("  " + ligne(x) + " | " + x.motif));
console.log(`\nFICHIER INTROUVABLE DANS SUPABASE (${fichierManquant.length}) :`);
fichierManquant.forEach((x) => console.log("  " + ligne(x) + " | " + x.fichier + " -> " + x.detail));
console.log(`\nFICHIER HORS SUPABASE, non verifiable (${horsSupabase.length}) :`);
horsSupabase.forEach((x) => console.log("  " + ligne(x) + " | " + x.fichier + " -> " + x.detail));

await p.$disconnect();
