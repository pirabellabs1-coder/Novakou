/**
 * Novakou — Email HTML escape utility
 *
 * XSS hardening: every user-supplied string interpolated into an email
 * template MUST go through escapeHtml() before being concatenated into
 * the HTML output. Email clients that render HTML treat unescaped <, >,
 * ", ', & exactly like a browser would, so a hostile name like
 * `<script>` (or even just `<img onerror="…">`) would otherwise render
 * in every recipient's inbox.
 *
 * Safe inputs that don't need escaping:
 *  - Numeric values (toFixed output, IDs we control)
 *  - Constants/literals from our own code
 *  - URLs we built ourselves (still careful with href context)
 *
 * Always escape:
 *  - name, email, productTitle, courseTitle, serviceTitle, message,
 *    reason, comment, buyerName, clientName, freelanceName, instructorName,
 *    reviewerName, etc. — anything ultimately sourced from user input.
 */
export function escapeHtml(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
