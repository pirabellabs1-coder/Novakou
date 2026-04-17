import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog · Novakou",
  description: "Stratégies, conseils et inspiration pour les créateurs et apprenants africains francophones. Vendez plus, formez mieux.",
};

const FEATURED = {
  slug: "lancer-son-premier-produit-digital",
  title: "Comment lancer son premier produit digital en Afrique francophone",
  excerpt: "De l'idée à la première vente : la méthode complète, étape par étape, adaptée au marché africain. Mobile Money, prix, marketing — tout y passe.",
  author: "L'équipe Novakou",
  date: "12 avril 2026",
  readTime: "8 min",
  category: "Guide",
  gradient: "linear-gradient(135deg, #006e2f, #22c55e)",
};

const ARTICLES = [
  {
    slug: "5-erreurs-creator-debutant",
    title: "5 erreurs que font tous les créateurs débutants (et comment les éviter)",
    excerpt: "Les pièges classiques qui plombent vos premières ventes — et comment les contourner dès le départ.",
    category: "Conseils",
    date: "8 avril 2026",
    readTime: "5 min",
    gradient: "linear-gradient(135deg, #f97316, #ec4899)",
  },
  {
    slug: "mobile-money-pour-vendeurs",
    title: "Mobile Money : tout ce qu'un vendeur doit savoir en 2026",
    excerpt: "Orange Money, Wave, MTN MoMo : comment recevoir vos paiements et choisir le bon partenaire.",
    category: "Paiements",
    date: "5 avril 2026",
    readTime: "6 min",
    gradient: "linear-gradient(135deg, #f59e0b, #dc2626)",
  },
  {
    slug: "tunnels-de-vente-101",
    title: "Tunnels de vente : la méthode qui multiplie vos conversions par 3",
    excerpt: "Anatomie d'un tunnel qui convertit. Hero, urgence, témoignages, upsell — chaque pièce expliquée.",
    category: "Marketing",
    date: "1 avril 2026",
    readTime: "12 min",
    gradient: "linear-gradient(135deg, #4f46e5, #a855f7)",
  },
  {
    slug: "fixer-prix-formation-digitale",
    title: "Combien facturer pour ma formation ? Le guide pricing complet",
    excerpt: "FCFA, EUR, USD : comment positionner votre offre selon votre cible et votre niveau d'expertise.",
    category: "Pricing",
    date: "28 mars 2026",
    readTime: "7 min",
    gradient: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
  },
  {
    slug: "communaute-clients-fideles",
    title: "Construire une communauté de clients fidèles (sans Discord)",
    excerpt: "Email, WhatsApp, espace privé : comment garder vos acheteurs engagés sur le long terme.",
    category: "Communauté",
    date: "22 mars 2026",
    readTime: "9 min",
    gradient: "linear-gradient(135deg, #fda4af, #fcd34d)",
  },
  {
    slug: "ia-creation-contenu",
    title: "L'IA pour les créateurs : 7 outils qui changent vraiment la donne",
    excerpt: "Notre sélection éditoriale d'outils IA testés et validés pour gagner du temps en 2026.",
    category: "Outils",
    date: "18 mars 2026",
    readTime: "10 min",
    gradient: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
  },
];

const CATEGORIES = ["Tous", "Guide", "Conseils", "Marketing", "Paiements", "Pricing", "Outils", "Communauté"];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
      {/* HERO */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#006e2f] bg-[#006e2f]/10 px-3 py-1 rounded-full mb-4">
            Le blog
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#191c1e] leading-tight tracking-tight">
            Stratégies pour vendre <br /> et apprendre mieux
          </h1>
          <p className="text-lg text-[#5c647a] mt-5 max-w-2xl mx-auto">
            Des guides concrets, sans bla-bla, pour les créateurs et apprenants africains francophones.
          </p>
        </div>
      </section>

      {/* CATEGORIES filter */}
      <section className="px-6 mb-10">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {CATEGORIES.map((c, i) => (
            <button
              key={c}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                i === 0 ? "bg-[#006e2f] text-white" : "bg-slate-100 text-[#5c647a] hover:bg-slate-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="px-6 mb-16">
        <div className="max-w-7xl mx-auto">
          <Link href={`/blog/${FEATURED.slug}`} className="group block bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="aspect-video md:aspect-auto md:min-h-[320px] flex items-center justify-center" style={{ background: FEATURED.gradient }}>
                <span className="material-symbols-outlined text-white text-[120px] opacity-30">article</span>
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#006e2f] mb-2">
                  ⭐ À LA UNE · {FEATURED.category}
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] leading-tight mb-3 group-hover:text-[#006e2f] transition-colors">
                  {FEATURED.title}
                </h2>
                <p className="text-[#5c647a] leading-relaxed mb-5">{FEATURED.excerpt}</p>
                <div className="flex items-center gap-3 text-xs text-[#5c647a]">
                  <span className="font-semibold text-[#191c1e]">{FEATURED.author}</span>
                  <span className="text-slate-300">·</span>
                  <span>{FEATURED.date}</span>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {FEATURED.readTime}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ARTICLES GRID */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-extrabold text-[#191c1e] mb-8 tracking-tight">Tous les articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ARTICLES.map((a) => (
              <Link key={a.slug} href={`/blog/${a.slug}`} className="group block bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all">
                <div className="aspect-[16/10] flex items-center justify-center relative" style={{ background: a.gradient }}>
                  <span className="material-symbols-outlined text-white text-[64px] opacity-30">article</span>
                  <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider text-white bg-black/30 backdrop-blur px-2 py-1 rounded-full">
                    {a.category}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-extrabold text-[#191c1e] leading-snug line-clamp-2 mb-2 group-hover:text-[#006e2f] transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-sm text-[#5c647a] leading-relaxed line-clamp-3 mb-4">{a.excerpt}</p>
                  <div className="flex items-center gap-2 text-[11px] text-[#5c647a]">
                    <span>{a.date}</span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      {a.readTime}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl p-12 text-center text-white">
          <span className="material-symbols-outlined text-[40px] text-[#22c55e] mb-3">mail</span>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Recevez nos meilleurs articles</h2>
          <p className="text-slate-300 mb-6 max-w-md mx-auto">
            Une newsletter mensuelle, sans spam. Stratégies + études de cas + outils.
          </p>
          <p className="text-xs text-slate-400">↓ Inscrivez-vous via le formulaire en bas de page.</p>
        </div>
      </section>
    </div>
  );
}
