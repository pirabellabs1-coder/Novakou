// ============================================================
// FreelanceHigh — Media Utilities
// Fonctions utilitaires pour getUserMedia, getDisplayMedia
// ============================================================

export interface MediaConstraints {
  audio?: boolean | MediaTrackConstraints;
  video?: boolean | MediaTrackConstraints;
}

// Get user media (microphone and/or camera)
export async function getLocalStream(constraints: MediaConstraints): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia(constraints);
}

// Get audio-only stream
export async function getAudioStream(): Promise<MediaStream> {
  return getLocalStream({ audio: true, video: false });
}

// Get audio + video stream
export async function getAudioVideoStream(
  videoQuality: "sd" | "hd" | "auto" = "auto"
): Promise<MediaStream> {
  const videoConstraints: MediaTrackConstraints = videoQuality === "hd"
    ? { width: { ideal: 1280 }, height: { ideal: 720 } }
    : videoQuality === "sd"
    ? { width: { ideal: 640 }, height: { ideal: 480 } }
    : { width: { ideal: 1280 }, height: { ideal: 720 } }; // auto = try HD

  return getLocalStream({ audio: true, video: videoConstraints });
}

// Get screen share stream
export async function getScreenShareStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getDisplayMedia({
    video: { cursor: "always" } as MediaTrackConstraints,
    audio: false,
  });
}

// Stop all tracks in a stream
export function stopStream(stream: MediaStream | null) {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

// Toggle a track (mute/unmute)
export function toggleTrack(stream: MediaStream | null, kind: "audio" | "video"): boolean {
  if (!stream) return false;
  const tracks = kind === "audio" ? stream.getAudioTracks() : stream.getVideoTracks();
  if (tracks.length === 0) return false;
  const newEnabled = !tracks[0].enabled;
  tracks.forEach((track) => {
    track.enabled = newEnabled;
  });
  return newEnabled;
}

// Replace video track (for camera switch or screen share)
export async function replaceVideoTrack(
  peerConnection: RTCPeerConnection,
  newStream: MediaStream
): Promise<void> {
  const newVideoTrack = newStream.getVideoTracks()[0];
  if (!newVideoTrack) return;

  const senders = peerConnection.getSenders();
  const videoSender = senders.find((s) => s.track?.kind === "video");

  if (videoSender) {
    await videoSender.replaceTrack(newVideoTrack);
  } else {
    peerConnection.addTrack(newVideoTrack, newStream);
  }
}

// Check TURN server connectivity (non-blocking probe)
export async function checkTurnConnectivity(iceServers: RTCIceServer[]): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers,
        iceTransportPolicy: "relay", // Only TURN, no STUN
      });

      const timeout = setTimeout(() => {
        pc.close();
        console.warn("[WebRTC] TURN server unreachable — STUN only");
        resolve(false);
      }, 3000);

      pc.onicecandidate = (event) => {
        if (event.candidate && event.candidate.type === "relay") {
          clearTimeout(timeout);
          pc.close();
          console.log("[WebRTC] TURN server OK");
          resolve(true);
        }
      };

      // Create a dummy data channel to trigger ICE gathering
      pc.createDataChannel("turn-test");
      pc.createOffer().then((offer) => pc.setLocalDescription(offer)).catch(() => {
        clearTimeout(timeout);
        pc.close();
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

// Enumerate available devices
export async function getAvailableDevices(): Promise<{
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
}> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return {
    audioInputs: devices.filter((d) => d.kind === "audioinput"),
    audioOutputs: devices.filter((d) => d.kind === "audiooutput"),
    videoInputs: devices.filter((d) => d.kind === "videoinput"),
  };
}

// Switch camera (front/back on mobile)
export async function switchCamera(
  currentStream: MediaStream,
  peerConnection: RTCPeerConnection
): Promise<MediaStream> {
  const currentTrack = currentStream.getVideoTracks()[0];
  const currentFacingMode = currentTrack?.getSettings()?.facingMode;

  const newFacingMode = currentFacingMode === "user" ? "environment" : "user";

  const newStream = await getLocalStream({
    audio: false,
    video: { facingMode: { exact: newFacingMode } },
  });

  await replaceVideoTrack(peerConnection, newStream);

  // Stop old track
  currentTrack?.stop();

  return newStream;
}
