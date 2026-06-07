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
  KazaHero,
  KazaCard,
  KazaKpiCard,
  KazaBadge,
  KazaEmpty,
} from "@/components/kaza";

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

function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
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
      <div className="min-h-screen bg-slate-50/50 p-6">
        <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
          <div className="h-32 bg-slate-200 rounded-3xl" />
          <div className="h-24 bg-slate-200 rounded-2xl" />
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-slate-200 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="px-5 md:px-10 py-8 md:py-12 max-w-[1200px] mx-auto space-y-8">
        <KazaHero
          badge="Mentor"
          badgeColor="white"
          icon={Users}
          title="Mes apprenants"
          subtitle="Vue agrégée de toutes les personnes que vous avez accompagnées."
        />

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
          <KazaKpiCard label="Total apprenants" value={students.length} icon={Users} iconColor="emerald" />
          <KazaKpiCard label="Total séances" value={bookings.length} icon={CalendarCheck} iconColor="navy" />
          <KazaKpiCard
            label="Terminées"
            value={bookings.filter((b) => b.status === "COMPLETED").length}
            icon={CheckCircle2}
            iconColor="sky"
          />
          <KazaKpiCard label="Revenus bruts" value={`${fmt(totalRevenue)} F`} icon={Wallet} iconColor="violet" />
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-500 ml-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email…"
            className="flex-1 text-sm focus:outline-none bg-transparent"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-slate-500 hover:text-slate-900 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Students list */}
        {filtered.length === 0 ? (
          <KazaEmpty
            icon={UsersRound}
            title={students.length === 0 ? "Aucun apprenant pour l'instant" : "Aucun résultat"}
            description={
              students.length === 0
                ? "Partagez votre profil public pour recevoir vos premières réservations."
                : "Essayez d'autres mots-clés."
            }
            action={students.length === 0 ? { label: "Voir mon profil public", href: "/mentor/profil" } : undefined}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <KazaCard key={s.id} className="hover:border-emerald-300 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-400 text-white font-bold flex items-center justify-center flex-shrink-0">
                    {s.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.image} alt={s.name ?? ""} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      initials(s.name)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {s.name ?? s.email ?? "Apprenant"}
                      </p>
                      {s.email && s.name && (
                        <p className="text-[11px] text-slate-500 truncate">{s.email}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <CalendarCheck className="w-3 h-3" />
                        {s.totalBookings} séance{s.totalBookings > 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {s.completedBookings} terminée{s.completedBookings > 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet className="w-3 h-3" />
                        {fmt(s.totalRevenue)} F
                      </span>
                      <span className="flex items-center gap-1">
                        <History className="w-3 h-3" />
                        Dernière : {timeAgo(s.lastBookingAt)}
                      </span>
                      {s.avgRating != null && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Star className="w-3 h-3 fill-current" />
                          {s.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
                    {s.pendingOrConfirmed > 0 && (
                      <KazaBadge variant="orange">{s.pendingOrConfirmed} à venir</KazaBadge>
                    )}
                    <Link
                      href={`/messages?to=${s.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Message
                    </Link>
                  </div>
                </div>
              </KazaCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
