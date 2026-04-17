/**
 * safe-fetch — helpers pour parser les réponses fetch sans crash "Unexpected token '<'".
 *
 * Pattern : une API peut renvoyer du HTML (page 404 Next.js, page login redirigée,
 * crash serveur non catché). `await res.json()` lève alors un SyntaxError.
 *
 * Utilisation :
 *   const res = await fetch("/api/...");
 *   const { ok, data, error } = await safeJson<MyType>(res);
 */

export type SafeJsonResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
};

/**
 * Lit la réponse de manière défensive :
 * - si `content-type` contient "application/json" → tente `res.json()` avec try/catch
 * - sinon → construit un message d'erreur selon le status HTTP (401/404/500…)
 *
 * Ne lève jamais — renvoie toujours un résultat exploitable par le client.
 */
export async function safeJson<T = unknown>(res: Response): Promise<SafeJsonResult<T>> {
  const contentType = res.headers.get("content-type") ?? "";
  let data: T | null = null;
  let error: string | null = null;

  if (contentType.includes("application/json")) {
    try {
      const parsed = (await res.json()) as T & { error?: string };
      // Les routes Next renvoient { data, error }. On transporte tel quel.
      data = parsed;
      if (parsed && typeof parsed === "object" && "error" in parsed && typeof parsed.error === "string") {
        error = parsed.error;
      }
    } catch {
      error = "Réponse serveur invalide";
    }
  } else {
    error = statusToMessage(res.status);
  }

  if (!res.ok && !error) {
    error = statusToMessage(res.status);
  }

  return { ok: res.ok && !error, status: res.status, data, error };
}

function statusToMessage(status: number): string {
  if (status === 401) return "Vous devez être connecté.";
  if (status === 403) return "Accès refusé.";
  if (status === 404) return "Ressource introuvable. Rechargez la page.";
  if (status === 429) return "Trop de requêtes. Réessayez dans un instant.";
  if (status >= 500) return "Erreur serveur. Réessayez plus tard.";
  return `Erreur HTTP ${status}`;
}

/**
 * Wrapper fetch + safeJson en un seul appel.
 */
export async function safeFetch<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeJsonResult<T>> {
  try {
    const res = await fetch(input, init);
    return safeJson<T>(res);
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err instanceof Error ? err.message : "Erreur réseau",
    };
  }
}
