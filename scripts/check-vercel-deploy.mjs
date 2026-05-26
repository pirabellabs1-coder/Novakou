// Liste le dernier déploiement Vercel pour ce projet.
const TOKEN = process.env.VERCEL_API_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID;
const teamQ = TEAM_ID ? `&teamId=${TEAM_ID}` : "";

const res = await fetch(
  `https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}&limit=3${teamQ}`,
  { headers: { Authorization: `Bearer ${TOKEN}` } },
);
const data = await res.json();
const ds = data.deployments ?? [];
for (const d of ds) {
  const t = new Date(d.created).toISOString();
  console.log(`${d.state.padEnd(12)} ${d.target?.padEnd(10) ?? "—".padEnd(10)} ${t}  ${d.meta?.githubCommitRef ?? ""}  ${d.meta?.githubCommitMessage?.split("\n")[0]?.slice(0, 70) ?? ""}`);
}
