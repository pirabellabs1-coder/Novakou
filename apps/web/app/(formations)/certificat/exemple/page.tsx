import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, BadgeCheck, Share2, ArrowLeft } from "lucide-react";
import CertificateView from "@/components/formations/CertificateView";

export const metadata: Metadata = {
  title: "Exemple de certificat · Novakou",
  description:
    "Découvrez à quoi ressemble un certificat Novakou délivré à un apprenant après avoir terminé une formation.",
};

/**
 * /certificat/exemple — Aperçu publique du design du certificat avec
 * des données fictives. Utilise <CertificateView /> pour rester 100 %
 * cohérent avec un vrai certificat.
 */
export default function CertificateExamplePage() {
  return (
    <>
      <CertificateView
        studentName="Aminata Diallo"
        formationTitle="Vendre une formation en ligne en Afrique francophone"
        instructorName="Thomas Eko"
        issuedAt={new Date()}
        score={92}
        totalLessons={24}
        code="NK-EXEMPLE-AB12CD34"
        isPreview
      />

      {/* Info section "ce qui est inclus" */}
      <div
        className="px-4 pb-12 pt-2"
        style={{
          background: "linear-gradient(180deg, #f5f1e0 0%, #f0eee3 100%)",
        }}
      >
        <div className="max-w-[920px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {[
              {
                icon: Sparkles,
                title: "Délivré automatiquement",
                text: "Quand l'apprenant atteint 100 % de progression, le certificat est généré et envoyé par email.",
              },
              {
                icon: BadgeCheck,
                title: "Vérifiable publiquement",
                text: "Chaque certificat a un code unique consultable sur novakou.com/certificat/<code>.",
              },
              {
                icon: Share2,
                title: "Partageable LinkedIn",
                text: "Vos apprenants peuvent l'ajouter à leur profil LinkedIn en un clic.",
              },
            ].map((it, i) => (
              <div
                key={i}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-[#c9a961]/30"
              >
                <div className="w-9 h-9 rounded-xl bg-[#0d3b1f]/10 flex items-center justify-center mb-3">
                  <it.icon size={18} className="text-[#0d3b1f]" />
                </div>
                <p
                  className="text-sm font-bold text-[#0d3b1f] mb-1"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {it.title}
                </p>
                <p className="text-xs text-[#5c5c5c] leading-relaxed">
                  {it.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0d3b1f] hover:text-[#c9a961] transition-colors"
            >
              <ArrowLeft size={16} />
              Retour à Novakou
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
