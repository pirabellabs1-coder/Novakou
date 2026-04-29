"use client";

/**
 * Form draft persistence — localStorage-backed, debounced, namespaced.
 *
 * Why this exists: every multi-step wizard (product creation, funnel editor,
 * mentor booking, etc.) loses everything if the device refreshes mid-flow.
 * Backend draft tables would be cleaner but force schema/API changes per form;
 * localStorage gives the same outcome for a single-device user with zero
 * server work and ships today.
 *
 * Conventions:
 *  - Every form picks a stable prefix, e.g. `vendeur:product:create`. Each
 *    field is then stored under `nk-draft:<prefix>:<field>`.
 *  - On successful submit (or "abandon" CTA) call `clearDrafts(prefix)` to
 *    wipe every key under that prefix.
 *  - Bump DRAFT_VERSION when the shape of stored values for an existing
 *    prefix changes incompatibly — older entries are then ignored.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const PREFIX = "nk-draft:";
const DRAFT_VERSION = 1;
const DEBOUNCE_MS = 400;
// Drafts older than this are ignored on read so a forgotten browser tab from
// last month doesn't resurrect ancient state on a fresh edit.
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

const isBrowser = typeof window !== "undefined";

type Stored<T> = { v: number; value: T; savedAt: number };

function readStored<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Stored<T>;
    if (parsed.v !== DRAFT_VERSION) return fallback;
    if (typeof parsed.savedAt !== "number" || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(PREFIX + key);
      return fallback;
    }
    return parsed.value;
  } catch {
    return fallback;
  }
}

function writeStored<T>(key: string, value: T) {
  if (!isBrowser) return;
  try {
    const payload: Stored<T> = { v: DRAFT_VERSION, value, savedAt: Date.now() };
    window.localStorage.setItem(PREFIX + key, JSON.stringify(payload));
  } catch {
    // QuotaExceededError, private mode, etc. — silently drop
  }
}

/**
 * Drop-in replacement for `useState<T>` that persists `value` to localStorage
 * under `nk-draft:<key>` with a 400 ms debounce.
 *
 * Use this when a form has many `useState` calls already; just rename the
 * hook on each line and pass a unique key.
 */
export function useDraftField<T>(
  key: string,
  initial: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Initialise from storage on first render. SSR-safe because readStored
  // checks isBrowser; the lazy initializer runs only client-side anyway
  // since this is a "use client" module.
  const [value, setValue] = useState<T>(() => readStored(key, initial));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setAndPersist = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (next) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => writeStored(key, resolved), DEBOUNCE_MS);
        return resolved;
      });
    },
    [key],
  );

  // Flush pending write on unmount so a fast unmount + reload doesn't drop
  // the last keystroke.
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        writeStored(key, value);
      }
    };
    // We intentionally don't depend on `value` here — the cleanup runs only
    // when the component unmounts and reads the latest closure value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, setAndPersist];
}

/** Remove every draft entry whose namespaced key starts with `<prefix>`. */
export function clearDrafts(prefix: string) {
  if (!isBrowser) return;
  const target = PREFIX + prefix;
  // Iterate in reverse so removeItem doesn't shift the indices we still need.
  for (let i = window.localStorage.length - 1; i >= 0; i--) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(target)) window.localStorage.removeItem(k);
  }
}

/**
 * Watches all drafts whose key starts with `prefix` and returns the most
 * recent savedAt timestamp (or null when none exist). Polls at 1.5 s — fast
 * enough for "Brouillon sauvegardé il y a Xs" indicators, light enough to
 * be invisible to performance.
 */
export function useDraftSavedAt(prefix: string): Date | null {
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!isBrowser) return;
    const target = PREFIX + prefix;

    const compute = () => {
      let latest = 0;
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k || !k.startsWith(target)) continue;
        try {
          const parsed = JSON.parse(window.localStorage.getItem(k) || "{}") as Partial<Stored<unknown>>;
          if (typeof parsed.savedAt === "number" && parsed.savedAt > latest) {
            latest = parsed.savedAt;
          }
        } catch {
          // ignore malformed entry
        }
      }
      setSavedAt((current) => {
        const next = latest > 0 ? new Date(latest) : null;
        if (next?.getTime() === current?.getTime()) return current;
        return next;
      });
    };

    compute();
    const interval = setInterval(compute, 1500);
    return () => clearInterval(interval);
  }, [prefix]);

  return savedAt;
}

/** Pretty-print a savedAt timestamp as "il y a Xs" / "il y a Xmin". */
export function formatSavedAt(date: Date | null): string | null {
  if (!date) return null;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "à l'instant";
  if (seconds < 60) return `il y a ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return date.toLocaleDateString("fr-FR");
}
