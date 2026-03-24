"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { useCallStore } from "@/store/call";
import type { CallType, CallUser, CallOffer } from "@/lib/webrtc/types";
import { ICE_SERVERS as iceServers } from "@/lib/webrtc/types";
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
  checkTurnConnectivity,
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
  }, []);

  // Create RTCPeerConnection with handlers
  const createPeerConnection = useCallback((callIdForIce: string, remoteUserId: string) => {
    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        iceSentCountRef.current++;
        sendIceCandidate({
          callId: callIdForIce,
          from: currentUser.id,
          to: remoteUserId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Receive remote tracks
    const remoteMs = new MediaStream();
    remoteStreamRef.current = remoteMs;

    pc.ontrack = (event) => {
      // Some browsers may not associate a stream with the track — use track directly as fallback
      const tracks = event.streams[0]?.getTracks() ?? [event.track];
      for (const track of tracks) {
        // Avoid duplicate tracks
        if (!remoteMs.getTracks().find((t) => t.id === track.id)) {
          remoteMs.addTrack(track);
        }
      }
      console.log(`[WebRTC] ontrack: kind=${event.track.kind}, total tracks=${remoteMs.getTracks().length}`);
      // Force re-render with a new MediaStream object so React detects the change
      setRemoteStream(new MediaStream(remoteMs.getTracks()));
    };

    pc.onconnectionstatechange = () => {
      const connState = pc.connectionState;
      console.log("[WebRTC] Connection state:", connState);

      if (connState === "connected") {
        const elapsed = callStartTimeRef.current ? Date.now() - callStartTimeRef.current : 0;
        console.log(`[WebRTC] Connection established in ${elapsed}ms (ICE sent: ${iceSentCountRef.current}, received: ${iceReceivedCountRef.current})`);
        stopAllSounds();
        playConnectedSound();
        setCallState("connected");
        setConnectionQuality("good");
        startDurationTimer();
      } else if (connState === "connecting") {
        setCallState("connecting");
      } else if (connState === "disconnected") {
        setCallState("reconnecting");
        setConnectionQuality("poor");
      } else if (connState === "failed") {
        // Retry: restart ICE
        console.warn(`[WebRTC] Connection FAILED — ICE sent: ${iceSentCountRef.current}, received: ${iceReceivedCountRef.current}, iceState: ${pc.iceConnectionState}`);
        pc.restartIce();
        // If still failed after 15s, hangup
        setTimeout(() => {
          if (pc.connectionState === "failed") {
            console.error(`[WebRTC] Connection FAILED after 15s — state: ${pc.connectionState}, iceState: ${pc.iceConnectionState}`);
            handleHangup();
          }
        }, 15000);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE state:", pc.iceConnectionState);
    };

    pcRef.current = pc;
    return pc;
  }, [currentUser.id, setCallState, setConnectionQuality, startDurationTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flush ICE candidates that arrived before setRemoteDescription
  const flushPendingCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    for (const candidate of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn("[WebRTC] Error adding buffered ICE candidate:", e);
      }
    }
    pendingCandidatesRef.current = [];
  }, []);

  // Initiate a call
  const initiateCall = useCallback(async (
    targetUser: CallUser,
    type: CallType,
    convId: string,
  ) => {
    const newCallId = generateCallId();
    iceSentCountRef.current = 0;
    iceReceivedCountRef.current = 0;
    callStartTimeRef.current = Date.now();

    startCall({
      callId: newCallId,
      callType: type,
      remoteUser: targetUser,
      conversationId: convId,
    });

    setSignalingCallActive(true);
    startDialTone();
    console.log(`[WebRTC] Call initiated: ${newCallId}, type: ${type}`);

    // Non-blocking TURN check
    checkTurnConnectivity(iceServers).catch(() => {});

    try {
      // Get local media
      const stream = type === "video"
        ? await getAudioVideoStream()
        : await getAudioStream();
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Create peer connection
      const pc = createPeerConnection(newCallId, targetUser.id);

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

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

  // Answer an incoming call
  const answerCall = useCallback(async (answerAsType?: CallType) => {
    const state = useCallStore.getState();
    if (!state.callId || !state.remoteUser) return;
    const offer = pendingOfferRef.current;
    if (!offer) return;

    const type = answerAsType ?? state.callType;
    iceSentCountRef.current = 0;
    iceReceivedCountRef.current = 0;
    callStartTimeRef.current = Date.now();
    setCallState("connecting");
    if (answerAsType) setCallType(answerAsType);
    stopRingtone();

    try {
      // Get local media based on answer type
      const stream = type === "video"
        ? await getAudioVideoStream()
        : await getAudioStream();
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Create peer connection
      const pc = createPeerConnection(state.callId, state.remoteUser.id);

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Set remote description from the stored offer
      await pc.setRemoteDescription(new RTCSessionDescription(offer.sdp));

      // Flush buffered ICE candidates
      await flushPendingCandidates();

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendAnswer({
        callId: state.callId,
        from: currentUser.id,
        to: state.remoteUser.id,
        sdp: answer,
      });
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
    console.log(`[WebRTC] Call ended: duration ${state.callDuration}s (ICE sent: ${iceSentCountRef.current}, received: ${iceReceivedCountRef.current})`);
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

  // Toggle mute (real track control)
  const toggleMuteReal = useCallback(() => {
    toggleTrack(localStreamRef.current, "audio");
    useCallStore.getState().toggleMute();
  }, []);

  // Toggle camera (real track control)
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
      // Start screen sharing
      try {
        const screenStream = await getScreenShareStream();
        screenStreamRef.current = screenStream;

        // Save original camera track
        const currentVideoTrack = localStreamRef.current?.getVideoTracks()[0] ?? null;
        originalVideoTrackRef.current = currentVideoTrack;

        // Replace video track on peer connection
        await replaceVideoTrack(pc, screenStream);

        // Update local stream for preview
        if (localStreamRef.current && currentVideoTrack) {
          localStreamRef.current.removeTrack(currentVideoTrack);
        }
        const screenTrack = screenStream.getVideoTracks()[0];
        if (localStreamRef.current && screenTrack) {
          localStreamRef.current.addTrack(screenTrack);
        }
        setLocalStream(localStreamRef.current ? new MediaStream(localStreamRef.current.getTracks()) : null);

        // Listen for browser "Stop sharing" button
        screenTrack?.addEventListener("ended", () => {
          toggleScreenShareReal();
        });

        store.toggleScreenShare();
      } catch (err) {
        console.log("[WebRTC] Screen share cancelled or failed:", err);
      }
    } else {
      // Stop screen sharing — restore camera
      stopStream(screenStreamRef.current);
      screenStreamRef.current = null;

      if (originalVideoTrackRef.current && localStreamRef.current) {
        // Remove screen track
        const screenTrack = localStreamRef.current.getVideoTracks()[0];
        if (screenTrack) localStreamRef.current.removeTrack(screenTrack);

        // Re-add camera track
        localStreamRef.current.addTrack(originalVideoTrackRef.current);

        // Replace on peer connection
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video" || !s.track);
        if (videoSender) {
          await videoSender.replaceTrack(originalVideoTrackRef.current);
        }

        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }
      originalVideoTrackRef.current = null;
      store.toggleScreenShare();
    }
  }, []);

  // Register signaling handlers
  useEffect(() => {
    registerSignalingHandlers({
      onOffer: (offer) => {
        const state = useCallStore.getState();
        // If already in a call, send busy
        if (state.callState !== "idle") {
          sendReject({
            callId: offer.callId,
            from: currentUser.id,
            to: offer.from.id,
            reason: "busy",
          });
          return;
        }

        // Store the SDP offer for when user answers
        pendingOfferRef.current = offer;
        setSignalingCallActive(true); // Speed up polling for ICE candidates

        receiveCall({
          callId: offer.callId,
          callType: offer.callType,
          remoteUser: offer.from,
          conversationId: "",
        });

        startRingtone();

        // Auto-miss after 30 seconds
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
        const pc = pcRef.current;
        const state = useCallStore.getState();
        // Accept answer if we're calling OR connecting (don't be too strict)
        if (!pc || (state.callState !== "calling" && state.callState !== "connecting")) return;

        try {
          // Transition caller to "connecting" state
          setCallState("connecting");
          stopDialTone();

          await pc.setRemoteDescription(new RTCSessionDescription(answer.sdp));
          await flushPendingCandidates();
          // Immediately poll for any buffered ICE candidates
          pollServerNow();
          console.log("[WebRTC] Remote description set, waiting for ICE connection...");
        } catch (e) {
          console.error("[WebRTC] Error setting remote description:", e);
        }
      },

      onIceCandidate: async (ice) => {
        const pc = pcRef.current;
        if (!pc) return;
        iceReceivedCountRef.current++;

        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(ice.candidate));
          } catch (e) {
            console.warn("[WebRTC] Error adding ICE candidate:", e);
          }
        } else {
          // Buffer until remote description is set
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

        if (reject.reason === "busy") {
          console.log("[WebRTC] Remote user is busy");
        }

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
