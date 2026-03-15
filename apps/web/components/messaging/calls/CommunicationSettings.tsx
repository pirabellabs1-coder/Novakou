"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useCommunicationSettings, type VideoQuality } from "@/store/communication-settings";
import { getAvailableDevices } from "@/lib/webrtc/media";

interface DeviceInfo {
  deviceId: string;
  label: string;
}

export function CommunicationSettings() {
  const {
    defaultMicId,
    defaultSpeakerId,
    defaultCameraId,
    videoQuality,
    soundsEnabled,
    callNotificationsEnabled,
    setDefaultMic,
    setDefaultSpeaker,
    setDefaultCamera,
    setVideoQuality,
    toggleSounds,
    toggleCallNotifications,
  } = useCommunicationSettings();

  const [microphones, setMicrophones] = useState<DeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<DeviceInfo[]>([]);
  const [cameras, setCameras] = useState<DeviceInfo[]>([]);
  const [micLevel, setMicLevel] = useState(0);
  const [isTesting, setIsTesting] = useState(false);
  const [cameraPreview, setCameraPreview] = useState(false);

  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Load available devices
  useEffect(() => {
    async function loadDevices() {
      try {
        // Need a temporary stream to get labels
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).catch(() => null);
        const { audioInputs, audioOutputs, videoInputs } = await getAvailableDevices();

        setMicrophones(audioInputs.map((d) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 5)}` })));
        setSpeakers(audioOutputs.map((d) => ({ deviceId: d.deviceId, label: d.label || `Haut-parleur ${d.deviceId.slice(0, 5)}` })));
        setCameras(videoInputs.map((d) => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 5)}` })));

        if (tempStream) tempStream.getTracks().forEach((t) => t.stop());
      } catch {
        // Permissions not granted
      }
    }
    loadDevices();
  }, []);

  // Mic test
  const startMicTest = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: defaultMicId ? { deviceId: { exact: defaultMicId } } : true,
      });
      micStreamRef.current = stream;
      setIsTesting(true);

      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const update = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setMicLevel(avg / 255);
        animFrameRef.current = requestAnimationFrame(update);
      };
      update();
    } catch {
      // Mic not available
    }
  }, [defaultMicId]);

  const stopMicTest = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setIsTesting(false);
    setMicLevel(0);
  }, []);

  // Camera preview
  const toggleCameraPreview = useCallback(async () => {
    if (cameraPreview) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
      setCameraPreview(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: defaultCameraId ? { deviceId: { exact: defaultCameraId } } : true,
        });
        cameraStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraPreview(true);
      } catch {
        // Camera not available
      }
    }
  }, [cameraPreview, defaultCameraId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicTest();
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-white mb-1">Paramètres de communication</h3>
        <p className="text-sm text-slate-500">Configurez vos périphériques audio et vidéo pour les appels</p>
      </div>

      {/* Microphone */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">mic</span>
          Microphone
        </h4>
        <select
          value={defaultMicId}
          onChange={(e) => setDefaultMic(e.target.value)}
          className="w-full px-3 py-2 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Par defaut</option>
          {microphones.map((m) => (
            <option key={m.deviceId} value={m.deviceId}>{m.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-3">
          <button
            onClick={isTesting ? stopMicTest : startMicTest}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              isTesting
                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            {isTesting ? "Arreter le test" : "Tester le micro"}
          </button>
          {isTesting && (
            <div className="flex-1 h-2 bg-border-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-100"
                style={{ width: `${micLevel * 100}%` }}
              />
            </div>
          )}
        </div>
      </section>

      {/* Speakers */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">volume_up</span>
          Haut-parleurs
        </h4>
        <select
          value={defaultSpeakerId}
          onChange={(e) => setDefaultSpeaker(e.target.value)}
          className="w-full px-3 py-2 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Par defaut</option>
          {speakers.map((s) => (
            <option key={s.deviceId} value={s.deviceId}>{s.label}</option>
          ))}
        </select>
      </section>

      {/* Camera */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">videocam</span>
          Camera
        </h4>
        <select
          value={defaultCameraId}
          onChange={(e) => setDefaultCamera(e.target.value)}
          className="w-full px-3 py-2 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Par defaut</option>
          {cameras.map((c) => (
            <option key={c.deviceId} value={c.deviceId}>{c.label}</option>
          ))}
        </select>
        <button
          onClick={toggleCameraPreview}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
            cameraPreview
              ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          )}
        >
          {cameraPreview ? "Arreter l'apercu" : "Tester la camera"}
        </button>
        {cameraPreview && (
          <div className="w-64 h-48 rounded-xl overflow-hidden border border-border-dark">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
          </div>
        )}
      </section>

      {/* Video quality */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">high_quality</span>
          Qualite video
        </h4>
        <div className="flex gap-2">
          {(["auto", "hd", "sd"] as VideoQuality[]).map((q) => (
            <button
              key={q}
              onClick={() => setVideoQuality(q)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-semibold transition-colors",
                videoQuality === q
                  ? "bg-primary text-white"
                  : "bg-neutral-dark text-slate-400 hover:text-white border border-border-dark"
              )}
            >
              {q === "auto" ? "Auto" : q.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {/* Toggles */}
      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-300">Notifications</h4>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm text-white">Sons de notification</p>
            <p className="text-xs text-slate-500">Sonneries et alertes sonores pour les appels</p>
          </div>
          <button
            onClick={toggleSounds}
            className={cn(
              "w-11 h-6 rounded-full transition-colors relative",
              soundsEnabled ? "bg-primary" : "bg-border-dark"
            )}
          >
            <div className={cn(
              "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
              soundsEnabled ? "translate-x-6" : "translate-x-1"
            )} />
          </button>
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm text-white">Notifications d&apos;appel</p>
            <p className="text-xs text-slate-500">Popup et sonnerie pour les appels entrants</p>
          </div>
          <button
            onClick={toggleCallNotifications}
            className={cn(
              "w-11 h-6 rounded-full transition-colors relative",
              callNotificationsEnabled ? "bg-primary" : "bg-border-dark"
            )}
          >
            <div className={cn(
              "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
              callNotificationsEnabled ? "translate-x-6" : "translate-x-1"
            )} />
          </button>
        </label>
      </section>
    </div>
  );
}
