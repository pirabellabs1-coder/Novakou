"use client";

import Link from "next/link";
import { useState } from "react";

// Simulated product data indexed by slug
const productData: Record<
  string,
  {
    title: string;
    seller: string;
    sellerInitial: string;
    sellerBio: string;
    rating: number;
    reviews: number;
    students: number;
    type: string;
    category: string;
    price: number;
    description: string;
    learnings: string[];
    requirements: string[];
    modules: { title: string; lessons: number; duration: string }[];
    reviewsList: { author: string; initial: string; rating: number; comment: string; date: string }[];
    gradient: string;
    icon: string;
  }
> = {
  "masterclass-facebook-ads-2024": {
    title: "Masterclass Facebook & Instagram Ads",
    seller: "Éric Mensah",
    sellerInitial: "EM",
    sellerBio: "Expert en publicité digitale avec +6 ans d'expérience. A géré +2 M$ de budgets publicitaires.",
    rating: 4.9,
    reviews: 312,
    students: 1840,
    type: "Formation vidéo",
    category: "Marketing",
    price: 75000,
    description:
      "Cette masterclass vous enseigne les stratégies avancées de publicité Facebook et Instagram utilisées par les agences marketing professionnelles. Vous apprendrez à créer des campagnes rentables, à cibler les bonnes audiences et à optimiser vos budgets pour maximiser votre ROI.",
    learnings: [
      "Créer des campagnes publicitaires rentables sur Facebook & Instagram",
      "Maîtriser le Pixel Facebook et les audiences personnalisées",
      "Optimiser les coûts d'acquisition et maximiser le ROI",
      "Créer des visuels et vidéos qui convertissent",
      "Analyser les métriques et ajuster les campagnes en temps réel",
      "Stratégies de retargeting avancées pour augmenter les conversions",
    ],
    requirements: [
      "Avoir un compte Facebook & Instagram actif",
      "Aucune expérience en publicité requise",
      "Disponibilité de 3-4h par semaine pour pratiquer",
    ],
    modules: [
      { title: "Fondamentaux du Business Manager", lessons: 6, duration: "1h 20min" },
      { title: "Créer sa première campagne", lessons: 8, duration: "2h 10min" },
      { title: "Ciblage & Audiences avancées", lessons: 10, duration: "3h 05min" },
      { title: "Créatifs qui convertissent", lessons: 7, duration: "2h 40min" },
      { title: "Pixel & Suivi des conversions", lessons: 5, duration: "1h 45min" },
      { title: "Optimisation & Scaling", lessons: 9, duration: "2h 55min" },
    ],
    reviewsList: [
      {
        author: "Kouassi Arnaud",
        initial: "KA",
        rating: 5,
        comment: "Formation exceptionnelle ! J'ai lancé ma première campagne et obtenu un ROI de 300% dès le premier mois. Éric explique très clairement.",
        date: "12 mars 2026",
      },
      {
        author: "Aminata Traoré",
        initial: "AT",
        rating: 5,
        comment: "La section sur le retargeting m'a littéralement transformé mon business. Je recommande à tous les e-commerçants africains.",
        date: "3 mars 2026",
      },
      {
        author: "Jean-Baptiste Kra",
        initial: "JK",
        rating: 4,
        comment: "Très bonne formation, complète et bien structurée. Quelques exemples pourraient être plus adaptés au marché francophone.",
        date: "18 fév. 2026",
      },
    ],
    gradient: "from-blue-500 to-purple-600",
    icon: "ads_click",
  },
  default: {
    title: "Formation Premium",
    seller: "Formateur Expert",
    sellerInitial: "FE",
    sellerBio: "Expert certifié avec plus de 5 ans d'expérience dans son domaine.",
    rating: 4.8,
    reviews: 150,
    students: 900,
    type: "Formation vidéo",
    category: "Digital",
    price: 55000,
    description:
      "Une formation complète pour maîtriser les compétences essentielles du marché digital africain. Des contenus pratiques créés par un expert reconnu.",
    learnings: [
      "Maîtriser les fondamentaux du domaine",
      "Appliquer les meilleures pratiques du secteur",
      "Créer des projets concrets et professionnels",
      "Développer une stratégie adaptée au marché africain",
    ],
    requirements: [
      "Aucun prérequis technique nécessaire",
      "Un ordinateur ou smartphone avec accès internet",
    ],
    modules: [
      { title: "Introduction & Fondamentaux", lessons: 5, duration: "1h 00min" },
      { title: "Pratiques avancées", lessons: 8, duration: "2h 30min" },
      { title: "Projets pratiques", lessons: 6, duration: "2h 00min" },
      { title: "Stratégie & Optimisation", lessons: 7, duration: "2h 15min" },
    ],
    reviewsList: [
      {
        author: "Utilisateur vérifié",
        initial: "UV",
        rating: 5,
        comment: "Excellente formation, très pratique et bien structurée. Je recommande vivement !",
        date: "10 avr. 2026",
      },
    ],
    gradient: "from-[#006e2f] to-[#22c55e]",
    icon: "school",
  },
};

function formatFCFA(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function toEur(fcfa: number) {
  return Math.round(fcfa / 655.957);
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sizeClass = size === "md" ? "text-[18px]" : "text-[14px]";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`material-symbols-outlined ${sizeClass} text-yellow-400`}
          style={{
            fontVariationSettings: s <= Math.floor(rating) ? "'FILL' 1" : "'FILL' 0",
          }}
        >
          star
        </span>
      ))}
    </div>
  );
}

export default function ProduitPageClient({ slug }: { slug: string }) {
  const product = productData[slug] || productData["default"];
  const [activeTab, setActiveTab] = useState<"description" | "contenu" | "avis">("description");
  const [expandedModule, setExpandedModule] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-[#5c647a]">
          <Link href="/formations" className="hover:text-[#006e2f] transition-colors">
            Accueil
          </Link>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <Link href="/formations/explorer" className="hover:text-[#006e2f] transition-colors">
            Explorer
          </Link>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="text-[#191c1e] font-medium truncate max-w-[200px]">{product.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column — 60% */}
          <div className="flex-1 min-w-0">
            {/* Thumbnail */}
            <div
              className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br ${product.gradient} mb-6 flex items-center justify-center`}
            >
              <span className="material-symbols-outlined text-white/30 text-[100px]">
                {product.icon}
              </span>
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                  <span className="material-symbols-outlined text-white text-[36px]">
                    play_arrow
                  </span>
                </button>
              </div>
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#006e2f] text-white">
                  {product.category}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-white/90 text-[#191c1e]">
                  {product.type}
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] tracking-tight mb-3 leading-tight">
              {product.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
              <div className="flex items-center gap-1.5">
                <StarRating rating={product.rating} />
                <span className="font-bold text-[#191c1e]">{product.rating}</span>
                <span className="text-[#5c647a]">({product.reviews} avis)</span>
              </div>
              <div className="flex items-center gap-1 text-[#5c647a]">
                <span className="material-symbols-outlined text-[16px]">group</span>
                <span>{product.students.toLocaleString()} apprenants</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
                >
                  {product.sellerInitial}
                </div>
                <span className="text-[#5c647a]">
                  par <span className="font-semibold text-[#191c1e]">{product.seller}</span>
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6 w-fit">
              {(["description", "contenu", "avis"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${
                    activeTab === tab
                      ? "bg-[#006e2f] text-white shadow-sm"
                      : "text-[#5c647a] hover:text-[#191c1e]"
                  }`}
                >
                  {tab === "description" ? "Description" : tab === "contenu" ? "Contenu du cours" : "Avis"}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "description" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-bold text-[#191c1e] mb-3">À propos de cette formation</h3>
                  <p className="text-sm text-[#5c647a] leading-relaxed">{product.description}</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-bold text-[#191c1e] mb-4">Ce que vous allez apprendre</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {product.learnings.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[#006e2f] text-[18px] mt-0.5 flex-shrink-0">
                          check_circle
                        </span>
                        <span className="text-sm text-[#5c647a] leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-bold text-[#191c1e] mb-4">Prérequis</h3>
                  <ul className="space-y-2">
                    {product.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[#5c647a] text-[16px] mt-0.5 flex-shrink-0">
                          arrow_right
                        </span>
                        <span className="text-sm text-[#5c647a]">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Seller card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-bold text-[#191c1e] mb-4">Votre formateur</h3>
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
                    >
                      {product.sellerInitial}
                    </div>
                    <div>
                      <p className="font-bold text-[#191c1e]">{product.seller}</p>
                      <p className="text-xs text-[#5c647a] mt-1 leading-relaxed">{product.sellerBio}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1 text-xs text-[#5c647a]">
                          <StarRating rating={product.rating} />
                          <span className="font-bold text-[#191c1e]">{product.rating}</span>
                        </div>
                        <span className="text-xs text-[#5c647a]">
                          {product.students.toLocaleString()} apprenants
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "contenu" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <p className="text-sm text-[#5c647a]">
                    <strong className="text-[#191c1e]">{product.modules.length} modules</strong> ·{" "}
                    <strong className="text-[#191c1e]">
                      {product.modules.reduce((a, m) => a + m.lessons, 0)} leçons
                    </strong>
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  {product.modules.map((mod, i) => (
                    <div key={i}>
                      <button
                        onClick={() => setExpandedModule(expandedModule === i ? null : i)}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#f7f9fb] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: "#006e2f" }}
                          >
                            {i + 1}
                          </div>
                          <span className="font-semibold text-[#191c1e] text-sm">{mod.title}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-[#5c647a]">
                            {mod.lessons} leçons · {mod.duration}
                          </span>
                          <span
                            className="material-symbols-outlined text-[18px] text-[#5c647a] transition-transform duration-200"
                            style={{ transform: expandedModule === i ? "rotate(180deg)" : "rotate(0deg)" }}
                          >
                            expand_more
                          </span>
                        </div>
                      </button>
                      {expandedModule === i && (
                        <div className="px-6 pb-4 pt-1 bg-[#f7f9fb]">
                          {Array.from({ length: mod.lessons }, (_, j) => (
                            <div key={j} className="flex items-center gap-2.5 py-1.5">
                              <span className="material-symbols-outlined text-[16px] text-[#5c647a]">
                                play_circle
                              </span>
                              <span className="text-xs text-[#5c647a]">
                                Leçon {j + 1} — {mod.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "avis" && (
              <div className="space-y-4">
                {/* Rating summary */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-5xl font-extrabold text-[#191c1e]">{product.rating}</p>
                    <StarRating rating={product.rating} size="md" />
                    <p className="text-xs text-[#5c647a] mt-1">{product.reviews} avis</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((s) => (
                      <div key={s} className="flex items-center gap-2">
                        <span className="text-xs text-[#5c647a] w-2">{s}</span>
                        <span
                          className="material-symbols-outlined text-yellow-400 text-[14px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-yellow-400"
                            style={{ width: s === 5 ? "75%" : s === 4 ? "18%" : "5%" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {product.reviewsList.map((review, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
                        >
                          {review.initial}
                        </div>
                        <div>
                          <p className="font-semibold text-[#191c1e] text-sm">{review.author}</p>
                          <div className="flex items-center gap-1">
                            <StarRating rating={review.rating} />
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#5c647a]">{review.date}</span>
                    </div>
                    <p className="text-sm text-[#5c647a] leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column — Sticky price card */}
          <div className="lg:w-80 xl:w-96 flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 mb-4">
                {/* Price */}
                <div className="mb-5">
                  <p className="text-3xl font-extrabold text-[#006e2f] tracking-tight">
                    {formatFCFA(product.price)}
                  </p>
                  <p className="text-sm text-[#5c647a]">≈ {toEur(product.price)} €</p>
                </div>

                {/* CTAs */}
                <div className="space-y-3 mb-5">
                  <Link
                    href="/formations/checkout"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
                  >
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                    Acheter maintenant
                  </Link>
                  <button className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border-2 border-[#006e2f] text-[#006e2f] font-bold text-sm hover:bg-[#006e2f]/5 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                    Ajouter au panier
                  </button>
                </div>

                {/* Guarantee */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 mb-5">
                  <span className="material-symbols-outlined text-[#006e2f] text-[20px]">
                    verified_user
                  </span>
                  <p className="text-xs font-semibold text-[#006e2f]">
                    Garantie satisfait ou remboursé 30 jours
                  </p>
                </div>

                {/* Seller info */}
                <div className="flex items-center gap-3 pb-5 border-b border-gray-100 mb-5">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
                  >
                    {product.sellerInitial}
                  </div>
                  <div>
                    <p className="font-bold text-[#191c1e] text-sm">{product.seller}</p>
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={product.rating} />
                      <span className="text-xs font-bold text-[#191c1e]">{product.rating}</span>
                    </div>
                    <p className="text-[10px] text-[#5c647a]">
                      {product.students.toLocaleString()} apprenants
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2.5">
                  {[
                    { icon: "play_circle", label: `${product.modules.reduce((a, m) => a + m.lessons, 0)} leçons vidéo` },
                    { icon: "download", label: "Accès à vie + téléchargements" },
                    { icon: "devices", label: "Accès mobile, tablette, desktop" },
                    { icon: "workspace_premium", label: "Certificat de réussite" },
                    { icon: "headset_mic", label: "Support formateur inclus" },
                  ].map((detail) => (
                    <div key={detail.label} className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[#5c647a] text-[16px]">
                        {detail.icon}
                      </span>
                      <span className="text-xs text-[#5c647a]">{detail.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Share / Gift */}
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-[#5c647a] hover:text-[#191c1e] hover:border-gray-300 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">share</span>
                  Partager
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-[#5c647a] hover:text-[#191c1e] hover:border-gray-300 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">card_giftcard</span>
                  Offrir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
