/**
 * Nettoyage du HTML riche (descriptions, bios, blocs de tunnel) produit par
 * Tiptap ou collé par un vendeur — AVANT tout rendu avec dangerouslySetInnerHTML.
 *
 * Fondé sur `sanitize-html` (analyseur HTML réel, liste blanche), et plus sur
 * des expressions régulières. La version regex exigeait un espace avant un
 * attribut `on*` : `<img/src=x/onerror=alert(1)>` passait, et le script
 * s'exécutait sur novakou.com dans le navigateur de tout visiteur — un admin
 * connecté compris (audit du 2026-10-08). Un analyseur ne se contourne pas
 * par une variante d'écriture : seules les balises et attributs listés ici
 * survivent, tout le reste est retiré.
 *
 * `sanitize-html` ne dépend pas de jsdom (contrairement à isomorphic-dompurify,
 * qui cassait le bundle serveur) : il fonctionne côté Node ET dans le
 * navigateur (aperçu de l'éditeur).
 *
 * Garanties :
 *  - aucune balise script/style/object/embed/form/svg/math, aucun `on*` ;
 *  - URLs : http(s), mailto, tel seulement (data: toléré pour les images) ;
 *  - iframes : YouTube et Vimeo uniquement, en https ;
 *  - tout <a> sort avec target="_blank" rel="noopener noreferrer nofollow" ;
 *  - styles en ligne réduits à l'alignement et aux couleurs.
 */

import sanitizeHtml from "sanitize-html";
import { marked } from "marked";

const COULEUR = [/^#(?:[0-9a-f]{3}){1,2}$/i, /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i];

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "h1", "h2", "h3", "h4", "h5", "h6", "br", "hr",
    "ul", "ol", "li", "blockquote", "pre", "code",
    "strong", "em", "b", "i", "u", "s", "del", "mark", "sub", "sup", "span", "div",
    "a", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tr", "td", "th",
    "iframe",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
    iframe: ["src", "width", "height", "allow", "allowfullscreen", "title", "frameborder"],
    "*": ["class", "style"],
  },
  allowedStyles: {
    "*": {
      "text-align": [/^(left|right|center|justify)$/],
      color: COULEUR,
      "background-color": COULEUR,
      "font-weight": [/^(bold|normal|[1-9]00)$/],
      "font-style": [/^(italic|normal)$/],
      "text-decoration": [/^(underline|line-through|none)$/],
    },
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowProtocolRelative: false,
  allowedIframeHostnames: ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "player.vimeo.com", "vimeo.com"],
  allowIframeRelativeUrls: false,
  disallowedTagsMode: "discard",
  transformTags: {
    // merge = true : les attributs existants (href, title) sont GARDÉS, et
    // target/rel sont écrasés par nos valeurs. Avec merge = false, href
    // disparaissait et chaque lien devenait inerte.
    a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer nofollow" }, true),
  },
  parser: { lowerCaseAttributeNames: true, lowerCaseTags: true },
};

/**
 * Nettoie le HTML de l'éditeur. Sûr côté serveur (Node) et côté client.
 */
export function sanitizeRichHtml(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return "";
  return sanitizeHtml(input, OPTIONS);
}

/**
 * Heuristique : ce contenu contient-il déjà du balisage HTML (Tiptap) ?
 * Si oui → on le traite comme du HTML. Sinon → c'est du Markdown (collé ou
 * legacy) qu'il faut convertir.
 */
function looksLikeHtml(s: string): boolean {
  return /<\/?(p|h[1-6]|ul|ol|li|strong|em|b|i|u|a|br|blockquote|img|hr|table|thead|tbody|tr|td|th|div|span|mark|iframe|pre|code)\b/i.test(s);
}

let markedConfigured = false;

/**
 * Convertit un contenu Markdown en HTML.
 *
 * `marked` v18 est pur ESM → import statique (un `require()` casserait en
 * SSR Node avec ERR_REQUIRE_ESM). `marked.parse` est synchrone tant
 * qu'aucune extension async n'est enregistrée — on caste donc en string.
 */
export function markdownToHtml(input: string): string {
  if (!markedConfigured) {
    marked.setOptions({ gfm: true, breaks: true });
    markedConfigured = true;
  }
  return marked.parse(input) as string;
}

/**
 * SOURCE DE VÉRITÉ UNIQUE pour afficher une description / bio enregistrée.
 *
 * - Si le contenu est déjà du HTML Tiptap → on le nettoie directement.
 * - Si c'est du Markdown (collé dans l'éditeur, ou contenu legacy) → on le
 *   convertit en HTML PUIS on le nettoie.
 *
 * Utilisé à la fois par l'aperçu de l'éditeur ET par toutes les pages
 * publiques (via TiptapRenderer) → le rendu est TOUJOURS identique.
 * Le rendu visuel est porté par la classe CSS `.nk-rich` (globals.css),
 * partagée entre l'éditeur et le public.
 */
export function renderRichContent(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return "";
  const trimmed = input.trim();
  if (!trimmed) return "";
  const html = looksLikeHtml(trimmed) ? trimmed : markdownToHtml(trimmed);
  return normalizeHardSpaces(sanitizeRichHtml(html));
}

/**
 * Remplace les espaces INSÉCABLES parasites par des espaces ordinaires.
 *
 * Un texte collé depuis Word, Google Docs ou une page de vente arrive souvent
 * avec TOUS ses espaces convertis en insécables. Or un espace insécable
 * interdit au navigateur de couper la ligne : le paragraphe part sur une seule
 * ligne interminable et se retrouve tronqué sur mobile. Constaté sur une fiche
 * produit réelle : 21 espaces insécables, zéro espace normal, texte coupé net.
 *
 * On préserve les insécables TYPOGRAPHIQUES du français — ceux qui précèdent
 * « ; : ! ? » et qui bordent les guillemets — parce que là, ils sont voulus :
 * les supprimer ferait passer la ponctuation à la ligne toute seule.
 */
function normalizeHardSpaces(html: string): string {
  return html
    // Entité HTML → caractère, pour n'avoir qu'une seule forme à traiter.
    .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
    // Insécable suivi d'une ponctuation haute, ou précédant un guillemet
    // fermant : typographie française correcte, on garde.
    .replace(/ (?![;:!?»])/g, (m, offset, str) => {
      const prev = str[offset - 1];
      return prev === "«" ? m : " ";
    })
    // Insécables restants en série (indentations collées) : un seul espace.
    .replace(/[  ]{3,}/g, " ");
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
