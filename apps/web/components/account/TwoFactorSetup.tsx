"use client";

/**
 * Reusable 2FA setup panel — works for any authenticated user.
 *
 * States:
 *   - idle (not enabled)     : "Activer" button
 *   - setup (QR displayed)   : user scans + confirms with a 6-digit code
 *   - enabled                : "Désactiver" button
 *
 * API contract (already implemented by /api/auth/setup-2fa):
 *   POST   → returns { otpauthUrl, secret }
 *   PUT    → body { code } → { success: true }
 *   DELETE → { success: true }
 */

import { useEffect, useState } from "react";
import Image from "next/image";

type Mode = "idle" | "loading-setup" | "setup" | "confirming" | "enabled" | "disabling";

interface InitialState {
  enabled: boolean;
}

export default function TwoFactorSetup({ initial }: { initial?: InitialState }) {
  const [mode, setMode] = useState<Mode>(initial?.enabled ? "enabled" : "idle");
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Load current state from server when mode is "idle" and no initial was provided.
  useEffect(() => {
    if (initial !== undefined) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me-2fa");
        if (!res.ok) return;
        const j = await res.json();
        if (!cancelled && j?.enabled) setMode("enabled");
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [initial]);

  async function handleEnable() {
    setError(null);
    setNotice(null);
    setMode("loading-setup");
    try {
      const res = await fetch("/api/auth/setup-2fa", { method: "POST" });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error || "Impossible de démarrer la configuration.");
        setMode("idle");
        return;
      }
      setOtpauthUrl(j.otpauthUrl);
      setSecret(j.secret);
      // Render QR code via dynamic import to avoid shipping the lib everywhere
      try {
        const QRCode = (await import("qrcode")).default;
        const dataUrl = await QRCode.toDataURL(j.otpauthUrl, { width: 220, margin: 1 });
        setQrDataUrl(dataUrl);
      } catch {
        // Fallback : link only
        setQrDataUrl(null);
      }
      setMode("setup");
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
      setMode("idle");
    }
  }

  async function handleConfirm() {
    setError(null);
    if (code.length !== 6) {
      setError("Entrez un code à 6 chiffres.");
      return;
    }
    setMode("confirming");
    try {
      const res = await fetch("/api/auth/setup-2fa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) {
        setError(j.error || "Code incorrect.");
        setMode("setup");
        return;
      }
      setNotice("Authentification à deux facteurs activée ✓");
      setMode("enabled");
      setCode("");
      setOtpauthUrl(null);
      setSecret(null);
      setQrDataUrl(null);
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
      setMode("setup");
    }
  }

  async function handleDisable() {
    if (!confirm("Désactiver l'authentification à deux facteurs ? Votre compte sera moins protégé.")) return;
    setError(null);
    setMode("disabling");
    try {
      const res = await fetch("/api/auth/setup-2fa", { method: "DELETE" });
      const j = await res.json();
      if (!res.ok || !j.success) {
        setError(j.error || "Erreur lors de la désactivation.");
        setMode("enabled");
        return;
      }
      setNotice("2FA désactivée.");
      setMode("idle");
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
      setMode("enabled");
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#191c1e] mb-1">
            Authentification à deux facteurs (2FA)
          </h2>
          <p className="text-sm text-[#5c647a] leading-relaxed">
            Ajoutez une couche de sécurité en demandant un code à 6 chiffres depuis votre application
            (Google Authenticator, Authy, 1Password…) à chaque connexion.
          </p>
        </div>
        <div className="flex-shrink-0">
          {mode === "enabled" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
              Activée
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
              Désactivée
            </span>
          )}
        </div>
      </div>

      {notice && (
        <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[15px]">check_circle</span>
          {notice}
        </div>
      )}
      {error && (
        <div className="mt-4 p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[15px]">error</span>
          {error}
        </div>
      )}

      {mode === "idle" && (
        <button
          onClick={handleEnable}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg transition-shadow"
          style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
        >
          <span className="material-symbols-outlined text-[18px]">security</span>
          Activer la 2FA
        </button>
      )}

      {mode === "loading-setup" && (
        <div className="mt-5 text-sm text-slate-500 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
          Génération du QR code…
        </div>
      )}

      {mode === "setup" && (
        <div className="mt-5 space-y-4">
          <ol className="space-y-3 text-sm text-slate-700">
            <li>
              <strong className="block font-bold text-slate-900 mb-1">1. Scannez le QR code</strong>
              <span className="text-slate-500 text-xs">
                Ouvrez votre application (Google Authenticator, Authy, 1Password…) et scannez ce code.
              </span>
            </li>
          </ol>
          <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-slate-50 rounded-2xl border border-slate-200">
            {qrDataUrl ? (
              <Image
                src={qrDataUrl}
                alt="QR code 2FA"
                width={220}
                height={220}
                unoptimized
                className="rounded-lg border border-white shadow-sm"
              />
            ) : (
              <div className="w-[220px] h-[220px] rounded-lg bg-slate-200 flex items-center justify-center">
                <span className="text-xs text-slate-500">QR indisponible</span>
              </div>
            )}
            <div className="flex-1 min-w-0 w-full">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Ou saisissez manuellement :
              </p>
              <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2.5">
                <code className="flex-1 text-xs font-mono break-all text-slate-700">{secret}</code>
                <button
                  onClick={() => secret && navigator.clipboard.writeText(secret)}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                  title="Copier"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                </button>
              </div>
              {otpauthUrl && (
                <p className="text-[11px] text-slate-400 mt-2 break-all font-mono">
                  {otpauthUrl}
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900 mb-1">2. Entrez le code généré</p>
            <p className="text-xs text-slate-500 mb-3">
              Une fois ajouté dans votre app, elle génère un code à 6 chiffres qui change toutes les 30s.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                autoFocus
                autoComplete="one-time-code"
                className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-center text-xl font-extrabold tracking-[0.4em] text-slate-900 placeholder-slate-300 focus:outline-none focus:border-[#006e2f] transition-all"
              />
              <button
                onClick={handleConfirm}
                disabled={code.length !== 6}
                className="px-5 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50 shadow-md shadow-emerald-500/20"
                style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
              >
                Confirmer et activer
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              setMode("idle");
              setCode("");
              setError(null);
              setQrDataUrl(null);
              setOtpauthUrl(null);
              setSecret(null);
            }}
            className="text-xs text-slate-500 hover:text-slate-900 font-semibold"
          >
            Annuler
          </button>
        </div>
      )}

      {mode === "confirming" && (
        <div className="mt-5 text-sm text-slate-500 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
          Vérification du code…
        </div>
      )}

      {mode === "enabled" && (
        <div className="mt-5 space-y-4">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-sm text-emerald-800 flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield_lock
            </span>
            <div>
              <p className="font-bold">Votre compte est protégé par 2FA.</p>
              <p className="text-xs mt-1">
                À chaque connexion, nous demanderons le code à 6 chiffres de votre application.
              </p>
            </div>
          </div>
          <button
            onClick={handleDisable}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 text-sm font-bold hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">shield_remove</span>
            Désactiver la 2FA
          </button>
        </div>
      )}

      {mode === "disabling" && (
        <div className="mt-5 text-sm text-slate-500 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
          Désactivation en cours…
        </div>
      )}
    </div>
  );
}
