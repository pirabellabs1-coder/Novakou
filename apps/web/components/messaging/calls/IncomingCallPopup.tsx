"use client";

import { useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { CallUser, CallType } from "@/lib/webrtc/types";
import { playMissedCallSound } from "@/lib/webrtc/sounds";

interface IncomingCallPopupProps {
  caller: CallUser;
  callType: CallType;
  onAccept: () => void;
  onAcceptAudioOnly?: () => void;
  onReject: () => void;
  onMissed?: () => void;
}

export function IncomingCallPopup({
  caller,
  callType,
  onAccept,
  onAcceptAudioOnly,
  onReject,
  onMissed,
}: IncomingCallPopupProps) {
  const missedRef = useRef(false);

  const handleMissedCall = useCallback(() => {
    if (missedRef.current) return;
    missedRef.current = true;
    playMissedCallSound();
    onMissed?.();
    onReject();

    // Create a missed call notification
    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        create: true,
        title: "Appel manque",
        message: `${caller.name} a essaye de vous appeler (${callType === "video" ? "video" : "audio"})`,
        type: "message",
        link: "/dashboard/messages",
      }),
    }).catch(() => {});
  }, [caller.name, callType, onMissed, onReject]);

  // Auto-timeout after 30 seconds — trigger missed call
  useEffect(() => {
    const timeout = setTimeout(handleMissedCall, 30000);
    return () => clearTimeout(timeout);
  }, [handleMissedCall]);

  // Send browser notification if tab is not active
  useEffect(() => {
    if (document.hidden && "Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(
        callType === "video" ? "Appel video entrant" : "Appel audio entrant",
        {
          body: `${caller.name} vous appelle`,
          icon: "/favicon.ico",
          requireInteraction: true,
        }
      );
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      return () => notification.close();
    }
  }, [caller.name, callType]);

  const isVideo = callType === "video";

  return (
    <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top-2 duration-300">
      <div className="bg-background-dark border border-border-dark rounded-2xl p-5 shadow-2xl shadow-black/40 w-80">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className={cn(
            "material-symbols-outlined text-lg",
            isVideo ? "text-blue-400" : "text-emerald-400"
          )}>
            {isVideo ? "videocam" : "call"}
          </span>
          <span className="text-sm font-semibold text-white">
            {isVideo ? "Appel video entrant" : "Appel entrant"}
          </span>
        </div>

        {/* Caller info */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary animate-pulse">
            {caller.avatar}
          </div>
          <div>
            <p className="font-bold text-white">{caller.name}</p>
            <p className="text-xs text-slate-500 capitalize">{caller.role}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className={cn("flex gap-2", isVideo ? "flex-col" : "")}>
          {isVideo ? (
            <>
              {/* Video call: 3 options */}
              <button
                onClick={onAccept}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">videocam</span>
                Repondre en video
              </button>
              <div className="flex gap-2">
                {onAcceptAudioOnly && (
                  <button
                    onClick={onAcceptAudioOnly}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">call</span>
                    Audio
                  </button>
                )}
                <button
                  onClick={onReject}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">call_end</span>
                  Refuser
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Audio call: 2 options */}
              <button
                onClick={onAccept}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">call</span>
                Repondre
              </button>
              <button
                onClick={onReject}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">call_end</span>
                Refuser
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
