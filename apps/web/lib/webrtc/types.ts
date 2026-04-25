/**
 * WebRTC types stub — kept for messaging components that reference these types.
 */

export type CallType = "audio" | "video";

export interface CallUser {
  id: string;
  name: string;
  image?: string | null;
}

export interface CallOffer {
  type: CallType;
  from: CallUser;
  sdp?: string;
}

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

export async function getFreshIceServers(): Promise<RTCIceServer[]> {
  try {
    const res = await fetch("/api/turn-credentials");
    if (!res.ok) return ICE_SERVERS;
    const data = await res.json();
    return data.iceServers ?? ICE_SERVERS;
  } catch {
    return ICE_SERVERS;
  }
}
