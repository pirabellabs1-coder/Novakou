"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Slot {
  start: string;
  end: string;
  durationMinutes: number;
}

interface MentorLite {
  id: string;
  name: string | null;
  image: string | null;
  specialty: string;
  sessionPrice: number;
  sessionDuration: number;
  timezone: string;
  isAvailable: boolean;
  hasSchedule?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function initials(name: string | null) {
  if (!name) return "M";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const MINI_WEEK_HEADERS = ["L", "M", "M", "J", "V", "S", "D"];

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

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

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectSlotISO = searchParams.get("slot");
  const { status: authStatus } = useSession();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [mentor, setMentor] = useState<MentorLite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [goals, setGoals] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    bookingId: string;
    meetingUrl: string;
    scheduledAt: string;
  } | null>(null);

  // Calendar state
  const initialMonth = preSelectSlotISO ? startOfMonth(new Date(preSelectSlotISO)) : startOfMonth(new Date());
  const [calMonth, setCalMonth] = useState<Date>(initialMonth);
  const [selectedDay, setSelectedDay] = useState<Date | null>(
    preSelectSlotISO ? new Date(preSelectSlotISO) : null,
  );
  const [autoApplied, setAutoApplied] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      const callback = `/mentors/${id}/reserver${preSelectSlotISO ? `?slot=${encodeURIComponent(preSelectSlotISO)}` : ""}`;
      router.push(`/connexion?callbackUrl=${encodeURIComponent(callback)}`);
    }
  }, [authStatus, router, id, preSelectSlotISO]);

  // Load slots + mentor info — load 60 days for the mini calendar
  useEffect(() => {
    async function load() {
      try {
        const from = startOfMonth(calMonth);
        const to = new Date(calMonth.getFullYear(), calMonth.getMonth() + 2, 0);
        const qs = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
        const res = await fetch(`/api/formations/mentors/${id}/slots?${qs.toString()}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Ce mentor n'existe pas.");
          throw new Error("Erreur de chargement");
        }
        const { data } = await res.json();
        setMentor(data.mentor);
        setSlots(data.slots ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setLoading(false);
      }
    }
    if (authStatus === "authenticated" || authStatus === "loading") {
      load();
    }
  }, [id, authStatus, calMonth]);

  // Group slots by day key
  const slotsByDayKey = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const s of slots) {
      const d = new Date(s.start);
      const key = dayKey(d);
      const list = m.get(key) ?? [];
      list.push(s);
      m.set(key, list);
    }
    return m;
  }, [slots]);

  const monthGrid = useMemo(() => buildMonthGrid(calMonth), [calMonth]);

  function dayHasSlots(d: Date): boolean {
    return slotsByDayKey.has(dayKey(d));
  }

  function slotsForDay(d: Date): Slot[] {
    return slotsByDayKey.get(dayKey(d)) ?? [];
  }

  // Auto-apply ?slot=ISO if a matching slot exists in loaded list — jump to step 2
  useEffect(() => {
    if (autoApplied || !preSelectSlotISO || slots.length === 0) return;
    const target = slots.find(
      (s) => Math.abs(new Date(s.start).getTime() - new Date(preSelectSlotISO).getTime()) < 60_000,
    );
    if (target) {
      setSelectedSlot(target);
      setSelectedDay(new Date(target.start));
      setStep(2);
      setAutoApplied(true);
    }
  }, [preSelectSlotISO, slots, autoApplied]);

  async function handleConfirm() {
    if (!selectedSlot) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`/api/formations/mentors/${id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotStart: selectedSlot.start,
          studentGoals: goals.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");

      // Redirect to payment (Moneroo or mock return page)
      // The return page will call /confirm-payment which sets status=PENDING + escrowStatus=HELD
      if (json.data.checkoutUrl) {
        window.location.href = json.data.checkoutUrl;
        return;
      }

      // Fallback (shouldn't happen): legacy response
      setBookingResult({
        bookingId: json.data.bookingId,
        meetingUrl: json.data.meetingUrl ?? "",
        scheduledAt: json.data.scheduledAt,
      });
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setConfirming(false);
    }
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] p-6">
        <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-56 bg-gray-200 rounded-xl" />
          <div className="h-32 bg-gray-200 rounded-2xl" />
          <div className="h-96 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href={`/mentors/${id}`} className="text-[#5c647a] hover:text-[#191c1e]">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <span className="text-sm font-bold text-[#191c1e] flex-1">Réserver une séance</span>

          {/* Stepper */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold text-[#5c647a]">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`flex items-center gap-1`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  step >= (n as 1 | 2 | 3 | 4) ? "bg-[#006e2f] text-white" : "bg-gray-200 text-gray-500"
                }`}>{n}</div>
                {n < 3 && <div className={`w-4 h-0.5 ${step > n ? "bg-[#006e2f]" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <span className="material-symbols-outlined text-red-500 text-[18px] mt-0.5">error</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Mentor recap header (horizontal, étoffé) */}
        {mentor && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0 ring-2 ring-white shadow">
              {mentor.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mentor.image} alt={mentor.name ?? ""} className="w-full h-full object-cover" />
              ) : (
                <span className="text-base">{initials(mentor.name)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-[#191c1e] truncate">
                  {mentor.name ?? "Mentor"}
                </p>
                <span
                  className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    mentor.isAvailable
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <span className={`w-1 h-1 rounded-full ${mentor.isAvailable ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                  {mentor.isAvailable ? "Disponible" : "Indisponible"}
                </span>
              </div>
              <p className="text-xs text-[#5c647a] truncate mt-0.5">{mentor.specialty}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-base font-extrabold text-[#006e2f] leading-tight">
                {fmt(mentor.sessionPrice)}{" "}
                <span className="text-[10px] font-bold text-[#5c647a]">FCFA</span>
              </p>
              <p className="text-[10px] text-[#5c647a]">{mentor.sessionDuration} min</p>
              <Link
                href={`/mentors/${id}`}
                className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-semibold text-[#006e2f] hover:underline"
              >
                Voir profil
                <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        )}

        {/* Step 1 — Choose slot (mini-calendar) */}
        {step === 1 && (
          <>
            <div>
              <h2 className="text-lg font-extrabold text-[#191c1e]">1. Choisissez un créneau</h2>
              <p className="text-sm text-[#5c647a] mt-0.5">
                Sélectionnez un jour puis une heure. Fuseau {mentor?.timezone ?? "Africa/Abidjan"}.
              </p>
            </div>

            {!mentor?.isAvailable ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                <span className="material-symbols-outlined text-amber-600 text-4xl">pause_circle</span>
                <p className="text-sm font-bold text-amber-800 mt-2">
                  Ce mentor n&apos;accepte plus de nouvelles réservations pour l&apos;instant.
                </p>
                <p className="text-xs text-amber-700 mt-1">Revenez plus tard ou contactez-le via la messagerie.</p>
              </div>
            ) : slots.length === 0 && !mentor.hasSchedule ? (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
                <span className="material-symbols-outlined text-gray-400 text-4xl">event_busy</span>
                <p className="text-sm font-bold text-[#191c1e] mt-2">
                  Le mentor n&apos;a pas encore configuré son calendrier.
                </p>
                <p className="text-xs text-[#5c647a] mt-1">
                  Revenez plus tard ou contactez-le via la messagerie.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
                {/* Calendar header */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-[#5c647a]"
                    aria-label="Mois précédent"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <p className="text-sm font-bold text-[#191c1e]">
                    {MONTHS_FR[calMonth.getMonth()]} {calMonth.getFullYear()}
                  </p>
                  <button
                    onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-[#5c647a]"
                    aria-label="Mois suivant"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>

                {/* Week headers */}
                <div className="grid grid-cols-7 text-[10px] font-bold text-[#5c647a] mb-1">
                  {MINI_WEEK_HEADERS.map((h, i) => (
                    <div key={i} className="text-center py-1">{h}</div>
                  ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {monthGrid.map((d, i) => {
                    const inMonth = d.getMonth() === calMonth.getMonth();
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isPast = d < today;
                    const has = dayHasSlots(d);
                    const isSelected =
                      selectedDay &&
                      d.getFullYear() === selectedDay.getFullYear() &&
                      d.getMonth() === selectedDay.getMonth() &&
                      d.getDate() === selectedDay.getDate();
                    return (
                      <button
                        key={i}
                        onClick={() => has && setSelectedDay(d)}
                        disabled={!has || isPast}
                        className={`aspect-square rounded-lg text-sm font-bold transition-colors flex items-center justify-center relative ${
                          isSelected
                            ? "bg-[#006e2f] text-white ring-2 ring-[#006e2f] shadow-sm"
                            : has
                              ? "bg-[#006e2f]/10 text-[#006e2f] hover:bg-[#006e2f]/20 border border-[#006e2f]/30"
                              : inMonth
                                ? "text-[#191c1e] bg-gray-50 cursor-not-allowed"
                                : "text-gray-400 bg-transparent cursor-not-allowed"
                        } ${isPast ? "opacity-40 cursor-not-allowed line-through" : ""}`}
                      >
                        {d.getDate()}
                        {has && !isSelected && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#006e2f] rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected day's slots */}
                {selectedDay && (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold text-[#191c1e] mb-2 capitalize">
                      {selectedDay.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                    {slotsForDay(selectedDay).length === 0 ? (
                      <p className="text-xs text-[#5c647a]">Aucun créneau disponible ce jour.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {slotsForDay(selectedDay).map((s) => {
                          const selected = selectedSlot?.start === s.start;
                          return (
                            <button
                              key={s.start}
                              onClick={() => setSelectedSlot(s)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                selected
                                  ? "bg-[#006e2f] text-white border-[#006e2f]"
                                  : "bg-white text-[#191c1e] border-gray-200 hover:border-[#006e2f] hover:text-[#006e2f]"
                              }`}
                            >
                              {fmtTime(s.start)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {!selectedDay && slots.length > 0 && (
                  <p className="text-[11px] text-[#5c647a] mt-4 text-center">
                    Cliquez sur un jour avec un point vert pour voir les heures disponibles.
                  </p>
                )}
                {slots.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-4 text-center">
                    Aucun créneau dispo dans ce mois — naviguez vers un autre mois.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedSlot}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                Continuer
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </>
        )}

        {/* Step 2 — Describe goals */}
        {step === 2 && selectedSlot && (
          <>
            <div>
              <h2 className="text-lg font-extrabold text-[#191c1e]">2. Décrivez votre besoin</h2>
              <p className="text-sm text-[#5c647a] mt-0.5">
                Ce contexte aidera le mentor à préparer au mieux la séance.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2 text-xs text-[#5c647a]">
                <span className="material-symbols-outlined text-[14px]">event</span>
                <span className="font-semibold text-[#191c1e] capitalize">{fmtDay(selectedSlot.start)}</span>
                <span>·</span>
                <span>{fmtTime(selectedSlot.start)} – {fmtTime(selectedSlot.end)}</span>
              </div>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={6}
                placeholder="Ex : je viens de lancer mon activité freelance de designer et je n'arrive pas à fixer mes tarifs. J'aimerais qu'on discute de ma proposition de valeur et d'une stratégie pour mes 3 premiers clients…"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-[10px] text-[#5c647a]">
                  {goals.trim().length} / 30 caractères minimum
                </p>
                {goals.trim().length < 30 && (
                  <p className="text-[10px] text-amber-600">
                    Il manque encore {30 - goals.trim().length} caractères
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-[#191c1e] hover:bg-gray-200"
              >
                ← Retour
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={goals.trim().length < 30}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 hover:opacity-90"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                Continuer
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </>
        )}

        {/* Step 3 — Recap + pay */}
        {step === 3 && selectedSlot && mentor && (
          <>
            <div>
              <h2 className="text-lg font-extrabold text-[#191c1e]">3. Récapitulatif</h2>
              <p className="text-sm text-[#5c647a] mt-0.5">
                Vérifiez les informations ci-dessous avant de confirmer.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#5c647a]">Date et heure</span>
                  <span className="text-sm font-bold text-[#191c1e] capitalize">
                    {fmtDay(selectedSlot.start)} · {fmtTime(selectedSlot.start)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#5c647a]">Durée</span>
                  <span className="text-sm font-bold text-[#191c1e]">{mentor.sessionDuration} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#5c647a]">Mentor</span>
                  <span className="text-sm font-bold text-[#191c1e]">{mentor.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#5c647a]">Vidéo</span>
                  <span className="text-sm font-bold text-blue-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">videocam</span>
                    Salle Jitsi auto
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <p className="text-xs font-bold text-[#191c1e] mb-1">Vos objectifs</p>
                  <p className="text-xs text-[#5c647a] whitespace-pre-wrap">{goals}</p>
                </div>
              </div>
              <div className="bg-[#006e2f]/5 px-5 py-4 border-t border-[#006e2f]/10 flex justify-between items-center">
                <span className="text-sm font-semibold text-[#191c1e]">Prix total</span>
                <span className="text-xl font-extrabold text-[#006e2f]">{fmt(mentor.sessionPrice)} FCFA</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2 text-xs text-blue-900">
              <span className="material-symbols-outlined text-[16px] mt-0.5">info</span>
              <div>
                <p className="font-semibold">Comment ça fonctionne</p>
                <p className="mt-0.5">
                  Le mentor reçoit votre demande et la confirme rapidement. Vous recevrez un email avec le lien vidéo dès validation. Une salle Jitsi privée est automatiquement créée pour vous deux.
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                disabled={confirming}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-[#191c1e] hover:bg-gray-200 disabled:opacity-50"
              >
                ← Retour
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 hover:opacity-90"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                {confirming ? (
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                )}
                {confirming ? "Envoi…" : "Confirmer et réserver"}
              </button>
            </div>
          </>
        )}

        {/* Step 4 — Success */}
        {step === 4 && bookingResult && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#191c1e]">Demande envoyée !</h2>
              <p className="text-sm text-[#5c647a] mt-1 max-w-md mx-auto">
                Le mentor a été notifié. Dès qu&apos;il confirme, vous recevrez un email avec le lien de la séance.
              </p>
            </div>

            <div className="bg-[#f7f9fb] rounded-xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#5c647a]">Date</span>
                <span className="font-semibold text-[#191c1e] capitalize">{fmtDay(bookingResult.scheduledAt)} · {fmtTime(bookingResult.scheduledAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5c647a]">Statut</span>
                <span className="font-semibold text-amber-700">En attente de confirmation</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-[#5c647a]">Salle vidéo</span>
                <a
                  href={bookingResult.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all text-right ml-3"
                >
                  {bookingResult.meetingUrl}
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Link
                href="/apprenant/sessions"
                className="flex-1 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                Voir mes sessions
              </Link>
              <Link
                href="/mentors"
                className="flex-1 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-[#191c1e] hover:bg-gray-200"
              >
                Autres mentors
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
