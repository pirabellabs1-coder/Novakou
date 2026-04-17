// ============================================================
// Novakou — Call Sound Manager
// Gestion des sons d'appel via Web Audio API
// Sons generes programmatiquement (pas de fichiers audio)
// ============================================================

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Play a tone with given frequency and duration
function playTone(frequency: number, durationMs: number, volume: number = 0.1) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // Audio not supported
  }
}

// Ringtone: repeating two-tone pattern
let ringtoneInterval: ReturnType<typeof setInterval> | null = null;

export function startRingtone() {
  stopRingtone();
  const ring = () => {
    playTone(440, 200, 0.08);
    setTimeout(() => playTone(523, 200, 0.08), 250);
  };
  ring();
  ringtoneInterval = setInterval(ring, 2000);
}

export function stopRingtone() {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
}

// Outgoing call "beep beep"
let dialToneInterval: ReturnType<typeof setInterval> | null = null;

export function startDialTone() {
  stopDialTone();
  const beep = () => playTone(425, 500, 0.06);
  beep();
  dialToneInterval = setInterval(beep, 3000);
}

export function stopDialTone() {
  if (dialToneInterval) {
    clearInterval(dialToneInterval);
    dialToneInterval = null;
  }
}

// Connection established sound
export function playConnectedSound() {
  playTone(523, 100, 0.08);
  setTimeout(() => playTone(659, 100, 0.08), 120);
  setTimeout(() => playTone(784, 150, 0.08), 240);
}

// Call ended sound
export function playEndCallSound() {
  playTone(400, 200, 0.06);
  setTimeout(() => playTone(300, 300, 0.06), 220);
}

// New message notification sound — subtle ping
export function playMessageSound() {
  playTone(880, 80, 0.04);
  setTimeout(() => playTone(1047, 100, 0.04), 100);
}

// Missed call sound — descending tone
export function playMissedCallSound() {
  playTone(523, 150, 0.06);
  setTimeout(() => playTone(392, 200, 0.06), 170);
}

// Stop all sounds
export function stopAllSounds() {
  stopRingtone();
  stopDialTone();
}
