// Refonte style KAZA — mentor dashboard — 2026-06-07
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CommunityBanner } from "@/components/formations/CommunityBanner";
import {
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaButton,
  KazaBadge,
  KazaSection,
  KazaEmpty,
} from "@/components/kaza";
import {
  Wallet,
  Hourglass,
  Calendar,
  Star,
  CheckCircle2,
  Video,
  MessageSquare,
  Gavel,
  CircleAlert,
  ShieldCheck,
  XCircle,
  Headphones,
  CalendarPlus,
  Edit3,
  ArrowRight,
  Timer,
  User,
} from "lucide-react";

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
  meetingLink?: string | null;
  meetingUrl?: string | null;
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
  grossRevenue: number;
  pendingRevenue: number;
  pendingGross: number;
  pendingCount: number;
  disputedCount: number;
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
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; variant: "orange" | "green" | "blue" | "rose" | "slate" }
  > = {
    PENDING: { label: "En attente", variant: "orange" },
    CONFIRMED: { label: "Confirmé", variant: "green" },
    COMPLETED: { label: "Terminé", variant: "blue" },
    CANCELLED: { label: "Annulé", variant: "rose" },
    NO_SHOW: { label: "Absent", variant: "slate" },
  };
  const s = map[status] ?? { label: status, variant: "slate" as const };
  return (
    <KazaBadge variant={s.variant} size="sm">
      {s.label}
    </KazaBadge>
  );
}

function BookingActions({
  booking,
  onRefresh,
}: {
  booking: UpcomingBooking;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);

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
        <KazaButton
          variant="primary"
          size="sm"
          icon={CheckCircle2}
          onClick={() => patchBooking({ action: "confirm" })}
          disabled={!!loading}
        >
          Confirmer
        </KazaButton>
      )}

      {booking.meetingUrl && (
        <KazaButton variant="ghost" size="sm" icon={Video} href={`/sessions/${booking.id}/salle`}>
          Rejoindre la salle
        </KazaButton>
      )}

      <KazaButton
        variant="ghost"
        size="sm"
        icon={MessageSquare}
        onClick={async () => {
          try {
            const res = await fetch("/api/formations/messages/conversations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ otherUserId: booking.student.id }),
            });
            const json = await res.json();
            if (json.data?.id) {
              window.location.href = `/messages/${json.data.id}`;
            }
          } catch {
            /* ignore */
          }
        }}
      >
        Message
      </KazaButton>

      {booking.status === "CONFIRMED" &&
        (new Date(booking.scheduledAt).getTime() - Date.now()) / 60000 < 30 && (
          <KazaButton
            variant="primary"
            size="sm"
            icon={CheckCircle2}
            onClick={async () => {
              const res = await fetch(
                `/api/formations/mentor-bookings/${booking.id}/attendance`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ attended: true }),
                },
              );
              if (res.ok) onRefresh();
            }}
          >
            J&apos;ai assisté
          </KazaButton>
        )}

      <KazaButton
        variant="danger"
        size="sm"
        icon={Gavel}
        disabled={!!loading}
        onClick={async () => {
          const reason = window.prompt(
            "Motif d'annulation (obligatoire, 30 caractères minimum). L'admin examinera votre demande. L'apprenant sera remboursé si validé.",
            "",
          );
          if (!reason || reason.trim().length < 30) {
            alert("Motif obligatoire (30 caractères minimum)");
            return;
          }
          await patchBooking({ action: "cancel", reason: reason.trim() });
        }}
      >
        Annuler
      </KazaButton>
    </div>
  );
}

export default function MentorDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [kycState, setKycState] = useState<{ level: number; pending: boolean } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [dashRes, kycRes] = await Promise.all([
        fetch("/api/formations/mentor/dashboard"),
        fetch("/api/formations/kyc").catch(() => null),
      ]);
      if (dashRes.status === 401) {
        router.push("/connexion?callbackUrl=/mentor/dashboard");
        return;
      }
      if (!dashRes.ok) throw new Error("Erreur serveur");
      const json = await dashRes.json();
      setData(json.data);
      setAvailability(json.data.profile.isAvailable);
      if (kycRes?.ok) {
        const kj = await kycRes.json();
        setKycState({ level: kj.data?.currentLevel ?? 0, pending: !!kj.data?.pending });
      }
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

  if (loading) {
    return (
      <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6 animate-pulse">
        <div className="h-40 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-sm shadow-sm">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <p className="text-rose-700 font-semibold mt-3">{error}</p>
          <KazaButton variant="primary" onClick={load} className="mt-4">
            Réessayer
          </KazaButton>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { profile, stats, upcoming, pastSessions } = data;

  const profileComplete =
    profile.specialty && profile.bio && profile.sessionPrice > 0 && profile.languages.length > 0;

  return (
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
      <KazaHero
        badge="Mentor"
        badgeColor="white"
        icon={Headphones}
        title="Dashboard Mentor"
        subtitle="Gérez vos séances, suivez vos revenus et accompagnez vos apprenants."
        actions={
          <>
            <button
              onClick={toggleAvailability}
              disabled={togglingAvail}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                availability
                  ? "bg-emerald-500/20 text-white border-emerald-400/50 hover:bg-emerald-500/30"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              } disabled:opacity-50`}
            >
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  availability ? "bg-emerald-300 animate-pulse" : "bg-slate-300"
                }`}
              />
              {availability ? "Disponible" : "Indisponible"}
            </button>
            <KazaButton variant="secondary" href="/mentor/profil" icon={Edit3}>
              Mon profil
            </KazaButton>
            <KazaButton variant="primary" href="/mentor/rendez-vous" icon={Calendar}>
              Rendez-vous
            </KazaButton>
          </>
        }
      />

      <CommunityBanner tone="mentor" />

      {/* KYC banner */}
      {kycState && kycState.level < 2 && (
        <div
          className={`rounded-2xl p-5 flex items-start gap-4 border ${
            kycState.pending ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200"
          }`}
        >
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${
              kycState.pending ? "bg-amber-500" : "bg-rose-500"
            }`}
          >
            {kycState.pending ? <Hourglass className="w-5 h-5" /> : <CircleAlert className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-[#0b2540]">
              {kycState.pending
                ? "Vérification d'identité en cours"
                : "Vérification d'identité requise"}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {kycState.pending
                ? "Notre équipe examine votre demande (24-48h). Vous serez notifié dès validation."
                : "Sans vérification, vous ne pourrez pas retirer les gains de vos séances."}
            </p>
            {!kycState.pending && (
              <KazaButton variant="primary" size="sm" href="/kyc" icon={ShieldCheck} className="mt-3">
                Commencer la vérification
              </KazaButton>
            )}
          </div>
        </div>
      )}

      {/* Profile incomplete */}
      {!profileComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <CircleAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">Profil incomplet</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Complétez votre profil (spécialité, bio, prix, langues) pour apparaître dans la liste
              des mentors.
            </p>
          </div>
          <KazaButton variant="ghost" size="sm" href="/mentor/profil">
            Compléter
          </KazaButton>
        </div>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KazaKpiCard
          label="Revenus nets acquis"
          value={`${fmt(stats.totalRevenue)} F`}
          delta={`${fmt(stats.grossRevenue)} bruts`}
          deltaTrend="up"
          icon={Wallet}
          iconColor="emerald"
        />
        <KazaKpiCard
          label="En attente (escrow)"
          value={`${fmt(stats.pendingRevenue)} F`}
          delta={`${stats.pendingCount} session(s)`}
          icon={Hourglass}
          iconColor="orange"
        />
        <KazaKpiCard
          label="À confirmer"
          value={stats.pendingBookings}
          delta={`${stats.confirmedBookings} confirmés`}
          icon={Calendar}
          iconColor="sky"
        />
        <KazaKpiCard
          label="Note moyenne"
          value={profile.rating > 0 ? profile.rating.toFixed(1) : "—"}
          delta={profile.reviewsCount > 0 ? `${profile.reviewsCount} avis` : undefined}
          icon={Star}
          iconColor="violet"
        />
      </section>

      {/* Calendar CTA */}
      {profileComplete && (
        <Link
          href="/mentor/calendrier"
          className="block bg-gradient-to-r from-sky-50 to-violet-50 border border-sky-200 rounded-2xl px-5 py-4 hover:border-sky-400 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0 text-white">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#0b2540]">Configurez vos disponibilités</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Définissez vos créneaux hebdomadaires pour recevoir des réservations automatiquement.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-sky-600" />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming sessions */}
        <div className="lg:col-span-2 space-y-4">
          <KazaSection
            label="Mentorat"
            title="Prochaines séances"
            action={
              <KazaButton variant="ghost" size="sm" href="/mentor/rendez-vous" iconRight={ArrowRight}>
                Voir tout
              </KazaButton>
            }
          >
            {upcoming.length === 0 ? (
              <KazaEmpty
                icon={Calendar}
                title="Aucune séance à venir"
                description="Partagez votre profil pour recevoir des demandes de réservation."
                action={{ label: "Voir mon profil public", href: "/mentors" }}
              />
            ) : (
              <div className="space-y-3">
                {upcoming.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-emerald-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden"
                          style={{ background: "linear-gradient(135deg, #0b2540 0%, #1a4a7d 100%)" }}
                        >
                          {b.student.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
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
                          <p className="text-sm font-bold text-[#0b2540]">
                            {b.student.name ?? b.student.email ?? "Apprenant"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {fmtDate(b.scheduledAt)}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              {fmtTime(b.scheduledAt)} · {b.durationMinutes} min
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <StatusBadge status={b.status} />
                        <p className="text-sm font-bold text-emerald-600 tabular-nums">
                          {fmt(b.paidAmount)} F
                        </p>
                      </div>
                    </div>

                    {b.meetingLink && (
                      <a
                        href={b.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center gap-1.5 text-xs text-sky-600 hover:underline"
                      >
                        <Video className="w-3.5 h-3.5" />
                        {b.meetingLink}
                      </a>
                    )}

                    <BookingActions booking={b} onRefresh={load} />
                  </div>
                ))}
              </div>
            )}
          </KazaSection>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div
              className="relative aspect-[4/3] overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0b2540 0%, #103057 45%, #1a4a7d 100%)" }}
            >
              {profile.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.coverImage}
                  alt={profile.specialty || "Profil mentor"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Headphones className="w-16 h-16 text-white/30" />
                </div>
              )}

              <span
                className={`absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur shadow-sm ${
                  profile.isAvailable ? "bg-emerald-500/95 text-white" : "bg-slate-600/95 text-slate-100"
                }`}
              >
                <span
                  className={`w-1 h-1 rounded-full ${profile.isAvailable ? "bg-white animate-pulse" : "bg-slate-300"}`}
                />
                {profile.isAvailable ? "Disponible" : "Indisponible"}
              </span>

              {profile.isVerified && (
                <span className="absolute top-2 right-2 inline-flex items-center gap-1 bg-white/95 backdrop-blur text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  <ShieldCheck className="w-3 h-3 text-sky-500" />
                  Vérifié
                </span>
              )}

              <div
                className="absolute bottom-2 left-2 w-12 h-12 rounded-full ring-2 ring-white shadow-lg overflow-hidden flex items-center justify-center text-white"
                style={{ background: "linear-gradient(135deg, #0b2540 0%, #1a4a7d 100%)" }}
              >
                <User className="w-5 h-5" />
              </div>

              {profile.rating > 0 && (
                <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-white/95 backdrop-blur text-[#0b2540] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  <Star className="w-3 h-3 text-amber-400" fill="currentColor" />
                  {profile.rating.toFixed(1)}
                </span>
              )}
            </div>

            <div className="p-4 flex flex-col gap-2">
              <div>
                <p className="text-sm font-bold text-[#0b2540] line-clamp-1">
                  {profile.specialty || "Spécialité non définie"}
                </p>
                {profile.domain && (
                  <KazaBadge variant="slate" size="sm">
                    {profile.domain}
                  </KazaBadge>
                )}
              </div>
              <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                {profile.bio ||
                  "Aucune bio renseignée. Ajoutez une description pour attirer des apprenants."}
              </p>
              <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-sm font-extrabold text-emerald-600 leading-tight tabular-nums">
                    {fmt(profile.sessionPrice)}{" "}
                    <span className="text-[10px] font-bold text-slate-500">FCFA</span>
                  </p>
                  <p className="text-[10px] text-slate-500">{profile.sessionDuration} min</p>
                </div>
                <KazaButton variant="ghost" size="sm" href="/mentor/profil" icon={Edit3}>
                  Modifier
                </KazaButton>
              </div>
            </div>
          </div>

          {/* Past sessions */}
          <KazaCard title="Séances passées">
            {pastSessions.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                Aucune séance terminée pour l&apos;instant.
              </p>
            ) : (
              <div className="space-y-3">
                {pastSessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold flex-shrink-0">
                        {initials(s.student.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#0b2540] truncate">
                          {s.student.name ?? "Apprenant"}
                        </p>
                        <p className="text-[10px] text-slate-500">{fmtDate(s.scheduledAt)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <p className="text-xs font-bold text-emerald-600 tabular-nums">
                        {fmt(s.paidAmount)} F
                      </p>
                      {s.rating ? (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className="w-2.5 h-2.5"
                              fill={star <= s.rating! ? "#f59e0b" : "transparent"}
                              stroke={star <= s.rating! ? "#f59e0b" : "#d1d5db"}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400">Non noté</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </KazaCard>

          {/* Quick stats */}
          <div
            className="rounded-2xl p-4 text-white shadow-md"
            style={{ background: "linear-gradient(135deg, #0b2540 0%, #103057 45%, #1a4a7d 100%)" }}
          >
            <p className="text-xs font-semibold text-white/70 mb-3 uppercase tracking-wider">
              Statistiques globales
            </p>
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
                      <Star className="w-3 h-3 text-amber-300" fill="currentColor" />
                      {profile.rating.toFixed(1)}
                    </span>
                  ) : (
                    "—"
                  )}
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
  );
}
