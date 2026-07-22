#!/usr/bin/env node
/**
 * Soumet toutes les URLs du sitemap à IndexNow (Bing, Yandex, Naver, Seznam).
 *
 * Usage :
 *   node scripts/indexnow.mjs                  # toutes les URLs du sitemap
 *   node scripts/indexnow.mjs <url> [<url>...] # seulement ces URLs
 *
 * À relancer après chaque mise en ligne de contenu (nouveaux guides, produits…).
 * Google n'utilise PAS IndexNow : pour lui, c'est le sitemap + Search Console.
 */

const HOST = "www.novakou.com";
const KEY = "552834c423f123fbeca4ecadccc6f674";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const SITEMAP = `https://${HOST}/sitemap.xml`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

// IndexNow accepte au maximum 10 000 URLs par requête.
const BATCH_SIZE = 10_000;

async function readSitemap() {
  const res = await fetch(SITEMAP, { headers: { "User-Agent": "novakou-indexnow" } });
  if (!res.ok) throw new Error(`sitemap ${res.status} ${res.statusText}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (urls.length === 0) throw new Error("sitemap vide ou illisible");
  return urls;
}

/** IndexNow rejette toute URL qui n'est pas sur le host déclaré. */
function keepSameHost(urls) {
  const kept = [];
  const rejected = [];
  for (const u of urls) {
    try {
      if (new URL(u).host === HOST) kept.push(u);
      else rejected.push(u);
    } catch {
      rejected.push(u);
    }
  }
  return { kept, rejected };
}

async function submit(urlList) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
  });
  const body = await res.text();
  return { status: res.status, body: body.trim() };
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const source = args.length > 0 ? args : await readSitemap();
  const { kept, rejected } = keepSameHost(source);

  if (rejected.length > 0) {
    console.warn(`! ${rejected.length} URL(s) ignorée(s), host different de ${HOST} :`);
    for (const u of rejected.slice(0, 5)) console.warn(`    ${u}`);
  }
  if (kept.length === 0) {
    console.error("Aucune URL à soumettre.");
    process.exit(1);
  }

  console.log(`Cle       : ${KEY_LOCATION}`);
  console.log(`A soumettre : ${kept.length} URL(s)${args.length ? " (fournies en argument)" : " (depuis le sitemap)"}`);

  let failed = false;
  for (let i = 0; i < kept.length; i += BATCH_SIZE) {
    const batch = kept.slice(i, i + BATCH_SIZE);
    const { status, body } = await submit(batch);
    const label = `lot ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} URLs)`;

    if (status === 200 || status === 202) {
      console.log(`OK   ${label} -> HTTP ${status}`);
    } else if (status === 403) {
      // Cle publiee a l'instant : la propagation CDN peut prendre quelques minutes.
      console.error(`ECHEC ${label} -> HTTP 403 (cle non validee). ${body}`);
      console.error(`      Verifie que ${KEY_LOCATION} repond 200, puis relance.`);
      failed = true;
    } else {
      console.error(`ECHEC ${label} -> HTTP ${status}. ${body}`);
      failed = true;
    }
  }

  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("Erreur :", err.message);
  process.exit(1);
});
