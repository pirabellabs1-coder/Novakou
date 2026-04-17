/**
 * Mentor slot computation — given a mentor's availability and existing bookings,
 * compute the list of reservable slots in a date range.
 *
 * Priority logic (date-based vs weekly recurrence):
 *   1. If the mentor has any `availabilitySlots` (date-based) in the requested
 *      window, those are used as the source of truth (the weekly schedule is
 *      ignored). This lets a mentor opt into Google-Calendar style management.
 *   2. Otherwise, fall back to the legacy weekly `availabilities`.
 *
 * In both cases, blocks are cut into slots of `sessionDuration` minutes
 * (with `sessionBuffer` between them). Slots are excluded when:
 *   - They start before now + bookingLeadTime
 *   - They overlap a CONFIRMED/PENDING booking (+ buffer)
 *   - They fall outside [fromDate, toDate]
 */

import type {
  MentorAvailability,
  MentorAvailabilitySlot,
  MentorBooking,
} from "@prisma/client";

export interface Slot {
  start: string; // ISO
  end: string;   // ISO
  durationMinutes: number;
}

export interface SlotsInput {
  /** Legacy weekly recurrence */
  availabilities: Pick<MentorAvailability, "dayOfWeek" | "startMin" | "endMin" | "isActive">[];
  /** New date-based slots — priority when present in the window */
  availabilitySlots?: Pick<MentorAvailabilitySlot, "date" | "startMin" | "endMin" | "isActive">[];
  bookings: Pick<MentorBooking, "scheduledAt" | "durationMinutes" | "status">[];
  fromDate: Date;
  toDate: Date;
  sessionDuration: number;
  sessionBuffer: number;
  bookingLeadTime: number;
}

/** Max look-ahead window to protect against abuse */
const MAX_RANGE_DAYS = 60;

/** Internal: a concrete bookable block (start..end) on a single calendar day */
interface ConcreteBlock {
  start: Date;
  end: Date;
}

function buildBlocksFromDated(
  slots: Pick<MentorAvailabilitySlot, "date" | "startMin" | "endMin" | "isActive">[],
): ConcreteBlock[] {
  const out: ConcreteBlock[] = [];
  for (const s of slots) {
    if (s.isActive === false) continue;
    if (!(s.endMin > s.startMin)) continue;
    const d = new Date(s.date);
    // Use the calendar day from the stored date and apply minutes-from-midnight
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    start.setMinutes(s.startMin);
    const end = new Date(d);
    end.setHours(0, 0, 0, 0);
    end.setMinutes(s.endMin);
    out.push({ start, end });
  }
  return out;
}

function buildBlocksFromWeekly(
  availabilities: Pick<MentorAvailability, "dayOfWeek" | "startMin" | "endMin" | "isActive">[],
  rangeStart: Date,
  rangeEnd: Date,
): ConcreteBlock[] {
  const byDay = new Map<number, { startMin: number; endMin: number }[]>();
  for (const a of availabilities) {
    if (a.isActive === false) continue;
    const list = byDay.get(a.dayOfWeek) ?? [];
    list.push({ startMin: a.startMin, endMin: a.endMin });
    byDay.set(a.dayOfWeek, list);
  }

  const out: ConcreteBlock[] = [];
  const cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= rangeEnd) {
    const dayBlocks = byDay.get(cursor.getDay()) ?? [];
    for (const block of dayBlocks) {
      const start = new Date(cursor);
      start.setHours(0, 0, 0, 0);
      start.setMinutes(block.startMin);
      const end = new Date(cursor);
      end.setHours(0, 0, 0, 0);
      end.setMinutes(block.endMin);
      out.push({ start, end });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export function computeAvailableSlots(input: SlotsInput): Slot[] {
  const {
    availabilities,
    availabilitySlots = [],
    bookings,
    fromDate,
    toDate,
    sessionDuration,
    sessionBuffer,
    bookingLeadTime,
  } = input;

  const now = new Date();
  const earliestStart = new Date(now.getTime() + bookingLeadTime * 60 * 1000);

  const rangeStart = fromDate > earliestStart ? fromDate : earliestStart;
  const rangeEnd = new Date(toDate.getTime());

  const maxEnd = new Date(now.getTime() + MAX_RANGE_DAYS * 24 * 60 * 60 * 1000);
  if (rangeEnd > maxEnd) rangeEnd.setTime(maxEnd.getTime());
  if (rangeEnd <= rangeStart) return [];

  // PRIORITY: dated slots within the window > weekly recurrence
  const datedInWindow = availabilitySlots.filter((s) => {
    const d = new Date(s.date);
    return d >= new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate())
      && d <= new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate(), 23, 59, 59);
  });

  let blocks: ConcreteBlock[];
  if (datedInWindow.length > 0) {
    blocks = buildBlocksFromDated(datedInWindow);
  } else if (availabilities.length > 0) {
    blocks = buildBlocksFromWeekly(availabilities, rangeStart, rangeEnd);
  } else {
    return [];
  }

  // Active bookings (CONFIRMED + PENDING block a slot)
  const activeBookings = bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "PENDING",
  );

  const slots: Slot[] = [];
  const slotMs = sessionDuration * 60 * 1000;
  const bufferMs = sessionBuffer * 60 * 1000;

  for (const block of blocks) {
    // Clip to [rangeStart, rangeEnd]
    const start = block.start < rangeStart ? rangeStart : block.start;
    const end = block.end > rangeEnd ? rangeEnd : block.end;
    if (end <= start) continue;

    let slotStart = new Date(start);
    // Align to nearest :00 or :30 boundary for nicer UX
    const mod = slotStart.getMinutes() % 30;
    if (mod !== 0) slotStart.setMinutes(slotStart.getMinutes() + (30 - mod), 0, 0);

    while (slotStart.getTime() + slotMs <= end.getTime()) {
      const slotEnd = new Date(slotStart.getTime() + slotMs);

      const conflict = activeBookings.some((b) => {
        const bStart = new Date(b.scheduledAt).getTime() - bufferMs;
        const bEnd = new Date(b.scheduledAt).getTime() + b.durationMinutes * 60 * 1000 + bufferMs;
        return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
      });

      if (!conflict) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          durationMinutes: sessionDuration,
        });
      }

      slotStart = new Date(slotEnd.getTime() + bufferMs);
    }
  }

  // Sort by start time (dated blocks may not be ordered)
  slots.sort((a, b) => a.start.localeCompare(b.start));
  return slots;
}

/**
 * Quick check: is this specific datetime still a valid bookable slot?
 * Used inside POST /book to prevent race conditions.
 */
export function isSlotStillAvailable(
  slotStart: Date,
  input: Omit<SlotsInput, "fromDate" | "toDate">,
): boolean {
  const { availabilities, availabilitySlots = [], bookings, sessionDuration, sessionBuffer, bookingLeadTime } = input;

  const now = new Date();
  const earliestStart = new Date(now.getTime() + bookingLeadTime * 60 * 1000);
  if (slotStart < earliestStart) return false;

  const slotEnd = new Date(slotStart.getTime() + sessionDuration * 60 * 1000);
  const bufferMs = sessionBuffer * 60 * 1000;

  // 1) slot must fit inside at least one availability block (dated priority over weekly)
  const dayStart = new Date(slotStart);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const datedToday = availabilitySlots.filter((s) => {
    if (s.isActive === false) return false;
    const d = new Date(s.date);
    return d >= dayStart && d < dayEnd;
  });

  let blocks: ConcreteBlock[];
  if (datedToday.length > 0) {
    blocks = buildBlocksFromDated(datedToday);
  } else if (availabilities.length > 0) {
    blocks = buildBlocksFromWeekly(availabilities, dayStart, dayEnd);
  } else {
    return false;
  }

  const fitsInBlock = blocks.some(
    (b) => slotStart.getTime() >= b.start.getTime() && slotEnd.getTime() <= b.end.getTime(),
  );
  if (!fitsInBlock) return false;

  // 2) no conflict with active bookings (CONFIRMED + PENDING + PAYMENT_PENDING)
  const activeBookings = bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "PENDING" || b.status === "PAYMENT_PENDING",
  );
  const conflict = activeBookings.some((b) => {
    const bStart = new Date(b.scheduledAt).getTime() - bufferMs;
    const bEnd = new Date(b.scheduledAt).getTime() + b.durationMinutes * 60 * 1000 + bufferMs;
    return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
  });

  return !conflict;
}
