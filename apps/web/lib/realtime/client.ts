"use client";

/**
 * Client Supabase Realtime côté navigateur (clé anon) — UNIQUEMENT pour
 * s'abonner aux canaux de broadcast applicatifs (messagerie, notifications,
 * présence). Aucune lecture/écriture de données : la donnée transite par les
 * routes API NextAuth. Singleton pour réutiliser une seule connexion WS.
 */

import { createClient, type SupabaseClient, type RealtimeChannel } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getRealtimeClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  if (!client) {
    client = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return client;
}

/**
 * S'abonne à un canal de conversation et reçoit les broadcasts.
 * Retourne une fonction de désabonnement (à appeler au cleanup React).
 *
 * @param topic    nom du canal, ex : `conv:{conversationId}`
 * @param handlers callbacks par type d'événement
 */
export function subscribeToChannel(
  topic: string,
  handlers: {
    onMessage?: (payload: unknown) => void;
    onTyping?: (payload: unknown) => void;
    onRead?: (payload: unknown) => void;
    onPresence?: (online: string[]) => void;
  },
  presenceKey?: string,
): () => void {
  const supa = getRealtimeClient();
  if (!supa) return () => {};

  const channel: RealtimeChannel = supa.channel(topic, {
    config: { broadcast: { self: false }, presence: { key: presenceKey ?? "" } },
  });

  if (handlers.onMessage)
    channel.on("broadcast", { event: "new-message" }, ({ payload }) => handlers.onMessage!(payload));
  if (handlers.onTyping)
    channel.on("broadcast", { event: "typing" }, ({ payload }) => handlers.onTyping!(payload));
  if (handlers.onRead)
    channel.on("broadcast", { event: "message-read" }, ({ payload }) => handlers.onRead!(payload));

  if (handlers.onPresence && presenceKey) {
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      handlers.onPresence!(Object.keys(state));
    });
  }

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED" && presenceKey) {
      channel.track({ online_at: new Date().toISOString() });
    }
  });

  return () => {
    try {
      supa.removeChannel(channel);
    } catch {
      /* ignore */
    }
  };
}

/** Envoie un événement de frappe (typing) sur le canal d'une conversation. */
export function sendTyping(topic: string, payload: { userId: string; name?: string }): void {
  const supa = getRealtimeClient();
  if (!supa) return;
  const channel = supa.channel(topic);
  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      channel.send({ type: "broadcast", event: "typing", payload });
    }
  });
}
