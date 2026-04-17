/**
 * Mentor availability validation helpers.
 *
 * A mentor's weekly schedule is a list of blocks:
 *   { dayOfWeek: 0..6, startMin: 0..1439, endMin: 0..1439 }
 *
 * Rules:
 *   - endMin must be > startMin
 *   - dayOfWeek must be in [0, 6]
 *   - minutes in [0, 1439]
 *   - blocks within the same day must not overlap
 *   - minimum block duration: 30 minutes (avoid junk data)
 */

export interface AvailabilityBlock {
  dayOfWeek: number;
  startMin: number;
  endMin: number;
  isActive?: boolean;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  sanitized: AvailabilityBlock[];
}

const MIN_BLOCK_MINUTES = 30;

export function validateSchedule(raw: unknown): ValidationResult {
  const errors: string[] = [];
  const sanitized: AvailabilityBlock[] = [];

  if (!Array.isArray(raw)) {
    return { ok: false, errors: ["Le schedule doit être un tableau."], sanitized: [] };
  }

  // Per-day blocks to detect overlap
  const byDay: Map<number, AvailabilityBlock[]> = new Map();

  for (let i = 0; i < raw.length; i++) {
    const b = raw[i] as Record<string, unknown>;
    const dayOfWeek = Number(b.dayOfWeek);
    const startMin = Number(b.startMin);
    const endMin = Number(b.endMin);

    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      errors.push(`Bloc #${i + 1} : jour invalide (doit être 0–6).`);
      continue;
    }
    if (!Number.isFinite(startMin) || startMin < 0 || startMin > 1439) {
      errors.push(`Bloc #${i + 1} : heure de début invalide.`);
      continue;
    }
    if (!Number.isFinite(endMin) || endMin < 0 || endMin > 1439) {
      errors.push(`Bloc #${i + 1} : heure de fin invalide.`);
      continue;
    }
    if (endMin <= startMin) {
      errors.push(`Bloc #${i + 1} : l'heure de fin doit être après l'heure de début.`);
      continue;
    }
    if (endMin - startMin < MIN_BLOCK_MINUTES) {
      errors.push(`Bloc #${i + 1} : durée minimum ${MIN_BLOCK_MINUTES} min.`);
      continue;
    }

    // Overlap check against existing blocks same day
    const existing = byDay.get(dayOfWeek) ?? [];
    for (const ex of existing) {
      const overlap = startMin < ex.endMin && endMin > ex.startMin;
      if (overlap) {
        errors.push(
          `Bloc #${i + 1} : chevauche un autre créneau du jour ${dayOfWeek}.`,
        );
      }
    }

    const block: AvailabilityBlock = {
      dayOfWeek,
      startMin,
      endMin,
      isActive: b.isActive === false ? false : true,
    };
    existing.push(block);
    byDay.set(dayOfWeek, existing);
    sanitized.push(block);
  }

  return { ok: errors.length === 0, errors, sanitized };
}

/** Convert minutes-since-midnight to "HH:MM" */
export function minToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Convert "HH:MM" to minutes-since-midnight */
export function hhmmToMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export const DAY_NAMES_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
export const DAY_NAMES_SHORT_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
