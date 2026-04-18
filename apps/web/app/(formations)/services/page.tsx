import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services & Produits digitaux · Novakou",
  description: "Découvrez tous les types de produits et services disponibles : formations vidéo, e-books, templates, coaching, audio, et plus.",
};

const PRODUCT_TYPES = [
  {
    icon: "school",
    color: "#006e2f",
    bg: "linear-gradient(135deg, #006e2f, #22c55e)",
    title: "Formations vidéo",
    desc: "Cours structurés en modules avec leçons vidéo HD. Idéal pour acquérir des compétences en profondeur.",
    features: ["Modules + leçons vidéo", "Quiz et certificat", "Accès à vie", "Support du créateur"],
    href: "/explorer?type=formations",
    cta: "Voir les formations",
  },
  {
    icon: "menu_book",
    color: "#dc2626",
    bg: "linear-gradient(135deg, #dc2626, #f97316)",
    title: "E-books & PDF",
    desc: "Guides pratiques téléchargeables. Lisez à votre rythme, où que vous soyez.",
    features: ["Téléchargement immédiat", "Format PDF / EPUB", "Lecture mobile + desktop", "Mises à jour offertes"],
    href: "/explorer?type=products&kind=PDF",
    cta: "Voir les e-books",
  },
  {
    icon: "dashboard_customize",
    color: "#8b5cf6",
    bg: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    title: "Templates & Modèles",
    desc: "Modèles prêts à l'emploi : Notion, Figma, PSD, présentations, contrats, scripts marketing.",
    features: ["Économisez des heures", "100% personnalisable", "Compatible toutes plateformes", "Exemples réels"],
    href: "/explorer?type=products&kind=TEMPLATE",
    cta: "Voir les templates",
  },
  {
    icon: "music_note",
    color: "#0ea5e9",
    bg: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
    title: "Audio & Podcasts",
    desc: "Contenus audio à écouter en déplacement : interviews, masterclass, méditations guidées.",
    features: ["MP3 haute qualité", "Téléchargeable hors ligne", "Apple Podcasts compatible", "Transcripts inclus"],
    href: "/explorer?type=products&kind=AUDIO",
    cta: "Voir les audios",
  },
  {
    icon: "video_call",
    color: "#f59e0b",
    bg: "linear-gradient(135deg, #f59e0b, #facc15)",
    title: "Coaching individuel",
    desc: "Sessions personnalisées en visio avec un mentor. Pour aller en profondeur sur vos blocages spécifiques.",
    features: ["1-on-1 en visio", "Plan personnalisé", "Suivi par messagerie", "Replay disponible"],
    href: "/mentors",
    cta: "Trouver un coach",
  },
  {
    icon: "inventory_2",
    color: "#7c3aed",
    bg: "linear-gradient(135deg, #7c3aed, #ec4899)",
    title: "Bundles & Packs",
    desc: "Plusieurs produits regroupés à prix réduit. La meilleure façon d'économiser sur un domaine.",
    features: ["Jusqu'à -40% de remise", "Plusieurs ressources", "Cohérence pédagogique", "Idéal débutants"],
    href: "/explorer?type=products&kind=BUNDLE",
    cta: "Voir les bundles",
  },
];

const HOW_IT_WORKS = [
  { num: "01", title: "Parcourez", desc: "Explorez le catalogue par type, catégorie, prix ou note." },
  { num: "02", title: "Achetez", desc: "Paiement sécurisé en Mobile Money, carte ou virement." },
  { num: "03", title: "Accédez", desc: "Téléchargement immédiat ou accès en ligne à vie." },
  { num: "04", title: "Apprenez", desc: "Progressez à votre rythme, posez vos questions au créateur." },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {/* HERO */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#006e2f] bg-[#006e2f]/10 px-3 py-1 rounded-full mb-4">
            Catalogue
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#191c1e] leading-tight tracking-tight">
            6 types de produits <br /> pour tous les besoins
          </h1>
          <p className="text-lg text-[#5c647a] mt-5 max-w-2xl mx-auto">
            Formation vidéo, e-book, template, audio, coaching ou bundle — choisissez le format qui vous convient.
          </p>
        </div>
      </section>

      {/* PRODUCT TYPES GRID */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRODUCT_TYPES.map((p) => (
            <div key={p.title} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col">
              <div className="h-32 flex items-center justify-center" style={{ background: p.bg }}>
                <span className="material-symbols-outlined text-white text-[64px] opacity-80" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-extrabold text-[#191c1e] mb-2">{p.title}</h3>
                <p className="text-sm text-[#5c647a] leading-relaxed mb-4">{p.desc}</p>
                <ul className="space-y-1.5 mb-5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-[#191c1e]">
                      <span className="material-symbols-outlined text-[14px]" style={{ color: p.color, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={p.href} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity" style={{ background: p.bg }}>
                  {p.cta}
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#006e2f] mb-3">Comment ça marche</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#191c1e] tracking-tight">4 étapes pour commencer</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-base font-extrabold" style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}>
                  {s.num}
                </div>
                <h3 className="text-base font-extrabold text-[#191c1e]">{s.title}</h3>
                <p className="text-sm text-[#5c647a] mt-1.5">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-slate-900 to-[#006e2f]/40 rounded-3xl p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">Explorez tout le catalogue</h2>
          <p className="text-lg opacity-90 mb-6 max-w-xl mx-auto">
            Plus de 1 200 formations et produits digitaux à découvrir.
          </p>
          <Link href="/explorer" className="inline-flex items-center gap-2 bg-white text-[#006e2f] px-7 py-4 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-colors">
            Voir le catalogue complet
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
