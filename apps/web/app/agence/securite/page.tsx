"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/store/toast";

interface Session {
  id: string;
  device: string;
  os: string;
  icon: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

interface SecurityEvent {
  id: string;
  type: "success" | "failed" | "password_change" | "2fa_enabled";
  description: string;
  location: string;
  device: string;
  timestamp: string;
}

const EVENT_META: Record<string, { icon: string; color: string }> = {
  success: { icon: "check_circle", color: "text-emerald-400" },
  failed: { icon: "error", color: "text-red-400" },
  password_change: { icon: "key", color: "text-primary" },
  "2fa_enabled": { icon: "verified_user", color: "text-primary" },
};

export default function AgenceSecuritePage() {
  const addToast = useToastStore((s) => s.addToast);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<"authenticator" | "sms">("authenticator");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  useEffect(() => {
    fetch("/api/auth/sessions")
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions || []))
      .catch(() => {});
    fetch("/api/auth/security-log")
      .then((r) => r.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => {});
  }, []);

  function handleToggle2FA() {
    setTwoFactorEnabled(!twoFactorEnabled);
    addToast(
      "success",
      twoFactorEnabled
        ? "2FA désactivée"
        : `2FA activée via ${twoFactorMethod === "authenticator" ? "Google Authenticator" : "SMS"}`
    );
  }

  function handleRevokeSession(id: string) {
    fetch(`/api/auth/sessions/${id}`, { method: "DELETE" })
      .then(() => {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        addToast("success", "Session révoquée");
      })
      .catch(() => addToast("error", "Impossible de révoquer la session"));
  }

  function handleChangePassword() {
    if (!currentPwd || !newPwd || !confirmPwd) {
      addToast("error", "Veuillez remplir tous les champs");
      return;
    }
    if (newPwd !== confirmPwd) {
      addToast("error", "Les mots de passe ne correspondent pas");
      return;
    }
    fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
        addToast("success", "Mot de passe modifié avec succès");
      })
      .catch(() => addToast("error", "Erreur lors du changement de mot de passe"));
  }

  const inputCls =
    "w-full px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">Sécurité & 2FA</h1>
        <p className="text-slate-400 mt-1">Protégez le compte de votre agence.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Password */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">key</span>
              </div>
              <h3 className="font-bold text-lg">Mot de passe</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <input type="password" placeholder="Mot de passe actuel" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} className={inputCls} />
              <input type="password" placeholder="Nouveau mot de passe" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className={inputCls} />
              <input type="password" placeholder="Confirmer le nouveau mot de passe" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} className={inputCls} />
            </div>
            <button onClick={handleChangePassword} className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
              Modifier le mot de passe
            </button>
          </div>

          {/* 2FA */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">verified_user</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Authentification à deux facteurs</h3>
                <p className="text-xs text-slate-400">Ajoutez une couche de protection supplémentaire</p>
              </div>
              {twoFactorEnabled && (
                <span className="ml-auto px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
                  2FA Active
                </span>
              )}
            </div>
            <div className="space-y-3">
              {([
                { key: "authenticator" as const, label: "Google Authenticator", desc: "Application TOTP. Plus sécurisé que le SMS.", icon: "phonelink_lock" },
                { key: "sms" as const, label: "SMS Texto", desc: "Code envoyé par SMS à votre numéro vérifié.", icon: "sms" },
              ]).map((opt) => (
                <label key={opt.key} className={cn("flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                  twoFactorMethod === opt.key ? "border-primary bg-primary/5" : "border-border-dark bg-neutral-dark hover:border-primary/30"
                )}>
                  <input type="radio" name="2fa" checked={twoFactorMethod === opt.key} onChange={() => setTwoFactorMethod(opt.key)} className="sr-only" />
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    twoFactorMethod === opt.key ? "bg-primary/10 text-primary" : "bg-border-dark text-slate-400"
                  )}>
                    <span className="material-symbols-outlined">{opt.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    twoFactorMethod === opt.key ? "border-primary" : "border-border-dark"
                  )}>
                    {twoFactorMethod === opt.key && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                </label>
              ))}
            </div>
            <button onClick={handleToggle2FA} className={cn("w-full py-3 font-bold rounded-xl text-sm transition-all",
              twoFactorEnabled ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20" : "bg-primary text-white hover:bg-primary/90"
            )}>
              {twoFactorEnabled ? "Désactiver la 2FA" : "Activer la 2FA"}
            </button>
          </div>

          {/* Sessions */}
          <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">devices</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Sessions actives</h3>
                <p className="text-xs text-slate-400">{sessions.length} appareil(s) connecté(s)</p>
              </div>
            </div>
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <span className="material-symbols-outlined text-3xl mb-2 block">devices_off</span>
                  Aucune session active
                </div>
              ) : sessions.map((session) => (
                <div key={session.id} className={cn("flex items-center gap-4 p-4 rounded-xl border",
                  session.isCurrent ? "border-primary/30 bg-primary/5" : "border-border-dark bg-neutral-dark"
                )}>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    session.isCurrent ? "bg-primary/10 text-primary" : "bg-border-dark text-slate-400"
                  )}>
                    <span className="material-symbols-outlined">{session.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{session.device} sur {session.os}</p>
                      {session.isCurrent && <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">Actuel</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{session.location} · IP: {session.ip}</p>
                    <p className="text-[11px] text-slate-500">{session.lastActive}</p>
                  </div>
                  {!session.isCurrent && (
                    <button onClick={() => handleRevokeSession(session.id)} className="px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors">
                      Révoquer
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — Security log */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-background-dark/50 border border-border-dark rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">history</span>
              </div>
              <h3 className="font-bold text-lg">Journal de sécurité</h3>
            </div>
            {events.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <span className="material-symbols-outlined text-3xl mb-2 block">shield</span>
                Aucun événement
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border-dark" />
                <div className="space-y-0">
                  {events.map((event) => {
                    const meta = EVENT_META[event.type] ?? EVENT_META.success;
                    return (
                      <div key={event.id} className="relative flex gap-4 py-3">
                        <div className="relative z-10 flex-shrink-0 mt-0.5">
                          <div className={cn("w-[23px] h-[23px] rounded-full border-[3px] border-background-dark",
                            event.type === "success" ? "bg-emerald-400" : event.type === "failed" ? "bg-red-400" : "bg-primary"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={cn("material-symbols-outlined text-sm", meta.color)}>{meta.icon}</span>
                            <p className="text-sm font-semibold truncate">{event.description}</p>
                          </div>
                          <p className="text-xs text-slate-400">{event.device}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-500">{event.location}</span>
                            <span className="text-[11px] text-slate-500">{event.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400">shield</span>
              <h4 className="font-bold text-sm text-amber-300">Conseil de sécurité</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ne partagez jamais vos codes de récupération 2FA. Conservez-les dans un endroit sûr et hors ligne.
              FreelanceHigh ne vous demandera jamais vos codes par email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
