/**
 * HTML sanitizer for rich-text bio/description content produced by Tiptap.
 *
 * IMPORTANT : implémentation regex-based pour rester compatible avec le
 * runtime Next.js serveur (edge + node). L'alternative `isomorphic-dompurify`
 * pull `jsdom` qui cherche des fichiers CSS au runtime et casse le bundle
 * serveur (ENOENT sur default-stylesheet.css).
 *
 * Garanties :
 *  - Supprime <script>, <style>, <object>, <embed>, <form>, <iframe> (sauf YouTube/Vimeo)
 *  - Supprime tout handler on* (onclick, onload, etc.)
 *  - Supprime javascript: / vbscript: URLs
 *  - Force target="_blank" rel="noopener noreferrer nofollow" sur tous les <a>
 *
 * C'est une défense en profondeur : Tiptap génère déjà du HTML propre côté
 * client, cette couche bloque les injections malicieuses en cas de bypass.
 */

const FORBIDDEN_TAGS_RE =
  /<(script|style|object|embed|form|input|textarea|button|link|meta|base|svg|math)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1\s*>/gi;

const SELF_CLOSING_FORBIDDEN_RE =
  /<(script|link|meta|base|input)\b[^>]*\/?>/gi;

/** Remove any inline event handler attribute (onclick, onerror, onload, etc.) */
const ON_EVENT_RE = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;

/** Remove dangerous URI schemes in href/src */
const DANGEROUS_URI_RE =
  /\s(href|src|xlink:href|formaction|action|data|poster)\s*=\s*(?:"(?:javascript|vbscript|data:text\/html|file):[^"]*"|'(?:javascript|vbscript|data:text\/html|file):[^']*'|(?:javascript|vbscript|data:text\/html|file):[^\s>]*)/gi;

function isAllowedIframeSrc(src: string): boolean {
  try {
    const u = new URL(src);
    return (
      u.protocol === "https:" &&
      (
        /(^|\.)youtube\.com$/.test(u.hostname) ||
        /(^|\.)youtube-nocookie\.com$/.test(u.hostname) ||
        /(^|\.)vimeo\.com$/.test(u.hostname) ||
        /(^|\.)player\.vimeo\.com$/.test(u.hostname)
      )
    );
  } catch {
    return false;
  }
}

/**
 * Sanitize HTML produced by the Tiptap editor.
 * Safe to call on the server (Node) and on the client.
 */
export function sanitizeRichHtml(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return "";
  let html = input;

  // 1. Strip forbidden block-level tags (with content)
  html = html.replace(FORBIDDEN_TAGS_RE, "");
  // 2. Strip self-closing forbidden tags (meta, link, etc. that don't have content)
  html = html.replace(SELF_CLOSING_FORBIDDEN_RE, "");

  // 3. Filter iframes : keep only YouTube/Vimeo embeds
  html = html.replace(
    /<iframe\b([^>]*?)(?:\/>|>(?:[\s\S]*?)<\/iframe\s*>)/gi,
    (_, attrs: string) => {
      const srcMatch = attrs.match(/\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
      const src = srcMatch ? (srcMatch[1] ?? srcMatch[2]) : "";
      if (!src || !isAllowedIframeSrc(src)) return "";
      // Rebuild a minimal safe iframe
      const safeAttrs = attrs
        .replace(ON_EVENT_RE, "")
        .replace(/\s(width|height|frameborder|allow|allowfullscreen|title|class)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, (m) => m); // keep these attrs
      return `<iframe${safeAttrs}></iframe>`;
    },
  );

  // 4. Remove event handlers everywhere
  html = html.replace(ON_EVENT_RE, "");

  // 5. Remove dangerous URI schemes
  html = html.replace(DANGEROUS_URI_RE, "");

  // 6. Force safe <a> attributes
  html = html.replace(
    /<a\b([^>]*)>/gi,
    (_match, attrs: string) => {
      // Remove any existing target/rel to override with safe values
      const cleaned = attrs
        .replace(/\starget\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
        .replace(/\srel\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
      return `<a${cleaned} target="_blank" rel="noopener noreferrer nofollow">`;
    },
  );

  return html;
}

/**
 * Strip HTML tags entirely — used to count characters of plain text content.
 */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
