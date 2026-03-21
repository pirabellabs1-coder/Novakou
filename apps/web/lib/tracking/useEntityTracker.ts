"use client";

import { useEffect } from "react";
import { tracker } from "./tracker";

/**
 * Hook to track entity views (service, formation, profile).
 * Deduplicates: only sends one event per entity per session.
 *
 * Usage:
 *   useEntityTracker("service", serviceId);
 *   useEntityTracker("formation", formationId);
 *   useEntityTracker("profile", userId);
 */
export function useEntityTracker(
  entityType: "service" | "formation" | "profile" | "project" | "blog",
  entityId: string | undefined | null
) {
  useEffect(() => {
    if (!entityId) return;

    // Wait for tracker to be initialized (TrackingProvider calls tracker.start())
    // Use requestAnimationFrame + small delay to ensure it runs after React mount cycle
    let cancelled = false;
    const tryTrack = () => {
      if (cancelled) return;
      try {
        tracker.trackEntityView(entityType, entityId);
      } catch {
        // Tracker may not be initialized yet — silently ignore
      }
    };

    // Delay slightly to ensure tracker.start() has been called from TrackingProvider
    const timer = requestAnimationFrame(() => {
      setTimeout(tryTrack, 50);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(timer);
    };
  }, [entityType, entityId]);
}
