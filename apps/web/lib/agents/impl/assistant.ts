import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout } from "@/lib/email";
import { recordRun, proposeAction } from "../runtime";

/**
 * Agent Assistant (« bras droit ») — rapport quotidien + alertes.
 * 100 % règles (aucune IA requise). Envoie un e-mail aux admins avec les
 * chiffres clés des dernières 24 h et les points qui demandent attention.
 */

async function adminEmails(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  });
  return admins.map((a) => a.email).filter(Boolean);
}

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

export async function runAssistant() {
  return recordRun("assistant", async () => {
    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      newUsers,
      newEnrollments,
      newPurchases,
      pendingKyc,
      pendingWithdrawals,
      openDisputes,
      abandoned24h,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.enrollment.count({ where: { createdAt: { gte: since } } }),
      prisma.digitalProductPurchase.count({ where: { createdAt: { gte: since } } }),
      prisma.kycRequest.count({ where: { status: "EN_ATTENTE" } }),
      prisma.instructorWithdrawal.count({ where: { status: "EN_ATTENTE" } }),
      prisma.dispute.count({ where: { status: { not: "RESOLU" } } }).catch(() => 0),
      prisma.checkoutAttempt
        .count({ where: { createdAt: { gte: since }, status: { not: "COMPLETED" }, recoveredAt: null } })
        .catch(() => 0),
    ]);

    const sales = newEnrollments + newPurchases;

    // Alertes : seuils simples
    const alerts: string[] = [];
    if (pendingKyc > 0) alerts.push(`${pendingKyc} dossier(s) KYC en attente de vérification`);
    if (pendingWithdrawals > 0) alerts.push(`${pendingWithdrawals} demande(s) de retrait à traiter`);
    if (openDisputes > 0) alerts.push(`${openDisputes} litige(s) ouvert(s)`);
    if (abandoned24h >= 5) alerts.push(`${abandoned24h} paniers abandonnés sur 24 h — pensez aux relances`);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";
    const row = (label: string, val: string) =>
      `<tr><td style="padding:8px 0;color:#5c647a;font-size:14px;">${label}</td><td style="padding:8px 0;text-align:right;font-weight:800;color:#13241b;font-size:15px;">${val}</td></tr>`;

    const alertsHtml = alerts.length
      ? `<div style="background:#fdf3df;border-left:4px solid #b45309;border-radius:8px;padding:14px 16px;margin:20px 0;">
           <strong style="color:#854f0b;">À traiter aujourd'hui</strong>
           <ul style="margin:8px 0 0;padding-left:18px;color:#5c4011;font-size:14px;line-height:1.7;">
             ${alerts.map((a) => `<li>${a}</li>`).join("")}
           </ul>
         </div>`
      : `<p style="color:#16a34a;font-size:14px;margin:16px 0;">✓ Rien d'urgent à traiter. Tout roule.</p>`;

    const content = `
      <h2 style="color:#13241b;font-size:22px;font-weight:800;margin:0 0 4px;">Votre rapport quotidien Novakou</h2>
      <p style="color:#5c647a;font-size:13px;margin:0 0 16px;">Synthèse des dernières 24 heures.</p>
      <table style="width:100%;border-collapse:collapse;">
        ${row("Nouveaux inscrits", fmt(newUsers))}
        ${row("Ventes (formations + produits)", fmt(sales))}
        ${row("Paniers abandonnés (24 h)", fmt(abandoned24h))}
        ${row("KYC en attente", fmt(pendingKyc))}
        ${row("Retraits à traiter", fmt(pendingWithdrawals))}
        ${row("Litiges ouverts", fmt(openDisputes))}
      </table>
      ${alertsHtml}
      <a href="${appUrl}/admin/dashboard" style="display:inline-block;margin-top:8px;background:linear-gradient(135deg,#006e2f,#22c55e);color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:12px;">Ouvrir mon tableau de bord</a>
    `;

    const emails = await adminEmails();
    const summary = `${newUsers} inscrits · ${sales} ventes · ${pendingKyc} KYC · ${pendingWithdrawals} retraits · ${alerts.length} alerte(s)`;

    // L'envoi du rapport est une action low-risk → auto-exécutée (autonomie mixte).
    await proposeAction({
      agentKey: "assistant",
      type: "report",
      risk: "low",
      title: `Rapport quotidien — ${summary}`,
      reasoning: alerts.length ? alerts.join(" · ") : "Aucune alerte.",
      payload: { newUsers, sales, pendingKyc, pendingWithdrawals, openDisputes, abandoned24h, alerts },
      dedupeKey: `report-${now.toISOString().slice(0, 10)}`,
      execute: async () => {
        for (const to of emails) {
          await sendEmail({ to, subject: `Rapport Novakou — ${summary}`, html: emailLayout(content) }).catch(() => null);
        }
        return { sentTo: emails.length };
      },
    });

    return { itemsProcessed: 1, actionsCreated: 1, summary };
  });
}
