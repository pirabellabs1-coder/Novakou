"use client";

import { useState, useRef, useEffect } from "react";

interface TestResult {
  name: string;
  status: "pending" | "ok" | "fail" | "running";
  detail: string;
}

export default function DebugMediaPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function addResult(name: string, status: TestResult["status"], detail: string) {
    setResults((prev) => {
      const existing = prev.findIndex((r) => r.name === name);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = { name, status, detail };
        return copy;
      }
      return [...prev, { name, status, detail }];
    });
  }

  async function runAllTests() {
    setRunning(true);
    setResults([]);
    setPreviewUrl(null);

    // ═══ TEST 1: Server infrastructure ═══
    addResult("1. Infra serveur", "running", "Vérification...");
    try {
      const res = await fetch("/api/debug-media");
      const data = await res.json();

      const authOk = data.auth?.ok;
      const sigTableOk = data.signaling_table?.ok;
      const sigRoundtripOk = data.signaling_roundtrip?.ok;
      const storageOk = data.supabase_storage?.ok;

      addResult("1a. Auth session", authOk ? "ok" : "fail",
        authOk ? `userId: ${data.auth.userId}` : `ERREUR: ${data.auth?.error}`);

      addResult("1b. Table signaling_signals", sigTableOk ? "ok" : "fail",
        sigTableOk ? `OK (${data.signaling_table.rows} rows)` : `ERREUR: ${data.signaling_table?.error}`);

      addResult("1c. Signaling write+read", sigRoundtripOk ? "ok" : "fail",
        sigRoundtripOk ? "Write → Read → Delete OK" : `ERREUR: ${data.signaling_roundtrip?.error}`);

      addResult("1d. Supabase Storage upload", storageOk ? "ok" : "fail",
        storageOk ? `Upload OK, signed URL: ${data.supabase_storage.signed_url_ok ? "OK" : "FAIL"}`
          : `ERREUR: ${data.supabase_storage?.error}`);

      addResult("1e. Variables d'env", "ok", JSON.stringify(data.env_vars));
    } catch (e) {
      addResult("1. Infra serveur", "fail", `Fetch error: ${e}`);
    }

    // ═══ TEST 2: Microphone ═══
    addResult("2. Microphone", "running", "Demande de permission...");
    let micStream: MediaStream | null = null;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tracks = micStream.getAudioTracks();
      const settings = tracks[0]?.getSettings();
      addResult("2. Microphone", "ok",
        `${tracks.length} track(s) — ${settings?.channelCount}ch, ${settings?.sampleRate}Hz, label: "${tracks[0]?.label}"`);
    } catch (e) {
      addResult("2. Microphone", "fail", `ERREUR: ${e}`);
    }

    // ═══ TEST 3: MediaRecorder ═══
    addResult("3. MediaRecorder", "running", "Enregistrement 3 secondes...");
    if (micStream) {
      try {
        const mimeTypes = [
          "audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus",
        ];
        const supportedMime = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) || "";

        if (!supportedMime) {
          addResult("3. MediaRecorder", "fail", "Aucun format audio supporté");
        } else {
          const recorder = new MediaRecorder(micStream, { mimeType: supportedMime });
          const chunks: Blob[] = [];

          const recordingDone = new Promise<Blob>((resolve) => {
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            recorder.onstop = () => resolve(new Blob(chunks, { type: supportedMime }));
          });

          recorder.start(250);
          await new Promise((r) => setTimeout(r, 3000));
          recorder.stop();
          micStream.getTracks().forEach((t) => t.stop());

          const blob = await recordingDone;
          const blobUrl = URL.createObjectURL(blob);
          setPreviewUrl(blobUrl);

          addResult("3. MediaRecorder", blob.size > 1000 ? "ok" : "fail",
            `MIME: ${supportedMime}, Blob: ${(blob.size / 1024).toFixed(1)} KB` +
            (blob.size < 1000 ? " — TROP PETIT, micro probablement muet" : " — taille OK"));

          // ═══ TEST 4: Upload audio ═══
          addResult("4. Upload audio", "running", "Upload vers Supabase...");
          try {
            let ext = "webm";
            if (supportedMime.includes("mp4")) ext = "m4a";
            else if (supportedMime.includes("ogg")) ext = "ogg";

            const file = new File([blob], `test-voice.${ext}`, { type: supportedMime });
            const formData = new FormData();
            formData.append("file", file);
            formData.append("bucket", "message-attachments");

            const uploadRes = await fetch("/api/upload/file", { method: "POST", body: formData });
            const uploadData = await uploadRes.json();

            if (uploadData.success && uploadData.file) {
              addResult("4. Upload audio", "ok",
                `Upload OK — path: ${uploadData.file.path}, URL valide: ${uploadData.file.url?.startsWith("http") ? "OUI" : "NON"}`);

              // ═══ TEST 5: Playback signed URL ═══
              addResult("5. Lecture signed URL", "running", "Test de lecture...");
              const testAudio = new Audio(uploadData.file.url);
              testAudio.preload = "auto";

              const playResult = await new Promise<string>((resolve) => {
                const timeout = setTimeout(() => resolve("TIMEOUT — pas de réponse en 10s"), 10000);
                testAudio.oncanplaythrough = () => { clearTimeout(timeout); resolve("OK — audio jouable"); };
                testAudio.onerror = (e) => {
                  clearTimeout(timeout);
                  const mediaErr = testAudio.error;
                  resolve(`ERREUR — code: ${mediaErr?.code}, message: ${mediaErr?.message || "inconnu"}`);
                };
                testAudio.load();
              });

              addResult("5. Lecture signed URL", playResult.startsWith("OK") ? "ok" : "fail", playResult);
            } else {
              addResult("4. Upload audio", "fail",
                `ERREUR: ${uploadData.error || "réponse invalide"} (status: ${uploadRes.status})`);
            }
          } catch (e) {
            addResult("4. Upload audio", "fail", `ERREUR: ${e}`);
          }
        }
      } catch (e) {
        addResult("3. MediaRecorder", "fail", `ERREUR: ${e}`);
        micStream.getTracks().forEach((t) => t.stop());
      }
    }

    // ═══ TEST 6: WebRTC PeerConnection ═══
    addResult("6. WebRTC loopback", "running", "Test connexion locale...");
    try {
      const iceServers = [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ];

      const pc1 = new RTCPeerConnection({ iceServers });
      const pc2 = new RTCPeerConnection({ iceServers });

      // Get audio for test
      const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      testStream.getTracks().forEach((t) => pc1.addTrack(t, testStream));

      let remoteTrackReceived = false;
      pc2.ontrack = () => { remoteTrackReceived = true; };

      // ICE exchange
      pc1.onicecandidate = (e) => { if (e.candidate) pc2.addIceCandidate(e.candidate).catch(() => {}); };
      pc2.onicecandidate = (e) => { if (e.candidate) pc1.addIceCandidate(e.candidate).catch(() => {}); };

      // Create offer/answer
      const offer = await pc1.createOffer();
      await pc1.setLocalDescription(offer);
      await pc2.setRemoteDescription(offer);

      const answer = await pc2.createAnswer();
      await pc2.setLocalDescription(answer);
      await pc1.setRemoteDescription(answer);

      // Wait for connection
      const connResult = await new Promise<string>((resolve) => {
        const timeout = setTimeout(() => {
          resolve(`TIMEOUT — état: pc1=${pc1.connectionState}, pc2=${pc2.connectionState}, ICE: pc1=${pc1.iceConnectionState}, pc2=${pc2.iceConnectionState}, track reçu: ${remoteTrackReceived}`);
        }, 10000);

        pc1.onconnectionstatechange = () => {
          if (pc1.connectionState === "connected") {
            clearTimeout(timeout);
            resolve(`CONNECTE — track distant reçu: ${remoteTrackReceived}`);
          } else if (pc1.connectionState === "failed") {
            clearTimeout(timeout);
            resolve(`ECHOUE — ICE: ${pc1.iceConnectionState}`);
          }
        };
      });

      testStream.getTracks().forEach((t) => t.stop());
      pc1.close();
      pc2.close();

      addResult("6. WebRTC loopback", connResult.startsWith("CONNECTE") ? "ok" : "fail", connResult);
    } catch (e) {
      addResult("6. WebRTC loopback", "fail", `ERREUR: ${e}`);
    }

    // ═══ TEST 7: TURN connectivity ═══
    addResult("7. TURN servers", "running", "Test des serveurs TURN...");
    try {
      const turnServers = [
        { urls: "turn:a.relay.metered.ca:80", username: "e8dd65a92f3c090f4be6e4c0", credential: "SoELzOhU5MEhH97+" },
        { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
      ];

      const turnResults: string[] = [];
      for (const turn of turnServers) {
        const pc = new RTCPeerConnection({ iceServers: [turn], iceTransportPolicy: "relay" });
        const result = await new Promise<string>((resolve) => {
          const timeout = setTimeout(() => { pc.close(); resolve(`${turn.urls}: TIMEOUT`); }, 5000);
          pc.onicecandidate = (e) => {
            if (e.candidate?.type === "relay") {
              clearTimeout(timeout);
              pc.close();
              resolve(`${turn.urls}: OK`);
            }
          };
          pc.createDataChannel("test");
          pc.createOffer().then((o) => pc.setLocalDescription(o)).catch(() => {
            clearTimeout(timeout); pc.close(); resolve(`${turn.urls}: ERREUR`);
          });
        });
        turnResults.push(result);
      }
      const anyOk = turnResults.some((r) => r.includes("OK"));
      addResult("7. TURN servers", anyOk ? "ok" : "fail", turnResults.join(" | "));
    } catch (e) {
      addResult("7. TURN servers", "fail", `ERREUR: ${e}`);
    }

    setRunning(false);
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: 20, fontFamily: "monospace", color: "#fff", background: "#111" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Diagnostic Audio & Appels</h1>

      <button
        onClick={runAllTests}
        disabled={running}
        style={{
          padding: "12px 24px", fontSize: 16, fontWeight: "bold",
          background: running ? "#444" : "#0070f3", color: "#fff",
          border: "none", borderRadius: 8, cursor: running ? "wait" : "pointer",
          marginBottom: 20,
        }}
      >
        {running ? "Tests en cours..." : "Lancer les tests"}
      </button>

      {previewUrl && (
        <div style={{ margin: "16px 0", padding: 12, background: "#1a1a2e", borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Aperçu enregistrement (3s) — tu dois entendre ta voix :</p>
          <audio ref={audioPreviewRef} src={previewUrl} controls style={{ width: "100%" }} />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {results.map((r) => (
          <div key={r.name} style={{
            padding: "10px 14px", borderRadius: 8,
            background: r.status === "ok" ? "#0a2e0a" : r.status === "fail" ? "#2e0a0a" : r.status === "running" ? "#1a1a2e" : "#1a1a1a",
            border: `1px solid ${r.status === "ok" ? "#0f0" : r.status === "fail" ? "#f00" : r.status === "running" ? "#44f" : "#333"}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>
                {r.status === "ok" ? "✅" : r.status === "fail" ? "❌" : r.status === "running" ? "⏳" : "⬜"}
              </span>
              <span style={{ fontWeight: "bold", fontSize: 14 }}>{r.name}</span>
            </div>
            <pre style={{ fontSize: 11, color: "#aaa", marginTop: 4, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {r.detail}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
