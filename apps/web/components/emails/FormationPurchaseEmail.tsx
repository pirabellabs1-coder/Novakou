// Email template — Confirmation d'achat de formation
// Envoy avec Resend quand un utilisateur achete une formation / s'inscrit a un cours

interface FormationPurchaseEmailProps {
  studentName: string;
  formationTitle: string;
  instructorName: string;
  price: string;
  thumbnail?: string;
  formationUrl: string;
  locale?: "fr" | "en";
}

const t = {
  fr: {
    subject: (title: string) => `Votre inscription a "${title}" est confirmee !`,
    greeting: (name: string) => `Bonjour ${name},`,
    body: (title: string, instructor: string) =>
      `Votre achat de la formation <strong>${title}</strong> par <strong>${instructor}</strong> a ete confirme avec succes.`,
    priceLabel: "Montant paye",
    accessLabel: "Acces",
    accessValue: "A vie",
    cta: "Commencer a apprendre",
    footer:
      "Satisfait ou rembourse 30 jours. Contactez le support si vous avez des questions.",
    team: "L'equipe Novakou",
  },
  en: {
    subject: (title: string) => `Your enrollment in "${title}" is confirmed!`,
    greeting: (name: string) => `Hello ${name},`,
    body: (title: string, instructor: string) =>
      `Your purchase of <strong>${title}</strong> by <strong>${instructor}</strong> has been successfully confirmed.`,
    priceLabel: "Amount paid",
    accessLabel: "Access",
    accessValue: "Lifetime",
    cta: "Start learning",
    footer:
      "30-day money-back guarantee. Contact support if you have any questions.",
    team: "The Novakou Team",
  },
};

export function FormationPurchaseEmail({
  studentName,
  formationTitle,
  instructorName,
  price,
  thumbnail,
  formationUrl,
  locale = "fr",
}: FormationPurchaseEmailProps) {
  const l = t[locale];

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
            background: "linear-gradient(135deg, #6C2BD9, #8B5CF6)",
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
            FORMATIONS
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
              {locale === "fr"
                ? "Inscription confirmee"
                : "Enrollment confirmed"}
            </span>
          </div>

          <h2
            style={{
              color: "#111827",
              fontSize: "22px",
              margin: "0 0 16px",
            }}
          >
            {l.greeting(studentName)}
          </h2>

          <p
            style={{
              color: "#4b5563",
              lineHeight: "1.6",
              margin: "0 0 24px",
              fontSize: "14px",
            }}
            dangerouslySetInnerHTML={{
              __html: l.body(formationTitle, instructorName),
            }}
          />

          {/* Thumbnail */}
          {thumbnail && (
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <img
                src={thumbnail}
                alt={formationTitle}
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>
          )}

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
                    {locale === "fr" ? "Formation" : "Course"}
                  </td>
                  <td
                    style={{
                      color: "#111827",
                      fontWeight: 600,
                      textAlign: "right",
                      fontSize: "14px",
                    }}
                  >
                    {formationTitle}
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
                    {locale === "fr" ? "Instructeur" : "Instructor"}
                  </td>
                  <td
                    style={{
                      color: "#111827",
                      textAlign: "right",
                      fontSize: "14px",
                    }}
                  >
                    {instructorName}
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
                      color: "#6C2BD9",
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
                    {l.accessLabel}
                  </td>
                  <td
                    style={{
                      color: "#16a34a",
                      fontWeight: 600,
                      textAlign: "right",
                      fontSize: "14px",
                    }}
                  >
                    {l.accessValue}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center", margin: "24px 0" }}>
            <a
              href={formationUrl}
              style={{
                display: "inline-block",
                background: "#6C2BD9",
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

          <p
            style={{
              color: "#9ca3af",
              fontSize: "12px",
              margin: "16px 0 0",
              textAlign: "center",
            }}
          >
            {l.footer}
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
              style={{ color: "#6C2BD9", textDecoration: "none" }}
            >
              Formations
            </a>{" "}
            ·{" "}
            <a
              href="https://novakou.com/contact"
              style={{ color: "#6C2BD9", textDecoration: "none" }}
            >
              Contact
            </a>
          </p>
          <p
            style={{ color: "#d1d5db", fontSize: "10px", margin: "12px 0 0" }}
          >
            &copy; 2026 Novakou — {locale === "fr" ? "Fondee par" : "Founded by"} Lissanon Gildas
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the email to an HTML string for use with Resend.
 * Usage:
 *   import { renderFormationPurchaseEmail } from "@/components/emails/FormationPurchaseEmail";
 *   const { html, subject } = renderFormationPurchaseEmail({ ... });
 *   await resend.emails.send({ from, to, subject, html });
 */
export function renderFormationPurchaseEmail(
  props: FormationPurchaseEmailProps
): { html: string; subject: string } {
  // Import ReactDOMServer dynamically to avoid issues in client bundles
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ReactDOMServer = require("react-dom/server");

  const locale = props.locale ?? "fr";
  const subject = t[locale].subject(props.formationTitle);
  const html = `<!DOCTYPE html><html lang="${locale}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f4f4f5;">${ReactDOMServer.renderToStaticMarkup(
    <FormationPurchaseEmail {...props} />
  )}</body></html>`;

  return { html, subject };
}
