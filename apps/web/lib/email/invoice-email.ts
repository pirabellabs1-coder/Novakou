// Novakou — Invoice email helper
// Generates invoice PDF and sends it via Resend

import { sendEmail, getAppUrl } from "./index";
import { generateInvoicePDF, type InvoiceData } from "@/lib/pdf/invoice-template";

interface SendInvoiceParams {
  to: string;
  userName: string;
  invoice: InvoiceData;
}

export async function sendInvoiceEmail({ to, userName, invoice }: SendInvoiceParams) {
  try {
    const pdfBytes = generateInvoicePDF(invoice);
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
    const appUrl = getAppUrl();

    const amountFormatted = invoice.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 720px; margin: 0 auto; background: #0f0f14; color: #e2e8f0; padding: 32px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #006e2f; font-size: 24px; margin: 0;">Novakou</h1>
        </div>
        <div style="background: #1a1a24; border: 1px solid #2d2d3d; border-radius: 12px; padding: 24px;">
          <h2 style="color: #fff; margin: 0 0 16px;">Votre facture ${invoice.id}</h2>
          <p style="color: #94a3b8; margin: 0 0 8px;">Bonjour ${userName},</p>
          <p style="color: #94a3b8; margin: 0 0 24px;">
            Votre paiement de <strong style="color: #fff;">${amountFormatted} EUR</strong> a ete traite avec succes.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="border-bottom: 1px solid #2d2d3d;">
              <td style="padding: 8px 0; color: #94a3b8;">Reference</td>
              <td style="padding: 8px 0; text-align: right; color: #fff; font-weight: 600;">${invoice.id}</td>
            </tr>
            <tr style="border-bottom: 1px solid #2d2d3d;">
              <td style="padding: 8px 0; color: #94a3b8;">Description</td>
              <td style="padding: 8px 0; text-align: right; color: #fff;">${invoice.description}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8;">Montant TTC</td>
              <td style="padding: 8px 0; text-align: right; color: #10b981; font-weight: 700; font-size: 18px;">${amountFormatted} EUR</td>
            </tr>
          </table>
          <p style="color: #64748b; font-size: 12px; margin: 16px 0 0;">
            La facture PDF est jointe a cet email. Vous pouvez egalement la telecharger depuis votre espace :
            <a href="${appUrl}/dashboard/factures" style="color: #006e2f;">Mes factures</a>
          </p>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <p style="color: #475569; font-size: 11px;">Novakou &copy; 2026 — La plateforme freelance qui eleve votre carriere</p>
        </div>
      </div>
    `;

    await sendEmail({
      to,
      subject: `Facture ${invoice.id} — ${amountFormatted} EUR`,
      html,
    });

    console.log(`[Invoice Email] Sent to ${to} for invoice ${invoice.id}`);
  } catch (error) {
    console.error(`[Invoice Email] Failed to send to ${to}:`, error);
    // Don't throw — invoice email failure shouldn't block the transaction
  }
}
