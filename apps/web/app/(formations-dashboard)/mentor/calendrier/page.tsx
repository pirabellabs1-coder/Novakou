// Refonte style KAZA — mentor calendrier — 2026-06-07
"use client";

/**
 * Mentor calendar — date-based availability (Google Calendar style).
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { confirmAction } from "@/store/confirm";
import {
  KazaHero,
  KazaKpiCard,
  KazaButton,
} from "@/components/kaza";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CalendarCheck,
  Plus,
  X,
  CheckCircle2,
  CircleAlert,
  Timer,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

interface DatedSlot {
  id?: string;
  date: string;
  startMin: number;
  endMin: number;
  isActive?: boolean;
}

interface WeeklyBlock {
  id?: string;
  dayOfWeek: number;
  startMin: number;
  endMin: number;
  isActive?: boolean;
}

interface Config {
  timezone: string;
  sessionBuffer: number;
  bookingLeadTime: number;
  sessionDuration: number;
}

function minToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function hhmmToMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function toUtcMidnightISO(d: Date): string {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
}
function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const WEEK_HEADERS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function buildMonthGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const dayIdx = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - dayIdx);

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const c = new Date(start);
    c.setDate(start.getDate() + i);
    cells.push(c);
  }
  return cells;
}

export default function MentorCalendrierPage() {
  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [datedSlots, setDatedSlots] = useState<DatedSlot[]>([]);
  const [weeklyBlocks, setWeeklyBlocks] = useState<WeeklyBlock[]>([]);
  const [config, setConfig] = useState<Config>({
    timezone: "Africa/Abidjan",
    sessionBuffer: 15,
    bookingLeadTime: 60,
    sessionDuration: 60,
  });
  const [loading, setLoading] = useState(true);
  const [savingDay, setSavingDay] = useState(false);
  const [savingWeekly, setSavingWeekly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [editingDate, setEditingDate] = useState<Date | null>(null);
  const [draftRanges, setDraftRanges] = useState<{ startMin: number; endMin: number }[]>([]);

  const loadSlots = useCallback(async (forMonth: Date) => {
    try {
      const from = startOfMonth(forMonth);
      const to = new Date(forMonth.getFullYear(), forMonth.getMonth() + 2, 0);
      const qs = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
      const res = await fetch(`/api/formations/mentor/availability-slots?${qs}`);
      if (!res.ok) throw new Error("Erreur chargement calendrier");
      const json = await res.json();
      setDatedSlots(json.data.slots ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    }
  }, []);

  useEffect(() => {
    async function initial() {
      try {
        await loadSlots(month);
        const wRes = await fetch("/api/formations/mentor/availability");
        if (wRes.ok) {
          const wJson = await wRes.json();
          setWeeklyBlocks(wJson.data.availabilities ?? []);
          setConfig(wJson.data.config ?? config);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }
    initial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    loadSlots(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const monthGrid = useMemo(() => buildMonthGrid(month), [month]);

  const slotsByDay = useMemo(() => {
    const m = new Map<string, DatedSlot[]>();
    for (const s of datedSlots) {
      const d = new Date(s.date);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      const list = m.get(key) ?? [];
      list.push(s);
      m.set(key, list);
    }
    return m;
  }, [datedSlots]);

  function dayKey(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  function slotsForDay(d: Date): DatedSlot[] {
    return slotsByDay.get(dayKey(d)) ?? [];
  }

  const totalRangesThisMonth = useMemo(() => {
    let count = 0;
    for (const s of datedSlots) {
      const d = new Date(s.date);
      if (d.getUTCMonth() === month.getMonth() && d.getUTCFullYear() === month.getFullYear())
        count++;
    }
    return count;
  }, [datedSlots, month]);

  const totalHoursThisMonth = useMemo(() => {
    let mins = 0;
    for (const s of datedSlots) {
      const d = new Date(s.date);
      if (d.getUTCMonth() === month.getMonth() && d.getUTCFullYear() === month.getFullYear()) {
        if (s.isActive !== false) mins += Math.max(0, s.endMin - s.startMin);
      }
    }
    return Math.round((mins / 60) * 10) / 10;
  }, [datedSlots, month]);

  function openDay(d: Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return;
    setEditingDate(d);
    setDraftRanges(slotsForDay(d).map((s) => ({ startMin: s.startMin, endMin: s.endMin })));
  }

  function closeModal() {
    setEditingDate(null);
    setDraftRanges([]);
  }

  function addDraftRange() {
    setDraftRanges((prev) => [...prev, { startMin: 9 * 60, endMin: 9 * 60 + 30 }]);
  }

  function updateDraftRange(idx: number, patch: Partial<{ startMin: number; endMin: number }>) {
    setDraftRanges((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function removeDraftRange(idx: number) {
    setDraftRanges((prev) => prev.filter((_, i) => i !== idx));
  }

  async function saveDay() {
    if (!editingDate) return;
    setSavingDay(true);
    setError(null);
    try {
      const dateISO = toUtcMidnightISO(editingDate);
      const slots = draftRanges
        .filter((r) => r.endMin > r.startMin)
        .map((r) => ({ date: dateISO, startMin: r.startMin, endMin: r.endMin }));

      if (slots.length === 0) {
        const qs = new URLSearchParams({ date: dateISO });
        const res = await fetch(`/api/formations/mentor/availability-slots?${qs}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erreur");
      } else {
        const res = await fetch("/api/formations/mentor/availability-slots", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slots }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(
            json.details ? (json.details as string[]).join(" · ") : json.error ?? "Erreur",
          );
        }
      }

      await loadSlots(month);
      setInfo("Plages enregistrées");
      setTimeout(() => setInfo(null), 2500);
      closeModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSavingDay(false);
    }
  }

  async function clearDay() {
    if (!editingDate) return;
    setDraftRanges([]);
  }

  async function applyWeekdaysPreset() {
    const ok = await confirmAction({
      title: "Appliquer le préset de semaine ?",
      message:
        "09:00–12:00 et 14:00–18:00 sur les jours ouvrés des 4 prochaines semaines.\nCela remplace les plages existantes pour ces jours.",
      confirmLabel: "Appliquer",
      confirmVariant: "warning",
      icon: "event_available",
    });
    if (!ok) return;
    setSavingDay(true);
    setError(null);
    try {
      const slots: { date: string; startMin: number; endMin: number }[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < 28; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dow = d.getDay();
        if (dow >= 1 && dow <= 5) {
          const dateISO = toUtcMidnightISO(d);
          slots.push({ date: dateISO, startMin: 9 * 60, endMin: 12 * 60 });
          slots.push({ date: dateISO, startMin: 14 * 60, endMin: 18 * 60 });
        }
      }
      const res = await fetch("/api/formations/mentor/availability-slots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(
          json.details ? (json.details as string[]).join(" · ") : json.error ?? "Erreur",
        );
      await loadSlots(month);
      setInfo("Préset appliqué — 4 prochaines semaines");
      setTimeout(() => setInfo(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSavingDay(false);
    }
  }

  async function clearAll() {
    const ok = await confirmAction({
      title: "Vider toutes les plages ?",
      message:
        "Les plages des 2 mois affichés seront supprimées. Cette action est irréversible.",
      confirmLabel: "Tout vider",
      confirmVariant: "danger",
      icon: "delete_sweep",
    });
    if (!ok) return;
    setSavingDay(true);
    setError(null);
    try {
      const dates = new Set<string>();
      for (const s of datedSlots) dates.add(s.date);
      for (const dateISO of dates) {
        const qs = new URLSearchParams({ date: dateISO });
        await fetch(`/api/formations/mentor/availability-slots?${qs}`, { method: "DELETE" });
      }
      await loadSlots(month);
      setInfo("Calendrier vidé");
      setTimeout(() => setInfo(null), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSavingDay(false);
    }
  }

  function addWeeklyBlock(day: number) {
    setWeeklyBlocks((prev) => [
      ...prev,
      { dayOfWeek: day, startMin: 9 * 60, endMin: 17 * 60, isActive: true },
    ]);
  }
  function updateWeeklyBlock(i: number, patch: Partial<WeeklyBlock>) {
    setWeeklyBlocks((prev) => prev.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }
  function removeWeeklyBlock(i: number) {
    setWeeklyBlocks((prev) => prev.filter((_, idx) => idx !== i));
  }
  async function saveWeekly() {
    setSavingWeekly(true);
    setError(null);
    try {
      const res = await fetch("/api/formations/mentor/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availabilities: weeklyBlocks.map((b) => ({
            dayOfWeek: b.dayOfWeek,
            startMin: b.startMin,
            endMin: b.endMin,
            isActive: b.isActive !== false,
          })),
          config,
        }),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(
          json.details ? (json.details as string[]).join(" · ") : json.error ?? "Erreur",
        );
      setWeeklyBlocks(json.data.availabilities ?? weeklyBlocks);
      setInfo("Hebdomadaire enregistrée");
      setTimeout(() => setInfo(null), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSavingWeekly(false);
    }
  }

  if (loading) {
    return (
      <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-3xl" />
        <div className="h-96 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-[1400px] mx-auto space-y-6">
      <KazaHero
        badge="Mentor"
        badgeColor="white"
        icon={Calendar}
        title="Calendrier de disponibilité"
        subtitle="Cliquez sur un jour pour ajouter vos plages horaires. Les apprenants verront automatiquement les créneaux libres."
        actions={
          <>
            <KazaButton
              variant="secondary"
              onClick={applyWeekdaysPreset}
              disabled={savingDay}
              icon={Sparkles}
            >
              Préset 9h-12h / 14h-18h
            </KazaButton>
            <KazaButton variant="danger" onClick={clearAll} disabled={savingDay} icon={Trash2}>
              Vider tout
            </KazaButton>
          </>
        }
      />

      {info && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <p className="text-sm text-emerald-700 font-semibold">{info}</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <CircleAlert className="w-5 h-5 text-rose-500 mt-0.5" />
          <p className="text-sm text-rose-700 flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:bg-rose-100 rounded p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KazaKpiCard
          label="Plages ce mois"
          value={totalRangesThisMonth}
          delta={`${totalHoursThisMonth} h`}
          icon={CalendarCheck}
          iconColor="emerald"
        />
        <KazaKpiCard
          label="Durée d'une session"
          value={`${config.sessionDuration} min`}
          icon={Timer}
          iconColor="sky"
        />
        <KazaKpiCard
          label="Délai min avant résa"
          value={
            config.bookingLeadTime >= 60
              ? `${Math.round(config.bookingLeadTime / 60)} h`
              : `${config.bookingLeadTime} min`
          }
          icon={Clock}
          iconColor="violet"
        />
      </section>

      {/* Month grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMonth(startOfMonth(new Date()))}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-[#0b2540]"
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              aria-label="Mois suivant"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-base font-extrabold text-[#0b2540]">
            {MONTHS_FR[month.getMonth()]} {month.getFullYear()}
          </h2>
          <div className="text-[10px] text-slate-500 hidden sm:block">{config.timezone}</div>
        </div>

        <div className="grid grid-cols-7 text-[11px] font-bold text-slate-500 bg-slate-50 border-b border-slate-100">
          {WEEK_HEADERS.map((h) => (
            <div key={h} className="py-2 text-center uppercase">
              {h}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthGrid.map((d, i) => {
            const inMonth = d.getMonth() === month.getMonth();
            const isPast = d < today;
            const isToday = sameLocalDay(d, today);
            const list = slotsForDay(d);
            const totalMin = list.reduce((a, s) => a + Math.max(0, s.endMin - s.startMin), 0);
            const hours =
              totalMin > 0
                ? `${Math.floor(totalMin / 60)}h${totalMin % 60 ? String(totalMin % 60).padStart(2, "0") : ""}`
                : null;

            return (
              <button
                key={i}
                onClick={() => openDay(d)}
                disabled={isPast}
                className={`relative min-h-[88px] sm:min-h-[100px] border-b border-r border-slate-100 p-1.5 text-left transition-colors ${
                  inMonth ? "bg-white" : "bg-slate-50/60"
                } ${isPast ? "opacity-40 cursor-not-allowed" : "hover:bg-emerald-50 cursor-pointer"} ${
                  isToday ? "ring-2 ring-emerald-500 ring-inset" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold ${
                      inMonth ? "text-[#0b2540]" : "text-slate-400"
                    } ${isToday ? "text-emerald-600" : ""}`}
                  >
                    {d.getDate()}
                  </span>
                  {list.length > 0 && (
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  )}
                </div>
                {list.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-[10px] font-semibold text-emerald-600">
                      {list.length} plage{list.length > 1 ? "s" : ""}
                    </p>
                    {hours && <p className="text-[9px] text-slate-500">{hours}</p>}
                    <div className="hidden sm:block space-y-0.5 mt-1">
                      {list.slice(0, 2).map((s, j) => (
                        <div
                          key={j}
                          className="text-[9px] bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded font-semibold truncate"
                        >
                          {minToHHMM(s.startMin)}–{minToHHMM(s.endMin)}
                        </div>
                      ))}
                      {list.length > 2 && (
                        <div className="text-[9px] text-slate-500 font-semibold">
                          +{list.length - 2} autre{list.length - 2 > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced weekly recurrence */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowAdvanced((s) => !s)}
          className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-slate-50"
        >
          <div>
            <p className="text-sm font-bold text-[#0b2540]">
              Mode avancé : récurrence hebdomadaire (legacy)
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Utilisé uniquement si aucune plage datée n&apos;est définie pour la semaine demandée.
            </p>
          </div>
          {showAdvanced ? (
            <ChevronUp className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          )}
        </button>
        {showAdvanced && (
          <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-3">
            {weeklyBlocks.length === 0 && (
              <p className="text-xs text-slate-500">Aucune plage hebdomadaire définie.</p>
            )}
            <div className="space-y-1">
              {weeklyBlocks.map((b, idx) => {
                const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs py-1">
                    <select
                      value={b.dayOfWeek}
                      onChange={(e) =>
                        updateWeeklyBlock(idx, { dayOfWeek: Number(e.target.value) })
                      }
                      className="border border-slate-200 rounded px-2 py-1 text-xs"
                    >
                      {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                        <option key={d} value={d}>
                          {dayNames[d]}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={minToHHMM(b.startMin)}
                      onChange={(e) =>
                        updateWeeklyBlock(idx, { startMin: hhmmToMin(e.target.value) })
                      }
                      className="border border-slate-200 rounded px-2 py-1 text-xs font-bold text-[#0b2540] bg-white"
                      step="900"
                    />
                    <span className="font-bold text-slate-500">→</span>
                    <input
                      type="time"
                      value={minToHHMM(b.endMin)}
                      onChange={(e) =>
                        updateWeeklyBlock(idx, { endMin: hhmmToMin(e.target.value) })
                      }
                      className="border border-slate-200 rounded px-2 py-1 text-xs font-bold text-[#0b2540] bg-white"
                      step="900"
                    />
                    <button
                      onClick={() => removeWeeklyBlock(idx)}
                      className="ml-auto text-rose-500 hover:bg-rose-50 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 flex-wrap pt-2">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
                return (
                  <button
                    key={d}
                    onClick={() => addWeeklyBlock(d)}
                    className="px-2 py-1 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600"
                  >
                    + {dayNames[d]}
                  </button>
                );
              })}
              <div className="ml-auto">
                <KazaButton
                  variant="primary"
                  size="sm"
                  onClick={saveWeekly}
                  disabled={savingWeekly}
                >
                  {savingWeekly ? "Enregistrement…" : "Enregistrer hebdo"}
                </KazaButton>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-2xl px-4 py-3 flex items-start gap-2">
        <Info className="w-5 h-5 text-sky-600 mt-0.5" />
        <div className="flex-1 text-xs text-sky-800">
          <p className="font-semibold">Comment ça marche</p>
          <p className="mt-0.5">
            Les plages que vous définissez sont découpées en créneaux de {config.sessionDuration}{" "}
            min côté apprenant. Les sessions déjà réservées ne sont jamais écrasées.
          </p>
        </div>
      </div>

      {/* Modal */}
      {editingDate && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">
                  {editingDate.toLocaleDateString("fr-FR", { weekday: "long" })}
                </p>
                <p className="text-lg font-extrabold text-[#0b2540]">
                  {editingDate.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {draftRanges.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  Aucune plage. Ajoutez votre première disponibilité ci-dessous.
                </p>
              ) : (
                draftRanges.map((r, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={minToHHMM(r.startMin)}
                      onChange={(e) =>
                        updateDraftRange(idx, { startMin: hhmmToMin(e.target.value) })
                      }
                      className="border-2 border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-[#0b2540] bg-white flex-1 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
                      step="900"
                    />
                    <span className="text-slate-500 font-bold">→</span>
                    <input
                      type="time"
                      value={minToHHMM(r.endMin)}
                      onChange={(e) =>
                        updateDraftRange(idx, { endMin: hhmmToMin(e.target.value) })
                      }
                      className="border-2 border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-[#0b2540] bg-white flex-1 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500"
                      step="900"
                    />
                    <button
                      onClick={() => removeDraftRange(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}

              <button
                onClick={addDraftRange}
                className="w-full mt-2 py-2.5 rounded-xl border-2 border-dashed border-emerald-300 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Ajouter une plage
              </button>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[10px] text-slate-500 text-center">
                  Format HH:MM. Durée minimum 30 min, pas de chevauchement.
                </p>
                <div className="flex gap-2">
                  <KazaButton variant="ghost" onClick={clearDay} className="flex-1">
                    Vider ce jour
                  </KazaButton>
                  <KazaButton
                    variant="primary"
                    onClick={saveDay}
                    disabled={savingDay}
                    className="flex-1"
                  >
                    {savingDay ? "Enregistrement…" : "Enregistrer"}
                  </KazaButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
