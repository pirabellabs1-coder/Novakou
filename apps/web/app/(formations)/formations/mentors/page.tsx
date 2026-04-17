"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// ─── Mentor shape (matches /api/formations/mentors response) ────────────────
type Mentor = {
  id: string;
  userId: string;
  name: string | null;
  image: string | null;
  specialty: string;
  domain: string | null;
  bio: string;
  coverImage: string | null;
  sessionPrice: number;
  sessionDuration: number;
  languages: string[];
  badges: string[];
  available: boolean;
  isVerified: boolean;
  rating: number;
  reviews: number;
  students: number;
  totalSessions: number;
  // Derived (UI helpers)
  cover?: string;
  initials?: string;
  gradient?: string;
  sessionDurationLabel?: string;
};

// Default cover photos (rotated based on mentor id hash) — shown when mentor hasn't set a cover
const DEFAULT_COVERS = [
  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80",
  "https://images.unsplash.com/photo-1506765515384-028b60a970df?w=800&q=80",
  "https://images.unsplash.com/photo-1557425493-6f90ae4659fc?w=800&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
];

function coverFor(m: Mentor): string {
  if (m.coverImage) return m.coverImage;
  const hash = m.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return DEFAULT_COVERS[hash % DEFAULT_COVERS.length];
}

function initialsOf(name: string | null): string {
  if (!name) return "??";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function gradientFor(id: string): string {
  const gradients = [
    "from-blue-500 to-blue-700",
    "from-purple-500 to-pink-600",
    "from-emerald-500 to-teal-700",
    "from-amber-500 to-orange-600",
    "from-indigo-500 to-indigo-700",
    "from-rose-500 to-red-600",
  ];
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}


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
  const [allMentors, setAllMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/formations/mentors");
        if (!res.ok) throw new Error();
        const json = await res.json();
        // Enrich with UI helpers so the existing card markup keeps working
        const enriched: Mentor[] = (json.data ?? []).map((m: Mentor) => ({
          ...m,
          cover: coverFor(m),
          initials: initialsOf(m.name),
          gradient: gradientFor(m.id),
          sessionDurationLabel: `${m.sessionDuration} min`,
        }));
        setAllMentors(enriched);
      } catch (err) {
        console.warn("[mentors page] fetch failed", err);
        setAllMentors([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = allMentors.filter((m) => {
    const matchDomain = activeDomain === "Tous" || m.domain === activeDomain;
    const q = search.trim().toLowerCase();
    const matchSearch =
      q === "" ||
      (m.name ?? "").toLowerCase().includes(q) ||
      m.specialty.toLowerCase().includes(q);
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
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-28 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="w-14 h-14 bg-gray-200 rounded-2xl -mt-7" />
                    <div className="h-4 bg-gray-200 rounded-lg w-2/3" />
                    <div className="h-3 bg-gray-200 rounded-lg w-full" />
                    <div className="h-10 bg-gray-200 rounded-xl mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-[#5c647a]">
              <span className="material-symbols-outlined text-[56px] block mb-3 text-gray-300">person_search</span>
              <p className="font-semibold text-[#191c1e] mb-1">
                {allMentors.length === 0 ? "Aucun mentor inscrit pour l'instant" : "Aucun mentor trouvé"}
              </p>
              <p className="text-sm mb-4">
                {allMentors.length === 0
                  ? "Soyez le premier à proposer vos services de mentorat sur Novakou."
                  : "Essayez un autre domaine ou modifiez votre recherche."}
              </p>
              {allMentors.length === 0 && (
                <Link
                  href="/formations/inscription?role=mentor"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                >
                  <span className="material-symbols-outlined text-[16px]">volunteer_activism</span>
                  Devenir mentor
                </Link>
              )}
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
          <h2 className="text-2xl font-extrabold text-[#191c1e] mb-3">Devenez mentor sur Novakou</h2>
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

// ─── Beautiful Mentor Card (image-en-haut style produit) ──────────────────────
function MentorCard({ mentor }: { mentor: Mentor }) {
  const cover = mentor.cover ?? coverFor(mentor);
  const initials = mentor.initials ?? initialsOf(mentor.name);

  return (
    <Link
      href={`/formations/mentors/${mentor.id}`}
      className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 hover:border-[#006e2f]/20 transition-all duration-300 overflow-hidden flex flex-col h-full"
    >
      {/* HERO IMAGE — aspect 4/3 (style produit) */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-[#003d1a] via-[#006e2f] to-[#22c55e] overflow-hidden">
        {mentor.coverImage || mentor.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={mentor.name ?? "Mentor"}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span
              className="material-symbols-outlined text-white text-[72px] opacity-60"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              support_agent
            </span>
          </div>
        )}

        {/* Top-left: availability badge (+ verified marker) */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur shadow-sm ${
              mentor.available ? "bg-green-500/95 text-white" : "bg-gray-600/95 text-gray-100"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${mentor.available ? "bg-white" : "bg-gray-300"}`} />
            {mentor.available ? "Disponible" : "Indisponible"}
          </span>
          {mentor.isVerified && (
            <span
              className="material-symbols-outlined text-blue-500 bg-white rounded-full p-0.5 shadow-sm"
              style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1" }}
              title="Profil vérifié"
            >
              verified
            </span>
          )}
        </div>

        {/* Top-right: rating badge */}
        {mentor.rating > 0 && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur text-[#191c1e] text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              <span
                className="material-symbols-outlined text-amber-400 text-[12px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              {mentor.rating.toFixed(1)}
              {mentor.reviews > 0 && <span className="text-[#5c647a]">({mentor.reviews})</span>}
            </span>
          </div>
        )}

        {/* Avatar superposé en bas-gauche */}
        <div className="absolute bottom-3 left-3">
          <div
            className={`w-14 h-14 rounded-full ring-2 ring-white shadow-lg overflow-hidden bg-gradient-to-br ${
              mentor.gradient ?? gradientFor(mentor.id)
            } flex items-center justify-center`}
          >
            {mentor.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mentor.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-extrabold text-sm tracking-tight">{initials}</span>
            )}
          </div>
        </div>
      </div>

      {/* CARD BODY */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Name + specialty */}
        <div>
          <h3 className="text-sm font-bold text-[#191c1e] leading-tight line-clamp-1 group-hover:text-[#006e2f] transition-colors">
            {mentor.name ?? "Mentor"}
          </h3>
          <p className="text-xs text-[#5c647a] line-clamp-1 mt-0.5">{mentor.specialty}</p>
        </div>

        {/* Domain pill */}
        {mentor.domain && (
          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-[#5c647a] w-fit">
            {mentor.domain}
          </span>
        )}

        {/* Bio (2 lignes max) */}
        <p className="line-clamp-2 text-xs text-[#5c647a] leading-relaxed">{mentor.bio}</p>

        {/* Badges + langues */}
        {(mentor.badges.length > 0 || mentor.languages.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {mentor.badges.slice(0, 2).map((badge) => {
              const cfg =
                badgeConfig[badge] ?? { bg: "bg-gray-100", text: "text-gray-600", icon: "label" };
              return (
                <span
                  key={badge}
                  className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}
                >
                  <span
                    className="material-symbols-outlined text-[10px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {cfg.icon}
                  </span>
                  {badge}
                </span>
              );
            })}
            {mentor.languages.slice(0, 3).map((lang) => (
              <span
                key={lang}
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-[#5c647a]"
              >
                {lang}
              </span>
            ))}
          </div>
        )}

        {/* Footer prix — pushed to bottom */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <div>
            <p className="text-base font-extrabold text-[#006e2f] leading-tight">
              {mentor.sessionPrice.toLocaleString("fr-FR")}{" "}
              <span className="text-[10px] font-bold text-[#5c647a]">FCFA</span>
            </p>
            <p className="text-[10px] text-[#5c647a]">
              ≈ {Math.round(mentor.sessionPrice / 655.957)} €
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#5c647a] font-medium">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {mentor.sessionDurationLabel ?? `${mentor.sessionDuration} min`}
          </div>
        </div>
      </div>
    </Link>
  );
}
