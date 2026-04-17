/**
 * Test Resend email delivery with current env config.
 * Usage: pnpm --filter=db tsx scripts/test-email.ts <recipient_email>
 */
import { Resend } from "resend";
import * as fs from "fs";
import * as path from "path";

// Load apps/web/.env.local manually
const envPath = path.resolve(__dirname, "../../../apps/web/.env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
    if (m) process.env[m[1]] = m[2];
  }
}

async function main() {
  const recipient = process.argv[2] ?? "support@novakou.com";
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Novakou <support@novakou.com>";

  console.log("\n══ TEST EMAIL RESEND ══\n");
  console.log(`  API Key   : ${apiKey ? `${apiKey.slice(0, 10)}…${apiKey.slice(-4)}` : "❌ MISSING"}`);
  console.log(`  From      : ${from}`);
  console.log(`  To        : ${recipient}`);

  if (!apiKey) {
    console.log("\n❌ RESEND_API_KEY manquante dans .env.local\n");
    process.exit(1);
  }

  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from,
      to: recipient,
      subject: "🧪 Test Novakou — connexion Resend OK",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:24px auto;padding:24px;background:#f9fafb;border-radius:12px;">
          <h2 style="color:#006e2f;">✅ Email reçu !</h2>
          <p>Si vous lisez ceci, c'est que la configuration Resend de Novakou fonctionne correctement.</p>
          <p style="font-size:12px;color:#6b7280;">Test envoyé le ${new Date().toISOString()}</p>
        </div>
      `,
    });

    if (result.error) {
      console.log(`\n❌ Erreur Resend :`);
      console.log(JSON.stringify(result.error, null, 2));
      process.exit(1);
    }

    console.log(`\n✅ Email envoyé avec succès !`);
    console.log(`   ID Resend : ${result.data?.id}`);
    console.log(`\n   Vérifiez la boîte ${recipient} dans 1-2 minutes.\n`);
  } catch (err) {
    console.log(`\n❌ Exception :`);
    console.log(err);
    process.exit(1);
  }
}

main();
