"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Award,
  Download,
  Linkedin,
  CheckCircle,
  Share2,
  Printer,
  ArrowLeft,
  ShieldCheck,
  QrCode,
} from "lucide-react";

interface CertificateDetail {
  id: string;
  code: string;
  score: number;
  issuedAt: string;
  pdfUrl: string | null;
  formationId: string;
  user: { name: string };
  formation: {
    title: string;
    slug: string;
    duration: number;
  };
  enrollment: {
    formation: {
      instructeur: { user: { name: string } };
    };
  };
}

export default function CertificatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const locale = useLocale();
  const { status } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const [cert, setCert] = useState<CertificateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/formations/connexion");
      return;
    }
    if (status !== "authenticated") return;

    fetch(`/api/apprenant/certificats/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => {
        setCert(d.certificate ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, status, router]);

  const copyLink = () => {
    if (!cert) return;
    navigator.clipboard.writeText(
      `${window.location.origin}/formations/verification/${cert.code}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinkedIn = () => {
    if (!cert) return;
    const title = cert.formation.title;
    const url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
      `${window.location.origin}/formations/verification/${cert.code}`
    )}&title=${encodeURIComponent(title)}`;
    window.open(url, "_blank", "noopener");
  };

  const downloadPdf = async () => {
    if (!cert) return;
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/formations/${cert.formationId}/certificate`
      );
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
      alert(
        fr
          ? "Erreur lors du telechargement"
          : "Error downloading certificate"
      );
    } finally {
      setDownloading(false);
    }
  };

  const printCertificate = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/10 rounded-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48" />
        </div>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="flex items-center justify-center text-center py-20">
        <div>
          <Award className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 mb-4 text-lg">
            {fr ? "Certificat introuvable" : "Certificate not found"}
          </p>
          <Link
            href="/formations/certificats"
            className="text-primary hover:underline text-sm"
          >
            {fr ? "Mes certifications" : "My Certifications"}
          </Link>
        </div>
      </div>
    );
  }

  const formation = cert.formation;
  const instructorName =
    cert.enrollment.formation.instructeur?.user?.name ?? "Instructeur";
  const formattedDate = new Date(cert.issuedAt).toLocaleDateString(
    fr ? "fr-FR" : "en-US",
    { day: "numeric", month: "long", year: "numeric" }
  );
  const durationHours = Math.round(formation.duration / 60);
  const scoreColor =
    cert.score >= 90
      ? "text-emerald-600"
      : cert.score >= 70
        ? "text-blue-600"
        : "text-violet-600";

  return (
    <div className="max-w-5xl mx-auto py-4">
      {/* Back link */}
      <Link
        href="/formations/certificats"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors print:hidden"
      >
        <ArrowLeft className="w-4 h-4" />
        {fr ? "Mes certifications" : "My Certifications"}
      </Link>

      {/* ==================== CERTIFICATE VISUAL ==================== */}
      <div
        id="certificate-visual"
        className="relative bg-gradient-to-br from-amber-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-2 border-amber-300/60 dark:border-amber-500/30 rounded-sm overflow-hidden shadow-2xl aspect-[297/210]"
      >
        {/* Outer gold border frame */}
        <div className="absolute inset-3 border-2 border-amber-400/40 dark:border-amber-500/20 rounded-sm pointer-events-none" />
        <div className="absolute inset-5 border border-amber-300/30 dark:border-amber-500/15 rounded-sm pointer-events-none" />

        {/* Top color strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-blue-500 to-emerald-500" />

        {/* Bottom color strip */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-600" />

        {/* Corner ornaments */}
        <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-amber-400/50 dark:border-amber-500/30" />
        <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-amber-400/50 dark:border-amber-500/30" />
        <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-amber-400/50 dark:border-amber-500/30" />
        <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-amber-400/50 dark:border-amber-500/30" />

        {/* Subtle watermark pattern */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 30px, #6C2BD9 30px, #6C2BD9 31px)`,
          }}
        />

        {/* Certificate content */}
        <div className="relative h-full flex flex-col items-center justify-between px-8 py-8 sm:px-12 sm:py-10 md:px-16 md:py-12">
          {/* Header: Brand */}
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-700 to-violet-500 dark:from-violet-400 dark:to-violet-300 bg-clip-text text-transparent tracking-wide">
              FreelanceHigh
            </h2>
            <p className="text-[10px] sm:text-xs text-blue-500/70 dark:text-blue-400/60 tracking-[0.2em] uppercase mt-0.5">
              Formations & Certifications
            </p>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-amber-400/50" />
              <div className="w-1.5 h-1.5 bg-amber-400/60 rotate-45" />
              <div className="w-2 h-2 bg-amber-400/80 rotate-45" />
              <div className="w-1.5 h-1.5 bg-amber-400/60 rotate-45" />
              <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-amber-400/50" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center -mt-1">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-[0.15em] text-slate-800 dark:text-slate-100 uppercase">
              {fr ? "Certificat de Reussite" : "Certificate of Completion"}
            </h1>
            {/* Double underline */}
            <div className="mt-2 flex flex-col items-center gap-1">
              <div className="h-0.5 w-40 sm:w-56 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              <div className="h-px w-28 sm:w-40 bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
            </div>
          </div>

          {/* Subtitle + Name */}
          <div className="text-center -mt-1">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
              {fr ? "Ce certificat atteste que" : "This certifies that"}
            </p>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-violet-700 dark:text-violet-400 mt-2 font-serif">
              {cert.user.name}
            </h3>
            {/* Decorative line under name */}
            <div className="mt-1.5 flex items-center justify-center gap-1">
              <div className="w-1 h-1 rounded-full bg-emerald-500/60" />
              <div className="h-px w-24 sm:w-48 bg-violet-400/30" />
              <div className="w-1 h-1 rounded-full bg-emerald-500/60" />
            </div>
          </div>

          {/* "Has completed" + Formation Title */}
          <div className="text-center -mt-1">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {fr
                ? "a complete avec succes la formation"
                : "has successfully completed the course"}
            </p>
            <h4 className="text-base sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1.5 max-w-lg mx-auto leading-tight">
              {formation.title}
            </h4>
          </div>

          {/* Details row: Score | Date | Duration | Instructor */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 -mt-1">
            <div className="text-center px-3 sm:px-5 py-2 bg-white/60 dark:bg-slate-700/40 rounded-lg border border-slate-200/50 dark:border-slate-600/30">
              <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
                Score
              </p>
              <p
                className={`text-lg sm:text-2xl font-bold ${scoreColor} dark:${scoreColor.replace("600", "400")}`}
              >
                {cert.score}%
              </p>
            </div>
            <div className="text-center px-3 sm:px-5 py-2 bg-white/60 dark:bg-slate-700/40 rounded-lg border border-slate-200/50 dark:border-slate-600/30">
              <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
                Date
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                {formattedDate}
              </p>
            </div>
            <div className="text-center px-3 sm:px-5 py-2 bg-white/60 dark:bg-slate-700/40 rounded-lg border border-slate-200/50 dark:border-slate-600/30">
              <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
                {fr ? "Duree" : "Duration"}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                {durationHours}h
              </p>
            </div>
            <div className="text-center px-3 sm:px-5 py-2 bg-white/60 dark:bg-slate-700/40 rounded-lg border border-slate-200/50 dark:border-slate-600/30">
              <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
                {fr ? "Instructeur" : "Instructor"}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                {instructorName}
              </p>
            </div>
          </div>

          {/* Signature + Seal + QR */}
          <div className="w-full flex items-end justify-between -mt-1">
            {/* QR Code area */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md flex items-center justify-center p-1">
                <QrCode className="w-full h-full text-violet-600 dark:text-violet-400 opacity-60" />
              </div>
              <Link
                href={`/formations/verification/${cert.code}`}
                target="_blank"
                className="text-[8px] sm:text-[9px] text-violet-500/70 hover:text-violet-600 transition-colors"
              >
                {fr ? "Verifier" : "Verify"}
              </Link>
            </div>

            {/* Center: Signature */}
            <div className="text-center flex-1 px-4">
              {/* Signature line */}
              <div className="border-b border-slate-300 dark:border-slate-600 w-36 sm:w-48 mx-auto mb-1" />
              <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500">
                {fr ? "Delivre et signe par" : "Issued and signed by"}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                {instructorName}
              </p>
            </div>

            {/* Official seal */}
            <div className="flex flex-col items-center gap-1">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                <div className="absolute inset-0 rounded-full border-2 border-amber-400/60 dark:border-amber-500/40" />
                <div className="absolute inset-1.5 rounded-full border border-amber-300/40 dark:border-amber-500/25" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 dark:text-amber-400" />
                  <span className="text-[6px] sm:text-[7px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase mt-0.5">
                    {fr ? "Certifie" : "Certified"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer: Code + Platform */}
          <div className="text-center -mt-1">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              <span className="font-mono text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 tracking-wider">
                {cert.code}
              </span>
            </div>
            <p className="text-[8px] sm:text-[9px] text-slate-400/60 dark:text-slate-500/60">
              FreelanceHigh — {fr
                ? "La plateforme freelance qui eleve votre carriere au plus haut niveau"
                : "The freelance platform that elevates your career to the highest level"
              }
            </p>
          </div>
        </div>
      </div>

      {/* ==================== ACTION BUTTONS ==================== */}
      <div className="mt-8 print:hidden">
        <div className="flex flex-wrap gap-3 justify-center">
          {/* Download PDF — always available */}
          <button
            onClick={downloadPdf}
            disabled={downloading}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-violet-500/20 text-sm"
          >
            <Download className="w-4 h-4" />
            {downloading
              ? fr
                ? "Telechargement..."
                : "Downloading..."
              : fr
                ? "Telecharger le PDF"
                : "Download PDF"}
          </button>

          {/* Print */}
          <button
            onClick={printCertificate}
            className="flex items-center gap-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-medium px-5 py-3 rounded-xl transition-colors text-sm"
          >
            <Printer className="w-4 h-4" />
            {fr ? "Imprimer" : "Print"}
          </button>

          {/* LinkedIn */}
          <button
            onClick={shareLinkedIn}
            className="flex items-center gap-2 bg-[#0077B5] hover:bg-[#006699] text-white font-medium px-5 py-3 rounded-xl transition-colors text-sm"
          >
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </button>

          {/* Copy verification link */}
          <button
            onClick={copyLink}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium px-5 py-3 rounded-xl transition-colors text-sm"
          >
            <Share2 className="w-4 h-4" />
            {copied
              ? fr
                ? "Lien copie !"
                : "Link Copied!"
              : fr
                ? "Copier le lien"
                : "Copy Link"}
          </button>
        </div>

        {/* Verification info */}
        <div className="mt-6 text-center">
          <Link
            href={`/formations/verification/${cert.code}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <ShieldCheck className="w-4 h-4" />
            {fr
              ? "Page de verification publique"
              : "Public verification page"}
          </Link>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #certificate-visual,
          #certificate-visual * {
            visibility: visible;
          }
          #certificate-visual {
            position: fixed;
            top: 0;
            left: 0;
            width: 297mm;
            height: 210mm;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
