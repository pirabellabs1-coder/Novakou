// Refonte design "Stitch" — apprenants mentor — vert Novakou officiel — 2026-06-13.
// Logique 100% préservée : query bookings, agrégation students, recherche.
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  X,
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Wallet,
  History,
  Star,
  MessageCircle,
  UsersRound,
} from "lucide-react";
import {
  StCard,
  StPageHeader,
  StKpiCompact,
  StChip,
  StAvatar,
  ST,
} from "@/components/stitch";

interface Booking {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  paidAmount: number;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  studentRating: number | null;
  student: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface StudentSummary {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  totalBookings: number;
  completedBookings: number;
  pendingOrConfirmed: number;
  totalRevenue: number;
  lastBookingAt: string | null;
  avgRating: number | null;
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return "Aujourd'hui";
  if (d < 7) return `Il y a ${d}j`;
  if (d < 30) return `Il y a ${Math.floor(d / 7)} sem.`;
  if (d < 365) return `Il y a ${Math.floor(d / 30)} mois`;
  return `Il y a ${Math.floor(d / 365)} an(s)`;
}

export default function MentorApprenantsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/formations/mentor/bookings");
        if (!res.ok) throw new Error("Erreur chargement");
        const json = await res.json();
        setBookings(json.data ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const students: StudentSummary[] = useMemo(() => {
    const m = new Map<string, StudentSummary>();
    for (const b of bookings) {
      const sid = b.student.id;
      const existing = m.get(sid) ?? {
        id: sid,
        name: b.student.name,
        email: b.student.email,
        image: b.student.image,
        totalBookings: 0,
        completedBookings: 0,
        pendingOrConfirmed: 0,
        totalRevenue: 0,
        lastBookingAt: null as string | null,
        avgRating: null as number | null,
      };
      existing.totalBookings += 1;
      if (b.status === "COMPLETED") {
        existing.completedBookings += 1;
        existing.totalRevenue += b.paidAmount;
      }
      if (b.status === "PENDING" || b.status === "CONFIRMED") {
        existing.pendingOrConfirmed += 1;
      }
      if (!existing.lastBookingAt || new Date(b.scheduledAt) > new Date(existing.lastBookingAt)) {
        existing.lastBookingAt = b.scheduledAt;
      }
      m.set(sid, existing);
    }
    for (const [sid, s] of m.entries()) {
      const ratings = bookings
        .filter((b) => b.student.id === sid && b.studentRating != null)
        .map((b) => b.studentRating as number);
      s.avgRating = ratings.length
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;
    }
    return Array.from(m.values()).sort((a, b) => b.totalBookings - a.totalBookings);
  }, [bookings]);

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const s = search.toLowerCase();
    return students.filter(
      (st) =>
        (st.name ?? "").toLowerCase().includes(s) ||
        (st.email ?? "").toLowerCase().includes(s),
    );
  }, [students, search]);

  const totalRevenue = useMemo(
    () => students.reduce((a, s) => a + s.totalRevenue, 0),
    [students],
  );

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
        <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1200px] mx-auto space-y-4 animate-pulse">
          <div className="h-10 w-64 rounded-xl" style={{ background: "#e9efeb" }} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-[18px]" style={{ background: "#e9efeb" }} />)}
          </div>
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-[18px]" style={{ background: "#e9efeb" }} />)}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1200px] mx-auto">
        <StPageHeader
          title="Mes apprenants"
          subtitle="Vue agrégée de toutes les personnes que vous avez accompagnées."
        />

        {error && (
          <div className="mb-4 rounded-[13px] px-4 py-3 flex items-center gap-2" style={{ background: ST.roseSoft, border: "1px solid #f3d4de" }}>
            <AlertCircle size={16} style={{ color: ST.roseText }} />
            <p className="text-[13px] font-bold" style={{ color: ST.roseText }}>{error}</p>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3.5 mb-4">
          <StKpiCompact label="Total apprenants" value={students.length} icon={Users} tone="green" />
          <StKpiCompact label="Total séances" value={bookings.length} icon={CalendarCheck} tone="blue" />
          <StKpiCompact
            label="Terminées"
            value={bookings.filter((b) => b.status === "COMPLETED").length}
            icon={CheckCircle2}
            tone="green"
          />
          <StKpiCompact label="Revenus bruts" value={`${fmt(totalRevenue)} F`} icon={Wallet} tone="amber" />
        </div>

        {/* Search */}
        <StCard className="!p-3 flex items-center gap-2 mb-4">
          <Search size={16} className="ml-2" style={{ color: ST.textMuted }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email…"
            className="flex-1 text-[13px] font-semibold focus:outline-none bg-transparent"
            style={{ color: ST.text }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="p-1" style={{ color: ST.textMuted }}>
              <X size={16} />
            </button>
          )}
        </StCard>

        {/* Students list */}
        {filtered.length === 0 ? (
          <StCard className="text-center py-12">
            <UsersRound size={40} style={{ color: "#d6e0da" }} className="mx-auto" />
            <p className="text-[14px] font-extrabold mt-3" style={{ color: ST.text }}>
              {students.length === 0 ? "Aucun apprenant pour l'instant" : "Aucun résultat"}
            </p>
            <p className="text-[12px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
              {students.length === 0
                ? "Partagez votre profil public pour recevoir vos premières réservations."
                : "Essayez d'autres mots-clés."}
            </p>
            {students.length === 0 && (
              <div className="mt-4">
                <Link
                  href="/mentor/profil"
                  className="inline-flex items-center justify-center font-extrabold text-[12px] rounded-[10px] px-3 py-2"
                  style={{ background: ST.greenSoft, color: ST.green }}
                >
                  Voir mon profil public
                </Link>
              </div>
            )}
          </StCard>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <StCard key={s.id}>
                <div className="flex items-start gap-4">
                  <StAvatar name={s.name ?? s.email ?? "Apprenant"} size={48} src={s.image} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="text-[13px] font-extrabold truncate" style={{ color: ST.text }}>
                        {s.name ?? s.email ?? "Apprenant"}
                      </p>
                      {s.email && s.name && (
                        <p className="text-[11px] font-semibold truncate" style={{ color: ST.textMuted }}>{s.email}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[11px] font-semibold" style={{ color: ST.textSecondary }}>
                      <span className="flex items-center gap-1">
                        <CalendarCheck size={12} />
                        {s.totalBookings} séance{s.totalBookings > 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {s.completedBookings} terminée{s.completedBookings > 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet size={12} />
                        {fmt(s.totalRevenue)} F
                      </span>
                      <span className="flex items-center gap-1">
                        <History size={12} />
                        Dernière : {timeAgo(s.lastBookingAt)}
                      </span>
                      {s.avgRating != null && (
                        <span className="flex items-center gap-1" style={{ color: "#b45309" }}>
                          <Star size={12} className="fill-current" />
                          {s.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
                    {s.pendingOrConfirmed > 0 && (
                      <StChip tone="amber">{s.pendingOrConfirmed} à venir</StChip>
                    )}
                    <Link
                      href={`/messages?to=${s.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-[11px] font-extrabold"
                      style={{ background: ST.greenSoft, color: ST.green }}
                    >
                      <MessageCircle size={12} />
                      Message
                    </Link>
                  </div>
                </div>
              </StCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
