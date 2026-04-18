"use client";

import { useEffect, useState } from "react";
import { countryToFlag } from "@/lib/tracking/geo";

interface Session {
  id: string;
  ipAddress: string;
  location: string;
  country: string | null;
  createdAt: string;
  isCurrent: boolean;
}

interface SessionsData {
  current: {
    ip: string;
    browser: string;
    os: string;
    device: "Mobile" | "Tablet" | "Desktop";
  } | null;
  sessions: Session[];
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  if (h < 24) return `Il y a ${h}h`;
  if (days === 1) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ActiveSessions() {
  const [data, setData] = useState<SessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/sessions");
        const j = await res.json();
        if (!res.ok) {
          setError(j.error || "Impossible de charger l'historique.");
          return;
        }
        setData(j.data);
      } catch {
        setError("Erreur réseau.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-[#191c1e] mb-4">Sessions actives & historique de connexion</h2>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const cur = data?.current;
  const sessions = data?.sessions ?? [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-[#191c1e]">Sessions & connexions récentes</h2>
          <p className="text-xs text-[#5c647a] mt-0.5">
            Basé sur votre IP réelle — les 10 dernières connexions.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      {/* Current session (always shown, even before any LoginAttempt row exists) */}
      {cur && (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-[#006e2f]/25 bg-[#006e2f]/5 mb-3">
          <span className="material-symbols-outlined text-[22px] text-[#006e2f]">
            {cur.device === "Mobile" ? "smartphone" : cur.device === "Tablet" ? "tablet" : "computer"}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-[#191c1e]">
                {cur.browser} · {cur.os}
              </p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#006e2f] text-white">
                Cet appareil
              </span>
            </div>
            <p className="text-xs text-[#5c647a] mt-0.5 font-mono">IP {cur.ip}</p>
          </div>
        </div>
      )}

      {sessions.length === 0 && !cur ? (
        <div className="text-center py-6">
          <span className="material-symbols-outlined text-4xl text-slate-300">history</span>
          <p className="text-sm text-slate-500 mt-2">Aucune connexion enregistrée pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`flex items-center gap-4 p-3 rounded-xl border ${
                s.isCurrent ? "border-[#006e2f]/25 bg-[#006e2f]/5" : "border-gray-100"
              }`}
            >
              <span className="text-lg">{s.country ? countryToFlag(s.country) : "🌐"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-[#191c1e] truncate">{s.location}</p>
                  {s.isCurrent && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f]">
                      Actuelle
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#5c647a]">
                  <span className="font-mono">{s.ipAddress}</span> · {timeAgo(s.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-[11px] text-[#5c647a]">
        Si vous repérez une connexion inconnue, changez immédiatement votre mot de passe et activez
        la 2FA ci-dessus.
      </p>
    </div>
  );
}
