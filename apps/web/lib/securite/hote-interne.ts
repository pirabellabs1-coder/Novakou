/**
 * Un hôte fourni par un utilisateur (URL de webhook, lien à tester) ne doit
 * pas pouvoir faire sonder, DEPUIS nos serveurs, le réseau privé, le loopback
 * ni l'adresse de métadonnées cloud (169.254.169.254).
 *
 * Partagé par toutes les routes qui appellent une URL saisie par un vendeur :
 * la même règle vivait dans une seule route et manquait aux autres.
 */
export function isInternalHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, ""); // retire les crochets IPv6
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || h.endsWith(".local")) return true;
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true; // IPv6 loopback/ULA/link-local
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 127 || a === 0 || a === 10) return true; // loopback / « ce réseau » / privé
    if (a === 169 && b === 254) return true; // link-local + métadonnées cloud
    if (a === 172 && b >= 16 && b <= 31) return true; // privé
    if (a === 192 && b === 168) return true; // privé
  }
  return false;
}

/**
 * Vrai si `raw` est une URL http(s) exploitable vers un hôte public.
 * Refuse les hôtes internes et tout ce qui n'est pas une URL.
 */
export function urlSortanteAutorisee(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return !isInternalHost(u.hostname);
  } catch {
    return false;
  }
}
