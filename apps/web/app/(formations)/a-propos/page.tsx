import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "À propos · Novakou",
  description: "Novakou est la plateforme qui transforme les talents en revenus durables. Découvrez notre mission, notre équipe et nos valeurs.",
};

const VALUES = [
  { icon: "rocket_launch", title: "Concret avant tout", desc: "Pas de théorie déconnectée. Chaque formation, produit, outil est pensé pour produire des résultats mesurables." },
  { icon: "diversity_3", title: "Communauté d'abord", desc: "Une plateforme bâtie POUR les créateurs et les apprenants. Vos retours façonnent chaque évolution produit." },
  { icon: "verified", title: "Qualité sans compromis", desc: "Curation manuelle des formateurs, modération active, support réactif. Pas de spam, pas de scams." },
  { icon: "trending_up", title: "Croissance partagée", desc: "Quand vous gagnez, on gagne. Notre commission n'augmente que si vos ventes augmentent — alignement total." },
];

const STATS = [
  { value: "12 000", suffix: "+", label: "Apprenants accompagnés", icon: "groups" },
  { value: "850", suffix: "+", label: "Créateurs actifs", icon: "school" },
  { value: "94", suffix: "%", label: "Taux de satisfaction", icon: "thumb_up" },
  { value: "17", suffix: "", label: "Pays africains couverts", icon: "public" },
];

const TEAM = [
  { name: "Pirabel Labs", role: "Fondateur & CEO", initial: "LG", bio: "Entrepreneur passionné par l'écosystème africain et la création de valeur via le digital." },
  { name: "Équipe produit", role: "Engineering & Design", initial: "EP", bio: "Une équipe distribuée qui construit avec soin chaque feature pensée pour vous." },
  { name: "Communauté", role: "Support & Modération", initial: "CO", bio: "Modérateurs et support clients basés en Afrique francophone, à votre écoute 7j/7." },
];

const TIMELINE = [
  { year: "2024", title: "L'idée née", desc: "Constat : trop de talents africains manquent d'outils pour monétiser leurs compétences. La graine est plantée." },
  { year: "2025", title: "Conception & prototype", desc: "9 mois de design produit avec des dizaines de créateurs et formateurs pour cadrer les vrais besoins." },
  { year: "2026", title: "Lancement officiel", desc: "Novakou ouvre ses portes. Marketplace, formations, outils marketing intégrés." },
  { year: "Demain", title: "Construire ensemble", desc: "Notre roadmap est publique. Vos retours guident les prochaines fonctionnalités." },
];

export default function AProposPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 30% 20%, #006e2f15, transparent 50%), radial-gradient(circle at 70% 80%, #22c55e10, transparent 50%)" }} />
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#006e2f] bg-[#006e2f]/10 px-3 py-1 rounded-full mb-6">
            Notre histoire
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-[#191c1e] leading-tight tracking-tight">
            Élever les talents <br /> au plus haut niveau
          </h1>
          <p className="text-lg md:text-xl text-[#5c647a] mt-6 max-w-2xl mx-auto leading-relaxed">
            Novakou est née d&apos;une conviction : chaque talent africain mérite des outils dignes pour transformer son savoir en revenus durables.
          </p>
        </div>
      </section>

      {/* MISSION */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#006e2f] mb-3">Notre mission</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#191c1e] mb-5 leading-tight">
              Donner à chaque créateur les moyens de vivre de son savoir
            </h2>
            <p className="text-[#5c647a] leading-relaxed mb-4">
              Trop de talents africains francophones manquent d&apos;une plateforme moderne pour vendre formations, e-books, templates ou consulting. Les outils existants sont chers, mal localisés, et négligent les méthodes de paiement africaines.
            </p>
            <p className="text-[#5c647a] leading-relaxed">
              Nous bâtissons l&apos;alternative : intégrée Mobile Money, pensée pour le francophone, avec des outils marketing qui se mesurent à Systeme.io ou Gumroad — sans le ticket d&apos;entrée.
            </p>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div className="grid grid-cols-2 gap-6">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[20px] text-[#006e2f]">{s.icon}</span>
                  </div>
                  <p className="text-3xl font-extrabold text-[#191c1e]">{s.value}<span className="text-[#006e2f]">{s.suffix}</span></p>
                  <p className="text-xs text-[#5c647a] mt-1 font-semibold">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VALEURS */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#006e2f] mb-3">Nos valeurs</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#191c1e] tracking-tight">Ce qui nous guide chaque jour</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white border border-slate-200 rounded-2xl p-7 hover:border-[#006e2f]/30 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #006e2f15, #22c55e15)" }}>
                  <span className="material-symbols-outlined text-[24px] text-[#006e2f]" style={{ fontVariationSettings: "'FILL' 1" }}>{v.icon}</span>
                </div>
                <h3 className="text-lg font-extrabold text-[#191c1e] mb-2">{v.title}</h3>
                <p className="text-[#5c647a] text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#006e2f] mb-3">Notre parcours</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#191c1e] tracking-tight">L&apos;histoire en quelques dates</h2>
          </div>
          <div className="space-y-6">
            {TIMELINE.map((t, i) => (
              <div key={t.year} className="flex gap-5 group">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-xl bg-white border-2 border-[#006e2f] flex items-center justify-center text-[#006e2f] font-extrabold text-sm flex-shrink-0">
                    {t.year}
                  </div>
                  {i < TIMELINE.length - 1 && <div className="w-0.5 flex-1 bg-[#006e2f]/20 mt-2" />}
                </div>
                <div className="flex-1 pb-6">
                  <h3 className="text-lg font-extrabold text-[#191c1e] mb-1">{t.title}</h3>
                  <p className="text-[#5c647a] text-sm leading-relaxed">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#006e2f] mb-3">L&apos;équipe</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#191c1e] tracking-tight">Les humains derrière la plateforme</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TEAM.map((p) => (
              <div key={p.name} className="bg-white border border-slate-200 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-extrabold" style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}>
                  {p.initial}
                </div>
                <h3 className="text-lg font-bold text-[#191c1e]">{p.name}</h3>
                <p className="text-xs font-semibold text-[#006e2f] uppercase tracking-wider mt-0.5">{p.role}</p>
                <p className="text-sm text-[#5c647a] mt-3 leading-relaxed">{p.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-[#006e2f] to-[#22c55e] rounded-3xl p-12 md:p-16 text-white">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">Rejoignez l&apos;aventure</h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Que vous soyez créateur ou apprenant, Novakou est votre nouveau terrain de jeu.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/inscription?role=instructeur" className="px-7 py-4 rounded-2xl bg-white text-[#006e2f] font-bold text-sm hover:bg-slate-100 transition-colors">
              Créer ma boutique
            </Link>
            <Link href="/explorer" className="px-7 py-4 rounded-2xl bg-white/15 backdrop-blur text-white font-bold text-sm hover:bg-white/25 transition-colors border border-white/30">
              Explorer le catalogue
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
