import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Exemple de certificat · Novakou",
  description:
    "Découvrez à quoi ressemble un certificat Novakou délivré à un apprenant après avoir terminé une formation.",
};

/**
 * /certificat/exemple — Aperçu publique du design du certificat avec
 * des données fictives. Permet aux vendeurs et apprenants de voir le
 * rendu avant qu'aucun certificat réel n'ait été émis.
 */
export default function CertificateExamplePage() {
  const sample = {
    code: "NK-EXEMPLE-AB12CD34",
    issuedAt: new Date(),
    score: 92,
    studentName: "Aminata Diallo",
    formationTitle: "Vendre une formation en ligne en Afrique francophone",
    instructorName: "Thomas Eko",
    totalLessons: 24,
  };

  const issuedDate = sample.issuedAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#f7f9fb] to-[#ecfdf5] py-12 px-4"
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Sample banner */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 flex items-start gap-3">
          <span
            className="material-symbols-outlined text-amber-600 text-[18px] mt-0.5 flex-shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            preview
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900 mb-0.5">
              Exemple de certificat — données fictives
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Voici à quoi ressemble un certificat Novakou. Vos apprenants en
              recevront un automatiquement à 100 % de progression, par email et
              dans leur espace.
            </p>
          </div>
        </div>

        {/* Certificate card — identique au rendu réel /certificat/[code] */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-[#006e2f]/10">
          <div className="h-3 bg-gradient-to-r from-[#006e2f] via-[#22c55e] to-[#006e2f]" />

          <div className="p-8 md:p-14">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#006e2f]/10 text-[#006e2f] text-[11px] font-extrabold uppercase tracking-[0.15em] mb-6">
                <span
                  className="material-symbols-outlined text-[14px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  workspace_premium
                </span>
                Certificat de complétion
              </div>
              <div className="inline-flex items-center gap-2.5 mb-2">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                  style={{ background: "#006e2f" }}
                >
                  <span className="text-white font-extrabold text-sm">NK</span>
                </div>
                <span className="font-extrabold text-[#191c1e] text-xl">
                  Novakou
                </span>
              </div>
              <p className="text-xs text-[#5c647a]">
                Plateforme de formations & produits digitaux
              </p>
            </div>

            {/* Body */}
            <div className="text-center py-6 border-y border-gray-100">
              <p className="text-sm text-[#5c647a] mb-2">
                Ce certificat atteste que
              </p>
              <h1
                className="text-3xl md:text-5xl font-extrabold text-[#191c1e] mb-5 leading-tight"
                style={{ fontFamily: "'Playfair Display', 'Manrope', serif" }}
              >
                {sample.studentName}
              </h1>
              <p className="text-sm text-[#5c647a] mb-2">
                a complété avec succès la formation
              </p>
              <h2 className="text-xl md:text-2xl font-bold text-[#006e2f] mb-3">
                « {sample.formationTitle} »
              </h2>
              <p className="text-xs text-[#5c647a]">
                enseignée par{" "}
                <span className="font-semibold text-[#191c1e]">
                  {sample.instructorName}
                </span>
              </p>
            </div>

            {/* Footer info */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-1">
                  Délivré le
                </p>
                <p className="text-sm font-bold text-[#191c1e]">{issuedDate}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-1">
                  Score
                </p>
                <p className="text-sm font-bold text-[#006e2f]">
                  {sample.score}/100
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-1">
                  Leçons
                </p>
                <p className="text-sm font-bold text-[#191c1e]">
                  {sample.totalLessons}
                </p>
              </div>
            </div>

            {/* Code + signature */}
            <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-wider mb-1">
                  Code de vérification
                </p>
                <p className="text-xs tabular-nums font-bold text-[#191c1e] bg-gray-50 px-3 py-1.5 rounded">
                  {sample.code}
                </p>
              </div>
              <div className="text-center">
                <p
                  className="text-lg font-bold text-[#006e2f] mb-0.5"
                  style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                >
                  Pirabel Labs
                </p>
                <div className="h-px w-32 bg-[#191c1e] mx-auto mb-1"></div>
                <p className="text-[10px] font-semibold text-[#5c647a]">
                  Fondateur &amp; CEO · Novakou
                </p>
              </div>
            </div>
          </div>

          <div className="h-3 bg-gradient-to-r from-[#006e2f] via-[#22c55e] to-[#006e2f]" />
        </div>

        {/* Info section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: "auto_awesome",
              title: "Délivré automatiquement",
              text: "Quand l'apprenant atteint 100 % de progression, le certificat est généré et envoyé par email.",
            },
            {
              icon: "verified",
              title: "Code de vérification unique",
              text: "Chaque certificat a un code public vérifiable via /certificat/<code>.",
            },
            {
              icon: "share",
              title: "Partageable LinkedIn",
              text: "Vos apprenants peuvent l'ajouter directement à leur profil LinkedIn en un clic.",
            },
          ].map((it, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-gray-100"
            >
              <div className="w-9 h-9 rounded-xl bg-[#006e2f]/10 flex items-center justify-center mb-3">
                <span
                  className="material-symbols-outlined text-[18px] text-[#006e2f]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {it.icon}
                </span>
              </div>
              <p className="text-sm font-bold text-[#191c1e] mb-1">
                {it.title}
              </p>
              <p className="text-xs text-[#5c647a] leading-relaxed">
                {it.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#006e2f] hover:underline"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            Retour à Novakou
          </Link>
        </div>
      </div>
    </div>
  );
}
