"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useCallStore } from "@/store/call";
import { CallControls } from "./CallControls";

function formatCallTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const STATE_LABELS: Record<string, string> = {
  calling: "Appel en cours...",
  ringing: "Appel entrant...",
  connecting: "Connexion...",
  connected: "",
  reconnecting: "Reconnexion...",
  ended: "Appel termine",
};

interface AudioCallModalProps {
  remoteStream: MediaStream | null;
  onHangup: () => void;
  onSwitchToVideo?: () => void;
  onToggleMute?: () => void;
}

export function AudioCallModal({ remoteStream, onHangup, onSwitchToVideo, onToggleMute }: AudioCallModalProps) {
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const {
    callState,
    remoteUser,
    isMuted,
    isSpeakerOn,
    isCameraOn,
    callDuration,
    connectionQuality,
    toggleMute,
    toggleSpeaker,
    toggleCamera,
    toggleScreenShare,
    isScreenSharing,
  } = useCallStore();

  // Attach remote audio stream to the hidden <audio> element
  useEffect(() => {
    const audioEl = remoteAudioRef.current;
    if (!audioEl) return;

    if (remoteStream) {
      audioEl.srcObject = remoteStream;
      audioEl.play().catch((err) => {
        console.warn("[AudioCallModal] Autoplay blocked, retrying on user gesture:", err);
      });
    } else {
      audioEl.srcObject = null;
    }
  }, [remoteStream]);

  if (!remoteUser || callState === "idle") return null;

  const statusLabel = STATE_LABELS[callState] || "";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      {/* Hidden audio element for remote stream playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="bg-background-dark border border-border-dark rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold mb-4",
            callState === "connected" ? "bg-emerald-500/20 text-emerald-400" : "bg-primary/20 text-primary",
            callState === "calling" && "animate-pulse",
          )}>
            {remoteUser.avatar}
          </div>
          <h3 className="text-lg font-bold text-white">{remoteUser.name}</h3>
          <p className="text-xs text-slate-500 capitalize">{remoteUser.role}</p>

          {/* Status / Timer */}
          <div className="mt-3">
            {callState === "connected" ? (
              <p className="text-2xl font-mono text-emerald-400">
                {formatCallTimer(callDuration)}
              </p>
            ) : (
              <p className={cn(
                "text-sm",
                callState === "reconnecting" ? "text-amber-400" : "text-slate-400"
              )}>
                {statusLabel}
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <CallControls
          isMuted={isMuted}
          isCameraOn={isCameraOn}
          isSpeakerOn={isSpeakerOn}
          isScreenSharing={isScreenSharing}
          showCameraButton={true}
          showScreenShareButton={false}
          connectionQuality={connectionQuality}
          onToggleMute={onToggleMute ?? toggleMute}
          onToggleCamera={() => {
            if (onSwitchToVideo) onSwitchToVideo();
          }}
          onToggleSpeaker={toggleSpeaker}
          onToggleScreenShare={toggleScreenShare}
          onHangup={onHangup}
        />
      </div>
    </div>
  );
}
