"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MentorProfile {
  id: string;
  specialty: string;
  bio: string;
  domain: string | null;
  sessionPrice: number;
  sessionDuration: number;
  isAvailable: boolean;
  isVerified: boolean;
  badges: string[];
  languages: string[];
  coverImage: string | null;
  rating: number;
  reviewsCount: number;
  totalSessions: number;
  totalStudents: number;
}

interface BookingStudent {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface UpcomingBooking {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  paidAmount: number;
  status: "PENDING" | "CONFIRMED";
  meetingLink: string | null;
  student: BookingStudent;
}

interface PastSession {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  paidAmount: number;
  rating: number | null;
  student: { id: string; name: string | null };
}

interface Stats {
  totalRevenue: number;
  completedSessions: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalBookings: number;
}

interface DashboardData {
  profile: MentorProfile;
  stats: Stats;
  upcoming: UpcomingBooking[];
  pastSessions: PastSession[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "En attente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    CONFIRMED: { label: "Confirmé", cls: "bg-green-50 text-green-700 border-green-200" },
    COMPLETED: { label: "Terminé", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    CANCELLED: { label: "Annulé", cls: "bg-red-50 text-red-700 border-red-200" },
    NO_SHOW: { label: "Absent", cls: "bg-gray-100 text-gray-500 border-gray-200" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <span className="material-symbols-outlined text-[22px] text-white">{icon}</span>
      </div>
      <div>
        <p className="text-xs text-[#5c647a] font-medium mb-0.5">{label}</p>
        <p className="text-2xl font-extrabold text-[#191c1e]">{value}</p>
        {sub && <p className="text-xs text-[#5c647a] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Booking Action Buttons ────────────────────────────────────────────────────
function BookingActions({
  booking,
  onRefresh,
}: {
  booking: UpcomingBooking;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState(booking.meetingLink ?? "");
  const [showLinkForm, setShowLinkForm] = useState(false);

  async function patchBooking(payload: Record<string, unknown>) {
    setLoading(JSON.stringify(payload));
    try {
      const res = await fetch(`/api/formations/mentor/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onRefresh();
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {booking.status === "PENDING" && (
        <button
          onClick={() => patchBooking({ action: "confirm" })}
          disabled={!!loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#006e2f] text-white hover:bg-[#005a26] disabled:opacity-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          Confirmer
        </button>
      )}

      <button
        onClick={() => setShowLinkForm(!showLinkForm)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
      >
        <span className="material-symbols-outlined text-[14px]">video_call</span>
        {booking.meetingLink ? "Modifier le lien" : "Ajouter un lien"}
      </button>

      <button
        onClick={() => patchBooking({ action: "cancel" })}
        disabled={!!loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
      >
        <span className="material-symbols-outlined text-[14px]">cancel</span>
        Annuler
      </button>

      {showLinkForm && (
        <div className="w-full flex gap-2 mt-1">
          <input
            type="url"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="https://meet.google.com/..."
            className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
          />
          <button
            onClick={() => {
              patchBooking({ action: "set_link", meetingLink: linkInput });
              setShowLinkForm(false);
            }}
            disabled={!linkInput || !!loading}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#006e2f] text-white hover:bg-[#005a26] disabled:opacity-50 transition-colors"
          >
            Enregistrer
          </button>
          <button
            onClick={() => setShowLinkForm(false)}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function MentorDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/formations/mentor/dashboard");
      if (res.status === 401) {
        router.push("/formations/connexion?callbackUrl=/formations/mentor/dashboard");
        return;
      }
      if (!res.ok) throw new Error("Erreur serveur");
      const json = await res.json();
      setData(json.data);
      setAvailability(json.data.profile.isAvailable);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleAvailability() {
    if (!data) return;
    setTogglingAvail(true);
    try {
      const res = await fetch("/api/formations/mentor/dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !availability }),
      });
      if (res.ok) setAvailability(!availability);
    } finally {
      setTogglingAvail(false);
    }
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] p-6">
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-sm">
          <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
          <p className="text-red-700 font-semibold mt-3">{error}</p>
          <button onClick={load} className="mt-4 px-4 py-2 bg-[#006e2f] text-white rounded-xl text-sm font-semibold">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { profile, stats, upcoming, pastSessions } = data;

  const profileComplete =
    profile.specialty && profile.bio && profile.sessionPrice > 0 && profile.languages.length > 0;

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/formations" className="text-[#5c647a] hover:text-[#191c1e] transition-colors">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <span className="text-sm font-bold text-[#191c1e]">Espace Mentor</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Availability toggle */}
            <button
              onClick={toggleAvailability}
              disabled={togglingAvail}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                availability
                  ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
              } disabled:opacity-50`}
            >
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${availability ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
              />
              {availability ? "Disponible" : "Indisponible"}
            </button>

            <Link
              href="/formations/mentor/profil"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-[#191c1e] hover:bg-gray-200 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">edit</span>
              Mon profil
            </Link>

            <Link
              href="/formations/mentor/rendez-vous"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              <span className="material-symbols-outlined text-[14px]">calendar_month</span>
              Rendez-vous
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Welcome ─────────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-extrabold text-[#191c1e]">Dashboard Mentor</h1>
          <p className="text-sm text-[#5c647a] mt-1">
            Gérez vos séances, suivez vos revenus et accompagnez vos apprenants.
          </p>
        </div>

        {/* ── Profile incomplete banner ───────────────────────────────────────── */}
        {!profileComplete && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-500 text-[22px] flex-shrink-0 mt-0.5">warning</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">Profil incomplet</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Complétez votre profil (spécialité, bio, prix, langues) pour apparaître dans la liste des mentors.
              </p>
            </div>
            <Link
              href="/formations/mentor/profil"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors flex-shrink-0"
            >
              Compléter
            </Link>
          </div>
        )}

        {/* ── KPI Grid ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon="payments"
            label="Revenus totaux"
            value={`${fmt(stats.totalRevenue)} FCFA`}
            sub="Commissions déduites"
            color="bg-[#006e2f]"
          />
          <KpiCard
            icon="check_circle"
            label="Séances terminées"
            value={String(stats.completedSessions)}
            sub={`${stats.totalBookings} au total`}
            color="bg-blue-500"
          />
          <KpiCard
            icon="schedule"
            label="En attente"
            value={String(stats.pendingBookings)}
            sub={`${stats.confirmedBookings} confirmés`}
            color="bg-amber-500"
          />
          <KpiCard
            icon="star"
            label="Note moyenne"
            value={profile.rating > 0 ? profile.rating.toFixed(1) : "—"}
            sub={profile.reviewsCount > 0 ? `${profile.reviewsCount} avis` : "Pas encore d'avis"}
            color="bg-purple-500"
          />
        </div>

        {/* ── Main content grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Upcoming sessions ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#191c1e]">Prochaines séances</h2>
              <Link
                href="/formations/mentor/rendez-vous"
                className="text-xs text-[#006e2f] font-semibold hover:underline flex items-center gap-1"
              >
                Voir tout
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <span className="material-symbols-outlined text-gray-300 text-5xl">event_available</span>
                <p className="text-sm text-[#5c647a] font-medium mt-3">Aucune séance à venir</p>
                <p className="text-xs text-gray-400 mt-1">
                  Partagez votre profil pour recevoir des demandes de réservation.
                </p>
                <Link
                  href="/formations/mentors"
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-[#006e2f] text-white hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  Voir mon profil public
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-[#006e2f]/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-gradient-to-br from-[#006e2f] to-[#22c55e]">
                          {b.student.image ? (
                            <img
                              src={b.student.image}
                              alt={b.student.name ?? ""}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            initials(b.student.name)
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#191c1e]">
                            {b.student.name ?? b.student.email ?? "Apprenant"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-[#5c647a] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                              {fmtDate(b.scheduledAt)}
                            </span>
                            <span className="text-xs text-[#5c647a] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">schedule</span>
                              {fmtTime(b.scheduledAt)}
                            </span>
                            <span className="text-xs text-[#5c647a] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">timer</span>
                              {b.durationMinutes} min
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <StatusBadge status={b.status} />
                        <p className="text-sm font-bold text-[#006e2f]">{fmt(b.paidAmount)} FCFA</p>
                      </div>
                    </div>

                    {/* Meeting link display */}
                    {b.meetingLink && (
                      <a
                        href={b.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                      >
                        <span className="material-symbols-outlined text-[14px]">videocam</span>
                        {b.meetingLink}
                      </a>
                    )}

                    <BookingActions booking={b} onRefresh={load} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right column ─────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Cover */}
              <div
                className="h-20 relative"
                style={{
                  background: profile.coverImage
                    ? `url(${profile.coverImage}) center/cover`
                    : "linear-gradient(135deg, #003d1a 0%, #006e2f 50%, #22c55e 100%)",
                }}
              >
                {profile.isVerified && (
                  <span className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[#006e2f] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[11px]">verified</span>
                    Vérifié
                  </span>
                )}
              </div>
              <div className="px-4 pb-4">
                <div className="w-14 h-14 rounded-full border-3 border-white bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white font-bold text-lg -mt-7 mb-2">
                  <span className="material-symbols-outlined text-[28px]">person</span>
                </div>
                <p className="text-sm font-bold text-[#191c1e]">
                  {profile.specialty || "Spécialité non définie"}
                </p>
                {profile.domain && (
                  <p className="text-xs text-[#5c647a] mt-0.5">{profile.domain}</p>
                )}
                <p className="text-xs text-[#5c647a] mt-2 line-clamp-3">
                  {profile.bio || "Aucune bio renseignée. Ajoutez une description pour attirer des apprenants."}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm font-extrabold text-[#006e2f]">
                    {fmt(profile.sessionPrice)} FCFA
                    <span className="text-xs font-normal text-[#5c647a]"> / {profile.sessionDuration} min</span>
                  </p>
                  <Link
                    href="/formations/mentor/profil"
                    className="text-xs text-[#006e2f] font-semibold hover:underline"
                  >
                    Modifier
                  </Link>
                </div>
              </div>
            </div>

            {/* Past sessions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="text-sm font-bold text-[#191c1e] mb-3">Séances passées</h3>
              {pastSessions.length === 0 ? (
                <p className="text-xs text-[#5c647a] text-center py-4">Aucune séance terminée pour l'instant.</p>
              ) : (
                <div className="space-y-3">
                  {pastSessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-[10px] font-bold flex-shrink-0">
                          {initials(s.student.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#191c1e] truncate">
                            {s.student.name ?? "Apprenant"}
                          </p>
                          <p className="text-[10px] text-[#5c647a]">{fmtDate(s.scheduledAt)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <p className="text-xs font-bold text-[#006e2f]">{fmt(s.paidAmount)} F</p>
                        {s.rating ? (
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className="material-symbols-outlined text-[10px]"
                                style={{
                                  color: star <= s.rating! ? "#f59e0b" : "#d1d5db",
                                  fontVariationSettings: "'FILL' 1",
                                }}
                              >
                                star
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-400">Non noté</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div className="bg-gradient-to-br from-[#003d1a] to-[#006e2f] rounded-2xl p-4 text-white">
              <p className="text-xs font-semibold text-white/70 mb-3">Statistiques globales</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/80">Séances totales</span>
                  <span className="text-sm font-bold">{profile.totalSessions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/80">Apprenants</span>
                  <span className="text-sm font-bold">{profile.totalStudents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/80">Note / 5</span>
                  <span className="text-sm font-bold">
                    {profile.rating > 0 ? (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-amber-300 text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        {profile.rating.toFixed(1)}
                      </span>
                    ) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/80">Avis reçus</span>
                  <span className="text-sm font-bold">{profile.reviewsCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
