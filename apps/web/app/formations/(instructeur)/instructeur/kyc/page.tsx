"use client";

import { useState, useEffect, useCallback } from "react";
import { KycStatusBanner } from "@/components/kyc/KycStatusBanner";
import { KycIndividualForm } from "@/components/kyc/KycIndividualForm";

interface KycRequest {
  id: string;
  level: number;
  documentType: string;
  status: "en_attente" | "approuve" | "refuse";
  reason: string;
  createdAt: string;
  type?: string;
}

type PageView = "loading" | "form" | "pending" | "approved" | "rejected";

export default function InstructeurKycPage() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [view, setView] = useState<PageView>("loading");
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchKyc = useCallback(async () => {
    try {
      const res = await fetch("/api/kyc");
      if (res.ok) {
        const data = await res.json();
        setCurrentLevel(data.currentLevel ?? 1);
        setRequests(data.requests ?? []);

        const level = data.currentLevel ?? 1;
        if (level >= 3) {
          setView("approved");
          return;
        }

        const reqs: KycRequest[] = data.requests ?? [];
        const hasPending = reqs.some((r) => r.status === "en_attente");
        if (hasPending) {
          setView("pending");
          return;
        }

        const refused = reqs.filter((r) => r.status === "refuse");
        if (refused.length > 0) {
          const latest = refused.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          setRejectionReason(latest.reason || "");
          setView("rejected");
          return;
        }

        setView("form");
      }
    } catch {
      setView("form");
    }
  }, []);

  useEffect(() => {
    fetchKyc();
  }, [fetchKyc]);

  function handleSuccess() {
    setView("pending");
    fetchKyc();
  }

  if (view === "loading") {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-0">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-white/5 rounded-xl w-2/3" />
          <div className="h-6 bg-white/5 rounded-xl w-1/2" />
          <div className="h-40 bg-white/5 rounded-2xl" />
          <div className="h-64 bg-white/5 rounded-2xl" />
          <div className="h-48 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  const bannerStatus =
    view === "approved"
      ? "approved"
      : view === "pending"
        ? "pending"
        : view === "rejected"
          ? "rejected"
          : "not_verified";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-xl text-primary">
              shield
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Verification d&apos;identite — Instructeur
            </h1>
            <p className="text-sm text-slate-400">
              Verifiez votre identite pour creer des formations et recevoir des paiements.
            </p>
          </div>
        </div>
      </div>

      {/* Status banner */}
      <div className="mb-6">
        <KycStatusBanner
          currentLevel={currentLevel}
          status={bannerStatus}
          rejectionReason={rejectionReason}
          kycHref="/formations/instructeur/kyc"
        />
      </div>

      {/* Pending state */}
      {view === "pending" && (
        <div className="bg-amber-500/5 rounded-2xl border border-amber-500/20 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl text-amber-400 animate-pulse">
                schedule
              </span>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg mb-1">
                Votre demande est en cours de verification
              </h3>
              <p className="text-sm text-slate-400 mb-3">
                Notre equipe examine vos documents. Vous serez notifie par email des que la verification sera terminee.
                Le delai habituel est de 24 a 48 heures.
              </p>
              <div className="flex items-center gap-2 text-xs text-amber-400/80">
                <span className="material-symbols-outlined text-sm">info</span>
                Vous pouvez continuer a utiliser la plateforme en attendant.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approved state */}
      {view === "approved" && (
        <div className="bg-emerald-500/5 rounded-2xl border border-emerald-500/20 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl text-emerald-400">
                verified
              </span>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg mb-1">
                Identite verifiee avec succes
              </h3>
              <p className="text-sm text-slate-400 mb-3">
                Votre identite a ete verifiee. Vous pouvez creer des formations et recevoir des paiements.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg text-xs font-semibold text-emerald-400">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Niveau {currentLevel}/4
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejected state */}
      {view === "rejected" && (
        <div className="bg-red-500/5 rounded-2xl border border-red-500/20 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl text-red-400">
                gpp_bad
              </span>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg mb-1">
                Verification refusee
              </h3>
              <p className="text-sm text-slate-400 mb-2">
                Votre derniere demande de verification a ete refusee. Vous pouvez soumettre une nouvelle demande ci-dessous.
              </p>
              {rejectionReason && (
                <div className="bg-red-500/10 rounded-lg p-3 mb-3 border border-red-500/10">
                  <p className="text-xs font-semibold text-red-400 mb-0.5">Motif du refus :</p>
                  <p className="text-sm text-red-300">{rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {(view === "form" || view === "rejected") && (
        <KycIndividualForm onSuccess={handleSuccess} />
      )}

      {/* History */}
      {requests.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400">history</span>
            Historique des demandes
          </h2>
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
                  {req.status === "approuve"
                    ? "Approuve"
                    : req.status === "refuse"
                      ? "Refuse"
                      : "En attente"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
