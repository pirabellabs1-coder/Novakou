// Refonte design "Stitch" — espace mentor — vert Novakou officiel — 2026-06-13.
// Logique 100% préservée : queries dashboard + kyc, toggle dispo, actions bookings.
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CommunityBanner } from "@/components/formations/CommunityBanner";
import {
  StCard,
  StPageHeader,
  StButton,
  StChip,
  StStatusPill,
  StKpi,
  StAvatar,
  StSectionTitle,
  StSuggestion,
  ST,
} from "@/components/stitch";
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
        <StButton
          size="sm"
          icon={CheckCircle2}
          onClick={() => patchBooking({ action: "confirm" })}
          disabled={!!loading}
        >
          Confirmer
        </StButton>
      )}

      {booking.meetingUrl && (
        <StButton variant="secondary" size="sm" icon={Video} href={`/sessions/${booking.id}/salle`}>
          Rejoindre la salle
        </StButton>
      )}

      <StButton
        variant="secondary"
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
      </StButton>

      {booking.status === "CONFIRMED" &&
        (new Date(booking.scheduledAt).getTime() - Date.now()) / 60000 < 30 && (
          <StButton
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
          </StButton>
        )}

      <button
        type="button"
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
        className="inline-flex items-center justify-center gap-2 font-extrabold text-[12px] rounded-[10px] px-3 py-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        style={{ background: ST.roseSoft, color: ST.roseText }}
      >
        <Gavel size={14} />
        Annuler
      </button>
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
      <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
        <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto space-y-4 animate-pulse">
          <div className="h-10 w-72 rounded-xl" style={{ background: "#e9efeb" }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-[18px]" style={{ background: "#e9efeb" }} />
            ))}
          </div>
          <div className="h-96 rounded-[18px]" style={{ background: "#e9efeb" }} />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
        <StCard className="text-center max-w-sm">
          <XCircle className="w-12 h-12 mx-auto" style={{ color: ST.roseText }} />
          <p className="text-[13px] font-bold mt-3" style={{ color: ST.text }}>{error}</p>
          <div className="mt-4">
            <StButton onClick={load}>Réessayer</StButton>
          </div>
        </StCard>
      </div>
    );
  }

  if (!data) return null;
  const { profile, stats, upcoming, pastSessions } = data;

  const profileComplete =
    profile.specialty && profile.bio && profile.sessionPrice > 0 && profile.languages.length > 0;

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Dashboard Mentor"
          subtitle="Gérez vos séances, suivez vos revenus et accompagnez vos apprenants."
          actions={
            <>
              <button
                onClick={toggleAvailability}
                disabled={togglingAvail}
                className="inline-flex items-center gap-1.5 text-[12px] font-extrabold rounded-[10px] px-3 py-2 transition-all disabled:opacity-50"
                style={
                  availability
                    ? { background: ST.greenSoft, color: ST.green, border: `1px solid #d7ecde` }
                    : { background: "#fff", color: ST.textSecondary, border: `1px solid ${ST.cardBorder}` }
                }
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: availability ? ST.greenBright : "#cbd5cd" }}
                />
                {availability ? "Disponible" : "Indisponible"}
              </button>
              <StButton variant="secondary" href="/mentor/profil" icon={Edit3}>
                Mon profil
              </StButton>
              <StButton href="/mentor/rendez-vous" icon={Calendar}>
                Rendez-vous
              </StButton>
            </>
          }
        />

        <CommunityBanner tone="mentor" />

        {/* KYC banner */}
        {kycState && kycState.level < 2 && (
          <StCard className="mb-4 !p-5">
            <div className="flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-[11px] flex items-center justify-center flex-shrink-0"
                style={kycState.pending ? { background: ST.amberSoft, color: ST.amberText } : { background: ST.roseSoft, color: ST.roseText }}
              >
                {kycState.pending ? <Hourglass size={20} /> : <CircleAlert size={20} />}
              </div>
              <div className="flex-1">
                <h3 className="text-[13.5px] font-extrabold" style={{ color: ST.text }}>
                  {kycState.pending
                    ? "Vérification d'identité en cours"
                    : "Vérification d'identité requise"}
                </h3>
                <p className="text-[12px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
                  {kycState.pending
                    ? "Notre équipe examine votre demande (24-48h). Vous serez notifié dès validation."
                    : "Sans vérification, vous ne pourrez pas retirer les gains de vos séances."}
                </p>
                {!kycState.pending && (
                  <div className="mt-3">
                    <StButton size="sm" href="/kyc" icon={ShieldCheck}>
                      Commencer la vérification
                    </StButton>
                  </div>
                )}
              </div>
            </div>
          </StCard>
        )}

        {/* Profile incomplete */}
        {!profileComplete && (
          <StCard className="mb-4 !p-4">
            <div className="flex items-start gap-3">
              <CircleAlert size={20} className="flex-shrink-0 mt-0.5" style={{ color: ST.amberText }} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>Profil incomplet</p>
                <p className="text-[11.5px] font-semibold mt-0.5" style={{ color: ST.textSecondary }}>
                  Complétez votre profil (spécialité, bio, prix, langues) pour apparaître dans la liste
                  des mentors.
                </p>
              </div>
              <StButton variant="secondary" size="sm" href="/mentor/profil">
                Compléter
              </StButton>
            </div>
          </StCard>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
          <StKpi
            label="Revenus nets acquis"
            value={fmt(stats.totalRevenue)}
            unit="F"
            icon={Wallet}
            chip={<StChip tone="green">{fmt(stats.grossRevenue)} bruts</StChip>}
          />
          <StKpi
            label="En attente (escrow)"
            value={fmt(stats.pendingRevenue)}
            unit="F"
            icon={Hourglass}
            chip={<StChip tone="amber">{stats.pendingCount} session{stats.pendingCount > 1 ? "s" : ""}</StChip>}
          />
          <StKpi
            label="À confirmer"
            value={stats.pendingBookings}
            icon={Calendar}
            chip={<StChip tone="blue">{stats.confirmedBookings} confirmés</StChip>}
          />
          <StKpi
            label="Note moyenne"
            value={profile.rating > 0 ? profile.rating.toFixed(1) : "—"}
            icon={Star}
            chip={profile.reviewsCount > 0 ? <StChip tone="neutral">{profile.reviewsCount} avis</StChip> : undefined}
          />
        </div>

        {/* Calendar CTA */}
        {profileComplete && (
          <div className="mb-4">
            <StSuggestion
              tone="green"
              icon={CalendarPlus}
              title="Configurez vos disponibilités"
              subtitle="Définissez vos créneaux hebdomadaires pour recevoir des réservations automatiquement."
              href="/mentor/calendrier"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          {/* Upcoming sessions */}
          <div className="lg:col-span-2 space-y-4">
            <StCard className="!p-[18px_20px]">
              <StSectionTitle
                action={
                  <Link href="/mentor/rendez-vous" className="text-[12px] font-extrabold inline-flex items-center gap-1 hover:underline" style={{ color: ST.green }}>
                    Voir tout <ArrowRight size={13} />
                  </Link>
                }
              >
                Prochaines séances
              </StSectionTitle>
              {upcoming.length === 0 ? (
                <div className="rounded-[14px] p-8 text-center" style={{ background: "#fbfdfc", border: "2px dashed #bcd6c5" }}>
                  <Calendar size={32} style={{ color: "#bcd6c5" }} className="mx-auto" />
                  <p className="text-[13px] font-extrabold mt-2.5" style={{ color: ST.greenDark }}>Aucune séance à venir</p>
                  <p className="text-[11.5px] font-semibold mt-1" style={{ color: ST.textMuted }}>
                    Partagez votre profil pour recevoir des demandes de réservation.
                  </p>
                  <div className="mt-3">
                    <StButton size="sm" variant="secondary" href="/mentors">
                      Voir mon profil public
                    </StButton>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-[14px] p-4 transition-colors"
                      style={{ border: `1px solid ${ST.cardBorder}`, background: "#fff" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <StAvatar name={b.student.name ?? b.student.email ?? "Apprenant"} size={40} src={b.student.image} />
                          <div>
                            <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>
                              {b.student.name ?? b.student.email ?? "Apprenant"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[11.5px] font-semibold flex items-center gap-1" style={{ color: ST.textSecondary }}>
                                <Calendar size={12} />
                                {fmtDate(b.scheduledAt)}
                              </span>
                              <span className="text-[11.5px] font-semibold flex items-center gap-1" style={{ color: ST.textSecondary }}>
                                <Timer size={12} />
                                {fmtTime(b.scheduledAt)} · {b.durationMinutes} min
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <StStatusPill status={b.status} />
                          <p className="text-[13px] font-extrabold tabular-nums" style={{ color: ST.green }}>
                            {fmt(b.paidAmount)} F
                          </p>
                        </div>
                      </div>

                      {b.meetingLink && (
                        <a
                          href={b.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center gap-1.5 text-[11.5px] font-semibold hover:underline"
                          style={{ color: ST.blueText }}
                        >
                          <Video size={14} />
                          {b.meetingLink}
                        </a>
                      )}

                      <BookingActions booking={b} onRefresh={load} />
                    </div>
                  ))}
                </div>
              )}
            </StCard>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Profile card */}
            <StCard noPadding className="overflow-hidden flex flex-col">
              <div
                className="relative aspect-[4/3] overflow-hidden"
                style={{ background: ST.gradient }}
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
                  className="absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full backdrop-blur shadow-sm"
                  style={profile.isAvailable ? { background: "rgba(34,197,94,.95)", color: "#fff" } : { background: "rgba(93,113,102,.95)", color: "#fff" }}
                >
                  <span
                    className="w-1 h-1 rounded-full"
                    style={{ background: profile.isAvailable ? "#fff" : "#cbd5cd" }}
                  />
                  {profile.isAvailable ? "Disponible" : "Indisponible"}
                </span>

                {profile.isVerified && (
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 bg-white/95 backdrop-blur text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-sm" style={{ color: ST.green }}>
                    <ShieldCheck className="w-3 h-3" style={{ color: ST.greenBright }} />
                    Vérifié
                  </span>
                )}

                <div
                  className="absolute bottom-2 left-2 w-12 h-12 rounded-full ring-2 ring-white shadow-lg overflow-hidden flex items-center justify-center text-white"
                  style={{ background: ST.gradient }}
                >
                  <User className="w-5 h-5" />
                </div>

                {profile.rating > 0 && (
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-white/95 backdrop-blur text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm" style={{ color: ST.text }}>
                    <Star className="w-3 h-3 text-amber-400" fill="currentColor" />
                    {profile.rating.toFixed(1)}
                  </span>
                )}
              </div>

              <div className="p-4 flex flex-col gap-2">
                <div>
                  <p className="text-[13px] font-extrabold line-clamp-1" style={{ color: ST.text }}>
                    {profile.specialty || "Spécialité non définie"}
                  </p>
                  {profile.domain && (
                    <div className="mt-1">
                      <StChip tone="neutral">{profile.domain}</StChip>
                    </div>
                  )}
                </div>
                <p className="text-[11.5px] font-semibold line-clamp-3 leading-relaxed" style={{ color: ST.textSecondary }}>
                  {profile.bio ||
                    "Aucune bio renseignée. Ajoutez une description pour attirer des apprenants."}
                </p>
                <div className="flex items-center justify-between mt-1 pt-2" style={{ borderTop: `1px solid ${ST.divider}` }}>
                  <div>
                    <p className="text-[13px] font-extrabold leading-tight tabular-nums" style={{ color: ST.green }}>
                      {fmt(profile.sessionPrice)}{" "}
                      <span className="text-[10px] font-bold" style={{ color: ST.textMuted }}>FCFA</span>
                    </p>
                    <p className="text-[10px] font-semibold" style={{ color: ST.textMuted }}>{profile.sessionDuration} min</p>
                  </div>
                  <StButton variant="secondary" size="sm" href="/mentor/profil" icon={Edit3}>
                    Modifier
                  </StButton>
                </div>
              </div>
            </StCard>

            {/* Past sessions */}
            <StCard className="!p-[18px_20px]">
              <StSectionTitle>Séances passées</StSectionTitle>
              {pastSessions.length === 0 ? (
                <p className="text-[11.5px] font-semibold text-center py-4" style={{ color: ST.textMuted }}>
                  Aucune séance terminée pour l&apos;instant.
                </p>
              ) : (
                <div className="space-y-3">
                  {pastSessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <StAvatar name={s.student.name ?? "Apprenant"} size={28} />
                        <div className="min-w-0">
                          <p className="text-[12px] font-extrabold truncate" style={{ color: ST.text }}>
                            {s.student.name ?? "Apprenant"}
                          </p>
                          <p className="text-[10px] font-semibold" style={{ color: ST.textMuted }}>{fmtDate(s.scheduledAt)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <p className="text-[12px] font-extrabold tabular-nums" style={{ color: ST.green }}>
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
                          <p className="text-[10px] font-semibold" style={{ color: ST.textFaint }}>Non noté</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </StCard>

            {/* Quick stats — hero gradient vert */}
            <div
              className="rounded-[18px] p-4 text-white relative overflow-hidden"
              style={{ background: ST.gradient }}
            >
              <div aria-hidden className="absolute rounded-full" style={{ right: -40, top: -50, width: 160, height: 160, background: "rgba(255,255,255,.08)" }} />
              <p className="relative text-[11px] font-extrabold text-white/75 mb-3 uppercase tracking-wider">
                Statistiques globales
              </p>
              <div className="relative space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-white/85">Séances totales</span>
                  <span className="text-[13px] font-extrabold">{profile.totalSessions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-white/85">Apprenants</span>
                  <span className="text-[13px] font-extrabold">{profile.totalStudents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-white/85">Note / 5</span>
                  <span className="text-[13px] font-extrabold">
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
                  <span className="text-[12px] text-white/85">Avis reçus</span>
                  <span className="text-[13px] font-extrabold">{profile.reviewsCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
