// Pousse (upsert) une variable d'env vers Vercel via l'API REST.
//
// Usage : node --env-file=.env.local scripts/push-secret-to-vercel.mjs KEY VALUE
//
// Cible : production + preview (configurable via 3e arg "prod,preview,dev").
// Idempotent : upsert via DELETE+POST si la clé existe déjà.

const [KEY, VALUE, TARGETS_ARG] = process.argv.slice(2);
if (!KEY || !VALUE) {
  console.error("Usage: node push-secret-to-vercel.mjs KEY VALUE [targets]");
  process.exit(1);
}

const TOKEN = process.env.VERCEL_API_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID;

if (!TOKEN || !PROJECT_ID) {
  console.error("❌ VERCEL_API_TOKEN ou VERCEL_PROJECT_ID manquant dans .env.local");
  process.exit(1);
}

const targets = (TARGETS_ARG ?? "production,preview").split(",").map((t) => t.trim());
const teamQ = TEAM_ID ? `&teamId=${encodeURIComponent(TEAM_ID)}` : "";
const baseUrl = `https://api.vercel.com`;

async function api(path, init = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

// 1. Récupère l'env existant pour voir si la clé est déjà là
const list = await api(`/v9/projects/${PROJECT_ID}/env?decrypt=false${teamQ}`);
if (list.status !== 200) {
  console.error("❌ Impossible de lister les env Vercel :", list.status, list.json);
  process.exit(1);
}

const existing = (list.json.envs ?? []).filter((e) => e.key === KEY);
console.log(`Clé "${KEY}" : ${existing.length} entrée(s) existante(s) sur Vercel.`);

// 2. Supprime les entrées existantes pour ces targets (clean slate)
for (const e of existing) {
  const shouldDelete = e.target?.some((t) => targets.includes(t));
  if (!shouldDelete) continue;
  const del = await api(`/v9/projects/${PROJECT_ID}/env/${e.id}?${teamQ.slice(1)}`, {
    method: "DELETE",
  });
  if (del.status >= 200 && del.status < 300) {
    console.log(`  🗑  Supprimé ancien (target=${e.target?.join(",")})`);
  } else {
    console.warn(`  ⚠  DELETE échoué (${del.status})`, del.json);
  }
}

// 3. Crée la nouvelle entrée (encrypted)
const create = await api(`/v10/projects/${PROJECT_ID}/env?upsert=true${teamQ}`, {
  method: "POST",
  body: JSON.stringify({
    key: KEY,
    value: VALUE,
    type: "encrypted",
    target: targets,
  }),
});

if (create.status >= 200 && create.status < 300) {
  console.log(`✅ ${KEY} poussé en target=[${targets.join(",")}] (encrypted)`);
} else {
  console.error(`❌ POST échoué (${create.status}) :`, create.json);
  process.exit(1);
}
