"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Award, Download, Linkedin, ExternalLink, ShieldCheck } from "lucide-react";

interface Certificate {
  id: string;
  code: string;
  score: number;
  issuedAt: string;
  pdfUrl: string | null;
  formationId: string;
  enrollment: {
    formation: {
      title: string;
      slug: string;
      thumbnail: string | null;
      instructeur: { user: { name: string } };
    };
  };
}

export default function MesCertificatsPage() {
  const locale = useLocale();
  const { status } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchCertificates = () => {
    setError(false);
    fetch("/api/apprenant/certificats")
      .then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json();
      })
      .then((d) => { setCertificates(d.certificates ?? []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  };

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/formations/connexion"); return; }
    if (status !== "authenticated") return;
    fetchCertificates();
  }, [status, router]);

  const shareLinkedIn = (cert: Certificate) => {
    const title = cert.enrollment.formation.title;
    const url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`${window.location.origin}/formations/verification/${cert.code}`)}&title=${encodeURIComponent(title)}`;
    window.open(url, "_blank", "noopener");
  };

  const downloadPdf = async (cert: Certificate) => {
    setDownloadingId(cert.id);
    try {
      const res = await fetch(`/api/formations/${cert.formationId}/certificate`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificat-${cert.code}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silent fail
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          {[1, 2].map((i) => (
            <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="text-4xl mb-4">&#9888;&#65039;</div>
        <p className="text-slate-700 dark:text-slate-300 font-medium mb-2">
          {fr ? "Impossible de charger les certificats" : "Failed to load certificates"}
        </p>
        <button onClick={() => { setLoading(true); fetchCertificates(); }} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm">
          {fr ? "Reessayer" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Award className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {fr ? "Mes certifications" : "My Certifications"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {certificates.length} {fr ? "certification" : "certification"}{certificates.length > 1 ? "s" : ""} {fr ? "obtenue" : "earned"}{certificates.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Award className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {fr ? "Vous n'avez pas encore de certification." : "You don't have any certifications yet."}
          </p>
          <Link
            href="/formations/mes-formations"
            className="text-primary hover:underline text-sm"
          >
            {fr ? "Voir mes formations en cours" : "View my courses in progress"}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {certificates.map((cert) => {
            const formation = cert.enrollment.formation;
            const title = formation.title;
            const scoreColor =
              cert.score >= 90 ? "text-emerald-600 dark:text-emerald-400" :
              cert.score >= 70 ? "text-blue-600 dark:text-blue-400" :
              "text-violet-600 dark:text-violet-400";

            return (
              <div
                key={cert.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-lg hover:border-amber-200 dark:hover:border-amber-500/20 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                  {/* Thumbnail / Certificate icon */}
                  <div className="w-24 h-16 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-500/10 dark:to-amber-500/5 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center border border-amber-200/50 dark:border-amber-500/20">
                    {formation.thumbnail ? (
                      <img
                        src={formation.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Award className="w-8 h-8 text-amber-500 dark:text-amber-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {formation.instructeur.user.name}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Score: <span className={`font-bold ${scoreColor}`}>{cert.score}%</span>
                      </span>
                      <span>
                        {fr ? "Obtenu le" : "Earned on"}{" "}
                        {new Date(cert.issuedAt).toLocaleDateString(fr ? "fr-FR" : "en-US")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                        {cert.code}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                    <Link
                      href={`/formations/certificats/${cert.id}`}
                      className="flex items-center gap-1.5 text-xs text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 px-3 py-2 rounded-lg transition-all font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {fr ? "Voir" : "View"}
                    </Link>
                    <button
                      onClick={() => downloadPdf(cert)}
                      disabled={downloadingId === cert.id}
                      className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 px-3 py-2 rounded-lg transition-colors font-medium"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </button>
                    <button
                      onClick={() => shareLinkedIn(cert)}
                      className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-3 py-2 rounded-lg transition-colors font-medium"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      LinkedIn
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
