/**
 * Diffusion temps réel côté serveur via l'API REST Broadcast de Supabase
 * Realtime — compatible serverless (un simple appel HTTP, aucune connexion
 * WebSocket persistante côté serveur).
 *
 * Pourquoi cette approche (et pas Postgres CDC + RLS) :
 * Novakou utilise NextAuth, pas Supabase Auth. Les clients Realtime
 * (navigateur, clé anon) n'ont donc PAS de contexte d'authentification
 * Supabase → les policies RLS basées sur `auth.uid()` ne peuvent pas
 * filtrer. On émet donc des « broadcasts » applicatifs : le serveur,
 * APRÈS avoir vérifié l'autorisation et persisté en base, pousse
 * l'événement sur un canal nommé par l'ID de conversation (CUID
 * non-devinable). Les participants — seuls à connaître l'ID — s'abonnent.
 *
 * Durcissement prévu (Phase 1.1) : canaux privés autorisés par JWT
 * Supabase signé côté serveur. Pour l'instant, l'ID CUID + la
 * vérification d'autorisation côté API suffisent pour une v1 sûre.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type BroadcastEvent =
  | "new-message"
  | "message-read"
  | "typing"
  | "notification";

/**
 * Pousse un événement sur un canal Supabase Realtime.
 * Ne jette jamais : la messagerie reste fonctionnelle via le polling de
 * secours même si le broadcast échoue (best-effort).
 *
 * @param topic   nom du canal (ex : `conv:{conversationId}` ou `user:{userId}`)
 * @param event   type d'événement applicatif
 * @param payload données arbitraires sérialisables
 */
export async function broadcast(
  topic: string,
  event: BroadcastEvent,
  payload: unknown,
): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        messages: [{ topic, event, payload, private: false }],
      }),
      // Ne bloque pas la réponse API au-delà du raisonnable.
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // best-effort — le polling prend le relais
  }
}
