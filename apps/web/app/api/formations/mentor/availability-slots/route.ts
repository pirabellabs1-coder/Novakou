import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";

/**
 * Date-based availability slots API.
 *
 * Replaces / enriches the legacy weekly recurrence (`MentorAvailability`).
 * The mentor sets specific date + time ranges in their calendar.
 */

// ── Helpers ────────────────────────────────────────────────────────────────────

const MAX_SLOTS_PER_PUT = 200; // safety cap

function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  // Normalize to UTC midnight of that calendar day
  const norm = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return norm;
}

interface SlotInput {
  date: string;
  startMin: number;
  endMin: number;
}

interface ValidatedSlot {
  date: Date;
  startMin: number;
  endMin: number;
}

function validateSlots(raw: unknown): {
  ok: boolean;
  errors: string[];
  sanitized: ValidatedSlot[];
} {
  const errors: string[] = [];
  const sanitized: ValidatedSlot[] = [];

  if (!Array.isArray(raw)) {
    return { ok: false, errors: ["slots doit être un tableau"], sanitized: [] };
  }
  if (raw.length > MAX_SLOTS_PER_PUT) {
    return {
      ok: false,
      errors: [`Trop de plages (max ${MAX_SLOTS_PER_PUT}).`],
      sanitized: [],
    };
  }

  // Group per date to detect overlaps
  const byDate = new Map<string, ValidatedSlot[]>();

  for (let i = 0; i < raw.length; i++) {
    const r = raw[i] as Partial<SlotInput>;
    const date = parseDateOnly(r.date);
    const startMin = Number(r.startMin);
    const endMin = Number(r.endMin);

    if (!date) {
      errors.push(`Plage #${i + 1} : date invalide.`);
      continue;
    }
    if (!Number.isFinite(startMin) || startMin < 0 || startMin > 1439) {
      errors.push(`Plage #${i + 1} : heure de début invalide.`);
      continue;
    }
    if (!Number.isFinite(endMin) || endMin < 0 || endMin > 1439) {
      errors.push(`Plage #${i + 1} : heure de fin invalide.`);
      continue;
    }
    if (endMin - startMin < 30) {
      errors.push(`Plage #${i + 1} : durée minimum 30 min.`);
      continue;
    }

    const slot: ValidatedSlot = { date, startMin: Math.floor(startMin), endMin: Math.floor(endMin) };
    const key = date.toISOString();
    const existing = byDate.get(key) ?? [];
    for (const ex of existing) {
      const overlap = slot.startMin < ex.endMin && slot.endMin > ex.startMin;
      if (overlap) {
        errors.push(`Plage #${i + 1} : chevauche une autre plage du même jour.`);
      }
    }
    existing.push(slot);
    byDate.set(key, existing);
    sanitized.push(slot);
  }

  return { ok: errors.length === 0, errors, sanitized };
}

async function resolveMentor(): Promise<
  | { ok: true; mentorId: string }
  | { ok: false; status: number; error: string }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user && !IS_DEV) {
    return { ok: false, status: 401, error: "Non authentifié" };
  }
  const userId = session?.user?.id ?? (IS_DEV ? "dev-instructeur-001" : null);
  if (!userId) return { ok: false, status: 401, error: "Non authentifié" };

  let profile = await prisma.mentorProfile.findUnique({ where: { userId } });
  if (!profile) {
    profile = await prisma.mentorProfile.create({
      data: { userId, specialty: "", bio: "" },
    });
  }
  return { ok: true, mentorId: profile.id };
}

// ── GET /api/formations/mentor/availability-slots?from=ISO&to=ISO ──────────────

export async function GET(request: Request) {
  try {
    const ctx = await resolveMentor();
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const now = new Date();
    const fromDate = fromParam ? new Date(fromParam) : new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate = toParam
      ? new Date(toParam)
      : new Date(now.getFullYear(), now.getMonth() + 2, 0);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json({ error: "Dates invalides" }, { status: 400 });
    }

    const slots = await prisma.mentorAvailabilitySlot.findMany({
      where: {
        mentorId: ctx.mentorId,
        date: { gte: fromDate, lte: toDate },
      },
      orderBy: [{ date: "asc" }, { startMin: "asc" }],
    });

    return NextResponse.json({
      data: {
        slots: slots.map((s) => ({
          id: s.id,
          date: s.date.toISOString(),
          startMin: s.startMin,
          endMin: s.endMin,
          isActive: s.isActive,
        })),
        count: slots.length,
      },
    });
  } catch (err) {
    console.error("[mentor/availability-slots GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── PUT /api/formations/mentor/availability-slots ──────────────────────────────
// Body: { slots: [{ date: ISO, startMin, endMin }] }
// Atomically replaces all slots for the dates contained in the payload.
// Other dates stay untouched.

export async function PUT(request: Request) {
  try {
    const ctx = await resolveMentor();
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const body = await request.json().catch(() => ({}));
    const raw = (body as { slots?: unknown }).slots;
    const { ok, errors, sanitized } = validateSlots(raw ?? []);
    if (!ok) {
      return NextResponse.json({ error: "Slots invalides", details: errors }, { status: 400 });
    }

    // Distinct dates in the payload (these are the ones we replace)
    const datesSet = new Set<string>();
    for (const s of sanitized) datesSet.add(s.date.toISOString());
    const dates = Array.from(datesSet).map((d) => new Date(d));

    await prisma.$transaction(async (tx) => {
      if (dates.length > 0) {
        await tx.mentorAvailabilitySlot.deleteMany({
          where: {
            mentorId: ctx.mentorId,
            date: { in: dates },
          },
        });
      }
      if (sanitized.length > 0) {
        await tx.mentorAvailabilitySlot.createMany({
          data: sanitized.map((s) => ({
            mentorId: ctx.mentorId,
            date: s.date,
            startMin: s.startMin,
            endMin: s.endMin,
            isActive: true,
          })),
        });
      }
    });

    // Re-read the affected dates so the UI gets fresh ids
    const slots =
      dates.length === 0
        ? []
        : await prisma.mentorAvailabilitySlot.findMany({
            where: { mentorId: ctx.mentorId, date: { in: dates } },
            orderBy: [{ date: "asc" }, { startMin: "asc" }],
          });

    return NextResponse.json({
      data: {
        slots: slots.map((s) => ({
          id: s.id,
          date: s.date.toISOString(),
          startMin: s.startMin,
          endMin: s.endMin,
          isActive: s.isActive,
        })),
        replacedDates: dates.map((d) => d.toISOString()),
        count: slots.length,
      },
    });
  } catch (err) {
    console.error("[mentor/availability-slots PUT]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── DELETE /api/formations/mentor/availability-slots?date=ISO ──────────────────
// Removes every slot of a single date. To delete a single slot, the UI re-PUTs the day.

export async function DELETE(request: Request) {
  try {
    const ctx = await resolveMentor();
    if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const { searchParams } = new URL(request.url);
    const date = parseDateOnly(searchParams.get("date"));
    if (!date) {
      return NextResponse.json({ error: "Paramètre date manquant ou invalide" }, { status: 400 });
    }

    const result = await prisma.mentorAvailabilitySlot.deleteMany({
      where: { mentorId: ctx.mentorId, date },
    });

    return NextResponse.json({ data: { deleted: result.count, date: date.toISOString() } });
  } catch (err) {
    console.error("[mentor/availability-slots DELETE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
