// ============================================================
// Novakou — WebRTC Signaling via Postgres API + BroadcastChannel
// Postgres API: cross-browser/cross-device signaling (works on Vercel serverless)
// BroadcastChannel: same-browser instant fallback
// ============================================================

import type {
  CallOffer,
  CallAnswer,
  IceCandidate,
  CallHangup,
  CallReject,
} from "./types";

type SignalingEventHandler = {
  onOffer: (offer: CallOffer) => void;
  onAnswer: (answer: CallAnswer) => void;
  onIceCandidate: (candidate: IceCandidate) => void;
  onHangup: (hangup: CallHangup) => void;
  onReject: (reject: CallReject) => void;
};

interface SignalingMessage {
  type: "offer" | "answer" | "ice-candidate" | "hangup" | "reject";
  to: string;
  payload: CallOffer | CallAnswer | IceCandidate | CallHangup | CallReject;
}

const CHANNEL_NAME = "freelancehigh-signaling";
const POLL_INTERVAL_IDLE = 3000;   // 3s quand pas d'appel
const POLL_INTERVAL_ACTIVE = 200;  // 200ms pendant un appel (ICE candidates rapides)

let channel: BroadcastChannel | null = null;
let handlers: SignalingEventHandler | null = null;
let currentUserId: string | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let isInCall = false;
let _callIdCounter = 0;

export function generateCallId(): string {
  _callIdCounter++;
  return `call-${_callIdCounter}-${Date.now()}`;
}

// Mark as in-call to speed up polling
export function setSignalingCallActive(active: boolean) {
  if (isInCall === active) return;
  isInCall = active;

  // Restart polling with appropriate interval
  if (pollTimer) clearInterval(pollTimer);
  if (currentUserId) {
    const interval = active ? POLL_INTERVAL_ACTIVE : POLL_INTERVAL_IDLE;
    pollTimer = setInterval(pollServer, interval);
  }
}

function dispatchSignal(type: string, payload: unknown) {
  if (!handlers) return;

  switch (type) {
    case "offer":
      handlers.onOffer(payload as CallOffer);
      break;
    case "answer":
      handlers.onAnswer(payload as CallAnswer);
      break;
    case "ice-candidate":
      handlers.onIceCandidate(payload as IceCandidate);
      break;
    case "hangup":
      handlers.onHangup(payload as CallHangup);
      break;
    case "reject":
      handlers.onReject(payload as CallReject);
      break;
  }
}

// BroadcastChannel handler
function handleBroadcastMessage(event: MessageEvent<SignalingMessage>) {
  const msg = event.data;
  if (!handlers || !currentUserId) return;
  if (msg.to !== currentUserId) return;
  dispatchSignal(msg.type, msg.payload);
}

// Server polling (backed by Postgres — works across Vercel serverless instances)
async function pollServer() {
  if (!currentUserId) return;

  try {
    const res = await fetch(`/api/signaling?userId=${encodeURIComponent(currentUserId)}`);
    if (!res.ok) return;

    const data = await res.json();
    if (data.signals && Array.isArray(data.signals)) {
      for (const sig of data.signals) {
        dispatchSignal(sig.type, sig.payload);
      }
    }
  } catch {
    // Silent fail — network error during polling
  }
}

// Register handlers for incoming signaling events
export function registerSignalingHandlers(h: SignalingEventHandler, userId: string) {
  handlers = h;
  currentUserId = userId;

  // BroadcastChannel (same-browser fallback)
  if (typeof BroadcastChannel !== "undefined") {
    if (channel) {
      channel.removeEventListener("message", handleBroadcastMessage);
      channel.close();
    }
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener("message", handleBroadcastMessage);
  }

  // Start server polling (backed by Postgres, shared across serverless instances)
  if (pollTimer) clearInterval(pollTimer);
  const interval = isInCall ? POLL_INTERVAL_ACTIVE : POLL_INTERVAL_IDLE;
  pollTimer = setInterval(pollServer, interval);
  pollServer(); // Immediate first poll
}

export function unregisterSignalingHandlers() {
  handlers = null;
  currentUserId = null;
  isInCall = false;

  if (channel) {
    channel.removeEventListener("message", handleBroadcastMessage);
    channel.close();
    channel = null;
  }

  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// Send signal via server API (Postgres) + BroadcastChannel
async function post(msg: SignalingMessage) {
  // BroadcastChannel (same-browser)
  if (channel) {
    channel.postMessage(msg);
  }

  // Server API (Postgres-backed, cross-browser / cross-device)
  try {
    await fetch("/api/signaling", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: msg.type,
        from: currentUserId,
        to: msg.to,
        payload: msg.payload,
      }),
    });
  } catch {
    console.warn("[Signaling] Failed to send via server");
  }
}

export function sendOffer(offer: CallOffer) {
  setSignalingCallActive(true);
  post({ type: "offer", to: offer.to, payload: offer });
}

export function sendAnswer(answer: CallAnswer) {
  setSignalingCallActive(true);
  post({ type: "answer", to: answer.to, payload: answer });
}

export function sendIceCandidate(candidate: IceCandidate) {
  post({ type: "ice-candidate", to: candidate.to, payload: candidate });
}

export function sendHangup(hangup: CallHangup) {
  post({ type: "hangup", to: hangup.to, payload: hangup });
  setSignalingCallActive(false);
}

export function sendReject(reject: CallReject) {
  post({ type: "reject", to: reject.to, payload: reject });
  setSignalingCallActive(false);
}

// Trigger an immediate poll (e.g. after receiving answer to fetch buffered ICE candidates)
export function pollServerNow() {
  pollServer();
}
