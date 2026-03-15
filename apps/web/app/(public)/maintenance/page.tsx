"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function MaintenancePage() {
  const [message, setMessage] = useState("La plateforme est en maintenance. Nous serons de retour bientot.");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Fetch maintenance message from API
    fetch("/api/public/maintenance")
      .then((r) => r.json())
      .then((data) => {
        if (!data.enabled) {
          // Maintenance is over — redirect to home
          window.location.href = "/";
          return;
        }
        if (data.message) setMessage(data.message);
      })
      .catch(() => {});
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
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="material-symbols-outlined text-[#22C55E] text-3xl">rocket_launch</span>
          <span className="font-bold text-2xl text-white">FreelanceHigh</span>
        </div>

        {/* Maintenance icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-amber-400">engineering</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">Maintenance en cours</h1>
        <p className="text-slate-400 text-lg mb-8 leading-relaxed">{message}</p>

        <div className="space-y-4">
          <button
            onClick={checkStatus}
            disabled={checking}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#22C55E] text-white font-bold rounded-xl hover:bg-[#16A34A] transition-all disabled:opacity-50"
          >
            {checking ? (
              <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-lg">refresh</span>
            )}
            {checking ? "Verification..." : "Verifier le statut"}
          </button>

          <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
            <Link href="/status" className="hover:text-white transition-colors">Statut des services</Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-white transition-colors">Contactez-nous</Link>
          </div>
        </div>

        <p className="text-xs text-slate-600 mt-12">
          Nous effectuons des mises a jour pour ameliorer votre experience. Merci de votre patience.
        </p>
      </div>
    </div>
  );
}
