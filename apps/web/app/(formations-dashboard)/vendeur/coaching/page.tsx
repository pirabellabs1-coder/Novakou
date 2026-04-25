"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────
type MentorDashboardPayload = {
  data: {
    profile: {
      id: string;
      specialty: string;
      bio: string;
      sessionPrice: number;
      sessionDuration: number;
      isAvailable: boolean;
      rating: number | null;
      reviewsCount: number;
      totalSessions: number;
      totalStudents: number;
    } | null;
    stats: {
      totalRevenue: number;
      completedSessions: number;
      pendingBookings: number;
      confirmedBookings: number;
      totalBookings: number;
    };
    upcoming: Array<{
      id: string;
      scheduledAt: string;
      durationMinutes: number;
      paidAmount: number;
      status: string;
      student: { id: string; name: string | null; email: string; image: string | null };
    }>;
  } | null;
  error?: string;
};

function fmtFCFA(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CoachingPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "Instructeur";

  const { data, isLoading, refetch } = useQuery<MentorDashboardPayload>({
    queryKey: ["vendeur-coaching-mentor-dashboard"],
    queryFn: () => fetch("/api/formations/mentor/dashboard").then((r) => r.json()),
    staleTime: 30_000,
  });

  const profile = data?.data?.profile ?? null;
  const stats = data?.data?.stats ?? null;
  const upcoming = data?.data?.upcoming ?? [];
  const hasBookings = (stats?.totalBookings ?? 0) > 0;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-[#191c1e]">Mon espace Coaching</h1>
          <p className="text-sm text-[#5c647a] mt-0.5">
            Gérez vos sessions 1:1 et vos demandes de coaching
          </p>
        </div>
        <div className="flex items-center gap-3">
          {profile && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                profile.isAvailable
                  ? "bg-[#006e2f]/10 border-[#006e2f]/30"
                  : "bg-gray-100 border-gray-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  profile.isAvailable ? "bg-[#006e2f]" : "bg-gray-400"
                }`}
              />
              <span
                className={`text-xs font-bold ${
                  profile.isAvailable ? "text-[#006e2f]" : "text-[#5c647a]"
                }`}
              >
                {profile.isAvailable ? "Disponible" : "Indisponible"}
              </span>
            </div>
          )}
          <Link
            href="/mentor/dashboard"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#006e2f] text-white text-sm font-bold hover:bg-[#005a26] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            Ouvrir mon espace mentor complet
          </Link>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Stats */}
      {!isLoading && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Sessions complétées",
              value: stats.completedSessions.toString(),
              icon: "check_circle",
              color: "text-[#006e2f]",
              bg: "bg-[#006e2f]/10",
            },
            {
              label: "Revenus coaching",
              value: fmtFCFA(stats.totalRevenue),
              icon: "payments",
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "Note moyenne",
              value: profile?.rating ? profile.rating.toFixed(1) : "—",
              icon: "star",
              color: "text-yellow-500",
              bg: "bg-yellow-50",
            },
            {
              label: "Demandes en attente",
              value: stats.pendingBookings.toString(),
              icon: "pending_actions",
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <span
                  className={`material-symbols-outlined text-[20px] ${s.color}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {s.icon}
                </span>
              </div>
              <p className="text-xl font-extrabold text-[#191c1e] leading-tight">{s.value}</p>
              <p className="text-xs text-[#5c647a] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Case: no profile yet (shouldn't happen since API auto-creates, but safe fallback) */}
      {!isLoading && !profile && (
        <div className="bg-gradient-to-br from-[#006e2f]/5 to-emerald-50 border border-[#006e2f]/10 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-4">
            <span
              className="material-symbols-outlined text-[32px] text-[#006e2f]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              support_agent
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[#191c1e] mb-2">
            Activez votre profil de mentor
          </h2>
          <p className="text-sm text-[#5c647a] max-w-xl mx-auto mb-6">
            Bonjour {userName}, créez votre profil mentor pour proposer des sessions de coaching 1:1
            à vos apprenants.
          </p>
          <Link
            href="/mentor/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006e2f] text-white text-sm font-bold hover:bg-[#005a26]"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Devenir mentor
          </Link>
        </div>
      )}

      {/* Profile summary + upcoming sessions */}
      {!isLoading && profile && (
        <>
          {/* Profile recap card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[240px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[20px] text-[#006e2f]">
                    psychology
                  </span>
                  <h2 className="text-base font-extrabold text-[#191c1e]">
                    {profile.specialty || "Spécialité non renseignée"}
                  </h2>
                </div>
                <div className="flex items-center gap-4 text-sm text-[#5c647a] flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {profile.sessionDuration} min / session
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">sell</span>
                    {fmtFCFA(profile.sessionPrice)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">groups</span>
                    {profile.totalStudents} apprenants accompagnés
                  </span>
                </div>
              </div>
              <Link
                href="/mentor/profil"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-[#5c647a] hover:bg-gray-50 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Modifier mon profil
              </Link>
            </div>
          </div>

          {/* Upcoming sessions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#191c1e]">
                Prochaines sessions ({upcoming.length})
              </h2>
              <Link
                href="/mentor/rendez-vous"
                className="text-xs font-bold text-[#006e2f] hover:underline"
              >
                Tout voir →
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-[24px] text-[#5c647a]">
                    event_busy
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#191c1e]">
                  Aucune session prévue pour le moment
                </p>
                <p className="text-xs text-[#5c647a] mt-1">
                  {hasBookings
                    ? "Vos apprenants pourront bientôt réserver de nouvelles sessions."
                    : "Partagez votre profil mentor pour recevoir vos premières demandes."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {upcoming.slice(0, 5).map((b) => (
                  <div key={b.id} className="px-6 py-4 flex items-center gap-4 flex-wrap">
                    <div className="w-10 h-10 rounded-full bg-[#006e2f]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {b.student.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={b.student.image}
                          alt={b.student.name ?? ""}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-[18px] text-[#006e2f]">
                          person
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#191c1e] truncate">
                        {b.student.name ?? b.student.email}
                      </p>
                      <p className="text-xs text-[#5c647a]">
                        {fmtDateTime(b.scheduledAt)} · {b.durationMinutes} min
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.status === "CONFIRMED"
                            ? "bg-[#006e2f]/10 text-[#006e2f]"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {b.status === "CONFIRMED" ? "Confirmée" : "En attente"}
                      </span>
                      <span className="text-sm font-bold text-[#191c1e]">
                        {fmtFCFA(b.paidAmount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: "event_available",
                title: "Mes disponibilités",
                desc: "Gérer mes créneaux",
                href: "/mentor/calendrier",
              },
              {
                icon: "calendar_month",
                title: "Mes rendez-vous",
                desc: "Voir toutes mes sessions",
                href: "/mentor/rendez-vous",
              },
              {
                icon: "settings",
                title: "Paramètres",
                desc: "Tarif, durée, timezone",
                href: "/mentor/profil",
              },
            ].map((a) => (
              <Link
                key={a.title}
                href={a.href}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-[#006e2f]/20 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#006e2f]/10 flex items-center justify-center mb-3 group-hover:bg-[#006e2f]/20 transition-colors">
                  <span
                    className="material-symbols-outlined text-[22px] text-[#006e2f]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {a.icon}
                  </span>
                </div>
                <p className="text-sm font-bold text-[#191c1e]">{a.title}</p>
                <p className="text-xs text-[#5c647a] mt-0.5">{a.desc}</p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Error state */}
      {!isLoading && data?.error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold text-red-700">{data.error}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}
