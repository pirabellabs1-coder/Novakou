"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Award, Download, Linkedin, ExternalLink } from "lucide-react";

interface Certificate {
  id: string;
  code: string;
  score: number;
  issuedAt: string;
  pdfUrl: string | null;
  enrollment: {
    formation: {
      titleFr: string;
      titleEn: string;
      slug: string;
      thumbnail: string | null;
      instructeur: { user: { name: string } };
    };
  };
}

export default function MesCertificatsPage() {
  const locale = useLocale();
  const { data: session, status } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
    const title = fr ? cert.enrollment.formation.titleFr : (cert.enrollment.formation.titleEn || cert.enrollment.formation.titleFr);
    const url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`${window.location.origin}/formations/verification/${cert.code}`)}&title=${encodeURIComponent(title)}`;
    window.open(url, "_blank", "noopener");
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
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-slate-700 dark:text-slate-300 font-medium mb-2">
          {fr ? "Impossible de charger les certificats" : "Failed to load certificates"}
        </p>
        <button onClick={() => { setLoading(true); fetchCertificates(); }} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm">
          {fr ? "Réessayer" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-500/10 rounded-xl flex items-center justify-center">
          <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
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
        <div className="text-center py-16 bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
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
            const title = fr ? formation.titleFr : (formation.titleEn || formation.titleFr);

            return (
              <div
                key={cert.id}
                className="bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-4 sm:gap-6"
              >
                {/* Thumbnail */}
                <div className="w-24 h-16 bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded-xl flex-shrink-0 overflow-hidden">
                  {formation.thumbnail ? (
                    <img
                      src={formation.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Award className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />
                    </div>
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
                    <span>{fr ? "Score :" : "Score:"} <span className="text-slate-900 dark:text-white font-medium">{cert.score}%</span></span>
                    <span>{fr ? "Obtenu le" : "Earned on"} {new Date(cert.issuedAt).toLocaleDateString(fr ? "fr-FR" : "en-US")}</span>
                  </div>
                  <p className="font-mono text-xs text-slate-400 dark:text-slate-500 mt-1">{cert.code}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                  <Link
                    href={`/formations/certificats/${cert.id}`}
                    className="flex items-center gap-1.5 text-xs text-white bg-primary hover:bg-primary/90 px-3 py-2 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {fr ? "Voir" : "View"}
                  </Link>
                  {cert.pdfUrl && (
                    <a
                      href={cert.pdfUrl}
                      download
                      className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white dark:hover:text-white bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </a>
                  )}
                  <button
                    onClick={() => shareLinkedIn(cert)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    LinkedIn
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
