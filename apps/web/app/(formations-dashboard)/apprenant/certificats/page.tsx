"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

type Certificate = {
  id: string;
  code: string;
  issuedAt: string;
  score: number;
  formation?: {
    id: string;
    title: string;
    customCategory: string | null;
    level: string | null;
    rating: number | null;
    instructeurId: string | null;
  };
};

const GRADIENTS: [string, string][] = [
  ["#006e2f", "#22c55e"],
  ["#0f3460", "#16213e"],
  ["#7c3aed", "#4f46e5"],
  ["#b45309", "#d97706"],
  ["#0e7490", "#164e63"],
  ["#be185d", "#db2777"],
];

const levelColors: Record<string, string> = {
  DEBUTANT: "bg-green-100 text-green-700",
  INTERMEDIAIRE: "bg-blue-100 text-blue-700",
  AVANCE: "bg-purple-100 text-purple-700",
};

function SkeletonRow() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="flex">
        <div className="w-2 bg-gray-100 flex-shrink-0" />
        <div className="flex items-start gap-4 p-5 flex-1">
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-2/3" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CertificatsPage() {
  const { data: session } = useSession();
  const [selected, setSelected] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["apprenant-certificates"],
    queryFn: () => fetch("/api/formations/apprenant/certificates").then((r) => r.json()),
    staleTime: 60_000,
  });

  const certs: Certificate[] = data?.data ?? [];
  const selectedCert = certs.find((c) => c.id === selected);
  const displayName = session?.user?.name ?? "Apprenant";

  const handleDownloadPDF = (cert: Certificate) => {
    window.open(`/api/formations/apprenant/certificates/${cert.id}/pdf`, "_blank");
  };

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#191c1e]">Mes certificats</h1>
          <p className="text-sm text-[#5c647a] mt-0.5">
            {isLoading ? "Chargement…" : `${certs.length} certificat${certs.length > 1 ? "s" : ""} obtenu${certs.length > 1 ? "s" : ""} · Valides 5 ans`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: "workspace_premium", bg: "bg-purple-50",        color: "text-purple-600",    label: "Certificats obtenus",   value: isLoading ? "…" : String(certs.length) },
          { icon: "verified",          bg: "bg-[#006e2f]/10",     color: "text-[#006e2f]",     label: "Certifications valides", value: isLoading ? "…" : String(certs.length) },
          { icon: "share",             bg: "bg-blue-50",          color: "text-blue-600",      label: "Téléchargeables",        value: isLoading ? "…" : String(certs.length) },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${s.bg}`}>
              <span className={`material-symbols-outlined text-[18px] ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <p className="text-xl font-extrabold text-[#191c1e]">{s.value}</p>
            <p className="text-[10px] text-[#5c647a]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Certificate modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const idx = certs.findIndex((c) => c.id === selectedCert.id);
              const [gFrom, gTo] = GRADIENTS[idx % GRADIENTS.length];
              const issuedDate = new Date(selectedCert.issuedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
              const validDate = null; // validUntil not available in current schema
              return (
                <div className="relative p-10 text-center" style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}>
                  <div className="absolute inset-3 rounded-xl border-2 border-white/20 pointer-events-none" />
                  <div className="absolute inset-4 rounded-xl border border-white/10 pointer-events-none" />
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                      <span className="text-white font-black text-lg">NK</span>
                    </div>
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-3">Certificat de réussite</p>
                    <p className="text-white font-bold text-sm mb-1">Décerné à</p>
                    <p className="text-white font-black text-2xl mb-4">{displayName}</p>
                    <p className="text-white/80 text-xs mb-2">Pour avoir complété avec succès</p>
                    <p className="text-white font-bold text-base leading-snug mb-4 max-w-xs mx-auto">
                      {selectedCert.formation?.title ?? "Formation Novakou"}
                    </p>
                    <p className="text-white/70 text-xs mb-3">{issuedDate}</p>
                    {selectedCert.score > 0 && (
                      <div className="mb-4">
                        <span className="text-[9px] font-semibold px-3 py-1 rounded-full bg-white/20 text-white">
                          Score : {selectedCert.score}%
                        </span>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-white/20 text-[9px] text-white/60">
                      Certificat #{selectedCert.code} · Novakou
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="p-5 flex items-center gap-3 flex-wrap">
              <button onClick={() => handleDownloadPDF(selectedCert)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                <span className="material-symbols-outlined text-[16px]">download</span>
                Télécharger PDF
              </button>
              <button className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-[#191c1e] hover:bg-gray-50 transition-colors">
                <span className="material-symbols-outlined text-[16px] text-blue-600">share</span>
                LinkedIn
              </button>
              <button onClick={() => setSelected(null)} className="p-2.5 rounded-xl border border-gray-200 text-[#5c647a] hover:bg-gray-50 transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">{[0,1,2].map((i) => <SkeletonRow key={i} />)}</div>
      ) : certs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px] text-[#5c647a]">workspace_premium</span>
          </div>
          <h3 className="font-bold text-[#191c1e] mb-1">Aucun certificat</h3>
          <p className="text-sm text-[#5c647a] mb-4">Terminez une formation pour obtenir votre premier certificat.</p>
          <Link href="/apprenant/mes-formations"
            className="px-5 py-2.5 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
            Mes formations
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {certs.map((cert, idx) => {
            const [gFrom, gTo] = GRADIENTS[idx % GRADIENTS.length];
            const level = cert.formation?.level?.toUpperCase() ?? "";
            const issuedDate = new Date(cert.issuedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
            const validDate = null; // validUntil not available in current schema

            return (
              <div key={cert.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex">
                  <div className="w-2 flex-shrink-0" style={{ background: `linear-gradient(to bottom, ${gFrom}, ${gTo})` }} />
                  <div className="flex items-start gap-4 p-5 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}>
                      <span className="material-symbols-outlined text-white text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {cert.formation?.customCategory && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f]">
                            {cert.formation.customCategory}
                          </span>
                        )}
                        {level && (
                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${levelColors[level] ?? "bg-gray-100 text-gray-700"}`}>
                            {level === "DEBUTANT" ? "Débutant" : level === "INTERMEDIAIRE" ? "Intermédiaire" : "Avancé"}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-[#191c1e] text-sm leading-snug mb-2">
                        {cert.formation?.title ?? "Formation Novakou"}
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] text-[#5c647a] flex-wrap">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[11px]">verified</span>
                          Obtenu le {issuedDate}
                        </span>
                        {validDate && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[11px]">schedule</span>
                            Valide jusqu&apos;au {validDate}
                          </span>
                        )}
                      </div>
                      {cert.score > 0 && (
                        <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#006e2f]/10 text-[#006e2f]">
                          Score : {cert.score}%
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => setSelected(cert.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold hover:opacity-90 transition-opacity"
                        style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        Voir
                      </button>
                      <button onClick={() => handleDownloadPDF(cert)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-[#5c647a] hover:text-[#191c1e] hover:bg-gray-50 transition-colors">
                        <span className="material-symbols-outlined text-[14px]">download</span>
                        PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 bg-gradient-to-br from-[#006e2f]/5 to-[#22c55e]/5 rounded-2xl border border-[#006e2f]/10 p-6 text-center">
        <span className="material-symbols-outlined text-[32px] text-[#006e2f] mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
        <h3 className="font-bold text-[#191c1e] mb-1">Obtenez plus de certificats</h3>
        <p className="text-xs text-[#5c647a] mb-4">Chaque formation complétée vous donne un certificat reconnu par les recruteurs et clients.</p>
        <Link href="/explorer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90"
          style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
          <span className="material-symbols-outlined text-[16px]">explore</span>
          Explorer les formations
        </Link>
      </div>
    </div>
  );
}
