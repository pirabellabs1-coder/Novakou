// Refonte design "Stitch" — apprenant certificats — vert Novakou — 2026-06-13
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { StCard, StPageHeader, StButton, StChip, StKpiCompact, ST } from "@/components/stitch";
import {
  Award,
  Search,
  Download,
  Share2,
  X,
  Eye,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

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

// Gradients décoratifs du certificat (artefact visuel) — premier = vert Novakou
const GRADIENTS: [string, string][] = [
  ["#006e2f", "#22c55e"],
  ["#0b3b20", "#34b06a"],
  ["#0e7490", "#164e63"],
  ["#b45309", "#d97706"],
  ["#185fa5", "#22c55e"],
  ["#7c3aed", "#4f46e5"],
];

const levelTone: Record<string, "green" | "blue" | "amber" | "neutral"> = {
  DEBUTANT: "green",
  INTERMEDIAIRE: "blue",
  AVANCE: "amber",
};

function SkeletonRow() {
  return (
    <div className="rounded-[18px] bg-white overflow-hidden animate-pulse" style={{ border: `1px solid ${ST.cardBorder}` }}>
      <div className="flex">
        <div className="w-2 flex-shrink-0" style={{ background: "#f3f6f4" }} />
        <div className="flex items-start gap-4 p-5 flex-1">
          <div className="w-14 h-14 rounded-xl flex-shrink-0" style={{ background: "#f3f6f4" }} />
          <div className="flex-1 space-y-2">
            <div className="h-4 rounded w-2/3" style={{ background: "#f3f6f4" }} />
            <div className="h-3 rounded w-1/3" style={{ background: "#f3f6f4" }} />
            <div className="h-3 rounded w-1/2" style={{ background: "#f3f6f4" }} />
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

  const handleShareLinkedIn = (cert: Certificate) => {
    if (typeof window === "undefined") return;
    const issued = new Date(cert.issuedAt);
    const certUrl = `${window.location.origin}/certificat/${cert.code}`;
    const params = new URLSearchParams({
      startTask: "CERTIFICATION_NAME",
      name: cert.formation?.title ?? "Formation Novakou",
      organizationName: "Novakou",
      issueYear: String(issued.getFullYear()),
      issueMonth: String(issued.getMonth() + 1),
      certUrl,
      certId: cert.code,
    });
    window.open(
      `https://www.linkedin.com/profile/add?${params.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Mes certificats"
          subtitle={
            isLoading
              ? "Chargement…"
              : `${certs.length} certificat${certs.length > 1 ? "s" : ""} obtenu${certs.length > 1 ? "s" : ""} · Valides 5 ans`
          }
          actions={
            <>
              <StButton variant="secondary" href="/apprenant/mes-formations" icon={GraduationCap}>
                Mes formations
              </StButton>
              <StButton href="/explorer" icon={Search}>
                Explorer
              </StButton>
            </>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mb-4">
          <StKpiCompact label="Certificats obtenus" value={isLoading ? "…" : certs.length} icon={Award} tone="green" />
          <StKpiCompact label="Certifications valides" value={isLoading ? "…" : certs.length} icon={ShieldCheck} tone="green" />
          <StKpiCompact label="Téléchargeables" value={isLoading ? "…" : certs.length} icon={Download} tone="blue" />
        </div>

        {/* Certificate modal */}
        {selectedCert && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={() => setSelected(null)}
          >
            <div
              className="bg-white rounded-[20px] shadow-2xl max-w-2xl w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const idx = certs.findIndex((c) => c.id === selectedCert.id);
                const [gFrom, gTo] = GRADIENTS[idx % GRADIENTS.length];
                const issuedDate = new Date(selectedCert.issuedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
                return (
                  <div
                    className="relative p-10 text-center"
                    style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}
                  >
                    <div className="absolute inset-3 rounded-xl border-2 border-white/20 pointer-events-none" />
                    <div className="absolute inset-4 rounded-xl border border-white/10 pointer-events-none" />
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <span className="text-white font-black text-lg">NK</span>
                      </div>
                      <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-3">
                        Certificat de réussite
                      </p>
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
                <StButton onClick={() => handleDownloadPDF(selectedCert)} icon={Download} className="flex-1">
                  Télécharger PDF
                </StButton>
                <StButton variant="secondary" onClick={() => handleShareLinkedIn(selectedCert)} icon={Share2}>
                  LinkedIn
                </StButton>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2.5 rounded-[12px] transition-colors hover:bg-[#f1f5f3]"
                  style={{ border: `1px solid ${ST.cardBorder}`, color: ST.textSecondary }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="space-y-3.5">
            {[0, 1, 2].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : certs.length === 0 ? (
          <StCard className="!p-10 text-center">
            <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mx-auto mb-4" style={{ background: ST.greenSoft }}>
              <Award size={32} style={{ color: ST.green }} strokeWidth={1.8} />
            </div>
            <h3 className="text-[15px] font-extrabold mb-1.5" style={{ color: ST.text }}>Aucun certificat</h3>
            <p className="text-[13px] font-semibold mb-5 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
              Terminez une formation pour obtenir votre premier certificat reconnu par les recruteurs.
            </p>
            <StButton href="/apprenant/mes-formations" icon={GraduationCap}>Voir mes formations</StButton>
          </StCard>
        ) : (
          <div className="space-y-3.5">
            {certs.map((cert, idx) => {
              const [gFrom, gTo] = GRADIENTS[idx % GRADIENTS.length];
              const level = cert.formation?.level?.toUpperCase() ?? "";
              const issuedDate = new Date(cert.issuedAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <StCard key={cert.id} noPadding className="overflow-hidden">
                  <div className="flex">
                    <div
                      className="w-2 flex-shrink-0"
                      style={{ background: `linear-gradient(to bottom, ${gFrom}, ${gTo})` }}
                    />
                    <div className="flex items-start gap-4 p-5 flex-1 min-w-0">
                      <div
                        className="w-14 h-14 rounded-[13px] flex items-center justify-center flex-shrink-0 text-white"
                        style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}
                      >
                        <Award className="w-7 h-7" fill="currentColor" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {cert.formation?.customCategory && (
                            <StChip tone="green">{cert.formation.customCategory}</StChip>
                          )}
                          {level && (
                            <StChip tone={levelTone[level] ?? "neutral"}>
                              {level === "DEBUTANT"
                                ? "Débutant"
                                : level === "INTERMEDIAIRE"
                                  ? "Intermédiaire"
                                  : "Avancé"}
                            </StChip>
                          )}
                        </div>
                        <h3 className="font-extrabold text-[13.5px] leading-snug mb-2" style={{ color: ST.text }}>
                          {cert.formation?.title ?? "Formation Novakou"}
                        </h3>
                        <div className="flex items-center gap-3 text-[10px] font-semibold flex-wrap" style={{ color: ST.textMuted }}>
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Obtenu le {issuedDate}
                          </span>
                        </div>
                        {cert.score > 0 && (
                          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: ST.greenSoft, color: ST.green }}>
                            <CheckCircle2 className="w-3 h-3" />
                            Score : {cert.score}%
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <StButton size="sm" onClick={() => setSelected(cert.id)} icon={Eye}>
                          Voir
                        </StButton>
                        <StButton variant="secondary" size="sm" onClick={() => handleDownloadPDF(cert)} icon={Download}>
                          PDF
                        </StButton>
                      </div>
                    </div>
                  </div>
                </StCard>
              );
            })}
          </div>
        )}

        {/* Bandeau incitatif gradient vert */}
        <StCard className="mt-4 !p-0 overflow-hidden">
          <div className="text-center py-7 px-5" style={{ background: "linear-gradient(135deg,#f0faf3,#ffffff)" }}>
            <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mx-auto mb-3 text-white" style={{ background: ST.gradient }}>
              <Award className="w-6 h-6" fill="currentColor" />
            </div>
            <h3 className="font-extrabold mb-1 text-[15px]" style={{ color: ST.text }}>Obtenez plus de certificats</h3>
            <p className="text-[12px] font-semibold mb-4 max-w-md mx-auto" style={{ color: ST.textSecondary }}>
              Chaque formation complétée vous donne un certificat reconnu par les recruteurs et clients.
            </p>
            <StButton href="/explorer" icon={Sparkles}>Explorer les formations</StButton>
          </div>
        </StCard>
      </main>
    </div>
  );
}
