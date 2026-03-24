// ============================================================
// FreelanceHigh — WebRTC Types
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

// Configuration STUN/TURN — TURN nécessaire pour traverser les NAT symétriques
// TURN credentials are read from env vars so they can be updated without code change.
// Set NEXT_PUBLIC_TURN_URL, NEXT_PUBLIC_TURN_USERNAME, NEXT_PUBLIC_TURN_CREDENTIAL on Vercel.
function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    // STUN publics Google (gratuits, fiables)
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ];

  // Dynamic TURN from env vars (preferred — always fresh)
  const turnUrl = typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_TURN_URL || "").trim()
    : "";
  const turnUser = typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_TURN_USERNAME || "").trim()
    : "";
  const turnCred = typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_TURN_CREDENTIAL || "").trim()
    : "";

  if (turnUrl && turnUser && turnCred) {
    // Support comma-separated URLs (e.g. "turn:host:80,turn:host:443")
    const urls = turnUrl.split(",").map((u) => u.trim()).filter(Boolean);
    for (const url of urls) {
      servers.push({ urls: url, username: turnUser, credential: turnCred });
    }
  } else {
    // Fallback: hardcoded metered.ca (update these if expired)
    const fallbackUser = "e8dd65a92f3c090f4be6e4c0";
    const fallbackCred = "SoELzOhU5MEhH97+";
    servers.push(
      { urls: "turn:a.relay.metered.ca:80", username: fallbackUser, credential: fallbackCred },
      { urls: "turn:a.relay.metered.ca:443", username: fallbackUser, credential: fallbackCred },
      { urls: "turn:a.relay.metered.ca:443?transport=tcp", username: fallbackUser, credential: fallbackCred },
    );
  }

  return servers;
}

export const ICE_SERVERS: RTCIceServer[] = buildIceServers();
