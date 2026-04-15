"use client";

import Link from "next/link";
import { useState } from "react";

// ─── Static mentor data (will be replaced with API once mentor profiles are in DB) ──
const mentors = [
  {
    id: 1,
    name: "Éric Mensah",
    initials: "EM",
    cover: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80",
    gradient: "from-blue-500 to-blue-700",
    specialty: "Facebook Ads & Marketing Digital",
    domain: "Marketing",
    bio: "10 ans d'expérience en growth marketing pour des marques africaines. Formé +1 200 freelances. Je vous aide à construire des campagnes qui convertissent vraiment.",
    rating: 4.9,
    reviews: 247,
    students: 1284,
    sessionPrice: 25000,
    sessionDuration: "60 min",
    languages: ["FR", "EN"],
    badges: ["Top Mentor", "Vérifié"],
    available: true,
  },
  {
    id: 2,
    name: "Aminata Koné",
    initials: "AK",
    cover: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
    gradient: "from-purple-500 to-purple-700",
    specialty: "Développement Web & React",
    domain: "Dev",
    bio: "Développeuse full-stack Senior chez une startup fintech. Passionnée par la transmission, je vous aide à progresser vite et à bien.",
    rating: 4.8,
    reviews: 183,
    students: 967,
    sessionPrice: 35000,
    sessionDuration: "60 min",
    languages: ["FR"],
    badges: ["Expert Tech", "Vérifié"],
    available: true,
  },
  {
    id: 3,
    name: "David Kabore",
    initials: "DK",
    cover: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
    gradient: "from-orange-500 to-orange-700",
    specialty: "Design UI/UX & Branding",
    domain: "Design",
    bio: "Designer indépendant avec +120 projets. Spécialiste de l'identité visuelle pour TPE/PME africaines.",
    rating: 4.7,
    reviews: 98,
    students: 542,
    sessionPrice: 20000,
    sessionDuration: "45 min",
    languages: ["FR"],
    badges: ["Vérifié"],
    available: false,
  },
  {
    id: 4,
    name: "Carine Aboua",
    initials: "CA",
    cover: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80",
    gradient: "from-pink-500 to-rose-600",
    specialty: "Copywriting & Personal Branding",
    domain: "Marketing",
    bio: "Copywriteuse freelance et coach personal branding. A aidé +300 entrepreneurs à se positionner sur les réseaux africains.",
    rating: 5.0,
    reviews: 74,
    students: 388,
    sessionPrice: 18000,
    sessionDuration: "60 min",
    languages: ["FR"],
    badges: ["Rising Star", "Vérifié"],
    available: true,
  },
  {
    id: 5,
    name: "Moussa Diallo",
    initials: "MD",
    cover: "https://images.unsplash.com/photo-1554774853-b415df9eeb92?w=800&q=80",
    gradient: "from-teal-500 to-teal-700",
    specialty: "Finance Personnelle & Investissement",
    domain: "Business",
    bio: "Consultant financier indépendant. Expert en gestion patrimoniale adaptée aux marchés africains et diaspora.",
    rating: 4.9,
    reviews: 131,
    students: 710,
    sessionPrice: 40000,
    sessionDuration: "90 min",
    languages: ["FR", "EN", "WO"],
    badges: ["Top Mentor", "Vérifié"],
    available: true,
  },
  {
    id: 6,
    name: "Jean-Pierre Nkomo",
    initials: "JN",
    cover: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    gradient: "from-indigo-500 to-indigo-700",
    specialty: "Intelligence Artificielle & Automatisation",
    domain: "Dev",
    bio: "Data scientist et entrepreneur tech. Aide les freelances à intégrer l'IA dans leurs services pour se différencier.",
    rating: 4.8,
    reviews: 59,
    students: 294,
    sessionPrice: 45000,
    sessionDuration: "60 min",
    languages: ["FR", "EN"],
    badges: ["Expert Tech", "Vérifié"],
    available: true,
  },
];

const domains = ["Tous", "Marketing", "Dev", "Design", "Business"];

const badgeConfig: Record<string, { bg: string; text: string; icon: string }> = {
  "Top Mentor":    { bg: "bg-amber-50",  text: "text-amber-700",  icon: "emoji_events" },
  "Vérifié":       { bg: "bg-green-50",  text: "text-green-700",  icon: "verified" },
  "Expert Tech":   { bg: "bg-blue-50",   text: "text-blue-700",   icon: "code" },
  "Rising Star":   { bg: "bg-purple-50", text: "text-purple-700", icon: "star" },
};

export default function MentorsPage() {
  const [activeDomain, setActiveDomain] = useState("Tous");
  const [search, setSearch] = useState("");

  const filtered = mentors.filter((m) => {
    const matchDomain = activeDomain === "Tous" || m.domain === activeDomain;
    const matchSearch =
      search.trim() === "" ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.specialty.toLowerCase().includes(search.toLowerCase());
    return matchDomain && matchSearch;
  });

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section
        className="relative py-20 px-4 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #003d1b 0%, #006e2f 55%, #22c55e 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute bottom-0 -left-16 w-64 h-64 bg-white/5 rounded-full" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-sm font-semibold px-4 py-2 rounded-full mb-5 border border-white/20">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            Mentorat 1:1 · Experts africains
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            Trouvez votre mentor
          </h1>
          <p className="text-white/75 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            Des professionnels qui vous accompagnent en session individuelle pour accélérer votre carrière freelance.
          </p>
          <div className="relative max-w-md mx-auto">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
            <input
              type="text"
              placeholder="Chercher un mentor, une spécialité…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-5 py-3.5 rounded-2xl text-[#191c1e] text-sm font-medium outline-none focus:ring-2 focus:ring-[#22c55e] bg-white shadow-xl placeholder:text-gray-400"
            />
          </div>
        </div>
      </section>

      {/* ── Domain filters ─────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 py-4 px-4 sticky top-[72px] z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none">
          {domains.map((domain) => (
            <button
              key={domain}
              onClick={() => setActiveDomain(domain)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeDomain === domain
                  ? "bg-[#006e2f] text-white shadow-sm"
                  : "bg-[#f7f9fb] text-[#5c647a] hover:bg-green-50 hover:text-[#006e2f]"
              }`}
            >
              {domain}
            </button>
          ))}
          <span className="ml-auto text-xs text-[#5c647a] flex-shrink-0 font-medium pl-4 whitespace-nowrap">
            {filtered.length} mentor{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </section>

      {/* ── Mentor grid ────────────────────────────────────────────── */}
      <section className="py-12 px-4 bg-[#f7f9fb] min-h-[60vh]">
        <div className="max-w-5xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-[#5c647a]">
              <span className="material-symbols-outlined text-[56px] block mb-3 text-gray-300">person_search</span>
              <p className="font-semibold text-[#191c1e] mb-1">Aucun mentor trouvé</p>
              <p className="text-sm">Essayez un autre domaine ou modifiez votre recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((mentor) => (
                <MentorCard key={mentor.id} mentor={mentor} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA become mentor ──────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#e8f5e9] flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-[32px] text-[#006e2f]" style={{ fontVariationSettings: "'FILL' 1" }}>record_voice_over</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#191c1e] mb-3">Devenez mentor sur FreelanceHigh</h2>
          <p className="text-[#5c647a] text-base mb-8 max-w-lg mx-auto leading-relaxed">
            Partagez votre expertise en 1:1, fixez vos propres tarifs et développez une nouvelle source de revenus récurrents. Les candidatures sont ouvertes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/formations/inscription?role=mentor"
              className="inline-flex items-center justify-center gap-2 bg-[#006e2f] text-white font-bold px-8 py-3.5 rounded-2xl text-sm shadow-lg hover:bg-[#005a26] hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">volunteer_activism</span>
              Postuler comme mentor
            </Link>
            <Link
              href="/formations/connexion"
              className="inline-flex items-center justify-center gap-2 border border-gray-200 text-[#5c647a] font-semibold px-8 py-3.5 rounded-2xl text-sm hover:bg-gray-50 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              J&apos;ai déjà un compte
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Beautiful Mentor Card ─────────────────────────────────────────────────────
function MentorCard({ mentor }: { mentor: typeof mentors[0] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group">

      {/* Cover photo */}
      <div className="relative h-28 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mentor.cover}
          alt={mentor.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Availability badge */}
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${mentor.available ? "bg-green-500 text-white" : "bg-gray-600 text-gray-200"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${mentor.available ? "bg-white" : "bg-gray-400"}`} />
          {mentor.available ? "Disponible" : "Complet"}
        </div>

        {/* Domain tag */}
        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
          {mentor.domain}
        </div>
      </div>

      {/* Avatar — overlapping cover */}
      <div className="relative px-5">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mentor.gradient} flex items-center justify-center border-4 border-white shadow-lg -mt-7 relative z-10`}>
          <span className="text-white font-extrabold text-base tracking-tight">{mentor.initials}</span>
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 pt-2 pb-5 flex flex-col flex-1">
        {/* Name + specialty */}
        <div className="mb-2">
          <h3 className="font-extrabold text-[#191c1e] text-base leading-tight">{mentor.name}</h3>
          <p className="text-xs text-[#5c647a] font-medium mt-0.5 leading-snug">{mentor.specialty}</p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map((s) => (
              <span key={s} className="material-symbols-outlined text-[12px]"
                style={{ color: s <= Math.round(mentor.rating) ? "#f59e0b" : "#d1d5db", fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
            ))}
          </div>
          <span className="text-xs font-bold text-[#191c1e]">{mentor.rating.toFixed(1)}</span>
          <span className="text-xs text-[#5c647a]">({mentor.reviews})</span>
          <span className="text-[#5c647a] text-xs">·</span>
          <span className="text-xs text-[#5c647a]">{mentor.students.toLocaleString("fr-FR")} élèves</span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {mentor.badges.map((badge) => {
            const cfg = badgeConfig[badge] ?? { bg: "bg-gray-100", text: "text-gray-600", icon: "label" };
            return (
              <span key={badge} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                {badge}
              </span>
            );
          })}
          {/* Languages */}
          {mentor.languages.map((lang) => (
            <span key={lang} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-[#5c647a]">{lang}</span>
          ))}
        </div>

        {/* Bio */}
        <p className="text-xs text-[#5c647a] leading-relaxed line-clamp-2 flex-1 mb-4">{mentor.bio}</p>

        {/* Session info + CTAs */}
        <div className="border-t border-gray-100 pt-4 flex items-center justify-between gap-2">
          <div>
            <p className="font-extrabold text-[#006e2f] text-base">{mentor.sessionPrice.toLocaleString("fr-FR")} <span className="text-xs font-bold text-[#5c647a]">FCFA</span></p>
            <p className="text-[10px] text-[#5c647a]">{mentor.sessionDuration} · ≈{Math.round(mentor.sessionPrice / 655.957)} €</p>
          </div>
          <div className="flex gap-1.5">
            <Link
              href={`/formations/mentors/${mentor.id}`}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-[#191c1e] hover:bg-gray-200 transition-colors flex-shrink-0"
              title="Voir le profil complet"
            >
              <span className="material-symbols-outlined text-[14px]">person</span>
            </Link>
            <Link
              href={mentor.available ? `/formations/inscription?role=mentor&mentorId=${mentor.id}` : "#"}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                mentor.available
                  ? "bg-[#006e2f] text-white hover:bg-[#005a26] shadow-sm hover:shadow-md"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {mentor.available ? "calendar_add_on" : "event_busy"}
              </span>
              {mentor.available ? "Réserver" : "Complet"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
