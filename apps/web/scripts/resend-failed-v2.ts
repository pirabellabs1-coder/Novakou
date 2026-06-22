/* eslint-disable */
/**
 * Renvoie l'email de campagne v2.0 UNIQUEMENT aux destinataires en échec
 * (les 21 qui ont pris un 429 rate-limit lors du 1er envoi). Envoi séquentiel
 * cadencé (600 ms) + 1 retry — conforme à la limite Resend Free (2 req/s).
 *
 * Lancer depuis apps/web avec les variables d'env chargées :
 *   DIRECT_URL=... RESEND_API_KEY=... EMAIL_FROM=... npx tsx scripts/resend-failed-v2.ts
 */
import { PrismaClient } from "@prisma/client";
import { sendAdminCampaignEmail } from "../lib/email/admin-campaign";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const campaign = await prisma.adminCampaign.findFirst({
    where: { subject: { contains: "Novakou 2.0" }, status: { not: "draft" } },
    orderBy: { createdAt: "desc" },
  });
  if (!campaign) {
    console.log("Aucune campagne v2.0 envoyée trouvée.");
    return;
  }

  // Le CTA des emails renvoyés pointe vers la page guide /nouveautes.
  const html = campaign.htmlBody.replace(/novakou\.com\/explorer/g, "novakou.com/nouveautes");

  const failed = await prisma.adminCampaignRecipient.findMany({
    where: { campaignId: campaign.id, status: { in: ["failed", "bounced"] } },
  });
  console.log(`Campagne ${campaign.id} — à renvoyer : ${failed.length} destinataires.`);

  let ok = 0;
  let ko = 0;
  for (let i = 0; i < failed.length; i++) {
    const r = failed[i];
    const user = await prisma.user.findUnique({ where: { id: r.userId }, select: { name: true } });
    const firstName = user?.name?.split(" ")[0] ?? null;

    let res = await sendAdminCampaignEmail({ to: r.email, firstName, subject: campaign.subject, htmlBody: html });
    if (!res.ok) {
      await sleep(1100);
      res = await sendAdminCampaignEmail({ to: r.email, firstName, subject: campaign.subject, htmlBody: html });
    }
    if (res.ok) {
      ok++;
      await prisma.adminCampaignRecipient.update({
        where: { id: r.id },
        data: { status: "sent", sentAt: new Date(), resendId: res.id ?? null },
      });
    } else {
      ko++;
      console.log("Échec persistant:", r.email, "—", res.error);
    }
    await sleep(600);
  }
  console.log(`\nRenvoi terminé : ${ok} envoyés, ${ko} échecs restants.`);
}

main()
  .catch((e) => {
    console.error("ERREUR:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
