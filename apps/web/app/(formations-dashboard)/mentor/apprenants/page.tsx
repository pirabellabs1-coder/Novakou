"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Page ─────────────────────────────────────────────────────────────────────
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

  // Group bookings by student
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
    // Compute avg rating per student
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
      <div className="min-h-screen bg-[#f7f9fb] p-6">
        <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded-xl" />
          <div className="h-32 bg-gray-200 rounded-2xl" />
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/mentor/dashboard" className="text-[#5c647a] hover:text-[#191c1e]">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <span className="text-sm font-bold text-[#191c1e] flex-1">Mes apprenants</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-extrabold text-[#191c1e]">Mes apprenants</h1>
          <p className="text-sm text-[#5c647a] mt-1">
            Vue agrégée de toutes les personnes que vous avez accompagnées.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-[#5c647a] font-medium">Total apprenants</p>
            <p className="text-2xl font-extrabold text-[#006e2f] mt-1">{students.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-[#5c647a] font-medium">Total séances</p>
            <p className="text-2xl font-extrabold text-[#191c1e] mt-1">{bookings.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-[#5c647a] font-medium">Terminées</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-1">
              {bookings.filter((b) => b.status === "COMPLETED").length}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-[#5c647a] font-medium">Revenus bruts</p>
            <p className="text-2xl font-extrabold text-[#006e2f] mt-1">{fmt(totalRevenue)} F</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#5c647a] text-[18px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email…"
            className="flex-1 text-sm focus:outline-none bg-transparent"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-[#5c647a] hover:text-[#191c1e]">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Students list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <span className="material-symbols-outlined text-gray-300 text-5xl">group_off</span>
            <p className="text-sm text-[#5c647a] font-medium mt-3">
              {students.length === 0 ? "Aucun apprenant pour l'instant." : "Aucun résultat."}
            </p>
            {students.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Partagez votre profil public pour recevoir vos premières réservations.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-[#006e2f]/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] text-white font-bold flex items-center justify-center flex-shrink-0">
                    {s.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.image} alt={s.name ?? ""} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      initials(s.name)
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-bold text-[#191c1e] truncate">
                        {s.name ?? s.email ?? "Apprenant"}
                      </p>
                      {s.email && s.name && (
                        <p className="text-[11px] text-[#5c647a] truncate">{s.email}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[11px] text-[#5c647a]">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">event_available</span>
                        {s.totalBookings} séance{s.totalBookings > 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        {s.completedBookings} terminée{s.completedBookings > 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">payments</span>
                        {fmt(s.totalRevenue)} F
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">history</span>
                        Dernière : {timeAgo(s.lastBookingAt)}
                      </span>
                      {s.avgRating != null && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <span
                            className="material-symbols-outlined text-[13px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          {s.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {s.pendingOrConfirmed > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-center">
                        {s.pendingOrConfirmed} à venir
                      </span>
                    )}
                    <Link
                      href={`/messages?to=${s.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100"
                    >
                      <span className="material-symbols-outlined text-[13px]">forum</span>
                      Message
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
