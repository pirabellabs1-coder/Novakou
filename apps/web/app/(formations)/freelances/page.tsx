import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Freelances & Mentors · Novakou",
  description: "Découvrez les meilleurs créateurs et mentors d'Afrique francophone. Formations, coaching, expertise.",
};

const SPECIALTIES = [
  { icon: "code", label: "Développement", count: "120+", color: "#006e2f" },
  { icon: "campaign", label: "Marketing digital", count: "85+", color: "#dc2626" },
  { icon: "palette", label: "Design", count: "60+", color: "#8b5cf6" },
  { icon: "monitoring", label: "Business & Stratégie", count: "75+", color: "#0ea5e9" },
  { icon: "edit", label: "Rédaction & Contenu", count: "40+", color: "#f59e0b" },
  { icon: "smart_toy", label: "Intelligence artificielle", count: "30+", color: "#7c3aed" },
];

const PERKS = [
  { icon: "verified", title: "Profils vérifiés", desc: "Chaque créateur est validé manuellement par notre équipe avant d'apparaître sur la marketplace." },
  { icon: "trending_up", title: "Notes & avis transparents", desc: "Les évaluations sont laissées par de vrais acheteurs. Pas de modération abusive." },
  { icon: "support_agent", title: "Support client réactif", desc: "En cas de problème avec un créateur, notre support intervient sous 24h." },
  { icon: "verified_user", title: "Garantie satisfait", desc: "14 jours pour tester. Si ça ne convient pas, remboursement intégral." },
];

export default function FreelancesPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
      {/* HERO */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#006e2f] bg-[#006e2f]/10 px-3 py-1 rounded-full mb-4">
            Mentors & créateurs
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#191c1e] leading-tight tracking-tight">
            Apprenez avec les meilleurs <br /> créateurs d&apos;Afrique francophone
          </h1>
          <p className="text-lg text-[#5c647a] mt-5 max-w-2xl mx-auto">
            Des mentors experts qui partagent leur savoir à travers formations, e-books, coaching individuel et templates.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link href="/mentors" className="px-7 py-4 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg" style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
              Découvrir tous les mentors
            </Link>
            <Link href="/inscription?role=instructeur" className="px-7 py-4 rounded-2xl bg-slate-100 text-[#191c1e] font-bold text-sm hover:bg-slate-200 transition-colors">
              Devenir créateur
            </Link>
          </div>
        </div>
      </section>

      {/* SPECIALTIES */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#006e2f] mb-3">Spécialités</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#191c1e] tracking-tight">Une expertise dans tous les domaines</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {SPECIALTIES.map((s) => (
              <Link
                key={s.label}
                href={`/explorer?category=${encodeURIComponent(s.label)}`}
                className="group bg-white border border-slate-200 rounded-2xl p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: `${s.color}15` }}>
                  <span className="material-symbols-outlined text-[28px]" style={{ color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                </div>
                <h3 className="text-base font-extrabold text-[#191c1e]">{s.label}</h3>
                <p className="text-xs font-bold text-[#006e2f] mt-1">{s.count} créateurs</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PERKS */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#006e2f] mb-3">Pourquoi nous</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#191c1e] tracking-tight">La confiance, notre priorité</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {PERKS.map((p) => (
              <div key={p.title} className="flex items-start gap-4 bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#006e2f]/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[24px] text-[#006e2f]" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#191c1e] mb-1">{p.title}</h3>
                  <p className="text-sm text-[#5c647a] leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-[#006e2f] to-[#22c55e] rounded-3xl p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">Prêt à apprendre des meilleurs ?</h2>
          <p className="text-lg opacity-90 mb-6 max-w-xl mx-auto">
            Parcourez le catalogue ou contactez directement un mentor pour un coaching personnalisé.
          </p>
          <Link href="/mentors" className="inline-flex items-center gap-2 bg-white text-[#006e2f] px-7 py-4 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-colors">
            Voir tous les mentors
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
