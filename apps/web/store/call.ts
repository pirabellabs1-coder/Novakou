// ============================================================
// Novakou — Call Store
// Store Zustand pour l'état d'appel en cours
// ============================================================

import { create } from "zustand";
import type { CallState, CallType, CallUser } from "@/lib/webrtc/types";

interface CallStoreState {
  // État de l'appel
  callState: CallState;
  callId: string | null;
  callType: CallType;
  conversationId: string | null;

  // Utilisateur distant
  remoteUser: CallUser | null;

  // Contrôles
  isMuted: boolean;
  isCameraOn: boolean;
  isSpeakerOn: boolean;
  isScreenSharing: boolean;

  // Durée
  callStartTime: number | null;
  callDuration: number;

  // Qualité réseau
  connectionQuality: "excellent" | "good" | "fair" | "poor" | "unknown";

  // Actions
  startCall: (params: {
    callId: string;
    callType: CallType;
    remoteUser: CallUser;
    conversationId: string;
  }) => void;
  receiveCall: (params: {
    callId: string;
    callType: CallType;
    remoteUser: CallUser;
    conversationId: string;
  }) => void;
  setCallState: (state: CallState) => void;
  setCallType: (type: CallType) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleSpeaker: () => void;
  toggleScreenShare: () => void;
  updateDuration: (duration: number) => void;
  setConnectionQuality: (quality: CallStoreState["connectionQuality"]) => void;
  endCall: () => void;
  resetCall: () => void;
}

export const useCallStore = create<CallStoreState>()((set) => ({
  callState: "idle",
  callId: null,
  callType: "audio",
  conversationId: null,
  remoteUser: null,
  isMuted: false,
  isCameraOn: false,
  isSpeakerOn: false,
  isScreenSharing: false,
  callStartTime: null,
  callDuration: 0,
  connectionQuality: "unknown",

  startCall: ({ callId, callType, remoteUser, conversationId }) =>
    set({
      callState: "calling",
      callId,
      callType,
      remoteUser,
      conversationId,
      isMuted: false,
      isCameraOn: callType === "video",
      isSpeakerOn: false,
      isScreenSharing: false,
      callStartTime: null,
      callDuration: 0,
      connectionQuality: "unknown",
    }),

  receiveCall: ({ callId, callType, remoteUser, conversationId }) =>
    set({
      callState: "ringing",
      callId,
      callType,
      remoteUser,
      conversationId,
      isMuted: false,
      isCameraOn: callType === "video",
      isSpeakerOn: false,
      isScreenSharing: false,
      callStartTime: null,
      callDuration: 0,
      connectionQuality: "unknown",
    }),

  setCallState: (callState) =>
    set((s) => ({
      callState,
      callStartTime: callState === "connected" ? Date.now() : s.callStartTime,
    })),

  setCallType: (callType) => set({ callType }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleCamera: () => set((s) => ({ isCameraOn: !s.isCameraOn })),
  toggleSpeaker: () => set((s) => ({ isSpeakerOn: !s.isSpeakerOn })),
  toggleScreenShare: () => set((s) => ({ isScreenSharing: !s.isScreenSharing })),
  updateDuration: (callDuration) => set({ callDuration }),
  setConnectionQuality: (connectionQuality) => set({ connectionQuality }),

  endCall: () =>
    set({
      callState: "ended",
    }),

  resetCall: () =>
    set({
      callState: "idle",
      callId: null,
      callType: "audio",
      conversationId: null,
      remoteUser: null,
      isMuted: false,
      isCameraOn: false,
      isSpeakerOn: false,
      isScreenSharing: false,
      callStartTime: null,
      callDuration: 0,
      connectionQuality: "unknown",
    }),
}));
