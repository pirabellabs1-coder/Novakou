"use client";

import { useState, useEffect, useCallback } from "react";
import { KycUploadCard } from "@/components/kyc/KycUploadCard";

interface KycRequest {
  id: string;
  level: number;
  documentType: string;
  status: "en_attente" | "approuve" | "refuse";
  reason: string;
  createdAt: string;
}

export default function KycPage() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKyc = useCallback(async () => {
    try {
      const res = await fetch("/api/kyc");
      if (res.ok) {
        const data = await res.json();
        setCurrentLevel(data.currentLevel);
        setRequests(data.requests);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKyc();
  }, [fetchKyc]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/5 rounded-xl w-1/3" />
          <div className="h-40 bg-white/5 rounded-2xl" />
          <div className="h-32 bg-white/5 rounded-2xl" />
          <div className="h-32 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Verification KYC</h1>
        <p className="text-slate-400">
          Verifiez votre identite pour debloquer toutes les fonctionnalites de la plateforme.
        </p>
      </div>

      <KycUploadCard
        currentLevel={currentLevel}
        requests={requests}
        onRefresh={fetchKyc}
      />

      {/* History */}
      {requests.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-white mb-4">Historique des demandes</h2>
          <div className="bg-neutral-dark rounded-2xl border border-border-dark divide-y divide-border-dark">
            {requests.map((req) => (
              <div key={req.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Niveau {req.level} — {req.documentType}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(req.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    req.status === "approuve"
                      ? "text-emerald-400 bg-emerald-500/10"
                      : req.status === "refuse"
                        ? "text-red-400 bg-red-500/10"
                        : "text-amber-400 bg-amber-500/10"
                  }`}
                >
                  {req.status === "approuve" ? "Approuve" : req.status === "refuse" ? "Refuse" : "En attente"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
