// Prévient les vendeurs et affiliés dont un retrait n'a pas abouti que la
// résolution est en cours. SIMULATION par défaut ; `--envoyer` pour envoyer.
//
//   node --env-file=.env.local scripts/mail-retraits-bloques.mjs
//   node --env-file=.env.local scripts/mail-retraits-bloques.mjs --envoyer
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client");
const p = new PrismaClient();

const ENVOYER = process.argv.includes("--envoyer");
const FROM = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";
const KEY = process.env.RESEND_API_KEY;
const depuis = new Date(Date.now() - 45 * 24 * 3600 * 1000);
const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

const vendeurs = await p.instructorWithdrawal.findMany({
  where: { createdAt: { gte: depuis }, status: { in: ["REFUSE", "EN_ATTENTE"] } },
  select: { amount: true, instructeur: { select: { user: { select: { email: true, name: true } } } } },
});
const affilies = await p.affiliateWithdrawal.findMany({
  where: { createdAt: { gte: depuis }, status: { in: ["REFUSE", "EN_ATTENTE"] } },
  select: { amount: true, affiliate: { select: { user: { select: { email: true, name: true } } } } },
});

const dest = new Map();
const tous = [
  ...vendeurs.map((w) => ({ amount: w.amount, u: w.instructeur?.user })),
  ...affilies.map((w) => ({ amount: w.amount, u: w.affiliate?.user })),
];
for (const w of tous) {
  if (!w.u?.email) continue;
  const g = dest.get(w.u.email) ?? { nom: w.u.name, n: 0, total: 0 };
  g.n += 1;
  g.total += w.amount;
  dest.set(w.u.email, g);
}

function html(prenom, n, total) {
  const pluriel = n > 1;
  return `<!DOCTYPE html><html><body style="margin:0;background:#f4f4f5;font-family:-apple-system,'Segoe UI',Roboto,sans-serif">
<div style="max-width:640px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,110,47,.10)">
  <div style="background:linear-gradient(135deg,#006e2f,#22c55e);padding:28px 36px"><h1 style="color:#fff;font-size:22px;margin:0">Novakou</h1></div>
  <div style="padding:32px 36px;color:#111827;font-size:15px;line-height:1.7">
    <p>Bonjour ${prenom},</p>
    <p>${pluriel ? `Vos <strong>${n} demandes de retrait</strong>` : "Votre <strong>demande de retrait</strong>"}
    (${fmt(total)} FCFA) ${pluriel ? "n’ont" : "n’a"} pas pu aboutir, et nous tenons d’abord à <strong>vous présenter nos excuses</strong>.</p>
    <p>Nous préférons être transparents avec vous : <strong>les retraits sur la plateforme ne sont pas encore stables pour le moment.</strong>
    Nous sommes en train de régler ce problème avec nos partenaires de paiement mobile, et la résolution est en cours.</p>
    <p>Rassurez-vous : <strong>votre argent est en sécurité</strong> et reste intégralement disponible sur votre solde Novakou.
    Rien n’a été perdu.</p>
    <p><strong>Dès que ce sera résolu, nous reviendrons vers vous très rapidement</strong> pour que votre retrait soit effectué.
    Vous n’aurez rien à refaire de votre côté.</p>
    <p>Nous sommes sincèrement désolés pour la gêne occasionnée, et nous vous remercions de votre patience et de votre confiance.</p>
    <p style="margin-top:24px">— L’équipe Novakou</p>
  </div>
  <div style="padding:16px 36px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px">© 2026 Novakou — Édité par Pirabel Labs</div>
</div></body></html>`;
}

console.log(`${ENVOYER ? "ENVOI RÉEL" : "SIMULATION"} — ${dest.size} destinataire(s)`);
if (ENVOYER && !KEY) {
  console.error("RESEND_API_KEY absente : aucun envoi possible.");
  process.exit(1);
}
for (const [email, g] of dest) {
  const prenom = (g.nom ?? "").trim().split(/\s+/)[0] || "cher partenaire";
  console.log(`  ${email.replace(/^(.{3}).*(@.*)$/, "$1***$2").padEnd(24)} ${g.n} retrait(s)  ${fmt(g.total)} F`);
  if (!ENVOYER) continue;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: "Votre retrait Novakou : nos excuses, la résolution est en cours",
      html: html(prenom, g.n, g.total),
    }),
  });
  console.log(`     -> ${r.status} ${(await r.text()).slice(0, 80)}`);
}
await p.$disconnect();
