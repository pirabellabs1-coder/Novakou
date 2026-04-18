// Email template — Livraison de produit numerique
// Envoy avec Resend quand un utilisateur achete un produit numerique (PDF, template, etc.)

interface ProductDeliveryEmailProps {
  buyerName: string;
  productTitle: string;
  productType: string;
  price: string;
  downloadUrl: string;
  maxDownloads: number;
  locale?: "fr" | "en";
}

const productTypeLabels: Record<string, Record<string, string>> = {
  fr: {
    PDF: "Document PDF",
    TEMPLATE: "Template",
    EBOOK: "E-book",
    LICENCE: "Licence logicielle",
    MEDIA: "Fichier media",
    AUTRE: "Produit numerique",
  },
  en: {
    PDF: "PDF Document",
    TEMPLATE: "Template",
    EBOOK: "E-book",
    LICENCE: "Software License",
    MEDIA: "Media File",
    AUTRE: "Digital Product",
  },
};

const t = {
  fr: {
    subject: (title: string) => `Votre produit "${title}" est pret !`,
    greeting: (name: string) => `Bonjour ${name},`,
    body: (title: string) =>
      `Merci pour votre achat ! Votre produit <strong>${title}</strong> est pret a etre telecharge.`,
    purchaseConfirmed: "Achat confirme",
    productLabel: "Produit",
    typeLabel: "Type",
    priceLabel: "Montant paye",
    statusLabel: "Statut",
    statusValue: "Pret au telechargement",
    cta: "Telecharger mon produit",
    downloadLimit: (n: number) =>
      `Vous pouvez telecharger ce produit ${n} fois. Conservez bien votre fichier.`,
    support:
      "Un probleme avec votre telechargement ? Contactez notre support.",
    team: "L'equipe Novakou",
  },
  en: {
    subject: (title: string) => `Your product "${title}" is ready!`,
    greeting: (name: string) => `Hello ${name},`,
    body: (title: string) =>
      `Thank you for your purchase! Your product <strong>${title}</strong> is ready to download.`,
    purchaseConfirmed: "Purchase confirmed",
    productLabel: "Product",
    typeLabel: "Type",
    priceLabel: "Amount paid",
    statusLabel: "Status",
    statusValue: "Ready for download",
    cta: "Download my product",
    downloadLimit: (n: number) =>
      `You can download this product ${n} times. Please keep your file safe.`,
    support:
      "Having trouble with your download? Contact our support team.",
    team: "The Novakou Team",
  },
};

export function ProductDeliveryEmail({
  buyerName,
  productTitle,
  productType,
  price,
  downloadUrl,
  maxDownloads,
  locale = "fr",
}: ProductDeliveryEmailProps) {
  const l = t[locale];
  const typeLabel =
    productTypeLabels[locale]?.[productType] ??
    productTypeLabels[locale]?.AUTRE ??
    productType;

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        background: "#f4f4f5",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "12px",
          overflow: "hidden",
          marginTop: "40px",
          marginBottom: "40px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #006e2f, #22c55e)",
            padding: "32px 40px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              color: "#ffffff",
              fontSize: "24px",
              fontWeight: 800,
              margin: 0,
            }}
          >
            Novakou
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "12px",
              margin: "4px 0 0",
              letterSpacing: "1px",
            }}
          >
            {locale === "fr" ? "PRODUITS NUMERIQUES" : "DIGITAL PRODUCTS"}
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: "40px" }}>
          {/* Success badge */}
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
              marginBottom: "24px",
            }}
          >
            <span
              style={{ color: "#16a34a", fontWeight: 700, fontSize: "16px" }}
            >
              {l.purchaseConfirmed}
            </span>
          </div>

          <h2
            style={{
              color: "#111827",
              fontSize: "22px",
              margin: "0 0 16px",
            }}
          >
            {l.greeting(buyerName)}
          </h2>

          <p
            style={{
              color: "#4b5563",
              lineHeight: "1.6",
              margin: "0 0 24px",
              fontSize: "14px",
            }}
            dangerouslySetInnerHTML={{
              __html: l.body(productTitle),
            }}
          />

          {/* Product type badge */}
          <div style={{ marginBottom: "24px" }}>
            <span
              style={{
                display: "inline-block",
                background: "#dcfce7",
                color: "#006e2f",
                padding: "6px 16px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {typeLabel}
            </span>
          </div>

          {/* Details table */}
          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td
                    style={{
                      color: "#6b7280",
                      padding: "6px 0",
                      fontSize: "14px",
                    }}
                  >
                    {l.productLabel}
                  </td>
                  <td
                    style={{
                      color: "#111827",
                      fontWeight: 600,
                      textAlign: "right",
                      fontSize: "14px",
                    }}
                  >
                    {productTitle}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      color: "#6b7280",
                      padding: "6px 0",
                      fontSize: "14px",
                    }}
                  >
                    {l.typeLabel}
                  </td>
                  <td
                    style={{
                      color: "#111827",
                      textAlign: "right",
                      fontSize: "14px",
                    }}
                  >
                    {typeLabel}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      color: "#6b7280",
                      padding: "6px 0",
                      fontSize: "14px",
                    }}
                  >
                    {l.priceLabel}
                  </td>
                  <td
                    style={{
                      color: "#006e2f",
                      fontWeight: 700,
                      textAlign: "right",
                      fontSize: "16px",
                    }}
                  >
                    {price}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      color: "#6b7280",
                      padding: "6px 0",
                      fontSize: "14px",
                    }}
                  >
                    {l.statusLabel}
                  </td>
                  <td
                    style={{
                      color: "#16a34a",
                      fontWeight: 600,
                      textAlign: "right",
                      fontSize: "14px",
                    }}
                  >
                    {l.statusValue}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center", margin: "24px 0" }}>
            <a
              href={downloadUrl}
              style={{
                display: "inline-block",
                background: "#006e2f",
                color: "#ffffff",
                padding: "14px 32px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              {l.cta}
            </a>
          </div>

          {/* Download limit info */}
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "16px",
            }}
          >
            <p
              style={{
                color: "#92400e",
                fontSize: "13px",
                margin: 0,
                textAlign: "center",
              }}
            >
              {l.downloadLimit(maxDownloads)}
            </p>
          </div>

          <p
            style={{
              color: "#9ca3af",
              fontSize: "12px",
              margin: "16px 0 0",
              textAlign: "center",
            }}
          >
            {l.support}
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "24px 40px",
            background: "#f9fafb",
            borderTop: "1px solid #e5e7eb",
            textAlign: "center",
          }}
        >
          <p
            style={{ color: "#6b7280", fontSize: "12px", margin: "0 0 8px" }}
          >
            {l.team}
          </p>
          <p style={{ color: "#9ca3af", fontSize: "11px", margin: 0 }}>
            <a
              href="https://novakou.com"
              style={{ color: "#006e2f", textDecoration: "none" }}
            >
              Formations
            </a>{" "}
            ·{" "}
            <a
              href="https://novakou.com/contact"
              style={{ color: "#006e2f", textDecoration: "none" }}
            >
              Contact
            </a>
          </p>
          <p
            style={{ color: "#d1d5db", fontSize: "10px", margin: "12px 0 0" }}
          >
            &copy; 2026 Novakou — {locale === "fr" ? "Fondee par" : "Founded by"} Pirabel Labs
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the email to an HTML string for use with Resend.
 * Usage:
 *   import { renderProductDeliveryEmail } from "@/components/emails/ProductDeliveryEmail";
 *   const { html, subject } = renderProductDeliveryEmail({ ... });
 *   await resend.emails.send({ from, to, subject, html });
 */
export function renderProductDeliveryEmail(
  props: ProductDeliveryEmailProps
): { html: string; subject: string } {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ReactDOMServer = require("react-dom/server");

  const locale = props.locale ?? "fr";
  const subject = t[locale].subject(props.productTitle);
  const html = `<!DOCTYPE html><html lang="${locale}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f4f4f5;">${ReactDOMServer.renderToStaticMarkup(
    <ProductDeliveryEmail {...props} />
  )}</body></html>`;

  return { html, subject };
}
