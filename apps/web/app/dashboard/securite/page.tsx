"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDashboardStore, useToastStore } from "@/store/dashboard";
import { ConfirmModal } from "@/components/ui/confirm-modal";

// ============================================================
// Demo data
// ============================================================

interface Session {
  id: string;
  device: string;
  browser: string;
  os: string;
  icon: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

interface LoginEvent {
  id: string;
  type: "success" | "failed" | "password_change" | "2fa_enabled" | "2fa_disabled";
  description: string;
  location: string;
  device: string;
  timestamp: string;
}

const DEMO_SESSIONS: Session[] = [];

const DEMO_LOGIN_HISTORY: LoginEvent[] = [];

// ============================================================
// Component
// ============================================================

export default function SecuritePage() {
  const { settings, updateSettings } = useDashboardStore();
  const addToast = useToastStore((s) => s.addToast);

  const [twoFactorMethod, setTwoFactorMethod] = useState<"authenticator" | "sms">("authenticator");
  const [sessions, setSessions] = useState<Session[]>(DEMO_SESSIONS);
  const [showDisconnectAll, setShowDisconnectAll] = useState(false);
  const [showDisconnectOne, setShowDisconnectOne] = useState<string | null>(null);
  const [activating2FA, setActivating2FA] = useState(false);

  // 2FA setup modal state
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [manualSecret, setManualSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [setupError, setSetupError] = useState("");
  const [setupStep, setSetupStep] = useState<"qr" | "verify">("qr");

  // 2FA setup: generate QR code
  async function handleEnable2FA() {
    setActivating2FA(true);
    setSetupError("");

    try {
      const res = await fetch("/api/auth/setup-2fa", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        addToast("error", data.error || "Erreur lors de la generation du QR code");
        setActivating2FA(false);
        return;
      }

      setQrCodeUrl(data.otpauthUrl);
      setManualSecret(data.secret || "");
      setSetupStep("qr");
      setVerificationCode("");
      setShowSetupModal(true);
      setActivating2FA(false);
    } catch {
      addToast("error", "Erreur de connexion au serveur");
      setActivating2FA(false);
    }
  }

  // 2FA setup: verify code
  async function handleVerifySetup() {
    if (verificationCode.length !== 6) {
      setSetupError("Entrez un code a 6 chiffres");
      return;
    }

    setActivating2FA(true);
    setSetupError("");

    try {
      const res = await fetch("/api/auth/setup-2fa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSetupError(data.error || "Code incorrect");
        setActivating2FA(false);
        return;
      }

      // Succes
      updateSettings({ twoFactorEnabled: true });
      setShowSetupModal(false);
      setActivating2FA(false);
      addToast("success", "2FA activee via Google Authenticator");
    } catch {
      setSetupError("Erreur de connexion au serveur");
      setActivating2FA(false);
    }
  }

  // 2FA disable
  async function handleDisable2FA() {
    setActivating2FA(true);

    try {
      const res = await fetch("/api/auth/setup-2fa", { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        addToast("error", data.error || "Erreur lors de la desactivation");
        setActivating2FA(false);
        return;
      }

      updateSettings({ twoFactorEnabled: false });
      setActivating2FA(false);
      addToast("warning", "Authentification a deux facteurs desactivee");
    } catch {
      addToast("error", "Erreur de connexion au serveur");
      setActivating2FA(false);
    }
  }

  // 2FA toggle
  function handleToggle2FA() {
    if (settings.twoFactorEnabled) {
      handleDisable2FA();
    } else {
      handleEnable2FA();
    }
  }

  // Disconnect a single session
  function handleDisconnectSession(sessionId: string) {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setShowDisconnectOne(null);
    addToast("success", "Session deconnectee avec succes");
  }

  // Disconnect all other sessions
  function handleDisconnectAll() {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    setShowDisconnectAll(false);
    addToast("success", "Toutes les autres sessions ont ete deconnectees");
  }

  // Helper: dot color for login events
  function eventDotColor(type: LoginEvent["type"]): string {
    switch (type) {
      case "success":
        return "bg-emerald-400";
      case "failed":
        return "bg-red-400";
      case "password_change":
        return "bg-primary";
      case "2fa_enabled":
        return "bg-primary";
      case "2fa_disabled":
        return "bg-amber-400";
      default:
        return "bg-slate-400";
    }
  }

  // Helper: icon for login events
  function eventIcon(type: LoginEvent["type"]): string {
    switch (type) {
      case "success":
        return "check_circle";
      case "failed":
        return "error";
      case "password_change":
        return "key";
      case "2fa_enabled":
        return "verified_user";
      case "2fa_disabled":
        return "remove_moderator";
      default:
        return "info";
    }
  }

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <div className="space-y-8">
      {/* Modals */}
      <ConfirmModal
        open={showDisconnectAll}
        title="Deconnecter tous les appareils"
        message="Toutes les sessions sauf celle-ci seront fermees. Vous devrez vous reconnecter sur ces appareils."
        confirmLabel="Deconnecter tout"
        onConfirm={handleDisconnectAll}
        onCancel={() => setShowDisconnectAll(false)}
      />
      <ConfirmModal
        open={showDisconnectOne !== null}
        title="Deconnecter cet appareil"
        message="Cette session sera fermee. L'utilisateur devra se reconnecter sur cet appareil."
        confirmLabel="Deconnecter"
        onConfirm={() => showDisconnectOne && handleDisconnectSession(showDisconnectOne)}
        onCancel={() => setShowDisconnectOne(null)}
      />

      {/* 2FA Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background-dark border border-border-dark rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">verified_user</span>
                Configurer la 2FA
              </h3>
              <button
                onClick={() => setShowSetupModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {setupStep === "qr" ? (
              <>
                <p className="text-sm text-slate-400">
                  Scannez ce QR code avec votre application authenticator (Google Authenticator, Authy, etc.)
                </p>

                {/* QR Code display - rendered as otpauth URL for manual entry */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 flex flex-col items-center gap-4">
                  <div className="w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
                    <div className="text-center p-3">
                      <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">qr_code_2</span>
                      <p className="text-xs text-slate-500 font-medium">
                        Utilisez ce lien dans votre app :
                      </p>
                    </div>
                  </div>
                </div>

                {/* Manual secret */}
                {manualSecret && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      Ou entrez ce code manuellement :
                    </p>
                    <div className="bg-neutral-dark border border-border-dark rounded-lg p-3 flex items-center justify-between gap-2">
                      <code className="text-sm font-mono text-primary tracking-wider break-all">{manualSecret}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(manualSecret);
                          addToast("success", "Secret copie dans le presse-papiers");
                        }}
                        className="text-slate-400 hover:text-primary transition-colors flex-shrink-0"
                      >
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setSetupStep("verify")}
                  className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
                >
                  J&apos;ai scanne le QR code
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-400">
                  Entrez le code a 6 chiffres affiche dans votre application authenticator pour confirmer la configuration.
                </p>

                {setupError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {setupError}
                  </div>
                )}

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setVerificationCode(v);
                    setSetupError("");
                  }}
                  placeholder="000000"
                  className="w-full text-center text-2xl tracking-[0.4em] font-mono py-3 bg-neutral-dark border border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-100"
                  autoFocus
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setSetupStep("qr")}
                    className="flex-1 py-3 text-sm font-semibold text-slate-400 border border-border-dark rounded-xl hover:text-white hover:border-primary/30 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleVerifySetup}
                    disabled={activating2FA || verificationCode.length !== 6}
                    className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {activating2FA ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        Verification...
                      </>
                    ) : (
                      "Confirmer"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Securite & 2FA</h2>
        <p className="text-slate-400 mt-1">
          Protegez votre compte avec l&apos;authentification a deux facteurs et suivez vos sessions actives.
        </p>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column — wider (3/5) */}
        <div className="lg:col-span-3 space-y-6">
          {/* 2FA Section */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">verified_user</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Authentification a deux facteurs</h3>
                <p className="text-xs text-slate-400">Ajoutez une couche de protection supplementaire a votre compte</p>
              </div>
              {settings.twoFactorEnabled && (
                <span className="ml-auto px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                  2FA Active
                </span>
              )}
            </div>

            {/* Method selection */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Methode de verification</p>

              {/* Google Authenticator */}
              <label
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                  twoFactorMethod === "authenticator"
                    ? "border-primary bg-primary/5"
                    : "border-border-dark bg-neutral-dark hover:border-primary/30"
                )}
              >
                <input
                  type="radio"
                  name="2fa-method"
                  checked={twoFactorMethod === "authenticator"}
                  onChange={() => setTwoFactorMethod("authenticator")}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    twoFactorMethod === "authenticator"
                      ? "bg-primary/10 text-primary"
                      : "bg-border-dark text-slate-400"
                  )}
                >
                  <span className="material-symbols-outlined">phonelink_lock</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Google Authenticator</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Application de verification TOTP. Plus securise que le SMS.
                  </p>
                </div>
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                    twoFactorMethod === "authenticator" ? "border-primary" : "border-border-dark"
                  )}
                >
                  {twoFactorMethod === "authenticator" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </div>
              </label>

              {/* SMS */}
              <label
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                  twoFactorMethod === "sms"
                    ? "border-primary bg-primary/5"
                    : "border-border-dark bg-neutral-dark hover:border-primary/30"
                )}
              >
                <input
                  type="radio"
                  name="2fa-method"
                  checked={twoFactorMethod === "sms"}
                  onChange={() => setTwoFactorMethod("sms")}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    twoFactorMethod === "sms"
                      ? "bg-primary/10 text-primary"
                      : "bg-border-dark text-slate-400"
                  )}
                >
                  <span className="material-symbols-outlined">sms</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">SMS Texto</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Code envoye par SMS a votre numero de telephone verifie.
                  </p>
                </div>
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                    twoFactorMethod === "sms" ? "border-primary" : "border-border-dark"
                  )}
                >
                  {twoFactorMethod === "sms" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </div>
              </label>
            </div>

            {/* 2FA action button */}
            <button
              onClick={handleToggle2FA}
              disabled={activating2FA}
              className={cn(
                "w-full py-3 font-bold rounded-xl text-sm transition-all",
                settings.twoFactorEnabled
                  ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                  : "bg-primary text-white hover:bg-primary/90",
                activating2FA && "opacity-60 cursor-wait"
              )}
            >
              {activating2FA
                ? "Traitement en cours..."
                : settings.twoFactorEnabled
                ? "Desactiver la 2FA"
                : "Activer la 2FA"}
            </button>
          </div>

          {/* Active Sessions */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">devices</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Sessions actives</h3>
                  <p className="text-xs text-slate-400">{sessions.length} appareil(s) connecte(s)</p>
                </div>
              </div>
              {otherSessions.length > 0 && (
                <button
                  onClick={() => setShowDisconnectAll(true)}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Deconnecter tous les autres
                </button>
              )}
            </div>

            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-border-dark text-slate-500 flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined">devices</span>
                  </div>
                  <p className="text-sm text-slate-400 font-medium">Aucune session active</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Les sessions de vos appareils connectes apparaitront ici.
                  </p>
                </div>
              ) : (
                <>
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                        session.isCurrent
                          ? "border-primary/30 bg-primary/5"
                          : "border-border-dark bg-neutral-dark hover:border-border-dark/80"
                      )}
                    >
                      {/* Device icon */}
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                          session.isCurrent
                            ? "bg-primary/10 text-primary"
                            : "bg-border-dark text-slate-400"
                        )}
                      >
                        <span className="material-symbols-outlined">{session.icon}</span>
                      </div>

                      {/* Device info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">
                            {session.device} sur {session.os}
                          </p>
                          {session.isCurrent && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full flex-shrink-0">
                              Actuel
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">location_on</span>
                            {session.location}
                          </span>
                          <span className="text-xs text-slate-500">IP: {session.ip}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{session.lastActive}</p>
                      </div>

                      {/* Disconnect button */}
                      {!session.isCurrent && (
                        <button
                          onClick={() => setShowDisconnectOne(session.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0"
                        >
                          Deconnexion
                        </button>
                      )}
                    </div>
                  ))}

                  {sessions.length === 1 && sessions[0].isCurrent && (
                    <p className="text-sm text-slate-500 text-center py-2">
                      Aucune autre session active.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right column — (2/5) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Login History Timeline */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">history</span>
                </div>
                <h3 className="font-bold text-lg">Historique</h3>
              </div>
              <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                Voir tout
              </button>
            </div>

            {/* Timeline */}
            {DEMO_LOGIN_HISTORY.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-border-dark text-slate-500 flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined">history</span>
                </div>
                <p className="text-sm text-slate-400 font-medium">Aucun historique</p>
                <p className="text-xs text-slate-500 mt-1">
                  Les evenements de connexion et de securite apparaitront ici.
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border-dark" />

                <div className="space-y-0">
                  {DEMO_LOGIN_HISTORY.map((event) => (
                    <div key={event.id} className="relative flex gap-4 py-3">
                      {/* Dot */}
                      <div className="relative z-10 flex-shrink-0 mt-0.5">
                        <div
                          className={cn(
                            "w-[23px] h-[23px] rounded-full border-[3px] border-background-dark flex items-center justify-center",
                            eventDotColor(event.type)
                          )}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={cn(
                              "material-symbols-outlined text-sm",
                              event.type === "success" && "text-emerald-400",
                              event.type === "failed" && "text-red-400",
                              (event.type === "password_change" || event.type === "2fa_enabled") && "text-primary"
                            )}
                          >
                            {eventIcon(event.type)}
                          </span>
                          <p className="text-sm font-semibold truncate">{event.description}</p>
                        </div>
                        <p className="text-xs text-slate-400">{event.device}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[11px]">location_on</span>
                            {event.location}
                          </span>
                          <span className="text-[11px] text-slate-500">{event.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Security Tip Box */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400">shield</span>
              <h4 className="font-bold text-sm text-amber-300">Conseil de securite</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ne partagez jamais vos codes de recuperation 2FA avec qui que ce soit.
              Conservez-les dans un endroit sur et hors ligne. FreelanceHigh ne vous
              demandera jamais vos codes par email ou telephone.
            </p>
            <div className="flex items-start gap-2 pt-1">
              <span className="material-symbols-outlined text-amber-400/60 text-sm mt-0.5">tips_and_updates</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Activez la 2FA via Google Authenticator pour une securite optimale.
                Les codes SMS peuvent etre interceptes dans certaines regions.
              </p>
            </div>
          </div>

          {/* Quick Security Score */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl p-5 space-y-4">
            <h4 className="font-bold text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">security</span>
              Score de securite
            </h4>
            <div className="space-y-3">
              <SecurityCheckItem
                label="Email verifie"
                checked={true}
              />
              <SecurityCheckItem
                label="Mot de passe fort"
                checked={true}
              />
              <SecurityCheckItem
                label="2FA activee"
                checked={settings.twoFactorEnabled}
              />
              <SecurityCheckItem
                label="Telephone verifie"
                checked={false}
              />
              <SecurityCheckItem
                label="Identite verifiee (KYC)"
                checked={false}
              />
            </div>
            {/* Score bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">Niveau de protection</span>
                <span className="font-bold text-primary">
                  {[true, true, settings.twoFactorEnabled, false, false].filter(Boolean).length}/5
                </span>
              </div>
              <div className="h-2 bg-border-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{
                    width: `${([true, true, settings.twoFactorEnabled, false, false].filter(Boolean).length / 5) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-component: Security Check Item
// ============================================================

function SecurityCheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
          checked ? "bg-emerald-500/10 text-emerald-400" : "bg-border-dark text-slate-500"
        )}
      >
        <span className="material-symbols-outlined text-[14px]">
          {checked ? "check" : "close"}
        </span>
      </div>
      <span
        className={cn(
          "text-xs",
          checked ? "text-slate-300" : "text-slate-500"
        )}
      >
        {label}
      </span>
    </div>
  );
}
