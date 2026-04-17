// Email template — Certificat obtenu
// Envoy avec Resend quand un apprenant obtient un certificat apres avoir complete une formation

interface CertificateEmailProps {
  studentName: string;
  formationTitle: string;
  score: number;
  certificateUrl: string;
  locale?: "fr" | "en";
}

const t = {
  fr: {
    subject: (title: string) => `Felicitations ! Votre certificat pour "${title}"`,
    greeting: (name: string) => `Felicitations ${name} !`,
    body: (title: string, score: number) =>
      `Vous avez complete avec succes la formation <strong>${title}</strong> avec un score de <strong>${score}%</strong>. Votre certificat est maintenant disponible.`,
    certificateTitle: "Certificat d'accomplissement",
    courseLabel: "Formation",
    scoreLabel: "Score obtenu",
    dateLabel: "Date d'obtention",
    cta: "Telecharger mon certificat",
    linkedIn:
      "Partagez votre reussite sur LinkedIn pour valoriser votre profil professionnel !",
    linkedInCta: "Partager sur LinkedIn",
    footer:
      "Ce certificat est verifie et valide par Novakou. Il peut etre partage avec vos employeurs et clients potentiels.",
    team: "L'equipe Novakou",
  },
  en: {
    subject: (title: string) => `Congratulations! Your certificate for "${title}"`,
    greeting: (name: string) => `Congratulations ${name}!`,
    body: (title: string, score: number) =>
      `You have successfully completed <strong>${title}</strong> with a score of <strong>${score}%</strong>. Your certificate is now available.`,
    certificateTitle: "Certificate of Completion",
    courseLabel: "Course",
    scoreLabel: "Score achieved",
    dateLabel: "Date earned",
    cta: "Download my certificate",
    linkedIn:
      "Share your achievement on LinkedIn to enhance your professional profile!",
    linkedInCta: "Share on LinkedIn",
    footer:
      "This certificate is verified and validated by Novakou. It can be shared with your employers and potential clients.",
    team: "The Novakou Team",
  },
};

export function CertificateEmail({
  studentName,
  formationTitle,
  score,
  certificateUrl,
  locale = "fr",
}: CertificateEmailProps) {
  const l = t[locale];
  const today = new Date().toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-US",
    { day: "numeric", month: "long", year: "numeric" }
  );

  // Score color coding
  const scoreColor =
    score >= 90 ? "#16a34a" : score >= 70 ? "#0EA5E9" : "#f59e0b";

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
            CERTIFICATIONS
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: "40px" }}>
          <h2
            style={{
              color: "#111827",
              fontSize: "22px",
              margin: "0 0 16px",
              textAlign: "center",
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
              textAlign: "center",
            }}
            dangerouslySetInnerHTML={{
              __html: l.body(formationTitle, score),
            }}
          />

          {/* Certificate card */}
          <div
            style={{
              background: "linear-gradient(135deg, #dcfce7, #ecfdf5)",
              border: "2px solid #006e2f",
              borderRadius: "16px",
              padding: "32px",
              textAlign: "center",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                color: "#006e2f",
                fontSize: "13px",
                fontWeight: 600,
                margin: "0 0 8px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {l.certificateTitle}
            </p>
            <p
              style={{
                color: "#111827",
                fontSize: "20px",
                fontWeight: 800,
                margin: "0 0 8px",
              }}
            >
              {studentName}
            </p>
            <p
              style={{
                color: "#6b7280",
                fontSize: "14px",
                margin: "0 0 16px",
              }}
            >
              {formationTitle}
            </p>

            {/* Score display */}
            <div
              style={{
                display: "inline-block",
                background: "#ffffff",
                borderRadius: "12px",
                padding: "12px 24px",
                margin: "0 0 12px",
              }}
            >
              <span
                style={{
                  color: scoreColor,
                  fontSize: "28px",
                  fontWeight: 800,
                }}
              >
                {score}%
              </span>
            </div>

            <p
              style={{ color: "#9ca3af", fontSize: "12px", margin: "8px 0 0" }}
            >
              {today}
            </p>
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
                    {l.courseLabel}
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
                    {l.scoreLabel}
                  </td>
                  <td
                    style={{
                      color: scoreColor,
                      fontWeight: 700,
                      textAlign: "right",
                      fontSize: "16px",
                    }}
                  >
                    {score}%
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
                    {l.dateLabel}
                  </td>
                  <td
                    style={{
                      color: "#111827",
                      textAlign: "right",
                      fontSize: "14px",
                    }}
                  >
                    {today}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* CTA — Download certificate */}
          <div style={{ textAlign: "center", margin: "24px 0" }}>
            <a
              href={certificateUrl}
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

          {/* LinkedIn share suggestion */}
          <div
            style={{
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
              marginBottom: "16px",
            }}
          >
            <p
              style={{
                color: "#0369a1",
                fontSize: "13px",
                margin: "0 0 8px",
              }}
            >
              {l.linkedIn}
            </p>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certificateUrl)}`}
              style={{
                display: "inline-block",
                background: "#0A66C2",
                color: "#ffffff",
                padding: "8px 20px",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "12px",
              }}
            >
              {l.linkedInCta}
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
              style={{ color: "#006e2f", textDecoration: "none" }}
            >
              Formations
            </a>{" "}
            ·{" "}
            <a
              href="https://novakou.com/apprenant/certificats"
              style={{ color: "#006e2f", textDecoration: "none" }}
            >
              {locale === "fr" ? "Mes certificats" : "My certificates"}
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
 *   import { renderCertificateEmail } from "@/components/emails/CertificateEmail";
 *   const { html, subject } = renderCertificateEmail({ ... });
 *   await resend.emails.send({ from, to, subject, html });
 */
export function renderCertificateEmail(
  props: CertificateEmailProps
): { html: string; subject: string } {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ReactDOMServer = require("react-dom/server");

  const locale = props.locale ?? "fr";
  const subject = t[locale].subject(props.formationTitle);
  const html = `<!DOCTYPE html><html lang="${locale}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f4f4f5;">${ReactDOMServer.renderToStaticMarkup(
    <CertificateEmail {...props} />
  )}</body></html>`;

  return { html, subject };
}
