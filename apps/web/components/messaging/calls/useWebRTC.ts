"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useCallStore } from "@/store/call";
import type { CallType, CallUser, CallOffer } from "@/lib/webrtc/types";
import { ICE_SERVERS as staticIceServers, getFreshIceServers } from "@/lib/webrtc/types";
import {
  generateCallId,
  sendOffer,
  sendAnswer,
  sendIceCandidate,
  sendHangup,
  sendReject,
  registerSignalingHandlers,
  unregisterSignalingHandlers,
  setSignalingCallActive,
  pollServerNow,
} from "@/lib/webrtc/signaling";
import {
  getAudioStream,
  getAudioVideoStream,
  getScreenShareStream,
  stopStream,
  toggleTrack,
  replaceVideoTrack,
} from "@/lib/webrtc/media";
import {
  startRingtone,
  stopRingtone,
  startDialTone,
  stopDialTone,
  playConnectedSound,
  playEndCallSound,
  stopAllSounds,
} from "@/lib/webrtc/sounds";

interface UseWebRTCOptions {
  currentUser: CallUser;
  onCallEnded?: (callType: CallType, duration: number) => void;
  onCallMissed?: (fromUser: CallUser) => void;
}

export function useWebRTC({ currentUser, onCallEnded, onCallMissed }: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingOfferRef = useRef<CallOffer | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringtimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iceSentCountRef = useRef(0);
  const iceReceivedCountRef = useRef(0);
  const callStartTimeRef = useRef<number | null>(null);
  const answerProcessedRef = useRef(false);

  const {
    callState,
    callId,
    callType,
    remoteUser,
    conversationId,
    startCall,
    receiveCall,
    setCallState,
    setCallType,
    updateDuration,
    setConnectionQuality,
    endCall,
    resetCall,
  } = useCallStore();

  // Duration timer
  const startDurationTimer = useCallback(() => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    const startTime = Date.now();
    durationTimerRef.current = setInterval(() => {
      updateDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  }, [updateDuration]);

  const stopDurationTimer = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  // Clean up peer connection and streams
  const cleanupMedia = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    stopStream(localStreamRef.current);
    localStreamRef.current = null;
    setLocalStream(null);
    stopStream(screenStreamRef.current);
    screenStreamRef.current = null;
    originalVideoTrackRef.current = null;
    remoteStreamRef.current = null;
    setRemoteStream(null);
    pendingOfferRef.current = null;
    pendingCandidatesRef.current = [];
    answerProcessedRef.current = false;
  }, []);

  // Create RTCPeerConnection with handlers
  const createPeerConnection = useCallback((callIdForIce: string, remoteUserId: string, iceServers?: RTCIceServer[]) => {
    const servers = iceServers || staticIceServers;
    const hasTurn = servers.some((s) => String(s.urls).includes("turn:"));
    console.log(`[WebRTC] Creating PC with ${servers.length} ICE servers (TURN: ${hasTurn})`);
    // Force relay when TURN is available — guarantees connectivity across networks
    // Without this, host/srflx candidates fail and prevent relay fallback in time
    const pc = new RTCPeerConnection({
      iceServers: servers,
      iceTransportPolicy: hasTurn ? "relay" : "all",
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        iceSentCountRef.current++;
        console.log(`[WebRTC] ICE candidate gathered: type=${event.candidate.type}, protocol=${event.candidate.protocol}, address=${event.candidate.address}`);
        sendIceCandidate({
          callId: callIdForIce,
          from: currentUser.id,
          to: remoteUserId,
          candidate: event.candidate.toJSON(),
        });
      } else {
        console.log("[WebRTC] ICE gathering complete");
      }
    };

    // Receive remote tracks
    const remoteMs = new MediaStream();
    remoteStreamRef.current = remoteMs;

    pc.ontrack = (event) => {
      // Use track directly (more reliable than event.streams)
      const track = event.track;
      if (!remoteMs.getTracks().find((t) => t.id === track.id)) {
        remoteMs.addTrack(track);
      }
      console.log(`[WebRTC] ontrack: kind=${track.kind}, total=${remoteMs.getTracks().length}`);
      // Force React re-render with new MediaStream reference
      setRemoteStream(new MediaStream(remoteMs.getTracks()));
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`[WebRTC] connectionState: ${state}`);

      if (state === "connected") {
        const elapsed = callStartTimeRef.current ? Date.now() - callStartTimeRef.current : 0;
        console.log(`[WebRTC] CONNECTED in ${elapsed}ms (ICE: ${iceSentCountRef.current} sent, ${iceReceivedCountRef.current} recv)`);
        stopAllSounds();
        playConnectedSound();
        setCallState("connected");
        setConnectionQuality("good");
        startDurationTimer();
      } else if (state === "connecting") {
        setCallState("connecting");
      } else if (state === "disconnected") {
        setCallState("reconnecting");
        setConnectionQuality("poor");
      } else if (state === "failed") {
        console.warn(`[WebRTC] FAILED (ICE: ${iceSentCountRef.current} sent, ${iceReceivedCountRef.current} recv, iceState: ${pc.iceConnectionState})`);
        pc.restartIce();
        setTimeout(() => {
          if (pc.connectionState === "failed") {
            console.error("[WebRTC] Still failed after 15s — hanging up");
            handleHangup();
          }
        }, 15000);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] iceConnectionState: ${pc.iceConnectionState}`);
    };

    pc.onicegatheringstatechange = () => {
      console.log(`[WebRTC] iceGatheringState: ${pc.iceGatheringState}`);
    };

    pcRef.current = pc;
    return pc;
  }, [currentUser.id, setCallState, setConnectionQuality, startDurationTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flush ICE candidates that arrived before setRemoteDescription
  const flushPendingCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || pendingCandidatesRef.current.length === 0) return;
    console.log(`[WebRTC] Flushing ${pendingCandidatesRef.current.length} buffered ICE candidates`);
    for (const candidate of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        // Ignore — late/duplicate candidates
      }
    }
    pendingCandidatesRef.current = [];
  }, []);

  // ── Initiate a call ──
  const initiateCall = useCallback(async (
    targetUser: CallUser,
    type: CallType,
    convId: string,
  ) => {
    const newCallId = generateCallId();
    iceSentCountRef.current = 0;
    iceReceivedCountRef.current = 0;
    callStartTimeRef.current = Date.now();
    answerProcessedRef.current = false;

    startCall({
      callId: newCallId,
      callType: type,
      remoteUser: targetUser,
      conversationId: convId,
    });

    setSignalingCallActive(true);
    startDialTone();
    console.log(`[WebRTC] Initiating ${type} call: ${newCallId} → ${targetUser.id}`);

    try {
      // Fetch TURN credentials + get media in parallel
      const [freshIceServers, stream] = await Promise.all([
        getFreshIceServers(),
        type === "video" ? getAudioVideoStream() : getAudioStream(),
      ]);

      console.log(`[WebRTC] Got ${freshIceServers.length} ICE servers, ${stream.getTracks().length} local tracks`);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(newCallId, targetUser.id, freshIceServers);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("[WebRTC] Offer created and set as local description");

      sendOffer({
        callId: newCallId,
        callType: type,
        from: currentUser,
        to: targetUser.id,
        sdp: offer,
      });

      // Timeout: no answer after 30 seconds
      ringtimeoutRef.current = setTimeout(() => {
        if (useCallStore.getState().callState === "calling") {
          onCallMissed?.(targetUser);
          handleHangup();
        }
      }, 30000);
    } catch (err) {
      console.error("[WebRTC] Error initiating call:", err);
      stopAllSounds();
      cleanupMedia();
      resetCall();
    }
  }, [currentUser, startCall, createPeerConnection, cleanupMedia, resetCall, onCallMissed]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Answer an incoming call ──
  const answerCall = useCallback(async (answerAsType?: CallType) => {
    const state = useCallStore.getState();
    if (!state.callId || !state.remoteUser) {
      console.error("[WebRTC] answerCall: no callId or remoteUser");
      return;
    }
    const offer = pendingOfferRef.current;
    if (!offer) {
      console.error("[WebRTC] answerCall: no pending offer");
      return;
    }

    const type = answerAsType ?? state.callType;
    iceSentCountRef.current = 0;
    iceReceivedCountRef.current = 0;
    callStartTimeRef.current = Date.now();
    setCallState("connecting");
    if (answerAsType) setCallType(answerAsType);
    stopRingtone();
    if (ringtimeoutRef.current) clearTimeout(ringtimeoutRef.current);

    console.log(`[WebRTC] Answering call ${state.callId} as ${type}`);

    try {
      const [freshIceServers, stream] = await Promise.all([
        getFreshIceServers(),
        type === "video" ? getAudioVideoStream() : getAudioStream(),
      ]);

      console.log(`[WebRTC] Answer: ${freshIceServers.length} ICE servers, ${stream.getTracks().length} local tracks`);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(state.callId, state.remoteUser.id, freshIceServers);

      // Add local tracks BEFORE setting remote description
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
      console.log("[WebRTC] Local tracks added to PC");

      // Set remote description (the caller's offer) — use init object directly (modern API)
      await pc.setRemoteDescription(offer.sdp);
      console.log("[WebRTC] Remote description (offer) set OK");

      // Flush any ICE candidates that arrived before we set remote description
      await flushPendingCandidates();

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("[WebRTC] Answer created and set as local description");

      sendAnswer({
        callId: state.callId,
        from: currentUser.id,
        to: state.remoteUser.id,
        sdp: answer,
      });
      console.log("[WebRTC] Answer sent via signaling");
    } catch (err) {
      console.error("[WebRTC] Error answering call:", err);
      stopAllSounds();
      cleanupMedia();
      resetCall();
    }
  }, [currentUser.id, setCallState, setCallType, createPeerConnection, flushPendingCandidates, cleanupMedia, resetCall]);

  // Reject incoming call
  const rejectCall = useCallback((reason: "rejected" | "busy" = "rejected") => {
    const state = useCallStore.getState();
    if (!state.callId || !state.remoteUser) return;

    stopRingtone();
    if (ringtimeoutRef.current) clearTimeout(ringtimeoutRef.current);
    setSignalingCallActive(false);
    sendReject({
      callId: state.callId,
      from: currentUser.id,
      to: state.remoteUser.id,
      reason,
    });

    cleanupMedia();
    resetCall();
  }, [currentUser.id, cleanupMedia, resetCall]);

  // Hangup
  const handleHangup = useCallback(() => {
    const state = useCallStore.getState();
    console.log(`[WebRTC] Hangup: duration=${state.callDuration}s, ICE sent=${iceSentCountRef.current}, recv=${iceReceivedCountRef.current}`);
    if (ringtimeoutRef.current) clearTimeout(ringtimeoutRef.current);
    stopDurationTimer();
    stopAllSounds();
    playEndCallSound();

    if (state.callId && state.remoteUser) {
      sendHangup({
        callId: state.callId,
        from: currentUser.id,
        to: state.remoteUser.id,
        duration: state.callDuration,
      });
      onCallEnded?.(state.callType, state.callDuration);
    }

    setSignalingCallActive(false);
    cleanupMedia();
    endCall();
    setTimeout(() => resetCall(), 500);
  }, [currentUser.id, stopDurationTimer, cleanupMedia, endCall, resetCall, onCallEnded]);

  // Toggle mute
  const toggleMuteReal = useCallback(() => {
    toggleTrack(localStreamRef.current, "audio");
    useCallStore.getState().toggleMute();
  }, []);

  // Toggle camera
  const toggleCameraReal = useCallback(() => {
    toggleTrack(localStreamRef.current, "video");
    useCallStore.getState().toggleCamera();
  }, []);

  // Toggle screen share
  const toggleScreenShareReal = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const store = useCallStore.getState();

    if (!store.isScreenSharing) {
      try {
        const screenStream = await getScreenShareStream();
        screenStreamRef.current = screenStream;
        const currentVideoTrack = localStreamRef.current?.getVideoTracks()[0] ?? null;
        originalVideoTrackRef.current = currentVideoTrack;
        await replaceVideoTrack(pc, screenStream);
        if (localStreamRef.current && currentVideoTrack) localStreamRef.current.removeTrack(currentVideoTrack);
        const screenTrack = screenStream.getVideoTracks()[0];
        if (localStreamRef.current && screenTrack) localStreamRef.current.addTrack(screenTrack);
        setLocalStream(localStreamRef.current ? new MediaStream(localStreamRef.current.getTracks()) : null);
        screenTrack?.addEventListener("ended", () => toggleScreenShareReal());
        store.toggleScreenShare();
      } catch (err) {
        console.log("[WebRTC] Screen share cancelled:", err);
      }
    } else {
      stopStream(screenStreamRef.current);
      screenStreamRef.current = null;
      if (originalVideoTrackRef.current && localStreamRef.current) {
        const screenTrack = localStreamRef.current.getVideoTracks()[0];
        if (screenTrack) localStreamRef.current.removeTrack(screenTrack);
        localStreamRef.current.addTrack(originalVideoTrackRef.current);
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video" || !s.track);
        if (videoSender) await videoSender.replaceTrack(originalVideoTrackRef.current);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }
      originalVideoTrackRef.current = null;
      store.toggleScreenShare();
    }
  }, []);

  // ── Register signaling handlers ──
  useEffect(() => {
    registerSignalingHandlers({
      onOffer: (offer) => {
        const state = useCallStore.getState();
        if (state.callState !== "idle") {
          sendReject({ callId: offer.callId, from: currentUser.id, to: offer.from.id, reason: "busy" });
          return;
        }

        console.log(`[WebRTC] Offer received: ${offer.callId} from ${offer.from.name}`);
        pendingOfferRef.current = offer;
        answerProcessedRef.current = false;
        setSignalingCallActive(true);

        receiveCall({
          callId: offer.callId,
          callType: offer.callType,
          remoteUser: offer.from,
          conversationId: "",
        });
        startRingtone();

        ringtimeoutRef.current = setTimeout(() => {
          if (useCallStore.getState().callState === "ringing") {
            stopRingtone();
            onCallMissed?.(offer.from);
            cleanupMedia();
            resetCall();
          }
        }, 30000);
      },

      onAnswer: async (answer) => {
        // Strict dedup: only process once
        if (answerProcessedRef.current) return;
        const pc = pcRef.current;
        const state = useCallStore.getState();
        if (!pc || state.callState !== "calling") {
          console.log(`[WebRTC] onAnswer ignored: pc=${!!pc}, callState=${state.callState}`);
          return;
        }

        answerProcessedRef.current = true;
        console.log("[WebRTC] Answer received from signaling");

        try {
          setCallState("connecting");
          stopDialTone();

          // Modern API: pass init object directly (no RTCSessionDescription constructor)
          await pc.setRemoteDescription(answer.sdp);
          console.log("[WebRTC] Remote description (answer) set OK");

          await flushPendingCandidates();
          pollServerNow();
          console.log("[WebRTC] ICE exchange in progress...");
        } catch (e) {
          console.error("[WebRTC] Error processing answer:", e);
        }
      },

      onIceCandidate: async (ice) => {
        const pc = pcRef.current;
        if (!pc) return;
        iceReceivedCountRef.current++;

        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(ice.candidate);
          } catch {
            // Ignore late/duplicate
          }
        } else {
          pendingCandidatesRef.current.push(ice.candidate);
        }
      },

      onHangup: () => {
        handleHangup();
      },

      onReject: (reject) => {
        if (ringtimeoutRef.current) clearTimeout(ringtimeoutRef.current);
        stopAllSounds();
        setSignalingCallActive(false);
        if (reject.reason === "busy") console.log("[WebRTC] Remote user is busy");
        cleanupMedia();
        resetCall();
      },
    }, currentUser.id);

    return () => {
      unregisterSignalingHandlers();
      if (ringtimeoutRef.current) clearTimeout(ringtimeoutRef.current);
    };
  }, [currentUser.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDurationTimer();
      stopAllSounds();
      cleanupMedia();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    callState,
    callId,
    callType,
    remoteUser,
    conversationId,
    localStream,
    remoteStream,
    initiateCall,
    answerCall,
    rejectCall,
    hangup: handleHangup,
    toggleMuteReal,
    toggleCameraReal,
    toggleScreenShareReal,
  };
}
