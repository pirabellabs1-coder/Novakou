"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MentorReview {
  id: string;
  rating: number | null;
  review: string | null;
  date: string;
  student: { id: string; name: string | null; image: string | null };
}

interface MentorPublic {
  id: string;
  userId: string;
  name: string | null;
  image: string | null;
  specialty: string;
  bio: string;
  domain: string | null;
  coverImage: string | null;
  sessionPrice: number;
  sessionDuration: number;
  languages: string[];
  badges: string[];
  isAvailable: boolean;
  isVerified: boolean;
  rating: number;
  reviewsCount: number;
  totalSessions: number;
  totalStudents: number;
  memberSince: string;
  reviews: MentorReview[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

function initials(name: string | null) {
  if (!name) return "M";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return "Aujourd'hui";
  if (d < 7) return `Il y a ${d}j`;
  if (d < 30) return `Il y a ${Math.floor(d / 7)} sem.`;
  if (d < 365) return `Il y a ${Math.floor(d / 30)} mois`;
  return `Il y a ${Math.floor(d / 365)} an(s)`;
}

const LANG_MAP: Record<string, { flag: string; label: string }> = {
  FR: { flag: "🇫🇷", label: "Français" },
  EN: { flag: "🇬🇧", label: "Anglais" },
  AR: { flag: "🇸🇦", label: "Arabe" },
  WO: { flag: "🇸🇳", label: "Wolof" },
  DI: { flag: "🇨🇮", label: "Dioula" },
  PT: { flag: "🇵🇹", label: "Portugais" },
  ES: { flag: "🇪🇸", label: "Espagnol" },
};

const BADGE_CONFIG: Record<string, { icon: string; color: string }> = {
  top: { icon: "emoji_events", color: "text-amber-500" },
  verified: { icon: "verified", color: "text-blue-500" },
  expert: { icon: "workspace_premium", color: "text-purple-500" },
  rising: { icon: "trending_up", color: "text-green-500" },
};

// ─── Star rating ──────────────────────────────────────────────────────────────
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className="material-symbols-outlined"
          style={{
            fontSize: `${size}px`,
            color: s <= rating ? "#f59e0b" : "#d1d5db",
            fontVariationSettings: "'FILL' 1",
          }}
        >
          star
        </span>
      ))}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function MentorPublicProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [mentor, setMentor] = useState<MentorPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/formations/public/mentors/${params.id}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setMentor(json.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] animate-pulse">
        <div className="h-48 bg-gray-200" />
        <div className="max-w-4xl mx-auto px-6 pt-6 space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded-xl" />
          <div className="h-32 bg-gray-200 rounded-2xl" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-md">
          <span className="material-symbols-outlined text-gray-300 text-5xl">person_off</span>
          <h2 className="text-lg font-bold text-[#191c1e] mt-3">Mentor introuvable</h2>
          <p className="text-sm text-[#5c647a] mt-1.5 mb-4">
            Ce profil n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <Link
            href="/formations/mentors"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* ── Cover ────────────────────────────────────────────────────────────── */}
      <div
        className="h-48 md:h-64 relative"
        style={{
          background: mentor.coverImage
            ? `url(${mentor.coverImage}) center/cover`
            : "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #22c55e 100%)",
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <Link
          href="/formations/mentors"
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          Retour
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-16 pb-12 relative z-10">
        {/* ── Profile card ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white text-3xl font-extrabold">
                {mentor.image ? (
                  <img src={mentor.image} alt={mentor.name ?? ""} className="w-full h-full object-cover" />
                ) : (
                  initials(mentor.name)
                )}
              </div>
              {mentor.isAvailable && (
                <div className="flex items-center gap-1.5 mt-2 justify-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-semibold text-green-700">Disponible</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e]">
                      {mentor.name ?? "Mentor"}
                    </h1>
                    {mentor.isVerified && (
                      <span
                        className="material-symbols-outlined text-blue-500"
                        style={{ fontVariationSettings: "'FILL' 1", fontSize: "22px" }}
                        title="Profil vérifié"
                      >
                        verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#006e2f] mt-1">{mentor.specialty}</p>
                  {mentor.domain && (
                    <p className="text-xs text-[#5c647a] mt-0.5">
                      <span className="material-symbols-outlined text-[12px] align-middle">category</span>{" "}
                      {mentor.domain}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-[#006e2f]">
                    {fmt(mentor.sessionPrice)} FCFA
                  </p>
                  <p className="text-xs text-[#5c647a]">
                    {mentor.sessionDuration} min · ≈ {Math.round(mentor.sessionPrice / 655.957)} €
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-5 mt-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={Math.round(mentor.rating)} size={16} />
                  <span className="text-sm font-bold text-[#191c1e]">
                    {mentor.rating > 0 ? mentor.rating.toFixed(1) : "Nouveau"}
                  </span>
                  {mentor.reviewsCount > 0 && (
                    <span className="text-xs text-[#5c647a]">({mentor.reviewsCount} avis)</span>
                  )}
                </div>
                <div className="text-xs text-[#5c647a] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">groups</span>
                  {mentor.totalStudents} apprenant{mentor.totalStudents > 1 ? "s" : ""}
                </div>
                <div className="text-xs text-[#5c647a] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">event_available</span>
                  {mentor.totalSessions} séance{mentor.totalSessions > 1 ? "s" : ""}
                </div>
                <div className="text-xs text-[#5c647a] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                  Membre depuis {new Date(mentor.memberSince).getFullYear()}
                </div>
              </div>

              {/* Badges */}
              {mentor.badges && mentor.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {mentor.badges.map((b) => {
                    const cfg = BADGE_CONFIG[b] ?? { icon: "star", color: "text-gray-500" };
                    return (
                      <span
                        key={b}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-50 border border-gray-200"
                      >
                        <span
                          className={`material-symbols-outlined text-[13px] ${cfg.color}`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {cfg.icon}
                        </span>
                        {b.charAt(0).toUpperCase() + b.slice(1)}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Languages */}
              {mentor.languages && mentor.languages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {mentor.languages.map((code) => {
                    const l = LANG_MAP[code];
                    return l ? (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-50 text-[#5c647a] border border-gray-200"
                      >
                        <span>{l.flag}</span>
                        {l.label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mt-5">
                <button
                  onClick={() => router.push(`/formations/inscription?role=mentor&mentorId=${mentor.id}`)}
                  disabled={!mentor.isAvailable}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                  {mentor.isAvailable ? "Réserver une séance" : "Indisponible"}
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `${mentor.name} · Mentor FreelanceHigh`,
                        text: mentor.specialty,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[#191c1e] text-sm font-semibold bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">share</span>
                  Partager
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bio ───────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 mt-5">
          <h2 className="text-lg font-extrabold text-[#191c1e] mb-3">À propos</h2>
          <p className="text-sm text-[#5c647a] leading-relaxed whitespace-pre-wrap">
            {mentor.bio || "Ce mentor n'a pas encore rédigé sa bio."}
          </p>
        </div>

        {/* ── Reviews ───────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 mt-5">
          <h2 className="text-lg font-extrabold text-[#191c1e] mb-4 flex items-center gap-2">
            Avis des apprenants
            <span className="text-sm font-semibold text-[#5c647a]">
              ({mentor.reviewsCount})
            </span>
          </h2>

          {mentor.reviews.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-gray-300 text-5xl">reviews</span>
              <p className="text-sm text-[#5c647a] mt-3">Aucun avis publié pour l&apos;instant.</p>
              <p className="text-xs text-gray-400 mt-1">Soyez le premier à réserver une séance !</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mentor.reviews.map((r) => (
                <div key={r.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0">
                      {r.student.image ? (
                        <img src={r.student.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        initials(r.student.name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-[#191c1e]">
                          {r.student.name ?? "Apprenant"}
                        </p>
                        <span className="text-[11px] text-[#5c647a]">{timeAgo(r.date)}</span>
                      </div>
                      {r.rating && <StarRating rating={r.rating} size={13} />}
                      {r.review && (
                        <p className="text-sm text-[#5c647a] mt-1.5 leading-relaxed">{r.review}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Trust signals ─────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-[#f7f9fb] to-white rounded-2xl border border-gray-100 p-6 mt-5">
          <h3 className="text-sm font-extrabold text-[#191c1e] mb-4 flex items-center gap-2">
            <span
              className="material-symbols-outlined text-[#006e2f] text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield
            </span>
            Garanties FreelanceHigh
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[#006e2f] text-[18px] flex-shrink-0 mt-0.5">
                verified_user
              </span>
              <div>
                <p className="text-xs font-bold text-[#191c1e]">Paiement sécurisé</p>
                <p className="text-[10px] text-[#5c647a]">Escrow jusqu&apos;à la séance</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[#006e2f] text-[18px] flex-shrink-0 mt-0.5">
                event_repeat
              </span>
              <div>
                <p className="text-xs font-bold text-[#191c1e]">Annulation 24h</p>
                <p className="text-[10px] text-[#5c647a]">Remboursement intégral</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[#006e2f] text-[18px] flex-shrink-0 mt-0.5">
                support_agent
              </span>
              <div>
                <p className="text-xs font-bold text-[#191c1e]">Support 24/7</p>
                <p className="text-[10px] text-[#5c647a]">Nous sommes à vos côtés</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
