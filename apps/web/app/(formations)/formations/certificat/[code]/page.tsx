import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Certificat ${code} · Novakou`,
    description: `Certificat de complétion Novakou — code ${code}.`,
  };
}

export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const cert = await prisma.certificate.findUnique({
    where: { code },
    include: {
      user: { select: { name: true, image: true } },
      formation: {
        include: {
          sections: { include: { lessons: { select: { id: true } } } },
          instructeur: {
            include: { user: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!cert) notFound();

  const totalLessons = cert.formation.sections.reduce((sum, s) => sum + s.lessons.length, 0);

  const issuedDate = new Date(cert.issuedAt).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
  const isRevoked = !!cert.revokedAt;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f9fb] to-[#ecfdf5] py-12 px-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-4xl mx-auto">
        {/* Certificate card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-[#006e2f]/10">
          {/* Top ribbon */}
          <div className="h-3 bg-gradient-to-r from-[#006e2f] via-[#22c55e] to-[#006e2f]" />

          <div className="p-8 md:p-14">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#006e2f]/10 text-[#006e2f] text-[11px] font-extrabold uppercase tracking-[0.15em] mb-6">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                Certificat de complétion
              </div>
              <div className="inline-flex items-center gap-2.5 mb-2">
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: "#006e2f" }}>
                  <span className="text-white font-extrabold text-sm">NK</span>
                </div>
                <span className="font-extrabold text-[#191c1e] text-xl">Novakou</span>
              </div>
              <p className="text-xs text-[#5c647a]">Plateforme de formations & produits digitaux</p>
            </div>

            {/* Body */}
            <div className="text-center py-6 border-y border-gray-100">
              <p className="text-sm text-[#5c647a] mb-2">Ce certificat atteste que</p>
              <h1 className="text-3xl md:text-5xl font-extrabold text-[#191c1e] mb-5 leading-tight" style={{ fontFamily: "'Playfair Display', 'Plus Jakarta Sans', serif" }}>
                {cert.user.name ?? "Utilisateur"}
              </h1>
              <p className="text-sm text-[#5c647a] mb-2">a complété avec succès la formation</p>
              <h2 className="text-xl md:text-2xl font-bold text-[#006e2f] mb-3">
                « {cert.formation.title} »
              </h2>
              {cert.formation.instructeur?.user?.name && (
                <p className="text-xs text-[#5c647a]">
                  enseignée par <span className="font-semibold text-[#191c1e]">{cert.formation.instructeur.user.name}</span>
                </p>
              )}
            </div>

            {/* Footer info */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-1">Délivré le</p>
                <p className="text-sm font-bold text-[#191c1e]">{issuedDate}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-1">Score</p>
                <p className="text-sm font-bold text-[#006e2f]">{cert.score}/100</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-1">Leçons</p>
                <p className="text-sm font-bold text-[#191c1e]">{totalLessons}</p>
              </div>
            </div>

            {/* Code + signature */}
            <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-1">Code de vérification</p>
                <p className="text-xs font-mono font-bold text-[#191c1e] bg-gray-50 px-3 py-1.5 rounded">{cert.code}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[#006e2f] mb-0.5" style={{ fontFamily: "'Caveat', cursive, sans-serif" }}>Lissanon Gildas</p>
                <div className="h-px w-32 bg-[#191c1e] mx-auto mb-1"></div>
                <p className="text-[10px] font-semibold text-[#5c647a]">Fondateur & CEO · Novakou</p>
              </div>
            </div>

            {isRevoked && (
              <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-center">
                <p className="text-sm font-bold text-red-700">⚠️ Ce certificat a été révoqué.</p>
              </div>
            )}
          </div>

          <div className="h-3 bg-gradient-to-r from-[#006e2f] via-[#22c55e] to-[#006e2f]" />
        </div>

        {/* Verify section */}
        <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-100 text-center">
          <p className="text-xs font-bold text-[#006e2f] uppercase tracking-wider mb-1">✓ Certificat vérifié</p>
          <p className="text-sm text-[#5c647a]">
            Ce certificat a été délivré par Novakou et est authentique.<br/>
            Pour toute question, contactez <a href="mailto:support@freelancehigh.com" className="text-[#006e2f] font-semibold">support@freelancehigh.com</a>.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/formations" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#006e2f] hover:underline">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Retour à Novakou
          </Link>
        </div>
      </div>
    </div>
  );
}
