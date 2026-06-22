/* eslint-disable */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

const SUBJECT = "Novakou 2.0 est arrivé 🚀 — découvrez tout ce qui change";

const INNER_HTML = `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#13241b;">Bonjour {{prenom}}, Novakou passe en 2.0 🚀</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#5c647a;">
  Nous avons travaillé dur pour rendre votre expérience plus rapide, plus humaine et plus rentable.
  Voici les nouveautés que vous pouvez utiliser dès aujourd'hui.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
  <tr><td style="padding:14px 16px;background:#f0faf3;border:1px solid #d7ecde;border-radius:12px;">
    <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#006e2f;">💬 Messagerie en temps réel</p>
    <p style="margin:0;font-size:14px;line-height:1.5;color:#5c647a;">Discutez en direct avec vos clients ou vos vendeurs, avec présence « en ligne » et notifications instantanées.</p>
  </td></tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
  <tr><td style="padding:14px 16px;background:#f0faf3;border:1px solid #d7ecde;border-radius:12px;">
    <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#006e2f;">🔍 Recherche par intelligence artificielle</p>
    <p style="margin:0;font-size:14px;line-height:1.5;color:#5c647a;">Décrivez votre besoin en langage naturel (« je veux apprendre à vendre sur WhatsApp ») et l'IA trouve les bons produits pour vous.</p>
  </td></tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
  <tr><td style="padding:14px 16px;background:#f0faf3;border:1px solid #d7ecde;border-radius:12px;">
    <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#006e2f;">🔔 Notifications push & 📲 application installable</p>
    <p style="margin:0;font-size:14px;line-height:1.5;color:#5c647a;">Installez Novakou sur votre téléphone comme une vraie app et soyez prévenu d'une vente ou d'un message, même l'application fermée.</p>
  </td></tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
  <tr><td style="padding:14px 16px;background:#f0faf3;border:1px solid #d7ecde;border-radius:12px;">
    <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#006e2f;">✅ Confiance renforcée</p>
    <p style="margin:0;font-size:14px;line-height:1.5;color:#5c647a;">Badge « Vendeur vérifié », recommandations personnalisées et un coach IA pour vous aider à progresser et à vendre.</p>
  </td></tr>
</table>

<p style="margin:0 0 8px;font-size:15px;font-weight:800;color:#13241b;">💡 Vendeurs : le conseil n°1 pour générer vos premières ventes</p>
<p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#5c647a;">
  Un bon produit ne suffit pas. Pour vendre, <strong>lancez une publicité</strong> : partagez votre lien, créez une promo,
  diffusez une annonce sponsorisée. C'est l'étape qui transforme vos visiteurs en acheteurs.
</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 8px;">
  <tr><td style="border-radius:12px;background:linear-gradient(to right,#006e2f,#22c55e);">
    <a href="https://novakou.com/nouveautes" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;">Découvrir Novakou 2.0 →</a>
  </td></tr>
</table>

<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#8a93a6;text-align:center;">
  Merci de faire partie de l'aventure Novakou.<br/>L'équipe Novakou — l'académie des créateurs digitaux.
</p>
`.trim();

async function main() {
  // 1. Trouver l'admin (createdBy)
  const adminEmail = process.env.ADMIN_EMAIL;
  let admin = adminEmail
    ? await prisma.user.findUnique({ where: { email: adminEmail }, select: { id: true, email: true } })
    : null;
  if (!admin) {
    admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true, email: true } });
  }
  if (!admin) {
    console.error("ERREUR : aucun admin trouvé pour createdBy.");
    process.exit(1);
  }

  // 2. Compter les destinataires (segment all = users ACTIF)
  const recipientCount = await prisma.user.count({ where: { status: "ACTIF" } });

  // 3. Éviter les doublons : ne pas recréer si un brouillon v2.0 existe déjà
  const existing = await prisma.adminCampaign.findFirst({
    where: { subject: SUBJECT, status: "draft" },
    select: { id: true },
  });
  if (existing) {
    console.log("Brouillon déjà existant:", existing.id, "| destinataires:", recipientCount);
    return;
  }

  const campaign = await prisma.adminCampaign.create({
    data: {
      subject: SUBJECT,
      htmlBody: INNER_HTML,
      segment: "all",
      status: "draft",
      createdBy: admin.id,
    },
    select: { id: true },
  });

  console.log("OK brouillon créé:", campaign.id);
  console.log("Admin (createdBy):", admin.email);
  console.log("Destinataires (segment all, ACTIF):", recipientCount);
}

main()
  .catch((e) => {
    console.error("ERREUR:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
