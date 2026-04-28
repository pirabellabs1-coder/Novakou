"use client";

/**
 * TrackingProvider — monté UNE fois dans le root layout. Fire un
 * page_view automatique sur chaque navigation, peu importe l'espace
 * (public, vendeur, apprenant, mentor, affilié, admin). Les pages
 * détaillées (produit, formation, boutique, mentor) peuvent monter en
 * plus un <TrackPageView type="product_view" entityId={...} /> pour
 * enrichir les events.
 */

import { Suspense } from "react";
import TrackPageView from "./TrackPageView";

function TrackerInner() {
  return <TrackPageView type="page_view" />;
}

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Suspense protects against the useSearchParams() boundary requirement
          in Next.js 15 App Router for client components reading URL params. */}
      <Suspense fallback={null}>
        <TrackerInner />
      </Suspense>
      {children}
    </>
  );
}
