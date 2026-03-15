"use client";

import { usePageTracker } from "@/lib/tracking/usePageTracker";

const TRACKING_ENABLED = process.env.NODE_ENV === "production";

function TrackingActive({ children }: { children: React.ReactNode }) {
  usePageTracker();
  return <>{children}</>;
}

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  if (!TRACKING_ENABLED) return <>{children}</>;
  return <TrackingActive>{children}</TrackingActive>;
}
