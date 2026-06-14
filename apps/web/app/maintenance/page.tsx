"use client";

import { useEffect, useState } from "react";
import {
  HardHat,
  Loader2,
  RefreshCw,
  Rocket,
} from "lucide-react";

export default function MaintenancePage() {
  const [message, setMessage] = useState("La plateforme est en maintenance. Nous serons de retour bientot.");
  const [checking, setChecking] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Fetch maintenance message and auto-check every 60 seconds
  useEffect(() => {
    async function checkMaintenance() {
      try {
        const res = await fetch("/api/public/maintenance");
        const data = await res.json();
        if (!data.enabled) {
          window.location.href = "/";
          return;
        }
        if (data.message) setMessage(data.message);
      } catch {
        // Still in maintenance
      }
    }

    checkMaintenance();
    const interval = setInterval(checkMaintenance, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for auto-refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 60;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  async function checkStatus() {
    setChecking(true);
    try {
      const res = await fetch("/api/public/maintenance");
      const data = await res.json();
      if (!data.enabled) {
        window.location.href = "/";
      }
    } catch {
      // Still in maintenance
    } finally {
      setChecking(false);
      setCountdown(60);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Rocket size={30} className="text-[#6C2BD9]" />
          <span className="font-bold text-2xl text-white">Novakou</span>
        </div>

        {/* Maintenance icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center animate-pulse">
          <HardHat size={36} className="text-amber-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">Maintenance en cours</h1>
        <p className="text-slate-400 text-lg mb-8 leading-relaxed">{message}</p>

        {/* Check button */}
        <button
          onClick={checkStatus}
          disabled={checking}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#6C2BD9] text-white font-bold rounded-xl hover:bg-[#5B21B6] transition-all disabled:opacity-50"
        >
          {checking ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <RefreshCw size={18} />
          )}
          {checking ? "Verification..." : "Verifier le statut"}
        </button>

        {/* Auto-check countdown */}
        <p className="text-xs text-slate-600 mt-6">
          Verification automatique dans {countdown}s
        </p>

        {/* Contact info */}
        <div className="mt-12 pt-6 border-t border-slate-800">
          <p className="text-xs text-slate-600">
            Nous effectuons des mises a jour pour ameliorer votre experience.
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Contact : <span className="text-slate-500">support@novakou.com</span>
          </p>
        </div>

        <p className="text-[10px] text-slate-700 mt-8">
          © 2026 Novakou — Editee par Pirabel Labs
        </p>
      </div>
    </div>
  );
}
