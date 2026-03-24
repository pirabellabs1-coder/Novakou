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

interface VideoCallModalProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onHangup: () => void;
  onToggleScreenShare: () => void;
  onSwitchCamera?: () => void;
  onToggleMute?: () => void;
  onToggleCamera?: () => void;
}

export function VideoCallModal({
  localStream,
  remoteStream,
  onHangup,
  onToggleScreenShare,
  onSwitchCamera,
  onToggleMute,
  onToggleCamera,
}: VideoCallModalProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
    callState,
    remoteUser,
    isMuted,
    isCameraOn,
    isSpeakerOn,
    isScreenSharing,
    callDuration,
    connectionQuality,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
    toggleScreenShare,
  } = useCallStore();

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && remoteStream.getTracks().length > 0) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {
        setTimeout(() => remoteVideoRef.current?.play().catch(() => {}), 500);
      });
    }
  }, [remoteStream]);

  if (!remoteUser || callState === "idle") return null;

  const isConnected = callState === "connected";

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {remoteUser.avatar}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{remoteUser.name}</p>
              <p className="text-xs text-slate-400 capitalize">{remoteUser.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isConnected && (
              <span className="text-sm font-mono text-emerald-400">
                {formatCallTimer(callDuration)}
              </span>
            )}
            {!isConnected && (
              <span className="text-sm text-slate-400">
                {callState === "calling" && "Appel en cours..."}
                {callState === "connecting" && "Connexion..."}
                {callState === "reconnecting" && "Reconnexion..."}
                {callState === "ringing" && "Appel entrant..."}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Remote video (full screen) */}
      <div className="flex-1 relative">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-900">
            <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary">
              {remoteUser.avatar}
            </div>
          </div>
        )}

        {/* Local video (PiP) */}
        <div className="absolute bottom-24 right-4 w-32 h-44 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl bg-slate-800">
          {localStream && isCameraOn ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              style={{ transform: "scaleX(-1)" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-slate-500">
                videocam_off
              </span>
            </div>
          )}
        </div>

        {/* Switch camera button (mobile) */}
        {onSwitchCamera && isCameraOn && (
          <button
            onClick={onSwitchCamera}
            className="absolute bottom-24 right-40 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center"
            title="Changer de camera"
          >
            <span className="material-symbols-outlined text-lg">cameraswitch</span>
          </button>
        )}
      </div>

      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-12 pb-8 px-4">
        <CallControls
          isMuted={isMuted}
          isCameraOn={isCameraOn}
          isSpeakerOn={isSpeakerOn}
          isScreenSharing={isScreenSharing}
          showCameraButton={true}
          showScreenShareButton={true}
          connectionQuality={connectionQuality}
          onToggleMute={onToggleMute ?? toggleMute}
          onToggleCamera={onToggleCamera ?? toggleCamera}
          onToggleSpeaker={toggleSpeaker}
          onToggleScreenShare={onToggleScreenShare}
          onHangup={onHangup}
        />
      </div>
    </div>
  );
}
