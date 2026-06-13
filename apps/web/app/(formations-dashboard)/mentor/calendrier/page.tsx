// Refonte design "Stitch" — calendrier mentor — vert Novakou officiel — 2026-06-13.
// Logique 100% préservée : slots datés, blocs hebdo, config, presets, modal d'édition jour.
"use client";

/**
 * Mentor calendar — date-based availability (Google Calendar style).
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { confirmAction } from "@/store/confirm";
import {
  StCard,
  StPageHeader,
  StButton,
  StKpiCompact,
  ST,
} from "@/components/stitch";
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
      <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
        <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto space-y-4 animate-pulse">
          <div className="h-10 w-72 rounded-xl" style={{ background: "#e9efeb" }} />
          <div className="h-96 rounded-[18px]" style={{ background: "#e9efeb" }} />
        </main>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen" style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}>
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto">
        <StPageHeader
          title="Calendrier de disponibilité"
          subtitle="Cliquez sur un jour pour ajouter vos plages horaires. Les apprenants verront automatiquement les créneaux libres."
          actions={
            <>
              <StButton
                variant="secondary"
                onClick={applyWeekdaysPreset}
                disabled={savingDay}
                icon={Sparkles}
              >
                Préset 9h-12h / 14h-18h
              </StButton>
              <button
                type="button"
                onClick={clearAll}
                disabled={savingDay}
                className="inline-flex items-center justify-center gap-2 font-extrabold text-[13px] rounded-[12px] px-4 py-2.5 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ background: ST.roseSoft, color: ST.roseText }}
              >
                <Trash2 size={16} />
                Vider tout
              </button>
            </>
          }
        />

        {info && (
          <div className="mb-4 rounded-[13px] px-4 py-2.5 flex items-center gap-2" style={{ background: ST.greenSoft, border: "1px solid #d7ecde" }}>
            <CheckCircle2 size={16} style={{ color: ST.green }} />
            <p className="text-[13px] font-extrabold" style={{ color: ST.greenDark }}>{info}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-[13px] px-4 py-3 flex items-start gap-2" style={{ background: ST.roseSoft, border: "1px solid #f3d4de" }}>
            <CircleAlert size={18} style={{ color: ST.roseText }} className="mt-0.5 flex-shrink-0" />
            <p className="text-[13px] font-bold flex-1" style={{ color: ST.roseText }}>{error}</p>
            <button
              onClick={() => setError(null)}
              className="rounded p-1 hover:bg-rose-100"
              style={{ color: ST.roseText }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-4">
          <StKpiCompact
            label={`Plages ce mois · ${totalHoursThisMonth} h`}
            value={totalRangesThisMonth}
            icon={CalendarCheck}
            tone="green"
          />
          <StKpiCompact
            label="Durée d'une session"
            value={`${config.sessionDuration} min`}
            icon={Timer}
            tone="blue"
          />
          <StKpiCompact
            label="Délai min avant résa"
            value={
              config.bookingLeadTime >= 60
                ? `${Math.round(config.bookingLeadTime / 60)} h`
                : `${config.bookingLeadTime} min`
            }
            icon={Clock}
            tone="amber"
          />
        </div>

        {/* Month grid */}
        <StCard noPadding className="overflow-hidden mb-4">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${ST.divider}` }}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="p-2 rounded-lg hover:bg-slate-100"
                style={{ color: ST.textSecondary }}
                aria-label="Mois précédent"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setMonth(startOfMonth(new Date()))}
                className="px-3 py-1.5 rounded-[10px] text-[12px] font-extrabold"
                style={{ background: ST.greenSoft, color: ST.green }}
              >
                Aujourd&apos;hui
              </button>
              <button
                onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="p-2 rounded-lg hover:bg-slate-100"
                style={{ color: ST.textSecondary }}
                aria-label="Mois suivant"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <h2 className="text-[15px] font-extrabold" style={{ color: ST.text }}>
              {MONTHS_FR[month.getMonth()]} {month.getFullYear()}
            </h2>
            <div className="text-[10px] font-semibold hidden sm:block" style={{ color: ST.textMuted }}>{config.timezone}</div>
          </div>

          <div className="grid grid-cols-7 text-[11px] font-extrabold" style={{ color: ST.textSecondary, background: "#f7faf8", borderBottom: `1px solid ${ST.divider}` }}>
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
                  className={`relative min-h-[88px] sm:min-h-[100px] p-1.5 text-left transition-colors ${
                    isPast ? "opacity-40 cursor-not-allowed" : "hover:bg-emerald-50 cursor-pointer"
                  }`}
                  style={{
                    borderBottom: `1px solid ${ST.divider}`,
                    borderRight: `1px solid ${ST.divider}`,
                    background: inMonth ? "#fff" : "#f7faf8",
                    boxShadow: isToday ? `inset 0 0 0 2px ${ST.greenBright}` : undefined,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[11px] font-extrabold"
                      style={{ color: isToday ? ST.green : inMonth ? ST.text : ST.textFaint }}
                    >
                      {d.getDate()}
                    </span>
                    {list.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: ST.greenBright }} />
                    )}
                  </div>
                  {list.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-[10px] font-extrabold" style={{ color: ST.green }}>
                        {list.length} plage{list.length > 1 ? "s" : ""}
                      </p>
                      {hours && <p className="text-[9px] font-semibold" style={{ color: ST.textMuted }}>{hours}</p>}
                      <div className="hidden sm:block space-y-0.5 mt-1">
                        {list.slice(0, 2).map((s, j) => (
                          <div
                            key={j}
                            className="text-[9px] px-1 py-0.5 rounded font-extrabold truncate"
                            style={{ background: ST.greenSoft, color: ST.green }}
                          >
                            {minToHHMM(s.startMin)}–{minToHHMM(s.endMin)}
                          </div>
                        ))}
                        {list.length > 2 && (
                          <div className="text-[9px] font-extrabold" style={{ color: ST.textMuted }}>
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
        </StCard>

        {/* Advanced weekly recurrence */}
        <StCard noPadding className="overflow-hidden mb-4">
          <button
            onClick={() => setShowAdvanced((s) => !s)}
            className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-slate-50"
          >
            <div>
              <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>
                Mode avancé : récurrence hebdomadaire (legacy)
              </p>
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: ST.textMuted }}>
                Utilisé uniquement si aucune plage datée n&apos;est définie pour la semaine demandée.
              </p>
            </div>
            {showAdvanced ? (
              <ChevronUp size={20} style={{ color: ST.textSecondary }} />
            ) : (
              <ChevronDown size={20} style={{ color: ST.textSecondary }} />
            )}
          </button>
          {showAdvanced && (
            <div className="px-5 pb-5 pt-4 space-y-3" style={{ borderTop: `1px solid ${ST.divider}` }}>
              {weeklyBlocks.length === 0 && (
                <p className="text-[11.5px] font-semibold" style={{ color: ST.textMuted }}>Aucune plage hebdomadaire définie.</p>
              )}
              <div className="space-y-1">
                {weeklyBlocks.map((b, idx) => {
                  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
                  return (
                    <div key={idx} className="flex items-center gap-2 text-[12px] py-1">
                      <select
                        value={b.dayOfWeek}
                        onChange={(e) =>
                          updateWeeklyBlock(idx, { dayOfWeek: Number(e.target.value) })
                        }
                        className="rounded px-2 py-1 text-[12px] font-semibold"
                        style={{ border: "1px solid #dde6e0", color: ST.text }}
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
                        className="rounded px-2 py-1 text-[12px] font-extrabold bg-white"
                        style={{ border: "1px solid #dde6e0", color: ST.text }}
                        step="900"
                      />
                      <span className="font-extrabold" style={{ color: ST.textSecondary }}>→</span>
                      <input
                        type="time"
                        value={minToHHMM(b.endMin)}
                        onChange={(e) =>
                          updateWeeklyBlock(idx, { endMin: hhmmToMin(e.target.value) })
                        }
                        className="rounded px-2 py-1 text-[12px] font-extrabold bg-white"
                        style={{ border: "1px solid #dde6e0", color: ST.text }}
                        step="900"
                      />
                      <button
                        onClick={() => removeWeeklyBlock(idx)}
                        className="ml-auto p-1 rounded hover:bg-rose-50"
                        style={{ color: ST.roseText }}
                      >
                        <Trash2 size={14} />
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
                      className="px-2 py-1 rounded text-[10px] font-extrabold"
                      style={{ background: ST.greenSoft, color: ST.green }}
                    >
                      + {dayNames[d]}
                    </button>
                  );
                })}
                <div className="ml-auto">
                  <StButton
                    size="sm"
                    onClick={saveWeekly}
                    disabled={savingWeekly}
                  >
                    {savingWeekly ? "Enregistrement…" : "Enregistrer hebdo"}
                  </StButton>
                </div>
              </div>
            </div>
          )}
        </StCard>

        <div className="rounded-[14px] px-4 py-3 flex items-start gap-2" style={{ background: "#f1f8fe", border: "1px solid #cfe3f5" }}>
          <Info size={18} style={{ color: ST.blueText }} className="mt-0.5" />
          <div className="flex-1 text-[12px]" style={{ color: "#0c447c" }}>
            <p className="font-extrabold">Comment ça marche</p>
            <p className="font-semibold mt-0.5">
              Les plages que vous définissez sont découpées en créneaux de {config.sessionDuration}{" "}
              min côté apprenant. Les sessions déjà réservées ne sont jamais écrasées.
            </p>
          </div>
        </div>
      </main>

      {/* Modal */}
      {editingDate && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4"
          style={{ fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-[20px] max-w-md w-full max-h-[85vh] overflow-y-auto"
            style={{ border: `1px solid ${ST.cardBorder}`, boxShadow: "0 18px 50px rgba(16,52,32,.18)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 flex items-start justify-between" style={{ borderBottom: `1px solid ${ST.divider}` }}>
              <div>
                <p className="text-[11px] font-extrabold uppercase" style={{ color: ST.textMuted }}>
                  {editingDate.toLocaleDateString("fr-FR", { weekday: "long" })}
                </p>
                <p className="text-[17px] font-extrabold" style={{ color: ST.text }}>
                  {editingDate.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded" style={{ color: ST.textSecondary }}>
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {draftRanges.length === 0 ? (
                <p className="text-[13px] font-semibold text-center py-4" style={{ color: ST.textMuted }}>
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
                      className="rounded-[10px] px-3 py-2 text-[13px] font-extrabold bg-white flex-1 focus:outline-none"
                      style={{ border: "1px solid #dde6e0", color: ST.text }}
                      step="900"
                    />
                    <span className="font-extrabold" style={{ color: ST.textSecondary }}>→</span>
                    <input
                      type="time"
                      value={minToHHMM(r.endMin)}
                      onChange={(e) =>
                        updateDraftRange(idx, { endMin: hhmmToMin(e.target.value) })
                      }
                      className="rounded-[10px] px-3 py-2 text-[13px] font-extrabold bg-white flex-1 focus:outline-none"
                      style={{ border: "1px solid #dde6e0", color: ST.text }}
                      step="900"
                    />
                    <button
                      onClick={() => removeDraftRange(idx)}
                      className="p-2 rounded-[10px] hover:bg-rose-50"
                      style={{ color: ST.roseText }}
                      aria-label="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}

              <button
                onClick={addDraftRange}
                className="w-full mt-2 py-2.5 rounded-[12px] text-[13px] font-extrabold transition-colors hover:bg-emerald-50 flex items-center justify-center gap-1.5"
                style={{ border: "2px dashed #bcd6c5", color: ST.green }}
              >
                <Plus size={16} />
                Ajouter une plage
              </button>

              <div className="pt-3 space-y-2" style={{ borderTop: `1px solid ${ST.divider}` }}>
                <p className="text-[10px] font-semibold text-center" style={{ color: ST.textMuted }}>
                  Format HH:MM. Durée minimum 30 min, pas de chevauchement.
                </p>
                <div className="flex gap-2">
                  <StButton variant="secondary" onClick={clearDay} className="flex-1">
                    Vider ce jour
                  </StButton>
                  <StButton
                    onClick={saveDay}
                    disabled={savingDay}
                    className="flex-1"
                  >
                    {savingDay ? "Enregistrement…" : "Enregistrer"}
                  </StButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
