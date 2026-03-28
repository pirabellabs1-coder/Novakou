"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDashboardStore, useToastStore } from "@/store/dashboard";
import { normalizePlanName, hasProductiviteAccess } from "@/lib/plans";
import {
  RotateCcw,
  Square,
  Camera,
  Keyboard,
  Share2,
  FolderOpen,
  CheckCircle2,
  Clock3,
  Zap,
  Coffee,
  Activity,
  Play,
  Pause,
} from "lucide-react";

// --- Helpers ---
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatSeconds(total: number): { h: string; m: string; s: string } {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { h: pad(h), m: pad(m), s: pad(s) };
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${pad(m)}m`;
  return `${m}min`;
}

// --- Main Component ---
export default function ProductivitePage() {
  const {
    currentPlan,
    productiviteSessions,
    productiviteLoading,
    syncProductivite,
    startProductiviteSession,
    pauseProductiviteSession,
    resumeProductiviteSession,
    stopProductiviteSession,
  } = useDashboardStore();
  const addToast = useToastStore((s) => s.addToast);

  const plan = normalizePlanName(currentPlan);

  const [elapsed, setElapsed] = useState(0);
  const [captureEnabled, setCaptureEnabled] = useState(true);
  const [showBreakBanner, setShowBreakBanner] = useState(false);
  const [breakTaken, setBreakTaken] = useState(false);
  const [sessionLabel, setSessionLabel] = useState("");
  const [showLabelInput, setShowLabelInput] = useState(false);

  // Find active session (running or paused)
  const activeSession = productiviteSessions.find((s) => s.status === "running" || s.status === "paused");
  const isRunning = activeSession?.status === "running";
  const isPaused = activeSession?.status === "paused";
  const isStopped = !activeSession;

  // Sync on mount
  useEffect(() => {
    syncProductivite();
  }, [syncProductivite]);

  // Timer tick
  useEffect(() => {
    if (!isRunning || !activeSession) return;
    // Set initial elapsed from session start
    const startTime = new Date(activeSession.start).getTime();
    setElapsed(Math.floor((Date.now() - startTime) / 1000));

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, activeSession?.id, activeSession?.start, activeSession]);

  // When paused, show frozen duration
  useEffect(() => {
    if (isPaused && activeSession) {
      setElapsed(activeSession.durationSeconds);
    }
  }, [isPaused, activeSession]);

  // When stopped, reset
  useEffect(() => {
    if (isStopped) setElapsed(0);
  }, [isStopped]);

  // Show break suggestion after 1.5h
  useEffect(() => {
    if (elapsed > 5400 && isRunning && !breakTaken) setShowBreakBanner(true);
  }, [elapsed, isRunning, breakTaken]);

  const handleStart = useCallback(async () => {
    if (!sessionLabel.trim()) {
      setShowLabelInput(true);
      return;
    }
    const result = await startProductiviteSession(sessionLabel.trim());
    if (result) {
      addToast("success", "Session demarree !");
      setShowLabelInput(false);
      setBreakTaken(false);
      setShowBreakBanner(false);
    } else {
      addToast("error", "Erreur lors du demarrage");
    }
  }, [sessionLabel, startProductiviteSession, addToast]);

  const handlePauseResume = useCallback(async () => {
    if (!activeSession) return;
    if (isRunning) {
      const ok = await pauseProductiviteSession(activeSession.id);
      if (ok) addToast("info", "Session en pause");
    } else if (isPaused) {
      const ok = await resumeProductiviteSession(activeSession.id);
      if (ok) addToast("success", "Session reprise !");
    }
  }, [activeSession, isRunning, isPaused, pauseProductiviteSession, resumeProductiviteSession, addToast]);

  const handleStop = useCallback(async () => {
    if (!activeSession) return;
    const ok = await stopProductiviteSession(activeSession.id);
    if (ok) {
      addToast("success", "Session terminee et sauvegardee");
      setSessionLabel("");
      // Refresh sessions list
      syncProductivite();
    }
  }, [activeSession, stopProductiviteSession, addToast, syncProductivite]);

  const handleReset = useCallback(() => {
    if (activeSession) {
      handleStop();
    }
    setElapsed(0);
    setBreakTaken(false);
    setShowBreakBanner(false);
    setSessionLabel("");
  }, [activeSession, handleStop]);

  const handleBreak = useCallback(async () => {
    setBreakTaken(true);
    setShowBreakBanner(false);
    if (activeSession && isRunning) {
      await pauseProductiviteSession(activeSession.id);
      addToast("info", "Session en pause — Prenez 5 minutes");
    }
  }, [activeSession, isRunning, pauseProductiviteSession, addToast]);

  const { h, m, s } = formatSeconds(elapsed);

  // Completed sessions (stopped ones)
  const completedSessions = productiviteSessions.filter((ss) => ss.status === "stopped");
  const totalEarnings = completedSessions.reduce((acc, ss) => acc + ss.amount, 0);
  const totalWorkedSeconds = completedSessions.reduce((acc, ss) => acc + ss.durationSeconds, 0) + (isRunning ? elapsed : isPaused ? (activeSession?.durationSeconds ?? 0) : 0);

  // Plan gate
  if (!hasProductiviteAccess(plan)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        <div className="max-w-md text-center">
          <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl text-primary">lock</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">Mode Focus & Productivite</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Passez au plan Sommet ou Empire pour acceder au suivi de temps, aux preuves de travail et au mode focus.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard/abonnement"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-sm">workspace_premium</span>
              Passer Sommet - 29.99 EUR/mois
            </Link>
            <Link href="/dashboard/abonnement"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-primary/30 text-primary font-bold rounded-xl hover:bg-primary/5 transition-all">
              Voir tous les plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="font-semibold text-slate-700 dark:text-slate-200">Session de Focus</span>
      </nav>

      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Mode Focus</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Suivi du temps en temps reel {activeSession && <span className="text-slate-700 dark:text-slate-300 font-semibold">— {activeSession.label}</span>}
          </p>
        </div>
      </header>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Timer + Sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* New session label input */}
          {showLabelInput && isStopped && (
            <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-border-dark rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold mb-3">Nouvelle session</h3>
              <div className="flex gap-3">
                <input type="text" value={sessionLabel} onChange={(e) => setSessionLabel(e.target.value)}
                  placeholder="Ex: Design System - Composants Boutons"
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-border-dark rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  onKeyDown={(e) => e.key === "Enter" && handleStart()} autoFocus />
                <button onClick={handleStart} disabled={!sessionLabel.trim()}
                  className="px-6 py-3 bg-[#0e7c66] text-white font-bold rounded-xl hover:bg-[#0a6454] transition-all disabled:opacity-40 shadow-lg shadow-[#0e7c66]/20">
                  Demarrer
                </button>
              </div>
            </div>
          )}

          {/* Timer Card */}
          <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-border-dark rounded-2xl p-8 shadow-sm">
            {/* Badge */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                  isRunning ? "bg-[#0e7c66]/15 text-[#0e7c66]" : isPaused ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}>
                  <span className={cn("w-2 h-2 rounded-full", isRunning ? "bg-[#0e7c66] animate-pulse" : isPaused ? "bg-amber-500" : "bg-slate-400")} />
                  {isRunning ? "Session de Travail Intense" : isPaused ? "Session en Pause" : "Pret a demarrer"}
                </span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </span>
            </div>

            {/* Timer Display */}
            <div className="flex items-center justify-center gap-3 mb-10">
              {[{ val: h, label: "Heures" }, { val: m, label: "Minutes" }, { val: s, label: "Secondes", accent: true }].map((item, idx) => (
                <div key={item.label} className="flex items-center gap-3">
                  {idx > 0 && <span className={cn("text-4xl font-black text-slate-300 dark:text-slate-600 mb-6 select-none", isRunning && "animate-pulse")}>:</span>}
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-border-dark rounded-xl px-5 py-4 min-w-[90px] text-center">
                      <span className={cn("text-5xl font-black tabular-nums tracking-tight font-mono", item.accent ? "text-[#0e7c66]" : "text-slate-800 dark:text-white")}>
                        {item.val}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              <button onClick={handleReset} title="Reinitialiser"
                className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-border-dark flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                <RotateCcw className="w-5 h-5" />
              </button>

              {isStopped ? (
                <button onClick={() => { setShowLabelInput(true); }} title="Demarrer"
                  className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all bg-[#0e7c66] hover:bg-[#0a6454] shadow-[#0e7c66]/30 text-white">
                  <Play className="w-8 h-8 translate-x-0.5" />
                </button>
              ) : (
                <button onClick={handlePauseResume} title={isRunning ? "Mettre en pause" : "Reprendre"}
                  className={cn("w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-200",
                    isRunning ? "bg-[#0e7c66] hover:bg-[#0a6454] shadow-[#0e7c66]/30 text-white" : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30 text-white")}>
                  {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 translate-x-0.5" />}
                </button>
              )}

              <button onClick={handleStop} title="Arreter la session" disabled={isStopped}
                className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all disabled:opacity-30">
                <Square className="w-5 h-5" />
              </button>
            </div>

            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-5 font-medium">
              {isRunning ? "Chronometre en cours — Appuyez sur pause pour suspendre"
                : isPaused ? "Session suspendue — Appuyez sur play pour reprendre"
                : "Cliquez sur play pour demarrer une nouvelle session"}
            </p>
          </div>

          {/* Daily Sessions */}
          <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-border-dark rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-border-dark/60 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 dark:text-slate-100">Sessions de la journee</h2>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Total : <span className="text-[#0e7c66] font-bold">&euro;{totalEarnings.toFixed(2)}</span>
              </span>
            </div>

            {productiviteLoading ? (
              <div className="p-8 text-center text-slate-500 animate-pulse">Chargement...</div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-border-dark/60">
                {productiviteSessions.length === 0 && (
                  <li className="p-8 text-center text-slate-500 text-sm">Aucune session aujourd&apos;hui. Demarrez votre premiere session !</li>
                )}
                {productiviteSessions.map((sess) => (
                  <li key={sess.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={cn("mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        sess.status === "stopped" ? "bg-[#0e7c66]/10 text-[#0e7c66]" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400")}>
                        {sess.status === "stopped" ? <CheckCircle2 className="w-4 h-4" /> : <Clock3 className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">{sess.label}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Clock3 className="w-3 h-3" />
                          {new Date(sess.start).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          {sess.end && <> – {new Date(sess.end).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</>}
                          <span className="text-slate-300 dark:text-slate-600">&middot;</span>
                          {formatDuration(sess.durationSeconds)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-shrink-0">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">&euro;{sess.amount.toFixed(2)}</span>
                      <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold",
                        sess.status === "stopped" ? "bg-[#0e7c66]/10 text-[#0e7c66]" : sess.status === "running" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400")}>
                        {sess.status === "stopped" ? <><CheckCircle2 className="w-3 h-3" /> Terminee</> : sess.status === "running" ? <><Zap className="w-3 h-3" /> En cours</> : <><Pause className="w-3 h-3" /> Pause</>}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT — Proof of work + Break + Summary */}
        <div className="space-y-6">
          {/* Proof of Work Card */}
          <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-border-dark rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-border-dark/60 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Preuves de travail</h2>
              <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                captureEnabled ? "bg-[#0e7c66]/15 text-[#0e7c66]" : "bg-slate-100 text-slate-500 dark:bg-slate-800")}>
                {captureEnabled && <span className="w-1.5 h-1.5 rounded-full bg-[#0e7c66] animate-pulse" />}
                {captureEnabled ? "ACTIF" : "INACTIF"}
              </span>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#0e7c66]/10 flex items-center justify-center text-[#0e7c66]"><Camera className="w-4 h-4" /></div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Capture d&apos;ecran (auto)</span>
                </div>
                <button onClick={() => setCaptureEnabled((v) => !v)}
                  className={cn("relative w-11 h-6 rounded-full transition-colors duration-200", captureEnabled ? "bg-[#0e7c66]" : "bg-slate-200 dark:bg-slate-700")}>
                  <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200", captureEnabled ? "translate-x-5" : "translate-x-0")} />
                </button>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><Keyboard className="w-4 h-4" /></div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Niveau d&apos;activite clavier</span>
                  </div>
                  <span className="text-sm font-bold text-[#0e7c66]">{isRunning ? "85%" : "0%"}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden ml-10">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#0e7c66] to-emerald-400 transition-all duration-700"
                    style={{ width: isRunning ? "85%" : "0%" }} />
                </div>
              </div>
              <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-black/20 overflow-hidden">
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400 dark:text-slate-600">
                  <Activity className="w-8 h-8" />
                  <span className="text-xs font-medium">{isRunning ? "Capture active" : "En attente de session"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Break suggestion card */}
          {showBreakBanner && !breakTaken && (
            <div className="bg-white dark:bg-background-dark/50 border border-amber-200 dark:border-amber-800/40 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-amber-100 dark:border-amber-800/30 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Coffee className="w-3.5 h-3.5" />
                </div>
                <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Pause suggeree</h2>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Vous travaillez depuis <span className="font-bold text-amber-600 dark:text-amber-400">{formatDuration(elapsed)}</span> sans pause.
                  Une pause de <span className="font-bold">5 min</span> ameliorerait votre productivite.
                </p>
                <div className="flex flex-col gap-2">
                  <button onClick={handleBreak}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0e7c66] text-white rounded-lg text-sm font-bold hover:bg-[#0a6454] transition-all">
                    <Coffee className="w-4 h-4" /> Prendre une pause
                  </button>
                  <button onClick={() => setShowBreakBanner(false)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-border-dark text-slate-500 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                    Ignorer
                  </button>
                </div>
              </div>
            </div>
          )}

          {breakTaken && (
            <div className="bg-white dark:bg-background-dark/50 border border-[#0e7c66]/30 rounded-2xl shadow-sm p-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0e7c66]/10 flex items-center justify-center text-[#0e7c66] flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Pause enregistree</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Appuyez sur play pour reprendre votre session.</p>
              </div>
            </div>
          )}

          {/* Earnings Summary */}
          <div className="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-border-dark rounded-2xl shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Resume de la journee</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Temps total travaille</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{formatDuration(totalWorkedSeconds)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Sessions completees</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{completedSessions.length}</span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-border-dark/60" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Revenus generes</span>
                <span className="text-base font-black text-[#0e7c66]">&euro;{totalEarnings.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
