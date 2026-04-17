// ============================================================
// Novakou — WebRTC Types
// Types partagés pour le signaling et les appels
// ============================================================

export type CallType = "audio" | "video";

export type CallState =
  | "idle"
  | "calling"      // Appelant : en attente de réponse
  | "ringing"      // Appelé : appel entrant
  | "connecting"   // Connexion WebRTC en cours
  | "connected"    // Appel actif
  | "reconnecting" // Reconnexion après coupure
  | "ended";       // Appel terminé

export interface CallUser {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

export interface CallOffer {
  callId: string;
  callType: CallType;
  from: CallUser;
  to: string; // userId destinataire
  sdp: RTCSessionDescriptionInit;
}

export interface CallAnswer {
  callId: string;
  from: string;
  to: string;
  sdp: RTCSessionDescriptionInit;
}

export interface IceCandidate {
  callId: string;
  from: string;
  to: string;
  candidate: RTCIceCandidateInit;
}

export interface CallHangup {
  callId: string;
  from: string;
  to: string;
  duration: number; // secondes
}

export interface CallReject {
  callId: string;
  from: string;
  to: string;
  reason: "rejected" | "busy" | "offline" | "timeout";
}

// STUN servers (always free, always work)
const STUN_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];

// Static TURN from env vars (set on Vercel)
function getStaticTurnServers(): RTCIceServer[] {
  if (typeof window === "undefined") return [];
  const turnUrl = (process.env.NEXT_PUBLIC_TURN_URL || "").trim();
  const turnUser = (process.env.NEXT_PUBLIC_TURN_USERNAME || "").trim();
  const turnCred = (process.env.NEXT_PUBLIC_TURN_CREDENTIAL || "").trim();
  if (!turnUrl || !turnUser || !turnCred) return [];
  return turnUrl.split(",").map((url) => ({
    urls: url.trim(),
    username: turnUser,
    credential: turnCred,
  }));
}

// Default ICE servers (STUN + static TURN from env)
export const ICE_SERVERS: RTCIceServer[] = [
  ...STUN_SERVERS,
  ...getStaticTurnServers(),
];

// Fetch fresh TURN credentials from our API (metered.ca REST API)
// Call this before initiating/answering a call for guaranteed-fresh credentials
let _cachedDynamicServers: RTCIceServer[] | null = null;
let _cachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export async function getFreshIceServers(): Promise<RTCIceServer[]> {
  // Return cache if fresh
  if (_cachedDynamicServers && Date.now() - _cachedAt < CACHE_TTL) {
    return [...STUN_SERVERS, ..._cachedDynamicServers];
  }

  try {
    const res = await fetch("/api/turn-credentials");
    if (res.ok) {
      const data = await res.json();
      if (data.iceServers && Array.isArray(data.iceServers) && data.iceServers.length > 0) {
        _cachedDynamicServers = data.iceServers;
        _cachedAt = Date.now();
        console.log(`[WebRTC] Fresh TURN credentials: ${data.iceServers.length} servers`);
        return [...STUN_SERVERS, ...data.iceServers];
      }
    }
  } catch {
    console.warn("[WebRTC] Failed to fetch dynamic TURN credentials, using static");
  }

  // Fallback to static
  return ICE_SERVERS;
}
