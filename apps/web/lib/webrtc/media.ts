/**
 * WebRTC media utilities stub — kept for messaging call components.
 */

export async function getAvailableDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      audioInputs: devices.filter(d => d.kind === "audioinput"),
      audioOutputs: devices.filter(d => d.kind === "audiooutput"),
      videoInputs: devices.filter(d => d.kind === "videoinput"),
    };
  } catch {
    return { audioInputs: [], audioOutputs: [], videoInputs: [] };
  }
}

export async function getUserMedia(constraints?: MediaStreamConstraints) {
  return navigator.mediaDevices.getUserMedia(constraints ?? { audio: true, video: false });
}

export function stopStream(stream: MediaStream | null) {
  if (stream) stream.getTracks().forEach(t => t.stop());
}
