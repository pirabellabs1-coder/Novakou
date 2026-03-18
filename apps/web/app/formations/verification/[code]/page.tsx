"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { CheckCircle, XCircle, Award, User, BookOpen, Calendar, Star, ArrowLeft, ExternalLink } from "lucide-react";

// ── Types matching API response shape ──────────────────────────

interface CertificateData {
  code: string;
  score: number;
  issuedAt: string;
  userName: string;
  userCountry: string | null;
  formationTitleFr: string;
  formationTitleEn: string | null;
  formationSlug: string;
  formationDuration: number;
  instructorName: string;
}

interface VerifyResult {
  valid: boolean;
  revoked?: boolean;
  certificate?: CertificateData;
}

// ── Page ──────────────────────────────────────────────────────

export default function CertificateVerificationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const locale = useLocale();

  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/formations/certificats/verify/${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data: VerifyResult) => { setResult(data); setLoading(false); })
      .catch(() => { setResult({ valid: false }); setLoading(false); });
  }, [code]);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    return h > 0 ? `${h}h` : `${minutes}min`;
  };

  const formationTitle = result?.certificate
    ? (locale === "fr" ? result.certificate.formationTitleFr : (result.certificate.formationTitleEn || result.certificate.formationTitleFr))
    : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">{locale === "fr" ? "Vérification en cours..." : "Verifying..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link href="/formations" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {locale === "fr" ? "Retour aux formations" : "Back to courses"}
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-black tracking-tight text-primary">
              Freelance<span className="text-slate-900 dark:text-white">High</span>
            </span>
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {locale === "fr" ? "Plateforme de vérification de certificats" : "Certificate Verification Platform"}
          </p>
        </div>

        {/* Main card */}
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Status header */}
          <div className={`p-6 text-center ${result?.valid ? "bg-gradient-to-r from-green-500 to-emerald-600" : "bg-gradient-to-r from-red-500 to-rose-600"}`}>
            <div className="flex justify-center mb-3">
              {result?.valid ? (
                <CheckCircle className="w-16 h-16 text-white" />
              ) : (
                <XCircle className="w-16 h-16 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {result?.valid
                ? (locale === "fr" ? "Ce certificat est authentique" : "This certificate is authentic")
                : result?.revoked
                  ? (locale === "fr" ? "Ce certificat a été révoqué" : "This certificate has been revoked")
                  : (locale === "fr" ? "Certificat introuvable" : "Certificate not found")}
            </h1>
            <p className="text-white/80 text-sm">
              {locale === "fr" ? "Code de vérification :" : "Verification code:"}{" "}
              <span className="font-mono font-bold text-white">{code}</span>
            </p>
          </div>

          {/* Details */}
          {result?.valid && result.certificate && (
            <div className="p-6 space-y-5">
              {/* Student */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700/50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{locale === "fr" ? "Délivré à" : "Issued to"}</p>
                  <p className="font-bold text-slate-900 dark:text-white text-lg">{result.certificate.userName}</p>
                </div>
              </div>

              {/* Formation */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700/50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                    {locale === "fr" ? "Pour avoir complété avec succès" : "For successfully completing"}
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white">{formationTitle}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {locale === "fr" ? "Durée :" : "Duration:"} {formatDuration(result.certificate.formationDuration)}
                  </p>
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-700/50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{locale === "fr" ? "Instructeur" : "Instructor"}</p>
                  <p className="font-bold text-slate-900 dark:text-white">{result.certificate.instructorName}</p>
                </div>
              </div>

              {/* Score + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                  <Award className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">{locale === "fr" ? "Score obtenu" : "Score"}</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{result.certificate.score}%</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">{locale === "fr" ? "Date d'obtention" : "Issue date"}</p>
                  <p className="font-bold text-blue-700 dark:text-blue-400">
                    {new Date(result.certificate.issuedAt).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US")}
                  </p>
                </div>
              </div>

              {/* Link to formation */}
              <Link
                href={`/formations/${result.certificate.formationSlug}`}
                className="flex items-center justify-center gap-2 w-full border border-primary text-primary font-medium py-3 rounded-xl hover:bg-primary/5 transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                {locale === "fr" ? "Voir la formation" : "View the course"}
              </Link>
            </div>
          )}

          {!result?.valid && (
            <div className="p-6 text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {result?.revoked
                  ? (locale === "fr" ? "Ce certificat a été invalidé par l'administrateur de la plateforme." : "This certificate has been invalidated by the platform administrator.")
                  : (locale === "fr" ? "Ce code de certificat ne correspond à aucun certificat valide dans notre système." : "This certificate code does not match any valid certificate in our system.")}
              </p>
              <Link href="/formations" className="text-primary text-sm hover:underline">
                {locale === "fr" ? "Retour aux formations" : "Back to courses"}
              </Link>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          {locale === "fr"
            ? "Ce système de vérification garantit l'authenticité des certificats délivrés par FreelanceHigh."
            : "This verification system guarantees the authenticity of certificates issued by FreelanceHigh."}
        </p>
      </div>
    </div>
  );
}
