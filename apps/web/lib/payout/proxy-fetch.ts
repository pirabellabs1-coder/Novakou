// fetch à IP FIXE, réservé aux appels que le fournisseur filtre par IP.
//
// Problème : Vercel a des IP de sortie DYNAMIQUES, alors que FeexPay n'autorise
// que des IP FIXES whitelistées → « IP not allowed ». Solution : faire sortir
// ces appels par un PROXY à IP fixe (Fixie), via PAYOUT_PROXY_URL.
//
//   PAYOUT_PROXY_URL="http://user:pass@proxy-host:port"
//
// ─── QUI DOIT PASSER PAR ICI : FEEXPAY, ET RIEN D'AUTRE ────────────────────
// Le proxy est un forfait au NOMBRE de requêtes (2 500/mois). Il servait à
// TOUT — FedaPay, Monetbil, iPay, et surtout leurs consultations de statut,
// relancées par le cron toutes les cinq minutes. Résultat le 2026-08-18 :
// 5 000 requêtes consommées sur 2 500, Fixie refusait, le code retombait « en
// direct », et FeexPay rejetait l'IP dynamique. Douze versements refusés en
// douze jours pour un quota mangé par des passerelles qui ne filtrent pas
// par IP. FedaPay, Monetbil et iPay sortent désormais en direct.
//
// Inerte tant que la variable n'est pas posée : fetch normal (IP dynamique).

// ⚠️ On importe le `fetch` d'undici EXPLICITEMENT.
//
// Next.js remplace le `fetch` global par le sien (pour son cache) et cette
// version IGNORE l'option `dispatcher` — silencieusement. Le proxy à IP fixe
// était donc configuré, le code le passait, et il partait à la poubelle sans
// un mot : tous les appels sortaient par l'IP dynamique de Vercel.
//
// FedaPay ne filtrant pas par IP, elle répondait 200 et masquait le défaut.
// FeexPay, elle, refusait : « Your IP address (13.38.126.157) is not allowed
// to perform payout operations » — la MÊME IP avec et sans proxy, ce qui a
// fini par trahir le problème.
import { ProxyAgent, fetch as undiciFetch } from "undici";

let cachedAgent: ProxyAgent | null = null;
let cachedUrl: string | null = null;

/** Vrai si un proxy de versement à IP fixe est configuré. */
export function isPayoutProxyConfigured(): boolean {
  return Boolean(process.env.PAYOUT_PROXY_URL && process.env.PAYOUT_PROXY_URL.trim());
}

/**
 * Construit le ProxyAgent. Les proxys authentifiés (ex. Fixie :
 * `http://fixie:MOTDEPASSE@host:port`) exigent un en-tête Proxy-Authorization.
 * Selon les versions d'undici, les identifiants présents dans l'URI ne sont pas
 * toujours convertis en header → on fournit le `token` Basic explicitement.
 */
function buildAgent(proxyUrl: string): ProxyAgent {
  const u = new URL(proxyUrl);
  const username = decodeURIComponent(u.username);
  const password = decodeURIComponent(u.password);
  if (username || password) {
    const token = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
    return new ProxyAgent({ uri: `${u.protocol}//${u.host}`, token });
  }
  return new ProxyAgent(proxyUrl);
}

/**
 * fetch qui sort par le proxy à IP fixe si PAYOUT_PROXY_URL est défini,
 * sinon fetch standard. À utiliser pour TOUS les appels FeexPay / FedaPay.
 */
/**
 * Codes d'erreur signifiant que la CONNEXION n'a jamais abouti : DNS, refus,
 * délai de connexion, proxy injoignable. La requête n'a donc jamais quitté
 * notre serveur.
 *
 * La distinction est vitale pour l'argent : sur un versement, une erreur
 * ambiguë (délai d'attente APRÈS envoi, coupure en cours) interdit d'essayer
 * une autre passerelle — le premier versement est peut-être parti, et
 * recommencer paierait deux fois. Une connexion jamais établie, elle, ne peut
 * rien avoir déclenché : basculer est alors sans danger.
 */
const CODES_JAMAIS_ENVOYE = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_PROXY",
]);

/**
 * Vérifie que le PROXY lui-même répond, par une requête SANS effet (GET).
 *
 * C'est ce qui permet de trancher sans deviner. Un échec de connexion peut
 * signifier deux choses opposées : le proxy est mort (rien n'est parti, on peut
 * réessayer) ou la connexion a été coupée EN COURS d'envoi (le versement est
 * peut-être parti, réessayer paierait deux fois). Le code d'erreur seul ne les
 * distingue pas.
 *
 * En sondant le proxy juste après l'échec, on obtient un fait : s'il est
 * injoignable, la requête de versement ne peut pas l'avoir traversé.
 */
async function proxyRepond(origine: string): Promise<boolean> {
  if (!cachedAgent) return false;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 6000);
    // GET sur l'origine du fournisseur : aucune écriture, aucun effet.
    await undiciFetch(origine, { method: "GET", signal: ctl.signal, dispatcher: cachedAgent });
    clearTimeout(t);
    return true;
  } catch {
    return false;
  }
}

/**
 * Prévient l'admin qu'on tourne sans proxy — au plus une fois par heure, pour
 * que le signal reste lisible quand la panne dure.
 */
let derniereAlerteProxy = 0;
async function alerterProxyHorsService(code: string): Promise<void> {
  const maintenant = Date.now();
  if (maintenant - derniereAlerteProxy < 60 * 60 * 1000) return;
  derniereAlerteProxy = maintenant;
  try {
    const { notifyAdmins } = await import("@/lib/admin/notify");
    await notifyAdmins({
      title: "Proxy de versement hors service",
      message:
        `Le proxy à IP fixe ne répond plus (${code}). Les versements FeexPay sortent par une IP ` +
        "dynamique et seront refusés. Vérifier le forfait Fixie (quota mensuel), l'hôte et les identifiants.",
      link: "/admin/passerelles",
    });
  } catch {
    // L'alerte ne doit jamais faire échouer l'appel qu'elle accompagne.
  }
}

/** Erreur de versement dont on sait qu'AUCUNE requête n'a atteint le fournisseur. */
export class PayoutNeverSentError extends Error {
  readonly code: string;
  constructor(code: string, cause: unknown) {
    super(`Connexion impossible (${code}) — la requête n'a jamais atteint le fournisseur`);
    this.name = "PayoutNeverSentError";
    this.code = code;
    this.cause = cause;
  }
}

/** Extrait le code système d'une erreur undici, quel que soit son emballage. */
export function codeSysteme(err: unknown): string | null {
  let e: unknown = err;
  for (let i = 0; i < 4 && e && typeof e === "object"; i++) {
    const c = (e as { code?: unknown }).code;
    if (typeof c === "string") return c;
    e = (e as { cause?: unknown }).cause;
  }
  return null;
}

export async function payoutFetch(url: string, init?: RequestInit): Promise<Response> {
  const proxyUrl = process.env.PAYOUT_PROXY_URL?.trim();

  try {
    if (!proxyUrl) return await fetch(url, init);

    if (!cachedAgent || cachedUrl !== proxyUrl) {
      cachedAgent = buildAgent(proxyUrl);
      cachedUrl = proxyUrl;
    }
    // `undiciFetch`, PAS le fetch global : lui seul honore le `dispatcher`.
    const res = await undiciFetch(url, {
      ...(init as Parameters<typeof undiciFetch>[1]),
      dispatcher: cachedAgent,
    });
    return res as unknown as Response;
  } catch (err) {
    const code = codeSysteme(err) ?? "inconnu";
    const certain = CODES_JAMAIS_ENVOYE.has(code);

    // Code non concluant : on demande au proxy s'il est encore là. S'il ne
    // répond pas, la requête de versement ne peut pas l'avoir traversé.
    const jamaisParti =
      certain || (proxyUrl ? !(await proxyRepond(new URL(url).origin)) : false);

    if (!jamaisParti) {
      // Erreur AMBIGUË : on la laisse remonter telle quelle, et l'orchestrateur
      // refusera de basculer. Mieux vaut un retrait en attente qu'un versement
      // payé deux fois.
      throw err;
    }

    // ── Le proxy n'a pas répondu ────────────────────────────────────────────
    // TOUTES les passerelles de versement sortent par ce proxy : s'il tombe,
    // basculer de fournisseur ne sert à rien, les deux échouent pareil. Le
    // retrait resterait bloqué sans que rien ne dise pourquoi.
    //
    // La connexion n'ayant jamais abouti, aucune requête n'est partie : on peut
    // réessayer SANS le proxy en toute sécurité. Deux issues, toutes deux
    // meilleures qu'un blocage : soit le versement passe, soit le fournisseur
    // refuse proprement pour IP non autorisée — un refus explicite, sur lequel
    // l'orchestrateur sait basculer et que l'admin peut lire.
    if (!proxyUrl) throw new PayoutNeverSentError(code, err);
    // Ce repli SAUVE la requête mais MASQUE la panne : en direct, FeexPay va
    // refuser l'IP, et l'échec ressemblera à un refus opérateur ordinaire. On
    // le crie donc fort, et on prévient l'admin — un proxy mort ou un forfait
    // épuisé bloque TOUS les versements FeexPay tant que personne n'agit.
    console.error(
      `[payout] PROXY À IP FIXE HORS SERVICE (${code}) — repli en direct vers ${new URL(url).host}. ` +
        "Vérifier Fixie : forfait épuisé, identifiants ou hôte. FeexPay refusera l'IP directe.",
    );
    void alerterProxyHorsService(code);
    try {
      return await fetch(url, init);
    } catch (err2) {
      const code2 = codeSysteme(err2);
      if (code2 && CODES_JAMAIS_ENVOYE.has(code2)) {
        throw new PayoutNeverSentError(code2, err2);
      }
      throw err2;
    }
  }
}
