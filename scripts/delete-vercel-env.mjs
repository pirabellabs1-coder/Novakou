// Supprime une variable d'env de Vercel (toutes targets).
//
// Usage : node --env-file=.env.local scripts/delete-vercel-env.mjs KEY [KEY2 ...]

const KEYS = process.argv.slice(2);
if (KEYS.length === 0) {
  console.error("Usage: node delete-vercel-env.mjs KEY [KEY2 ...]");
  process.exit(1);
}

const TOKEN = process.env.VERCEL_API_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID;
const teamQ = TEAM_ID ? `?teamId=${encodeURIComponent(TEAM_ID)}` : "";

const list = await fetch(`https://api.vercel.com/v9/projects/${PROJECT_ID}/env${teamQ}`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
}).then((r) => r.json());

for (const key of KEYS) {
  const matches = (list.envs ?? []).filter((e) => e.key === key);
  if (matches.length === 0) {
    console.log(`⚪ ${key} — déjà absent.`);
    continue;
  }
  for (const e of matches) {
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${e.id}${teamQ}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${TOKEN}` } },
    );
    if (res.ok) console.log(`🗑  ${key} [${(e.target ?? []).join(",")}] supprimé`);
    else console.error(`❌ ${key} : DELETE échoué (${res.status})`);
  }
}
