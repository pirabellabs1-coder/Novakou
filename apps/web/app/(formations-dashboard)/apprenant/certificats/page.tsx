// Refonte style KAZA — apprenant certificats — 2026-06-07
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";
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
  Clock,
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

const GRADIENTS: [string, string][] = [
  ["#0b2540", "#1a4a7d"],
  ["#103057", "#22c55e"],
  ["#7c3aed", "#4f46e5"],
  ["#b45309", "#d97706"],
  ["#0e7490", "#164e63"],
  ["#be185d", "#db2777"],
];

const levelVariant: Record<string, "green" | "blue" | "violet" | "slate"> = {
  DEBUTANT: "green",
  INTERMEDIAIRE: "blue",
  AVANCE: "violet",
};

function SkeletonRow() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse">
      <div className="flex">
        <div className="w-2 bg-slate-100 flex-shrink-0" />
        <div className="flex items-start gap-4 p-5 flex-1">
          <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded w-2/3" />
            <div className="h-3 bg-slate-100 rounded w-1/3" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
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
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
      <KazaHero
        badge="Apprenant"
        badgeColor="blue"
        icon={Award}
        title="Mes certificats"
        subtitle={
          isLoading
            ? "Chargement…"
            : `${certs.length} certificat${certs.length > 1 ? "s" : ""} obtenu${certs.length > 1 ? "s" : ""} · Valides 5 ans`
        }
        actions={
          <>
            <KazaButton variant="secondary" href="/apprenant/mes-formations" icon={GraduationCap}>
              Mes formations
            </KazaButton>
            <KazaButton variant="primary" href="/explorer" icon={Search}>
              Explorer
            </KazaButton>
          </>
        }
      />

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <KazaKpiCard
          label="Certificats obtenus"
          value={isLoading ? "…" : certs.length}
          icon={Award}
          iconColor="violet"
        />
        <KazaKpiCard
          label="Certifications valides"
          value={isLoading ? "…" : certs.length}
          icon={ShieldCheck}
          iconColor="emerald"
        />
        <KazaKpiCard
          label="Téléchargeables"
          value={isLoading ? "…" : certs.length}
          icon={Download}
          iconColor="sky"
        />
      </section>

      {/* Certificate modal */}
      {selectedCert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
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
              <KazaButton
                variant="primary"
                onClick={() => handleDownloadPDF(selectedCert)}
                icon={Download}
                className="flex-1"
              >
                Télécharger PDF
              </KazaButton>
              <KazaButton
                variant="ghost"
                onClick={() => handleShareLinkedIn(selectedCert)}
                icon={Share2}
              >
                LinkedIn
              </KazaButton>
              <button
                onClick={() => setSelected(null)}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : certs.length === 0 ? (
        <KazaEmpty
          icon={Award}
          title="Aucun certificat"
          description="Terminez une formation pour obtenir votre premier certificat reconnu par les recruteurs."
          action={{ label: "Voir mes formations", href: "/apprenant/mes-formations" }}
        />
      ) : (
        <div className="space-y-4">
          {certs.map((cert, idx) => {
            const [gFrom, gTo] = GRADIENTS[idx % GRADIENTS.length];
            const level = cert.formation?.level?.toUpperCase() ?? "";
            const issuedDate = new Date(cert.issuedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={cert.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex">
                  <div
                    className="w-2 flex-shrink-0"
                    style={{ background: `linear-gradient(to bottom, ${gFrom}, ${gTo})` }}
                  />
                  <div className="flex items-start gap-4 p-5 flex-1 min-w-0">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
                      style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}
                    >
                      <Award className="w-7 h-7" fill="currentColor" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {cert.formation?.customCategory && (
                          <KazaBadge variant="green" size="sm">
                            {cert.formation.customCategory}
                          </KazaBadge>
                        )}
                        {level && (
                          <KazaBadge variant={levelVariant[level] ?? "slate"} size="sm">
                            {level === "DEBUTANT"
                              ? "Débutant"
                              : level === "INTERMEDIAIRE"
                                ? "Intermédiaire"
                                : "Avancé"}
                          </KazaBadge>
                        )}
                      </div>
                      <h3 className="font-bold text-[#0b2540] text-sm leading-snug mb-2">
                        {cert.formation?.title ?? "Formation Novakou"}
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Obtenu le {issuedDate}
                        </span>
                      </div>
                      {cert.score > 0 && (
                        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />
                          Score : {cert.score}%
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <KazaButton
                        variant="primary"
                        size="sm"
                        onClick={() => setSelected(cert.id)}
                        icon={Eye}
                      >
                        Voir
                      </KazaButton>
                      <KazaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPDF(cert)}
                        icon={Download}
                      >
                        PDF
                      </KazaButton>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <KazaCard variant="highlighted">
        <div className="text-center py-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-3 text-white">
            <Award className="w-6 h-6" fill="currentColor" />
          </div>
          <h3 className="font-bold text-[#0b2540] mb-1">Obtenez plus de certificats</h3>
          <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
            Chaque formation complétée vous donne un certificat reconnu par les recruteurs et clients.
          </p>
          <KazaButton variant="primary" href="/explorer" icon={Sparkles}>
            Explorer les formations
          </KazaButton>
        </div>
      </KazaCard>
    </div>
  );
}
