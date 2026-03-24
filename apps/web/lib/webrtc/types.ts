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
export const ICE_SERVERS: RTCIceServer[] = [
  // STUN publics Google (gratuits, fiables)
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
  // TURN servers (metered.ca free tier) — UDP + TCP + TLS
  {
    urls: "turn:a.relay.metered.ca:80",
    username: "e8dd65a92f3c090f4be6e4c0",
    credential: "SoELzOhU5MEhH97+",
  },
  {
    urls: "turn:a.relay.metered.ca:443",
    username: "e8dd65a92f3c090f4be6e4c0",
    credential: "SoELzOhU5MEhH97+",
  },
  {
    urls: "turn:a.relay.metered.ca:443?transport=tcp",
    username: "e8dd65a92f3c090f4be6e4c0",
    credential: "SoELzOhU5MEhH97+",
  },
  // TURN fallback (openrelay — free, no auth)
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];
