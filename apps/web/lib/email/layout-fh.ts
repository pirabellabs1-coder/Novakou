/**
 * Novakou — Email Layout (Light mode, brand green)
 *
 * Rules:
 *   - Inline styles only (works in all email clients)
 *   - Light background (better for transactional deliverability)
 *   - Brand palette: #006e2f (primary green) + #22c55e (accent)
 *   - Max width 600px, centered
 */
import { getAppUrl } from "@/lib/email";

const BRAND = {
  primary: "#006e2f",
  accent: "#22c55e",
  text: "#191c1e",
  textMuted: "#5c647a",
  textLight: "#9ca3af",
  bg: "#f7f9fb",
  bgCard: "#ffffff",
  border: "#e5e7eb",
  success: "#006e2f",
  warning: "#f59e0b",
  danger: "#ef4444",
};

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT WRAPPER
// ═══════════════════════════════════════════════════════════════════════════
export function emailLayoutFH(content: string, preheader?: string): string {
  const appUrl = getAppUrl();
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Novakou</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Manrope',sans-serif;color:${BRAND.text};-webkit-font-smoothing:antialiased;">
${preheader ? `<div style="display:none;overflow:hidden;line-height:1px;color:transparent;opacity:0;max-height:0;max-width:0;">${preheader}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bg};padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${BRAND.bgCard};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,${BRAND.primary} 0%,${BRAND.accent} 100%);padding:28px 32px;text-align:center;">
            <a href="${appUrl}" style="text-decoration:none;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="background:rgba(255,255,255,0.2);border-radius:10px;padding:6px 10px;border:1px solid rgba(255,255,255,0.25);">
                    <span style="color:#ffffff;font-weight:800;font-size:14px;letter-spacing:0.5px;">NK</span>
                  </td>
                  <td style="padding-left:10px;">
                    <span style="color:#ffffff;font-weight:800;font-size:18px;letter-spacing:-0.3px;">Novakou</span>
                  </td>
                </tr>
              </table>
            </a>
          </td>
        </tr>

        <!-- CONTENT -->
        <tr>
          <td style="padding:40px 32px;">
            ${content}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#fafbfd;padding:24px 32px;border-top:1px solid ${BRAND.border};text-align:center;">
            <p style="color:${BRAND.textMuted};font-size:12px;margin:0 0 12px;">
              Une question ? Écrivez-nous à
              <a href="mailto:support@novakou.com" style="color:${BRAND.primary};font-weight:600;text-decoration:none;">support@novakou.com</a>
            </p>
            <p style="color:${BRAND.textLight};font-size:11px;margin:0 0 12px;">
              <a href="${appUrl}/cgu" style="color:${BRAND.textMuted};text-decoration:none;margin:0 8px;">CGU</a>·
              <a href="${appUrl}/confidentialite" style="color:${BRAND.textMuted};text-decoration:none;margin:0 8px;">Confidentialité</a>·
              <a href="${appUrl}/cookies" style="color:${BRAND.textMuted};text-decoration:none;margin:0 8px;">Cookies</a>
            </p>
            <p style="color:${BRAND.textLight};font-size:11px;margin:0;">
              © 2026 Novakou · La plateforme qui élève les talents
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS (reusable HTML snippets)
// ═══════════════════════════════════════════════════════════════════════════

export function heading(text: string, size: "xl" | "lg" | "md" = "lg"): string {
  const sizes = { xl: "28px", lg: "22px", md: "18px" };
  return `<h1 style="color:${BRAND.text};font-size:${sizes[size]};font-weight:800;margin:0 0 16px;line-height:1.25;letter-spacing:-0.3px;">${text}</h1>`;
}

export function paragraph(text: string): string {
  return `<p style="color:${BRAND.textMuted};font-size:15px;line-height:1.65;margin:0 0 16px;">${text}</p>`;
}

export function greeting(name: string): string {
  return `<p style="color:${BRAND.text};font-size:16px;font-weight:600;margin:0 0 16px;">Bonjour ${name} 👋</p>`;
}

type ButtonVariant = "primary" | "outline" | "secondary";
export function button(label: string, url: string, variant: ButtonVariant = "primary"): string {
  let bg = `linear-gradient(135deg,${BRAND.primary},${BRAND.accent})`;
  let color = "#ffffff";
  let border = "none";
  if (variant === "outline") { bg = BRAND.bgCard; color = BRAND.primary; border = `2px solid ${BRAND.primary}`; }
  else if (variant === "secondary") { bg = "#f3f4f6"; color = BRAND.text; border = "none"; }
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td style="border-radius:12px;background:${bg};">
      <a href="${url}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:${color};text-decoration:none;border-radius:12px;border:${border};box-shadow:0 4px 12px rgba(0,110,47,0.25);">${label}</a>
    </td>
  </tr>
</table>`;
}

export function otpCode(code: string): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td align="center" style="background:#ecfdf5;border:2px dashed ${BRAND.primary};border-radius:16px;padding:32px;">
      <p style="color:${BRAND.textMuted};font-size:11px;font-weight:700;letter-spacing:2px;margin:0 0 8px;text-transform:uppercase;">Votre code</p>
      <p style="color:${BRAND.primary};font-size:42px;font-weight:800;letter-spacing:12px;margin:0;font-family:'SF Mono','Consolas',monospace;">${code}</p>
      <p style="color:${BRAND.textMuted};font-size:12px;margin:12px 0 0;">Expire dans 10 minutes</p>
    </td>
  </tr>
</table>`;
}

export function infoBox(title: string, content: string, color: "green" | "amber" | "red" | "blue" = "green"): string {
  const colors = {
    green: { bg: "#ecfdf5", border: "#a7f3d0", title: BRAND.primary },
    amber: { bg: "#fffbeb", border: "#fcd34d", title: "#92400e" },
    red: { bg: "#fef2f2", border: "#fca5a5", title: "#991b1b" },
    blue: { bg: "#eff6ff", border: "#93c5fd", title: "#1e3a8a" },
  }[color];
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
  <tr>
    <td style="background:${colors.bg};border:1px solid ${colors.border};border-radius:12px;padding:16px 20px;">
      <p style="color:${colors.title};font-size:13px;font-weight:700;margin:0 0 6px;">${title}</p>
      <p style="color:${BRAND.text};font-size:14px;line-height:1.55;margin:0;">${content}</p>
    </td>
  </tr>
</table>`;
}

export function orderSummary(items: Array<{ title: string; amount: number; sub?: string }>, total: { label: string; amount: number; currency?: string }): string {
  const rows = items.map((it) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};">
        <p style="color:${BRAND.text};font-size:14px;font-weight:600;margin:0 0 4px;">${it.title}</p>
        ${it.sub ? `<p style="color:${BRAND.textMuted};font-size:12px;margin:0;">${it.sub}</p>` : ""}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};text-align:right;">
        <p style="color:${BRAND.text};font-size:14px;font-weight:600;margin:0;">${fmt(it.amount)} FCFA</p>
      </td>
    </tr>
  `).join("");
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background:#fafbfd;border-radius:12px;padding:20px 24px;border:1px solid ${BRAND.border};">
  ${rows}
  <tr>
    <td style="padding:16px 0 0;">
      <p style="color:${BRAND.text};font-size:16px;font-weight:800;margin:0;">${total.label}</p>
    </td>
    <td style="padding:16px 0 0;text-align:right;">
      <p style="color:${BRAND.primary};font-size:22px;font-weight:800;margin:0;">${fmt(total.amount)} ${total.currency ?? "FCFA"}</p>
    </td>
  </tr>
</table>`;
}

export function statRow(stats: Array<{ label: string; value: string; trend?: "up" | "down" | "neutral" }>): string {
  const cells = stats.map((s) => {
    const arrow = s.trend === "up" ? "↗" : s.trend === "down" ? "↘" : "";
    const trendColor = s.trend === "up" ? BRAND.success : s.trend === "down" ? BRAND.danger : BRAND.textMuted;
    return `
      <td align="center" style="padding:16px 8px;width:${(100 / stats.length).toFixed(0)}%;vertical-align:top;">
        <p style="color:${BRAND.textMuted};font-size:11px;font-weight:600;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.5px;">${s.label}</p>
        <p style="color:${BRAND.text};font-size:22px;font-weight:800;margin:0;">${s.value}<span style="color:${trendColor};font-size:14px;margin-left:4px;">${arrow}</span></p>
      </td>`;
  }).join("");
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background:#fafbfd;border-radius:12px;border:1px solid ${BRAND.border};">
  <tr>${cells}</tr>
</table>`;
}

export function divider(): string {
  return `<div style="height:1px;background:${BRAND.border};margin:24px 0;"></div>`;
}

export function footerNote(text: string): string {
  return `<p style="color:${BRAND.textLight};font-size:12px;line-height:1.5;margin:16px 0 0;text-align:center;font-style:italic;">${text}</p>`;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

export { BRAND };
